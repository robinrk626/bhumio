const STATUS_CODES = {
  STATUS_CODE_INVALID_PROMPT: 113,
  STATUS_CODE_SUCCESS: 200,
  STATUS_CODE_INVALID_FORMAT: 400,
  STATUS_CODE_UNAUTHORIZED: 401,
  STATUS_CODE_FORBIDDEN: 403,
  STATUS_CODE_DATA_NOT_FOUND: 404,
  STATUS_CODE_FAILURE: 500,
  STATUS_CODE_DATA_SOFT_DELETE: 421,
  STATUS_CODE_VALIDATION_FAILED: 422,
  STATUS_CODE_NOT_ACCEPTABLE: 406,
};

const successResponse = ({
  res,
  data = {},
  code = 200,
  message = '',
}) => res.send({ data, code, message });

const errorResponse = ({
  res,
  data = {},
  code = STATUS_CODES.STATUS_CODE_FAILURE,
  message = null,
  error = null,
}) => {
  code = (error && error.code) || code;
  message = (error && error.message) || message || '';
  return res.send(
    {
      data,
      code,
      message,
    },
    code,
  );
};

const throwValidationError = ({ message = '', code = STATUS_CODES.STATUS_CODE_VALIDATION_FAILED }) => {
  throw { code, message };
}

module.exports = {
  successResponse,
  errorResponse,
  STATUS_CODES,
  throwValidationError,
};
