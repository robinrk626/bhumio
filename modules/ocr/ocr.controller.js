const fs = require('fs');
const { errorResponse, successResponse } = require("../../utils/response/response.handler");
const { processPdfHelper } = require('./ocr.helper');
const { SUCCESS_MESSAGE } = require('./ocr.constants');

const processPdf = async (req, res) => {
  const { filePath } = req.body;
  try {
    const data = await processPdfHelper({ filePath });
    return successResponse({
      res,
      data,
      message: SUCCESS_MESSAGE.PDF_FILE_PROCESSED,
    });
  } catch (error) {
    return errorResponse({
      res, error
    });
  } finally {
    if (filePath && fs.existsSync(filePath)) {
      fs.rmSync(filePath);
    }
  }
};

module.exports = {
  processPdf,
}; 