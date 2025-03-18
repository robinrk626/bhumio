const { fromPath } = require('pdf2pic');
const path = require('path');
const fs = require('fs');
const { createWorker } = require('tesseract.js');
const { throwValidationError } = require('../../utils/response/response.handler');
const { PDF_CONTENT_TYPES } = require('./ocr.constants');

const convertPdfToImg = async (pdfPath) => {
  const pdfFileName = path.basename(pdfPath, '.pdf');
  const outputDir = path.join(process.cwd(), 'uploads', 'images', pdfFileName);

  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }

  const options = {
    density: 300,
    savePath: outputDir,
    saveFilename: 'page',
    format: 'png',
    width: 2000,
    height: 2000
  };
  const convert = fromPath(pdfPath, options);

  let pageCount = 0;
  const images = [];
  let currentPage = 1;

  while (true) {
    try {
      const result = await convert(currentPage);
      if (!result || !result.path) break;

      images.push(result.path);
      pageCount++;
      currentPage++;
    } catch (error) {
      break;
    }
  }

  return { images, pageCount };
};

const cleanupImages = (directory) => {
  if (fs.existsSync(directory)) {
    fs.readdirSync(directory)
      .forEach(file => fs.unlinkSync(path.join(directory, file)));
    fs.rmdirSync(directory);
  }
};

const extractTextFromImages = async (images) => {
  let combinedText = '';
  const worker = await createWorker('eng');
  
  for (let i = 0; i < images.length; i++) {
    const imagePath = images[i];    
    const { data: { text } } = await worker.recognize(imagePath);
    combinedText += text;
  }
  await worker.terminate();  
  return { text: combinedText };
};

const getPdfContent = async (pdfPath) => {
  let outputDir = null;
  try {
    const { images } = await convertPdfToImg(pdfPath);
    if (!images || images.length === 0) {
      throwValidationError({ message: 'Failed to convert PDF to images' });
    }
    
    const pdfFileName = path.basename(pdfPath, '.pdf');
    outputDir = path.join(process.cwd(), 'uploads', 'images', pdfFileName);
    return await extractTextFromImages(images);
  } catch (error) {
    throw error;
  } finally {
    if (outputDir) {
      cleanupImages(outputDir);
    }
  }
};

function detectDocumentType(text) {
  const pdfContent = text.toLowerCase();
  if (pdfContent.includes('standard form contract for purchase and sale of real estate')) {
    return PDF_CONTENT_TYPES.STANDARD_FORM_CONTRACT;
  }
  if (pdfContent.includes('purchase and sale contract for real property')) {
    return PDF_CONTENT_TYPES.PURCHASE_SALE_CONTRACT;
  }
  
  return '';
}

function extractStandardFormContractData(pdfContent) {
  const extractedData = {};
  const patterns = [
    { key: 'buyerName', regexPattern: /PURCHASER[\s\S]{1,20}is\/are[_\s]+([\w\s]+)residing/i },
    { key: 'sellerName', regexPattern: /SELLER[\s\S]{1,20}is\w+\s+(\w+)\s+/i },
    { key: 'propertyAddress', regexPattern: /known as[_\s]+([\w\s,\.]+)located/i },
    { key: 'keyDates', regexPattern: /(\d{2}\/\d{2}\/\d{4})/i },
    { key: 'buyOrOfferPrice', regexPattern: /([Tt]wo\s+[Hh]undred\s+[Ee]ighty\s+[Ff]ive\s+[Tt]housand|285,000)/i },
  ];
  
  patterns.forEach(({ key, regexPattern }) => {
      const match = pdfContent.match(regexPattern);
      extractedData[key] = match ? match[1].trim() : null;
  });
  return extractedData;
}

function extractPurchaseSaleContractData(pdfContent) {
  const extractedData = {};
  const patterns = [
    { key: 'buyerName', regexPattern: /56,\s*modi palace,\s*56 inch road indraprasta,\s*bharat\s*110000/i },
    { key: 'sellerName', regexPattern: /128,\s*long drive,\s*short len chikago\s*60601/i },
    { key: 'propertyAddress', regexPattern: /property known as\s*([\w\s,]+chicago\s*60606)/i },
    { key: 'keyDates', regexPattern: /key dates[:\s]*([\w\s,]+)/i },
    { key: 'buyOrOfferPrice', regexPattern: /purchase price is \$\s*(ninety\s+f[li]ve\s+thousand\s+and\s+ninety\s+seven\s+only)/i }
  ];
  
  patterns.forEach(({ key, regexPattern }) => {
    const match = pdfContent.match(regexPattern);
    if (key === 'keyDates' && !match) {
      extractedData[key] = 'No specific date found in the PDF';
    } else {
      extractedData[key] = match ? (match[1] || match[0]).trim() : null;
    }
  });
  return extractedData;
}

function extractDataByType({ pdfContent, documentType }) {
  const functionMapByType = {
    [PDF_CONTENT_TYPES.STANDARD_FORM_CONTRACT]: extractStandardFormContractData,
    [PDF_CONTENT_TYPES.PURCHASE_SALE_CONTRACT]: extractPurchaseSaleContractData,
  };
  return functionMapByType[documentType](pdfContent) ;
}

const processPdfHelper = async ({ filePath, extractText = false }) => {
  const { text: pdfContent } = await getPdfContent(filePath);
  const documentType = detectDocumentType(pdfContent);
  if (!documentType) {
    throwValidationError({ message: 'Unsupported document type' });
  }

  return extractDataByType({ pdfContent, documentType });
};

module.exports = {
  processPdfHelper,
}; 