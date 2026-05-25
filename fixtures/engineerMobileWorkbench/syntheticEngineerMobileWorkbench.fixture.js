const syntheticEngineerContext = Object.freeze({
  organizationRef: 'synthetic-org-001',
  engineerRef: 'synthetic-engineer-001',
  role: 'field_engineer',
  displayName: 'Synthetic Engineer'
});

const syntheticTaskReference = Object.freeze({
  taskRef: 'synthetic-task-001',
  appointmentRef: 'synthetic-appointment-001',
  caseRef: 'synthetic-case-001',
  productSummary: 'synthetic appliance',
  issueSummary: 'synthetic issue summary',
  roughLocationHint: 'synthetic district',
  contactAvailability: 'available_via_masked_contact'
});

const syntheticForbiddenPayloadMarkers = Object.freeze([
  'real-customer-name',
  'real-phone',
  'real-address',
  'raw-channel-id',
  'provider-payload',
  'real-photo',
  'real-signature',
  'formal-field-service-report-payload',
  'manual-final-appointment-selection'
]);

module.exports = {
  syntheticEngineerContext,
  syntheticTaskReference,
  syntheticForbiddenPayloadMarkers
};
