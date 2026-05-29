'use strict';

const BILLING_CONTACT_SEPARATION_GUARD_KIND = 'saas.billing_contact_separation_guard';

const REASON_CODES = Object.freeze({
  allowed: 'billing_contact_separation_allowed',
  organizationRequired: 'billing_contact_organization_required',
  contextRequired: 'billing_contact_context_required',
  unsupportedType: 'billing_contact_type_unsupported',
  frontendOnlyClaim: 'billing_contact_frontend_only_claim_denied',
  roleConflation: 'billing_contact_role_conflation_denied',
  rawUnverifiedPayload: 'billing_contact_raw_unverified_payload_denied',
  consentRequired: 'billing_contact_consent_required',
  verificationRequired: 'billing_contact_verification_required',
});

const SUPPORTED_BILLING_CONTACT_TYPES = new Set([
  'billing_contact',
  'billing_metadata_contact',
  'billing_notification_recipient',
]);

const FORBIDDEN_BILLING_CONTACT_IDENTITY_KINDS = new Set([
  'admin_actor',
  'customer_identity',
  'entitlement_owner',
  'login_identity',
  'organization_owner',
  'payment_authority',
  'reporter_identity',
]);

const ROLE_CONFLATION_FLAGS = [
  'billingContactBecomesCustomer',
  'billingContactBecomesReporter',
  'billingContactBecomesOnSiteContact',
  'billingContactBecomesAdminActor',
  'billingContactBecomesOrganizationOwner',
  'billingContactBecomesEntitlementOwner',
  'billingContactBecomesPaymentAuthority',
];

function isObject(value) {
  return Boolean(value) && typeof value === 'object' && !Array.isArray(value);
}

function stringValue(value) {
  if (value === undefined || value === null || value === '') {
    return undefined;
  }

  if (typeof value === 'string') {
    const trimmed = value.trim();

    return trimmed.length > 0 ? trimmed : undefined;
  }

  if (typeof value === 'number' || typeof value === 'boolean') {
    return String(value);
  }

  return undefined;
}

function lowerString(value) {
  const text = stringValue(value);

  return text ? text.toLowerCase() : undefined;
}

function compactRecord(record) {
  return Object.fromEntries(
    Object.entries(record).filter(([, value]) => value !== undefined),
  );
}

function firstString(...values) {
  return values.map(stringValue).find(Boolean);
}

function organizationId(source) {
  return firstString(
    source.organizationId,
    source.organization && source.organization.id,
    source.organization && source.organization.organizationId,
  );
}

function requestId(source) {
  return firstString(source.requestId, source.context && source.context.requestId);
}

function billingContactInput(source) {
  if (isObject(source.billingContactRef)) return source.billingContactRef;
  if (isObject(source.billingContact)) return source.billingContact;

  return undefined;
}

function billingContactType(contact) {
  return lowerString(contact.type || contact.kind || contact.contactType) || 'billing_contact';
}

function billingContactRefId(contact) {
  return firstString(contact.refId, contact.id, contact.billingContactId);
}

function hasFrontendOnlyClaim(source, contact) {
  return source.frontendOnlyBillingContactClaim === true
    || source.frontendOnlyBillingContact === true
    || lowerString(source.billingContactSource) === 'frontend'
    || lowerString(source.context && source.context.billingContactSource) === 'frontend'
    || lowerString(contact.source) === 'frontend';
}

function hasRoleConflation(source, contact) {
  if (ROLE_CONFLATION_FLAGS.some((flag) => source[flag] === true || contact[flag] === true)) {
    return true;
  }

  const role = lowerString(contact.role || contact.identityRole);
  const identityKind = lowerString(contact.identityKind);

  return (role && role !== 'billing_contact')
    || FORBIDDEN_BILLING_CONTACT_IDENTITY_KINDS.has(identityKind);
}

function safeSummary(source, contact) {
  const input = isObject(source.safeSummary)
    ? source.safeSummary
    : isObject(contact.safeSummary)
      ? contact.safeSummary
      : isObject(contact.normalizedContactSummary)
        ? contact.normalizedContactSummary
        : {};

  return compactRecord({
    displayName: stringValue(input.displayName),
    maskedEmail: stringValue(input.maskedEmail),
    maskedPhone: stringValue(input.maskedPhone),
    maskedAddress: stringValue(input.maskedAddress),
  });
}

function hasRawContactPayload(contact) {
  return Boolean(
    contact.rawPhone
      || contact.phone
      || contact.rawAddress
      || contact.address
      || contact.providerPayload
      || contact.rawProviderPayload
      || contact.rawDbRow
      || contact.paymentMethod
      || contact.invoice
      || contact.token
      || contact.secret,
  );
}

