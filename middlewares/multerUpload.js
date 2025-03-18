const multer = require("multer");
const fs = require('fs');
const path = require('path');

function multerUpload({ destination = 'uploads' }) {
  if (!fs.existsSync(destination)) {
    fs.mkdirSync(destination, { recursive: true });
  }

  const storage = multer.diskStorage({

    destination: (req, file, cb) => {
      cb(null, __dirname + `/../${destination}`);
    },
    filename: (req, file, cb) => {
      req.body.fileName = file.originalname;
      req.body.filePath = `${__dirname}/../${destination}/${req.body.fileName}`;
      req.body.fileExtension = path.extname(file.originalname).toLowerCase();
      cb(null, file.originalname);
    }
  });

  return multer({ storage }).single("file");
}

module.exports = multerUpload;
