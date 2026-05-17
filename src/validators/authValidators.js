const { z } = require('./index');

const loginSchema = {
  body: z.object({
    email: z.string().trim().email(),
    password: z.string().min(1)
  })
};

module.exports = {
  loginSchema
};
