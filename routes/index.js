const ocrRoutes = require('../modules/ocr/ocr.routes');

module.exports = (app) => {
  app.use('/ocr', ocrRoutes);
}