function verificationMarker(source, contact) {
  const summary = isObject(source.safeSummary)
    ? source.safeSummary
    : isObject(contact.safeSummary)
      ? contact.safeSummary
      : isObject(contact.normalizedContactSummary)
        ? contact.normalizedContactSummary
        : {};

  return contact.verified === true
    || contact.verificationStatus === 'verified'
    || summary.verified === true
    || summary.verificationStatus === 'verified';
}

function consentMarker(source, contact) {
  const summary = isObject(source.safeSummary)
    ? source.safeSummary
    : isObject(contact.safeSummary)
      ? contact.safeSummary
      : isObject(contact.normalizedContactSummary)
        ? contact.normalizedContactSummary
        : {};

  return contact.consentVerified === true
    || contact.consentStatus === 'verified'
    || summary.consentVerified === true
    || summary.consentStatus === 'verified';
}

function roleRef(source, name) {
  const value = source[name];

  if (!isObject(value)) return undefined;

  return compactRecord({
    refId: firstString(value.refId, value.id),
    role: stringValue(value.role) || name.replace(/Ref$/, ''),
  });
}

function nonBillingExecutionMarkers() {
  return {
    invoiceCreated: false,
    paymentCreated: false,
    paymentMethodCollected: false,
    billingProviderCalled: false,
    loginIdentityCreated: false,
    customerIdentityAssigned: false,
    reporterIdentityAssigned: false,
    entitlementOwnerAssigned: false,
  };
}

function failure(reasonCode, context = {}) {
  return compactRecord({
    ok: false,
    allowed: false,
    guardKind: BILLING_CONTACT_SEPARATION_GUARD_KIND,
    reasonCode,
    organizationId: context.organizationId,
    requestId: context.requestId,
    billingContactRef: context.billingContactRef,
    ...nonBillingExecutionMarkers(),
  });
}

function success(context = {}) {
  return compactRecord({
    ok: true,
    allowed: true,
    guardKind: BILLING_CONTACT_SEPARATION_GUARD_KIND,
    reasonCode: REASON_CODES.allowed,
    organizationId: context.organizationId,
    requestId: context.requestId,
    billingContact: {
      refId: context.refId,
      type: context.type,
      use: 'billing_metadata_only',
      notificationRecipientMetadata: true,
      loginIdentity: false,
      customerIdentity: false,
      reporterIdentity: false,
      onSiteContactIdentity: false,
      adminActor: false,
      organizationOwner: false,
      entitlementOwner: false,
      paymentAuthority: false,
      safeSummary: context.safeSummary,
    },
    relatedRoles: context.relatedRoles,
    samePersonAllowedWithoutRoleConflation: true,
    ...nonBillingExecutionMarkers(),
  });
}

function evaluateBillingContactSeparationGuard(input = {}) {
  const source = isObject(input) ? input : {};
  const resolvedRequestId = requestId(source);
  const resolvedOrganizationId = organizationId(source);

  if (!resolvedOrganizationId) {
    return failure(REASON_CODES.organizationRequired, { requestId: resolvedRequestId });
  }

  const contact = billingContactInput(source);

  if (!isObject(contact)) {
    return failure(REASON_CODES.contextRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
    });
  }

  const type = billingContactType(contact);
  const refId = billingContactRefId(contact);
  const billingContactRef = refId ? { refId, type } : undefined;

  if (!SUPPORTED_BILLING_CONTACT_TYPES.has(type) || !refId) {
    return failure(REASON_CODES.unsupportedType, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
      billingContactRef,
    });
  }

  if (hasFrontendOnlyClaim(source, contact)) {
    return failure(REASON_CODES.frontendOnlyClaim, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
      billingContactRef,
    });
  }

  if (hasRoleConflation(source, contact)) {
    return failure(REASON_CODES.roleConflation, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
      billingContactRef,
    });
  }

  if (!verificationMarker(source, contact)) {
    return failure(REASON_CODES.verificationRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
      billingContactRef,
    });
  }

  if (!consentMarker(source, contact)) {
    return failure(REASON_CODES.consentRequired, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
      billingContactRef,
    });
  }

  const summary = safeSummary(source, contact);

  if (hasRawContactPayload(contact) && Object.keys(summary).length === 0) {
    return failure(REASON_CODES.rawUnverifiedPayload, {
      organizationId: resolvedOrganizationId,
      requestId: resolvedRequestId,
      billingContactRef,
    });
  }

  return success({
    organizationId: resolvedOrganizationId,
    requestId: resolvedRequestId,
    refId,
    type,
    safeSummary: summary,
    relatedRoles: compactRecord({
      customer: roleRef(source, 'customerRef'),
      reporter: roleRef(source, 'reporterRef'),
      onSiteContact: roleRef(source, 'onSiteContactRef'),
      adminActor: roleRef(source, 'adminActorRef'),
      organizationOwner: roleRef(source, 'organizationOwnerRef'),
    }),
  });
}

module.exports = {
  BILLING_CONTACT_SEPARATION_GUARD_KIND,
  REASON_CODES,
  evaluateBillingContactSeparationGuard,
};
