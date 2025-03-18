const multerUpload = require('../../middlewares/multerUpload');
const { processPdf } = require('./ocr.controller');
const { validatePdfUpload } = require('./ocr.middleware');

const restana = require('restana')();

const router = restana.newRouter();

router.post(
  '/',
  multerUpload({ destination: 'uploads' }),
  validatePdfUpload,
  processPdf,
);

module.exports = router; 