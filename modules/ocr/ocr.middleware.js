const { errorResponse, throwValidationError } = require("../../utils/response/response.handler");
const { VALIDATION_MESSAGES } = require("./ocr.constants");
const fs = require('fs');

const validatePdfUpload = (req, res, next) => {
  const {
    filePath,
    fileExtension,
  } = req.body;
  try {
    if (!filePath) {
      throwValidationError({ message: VALIDATION_MESSAGES.FILE_MISSING });
    }
    const validExtensions = ['.pdf'];
    if (!validExtensions.includes(fileExtension)) {
      throwValidationError({ message: VALIDATION_MESSAGES.INVALID_FILE });
    }
    return next();
  } catch (error) {
    if (filePath && fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }
    return errorResponse({
      res, error,
    });
  }
};

module.exports = {
  validatePdfUpload,
}; 