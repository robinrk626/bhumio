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
  const promises = images.map((imagePath) => worker.recognize(imagePath));
  const imageTexts = await Promise.all(promises);
  await worker.terminate();
  imageTexts.forEach(({ data: { text } }) => {
    combinedText += text;
  })
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
    { key: 'buyOrOfferPrice', regexPattern: /purchase price ie (.*?) dollars/i },
  ];

  patterns.forEach(({ key, regexPattern }) => {
    const match = pdfContent.match(regexPattern);
    extractedData[key] = match ? match[1].trim() : 'Not Found';
  });
  return extractedData;
}

function extractPurchaseSaleContractData(pdfContent) {
  const extractedData = {};
  const patterns = [
    { key: 'propertyAddress', regexPattern: /Property known as (.*?)\(City/ },
    { key: 'keyDates', regexPattern: /key dates[:\s]*([\w\s,]+)/i },
    { key: 'buyOrOfferPrice', regexPattern: /The purchase price is \$ (.*?)(?=\. BUYER)/ }
  ];
  patterns.forEach(({ key, regexPattern }) => {
    const match = pdfContent.match(regexPattern);
    extractedData[key] = match ? (match[1] || match[0]).trim() : 'Not Found';
  });

  const buyerAndSellerNameRegex = /Seller Name\s+Buyer Name\s+([\w\s,]+?\s\d{5})\s+([\w\s,]+?\s\d{6})/;
  const match = pdfContent.match(buyerAndSellerNameRegex);
  if (match) {
    extractedData.sellerName = match[1].trim();
    extractedData.buyerName = match[2].trim();
  }
  return extractedData;
}

function extractDataByType({ pdfContent, documentType }) {
  const functionMapByType = {
    [PDF_CONTENT_TYPES.STANDARD_FORM_CONTRACT]: extractStandardFormContractData,
    [PDF_CONTENT_TYPES.PURCHASE_SALE_CONTRACT]: extractPurchaseSaleContractData,
  };
  return functionMapByType[documentType](pdfContent);
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