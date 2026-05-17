const { z } = require('zod');
const { validateRequest } = require('../middlewares/validateRequest');

module.exports = {
  z,
  validateRequest
};
