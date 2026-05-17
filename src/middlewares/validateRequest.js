const { ZodError } = require('zod');
const { ValidationError } = require('../utils/errors');

function formatZodIssues(issues) {
  return issues.map((issue) => ({
    field: issue.path.join('.'),
    message: issue.message,
    code: issue.code
  }));
}

function parsePart(schema, value) {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw result.error;
  }

  return result.data;
}

function validateRequest(schemas = {}) {
  return function validationMiddleware(req, res, next) {
    try {
      if (schemas.params) {
        req.params = parsePart(schemas.params, req.params);
      }

      if (schemas.query) {
        req.query = parsePart(schemas.query, req.query);
      }

      if (schemas.body) {
        req.body = parsePart(schemas.body, req.body);
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        next(new ValidationError('Invalid request.', formatZodIssues(error.issues)));
        return;
      }

      next(error);
    }
  };
}

module.exports = {
  validateRequest
};
