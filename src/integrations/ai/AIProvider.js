class AIProvider {
  constructor({ providerName = 'placeholder' } = {}) {
    this.providerName = providerName;
  }

  async summarizeCase() {
    throw new Error('summarizeCase is not implemented by this AI provider.');
  }

  async classifyCase() {
    throw new Error('classifyCase is not implemented by this AI provider.');
  }

  async suggestDispatch() {
    throw new Error('suggestDispatch is not implemented by this AI provider.');
  }

  async analyzeServiceReport() {
    throw new Error('analyzeServiceReport is not implemented by this AI provider.');
  }

  async analyzeBilling() {
    throw new Error('analyzeBilling is not implemented by this AI provider.');
  }

  async runOCR() {
    throw new Error('runOCR is not implemented by this AI provider.');
  }
}

module.exports = {
  AIProvider
};
