'use strict';

const CUSTOMER_ACCESS_CONTEXT_REPOSITORY_METHODS = Object.freeze([
  'getOrganizationScope',
  'getVerifiedCustomerIdentity',
  'getCaseLinkage',
  'getPublicationState',
  'getCustomerVisibleProjection',
]);

function unavailableOrganizationScope() {
  return {
    available: false,
    organizationScopeMatched: false,
  };
}

function unverifiedCustomerIdentity() {
  return {
    available: false,
    customerIdentityVerified: false,
    customerId: null,
    channelIdentityPresent: false,
    scopedChannelIdentityPresent: false,
  };
}

function unlinkedCase() {
  return {
    available: false,
    caseLinkedToCustomer: false,
  };
}

function unpublishedState() {
  return {
    available: false,
    publicationAllowed: false,
    customerVisiblePolicyPassed: false,
  };
}

function emptyCustomerVisibleProjection() {
  return {
    available: false,
    customerVisibleData: {},
  };
}

function createCustomerAccessContextRepository() {
  return {
    getOrganizationScope() {
      return unavailableOrganizationScope();
    },
    getVerifiedCustomerIdentity() {
      return unverifiedCustomerIdentity();
    },
    getCaseLinkage() {
      return unlinkedCase();
    },
    getPublicationState() {
      return unpublishedState();
    },
    getCustomerVisibleProjection() {
      return emptyCustomerVisibleProjection();
    },
  };
}

module.exports = {
  CUSTOMER_ACCESS_CONTEXT_REPOSITORY_METHODS,
  createCustomerAccessContextRepository,
};
