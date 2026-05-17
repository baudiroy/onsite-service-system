const ERROR_CODES = Object.freeze({
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  INQUIRY_VERIFICATION_FAILED: 'INQUIRY_VERIFICATION_FAILED',
  PROVIDER_ERROR: 'PROVIDER_ERROR',
  STORAGE_ERROR: 'STORAGE_ERROR',
  RATE_LIMITED: 'RATE_LIMITED',
  INTERNAL_ERROR: 'INTERNAL_ERROR'
});

class AppError extends Error {
  constructor({ code, message, statusCode, details = [], requestId = null }) {
    super(message);
    this.name = this.constructor.name;
    this.code = code;
    this.statusCode = statusCode;
    this.details = details;
    this.requestId = requestId;
    Error.captureStackTrace(this, this.constructor);
  }
}

class ValidationError extends AppError {
  constructor(message = 'Invalid request.', details = []) {
    super({
      code: ERROR_CODES.VALIDATION_ERROR,
      message,
      statusCode: 400,
      details
    });
  }
}

class AuthRequiredError extends AppError {
  constructor(message = 'Authentication required.') {
    super({
      code: ERROR_CODES.AUTH_REQUIRED,
      message,
      statusCode: 401
    });
  }
}

class AuthError extends AuthRequiredError {}

class PermissionDeniedError extends AppError {
  constructor(message = 'Permission denied.') {
    super({
      code: ERROR_CODES.PERMISSION_DENIED,
      message,
      statusCode: 403
    });
  }
}

class PermissionError extends PermissionDeniedError {}

class NotFoundError extends AppError {
  constructor(message = 'Resource not found.') {
    super({
      code: ERROR_CODES.NOT_FOUND,
      message,
      statusCode: 404
    });
  }
}

class ConflictError extends AppError {
  constructor(message = 'Request conflicts with current state.') {
    super({
      code: ERROR_CODES.CONFLICT,
      message,
      statusCode: 409
    });
  }
}

class InvalidStatusTransitionError extends AppError {
  constructor(message = 'Invalid status transition.') {
    super({
      code: ERROR_CODES.INVALID_STATUS_TRANSITION,
      message,
      statusCode: 409
    });
  }
}

class ProviderError extends AppError {
  constructor(message = 'Provider request failed.') {
    super({
      code: ERROR_CODES.PROVIDER_ERROR,
      message,
      statusCode: 502
    });
  }
}

class StorageError extends AppError {
  constructor(message = 'Storage request failed.') {
    super({
      code: ERROR_CODES.STORAGE_ERROR,
      message,
      statusCode: 502
    });
  }
}

class RateLimitedError extends AppError {
  constructor(message = 'Too many requests.') {
    super({
      code: ERROR_CODES.RATE_LIMITED,
      message,
      statusCode: 429
    });
  }
}

function isAppError(error) {
  return error instanceof AppError;
}

module.exports = {
  ERROR_CODES,
  AppError,
  ValidationError,
  AuthError,
  AuthRequiredError,
  PermissionError,
  PermissionDeniedError,
  NotFoundError,
  ConflictError,
  InvalidStatusTransitionError,
  ProviderError,
  StorageError,
  RateLimitedError,
  isAppError
};
