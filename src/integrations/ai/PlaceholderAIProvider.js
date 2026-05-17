const { AIProvider } = require('./AIProvider');

class PlaceholderAIProvider extends AIProvider {
  constructor() {
    super({ providerName: 'placeholder' });
  }

  buildPlaceholderResponse({ jobType, entityType, entityId }) {
    return {
      provider: this.providerName,
      jobType,
      entityType,
      entityId,
      advisoryOnly: true,
      status: 'placeholder_completed',
      note: 'No real AI or OCR provider is implemented in Task 021.'
    };
  }

  async summarizeCase(input) {
    return this.buildPlaceholderResponse({ jobType: 'case_summary', entityType: 'case', entityId: input.caseId });
  }

  async classifyCase(input) {
    return this.buildPlaceholderResponse({ jobType: 'case_classification', entityType: 'case', entityId: input.caseId });
  }

  async suggestDispatch(input) {
    return this.buildPlaceholderResponse({ jobType: 'dispatch_suggestion', entityType: 'case', entityId: input.caseId });
  }

  async analyzeServiceReport(input) {
    return this.buildPlaceholderResponse({ jobType: 'service_report_analysis', entityType: 'service_report', entityId: input.serviceReportId });
  }

  async analyzeBilling(input) {
    return this.buildPlaceholderResponse({ jobType: 'billing_analysis', entityType: 'billing_record', entityId: input.billingRecordId });
  }

  async runOCR(input) {
    return this.buildPlaceholderResponse({ jobType: 'ocr', entityType: 'attachment', entityId: input.attachmentId });
  }
}

module.exports = {
  PlaceholderAIProvider
};
