# OCR Processing Application

This application provides OCR (Optical Character Recognition) capabilities for PDF documents.

## Features

- Upload PDF files for processing
- Convert PDF pages to images
- Perform OCR on the extracted images
- Clean API endpoints for integration

## Requirements

### Node.js Dependencies

Install Node.js dependencies with:

```bash
npm install
```

The application uses the following key dependencies:
- **pdf2pic**: For converting PDF pages to images (uses GraphicsMagick/ImageMagick under the hood)
- **restana**: Lightweight HTTP server framework
- **multer**: For handling file uploads

### System Dependencies

This application uses GraphicsMagick or ImageMagick for PDF to image conversion. You'll need to install one of these on your system:

#### Ubuntu/Debian
```bash
sudo apt-get update
sudo apt-get install graphicsmagick
# or
sudo apt-get install imagemagick
```

#### macOS
```bash
brew install graphicsmagick
# or
brew install imagemagick
```

#### Windows
Download and install GraphicsMagick from: http://www.graphicsmagick.org/download.html
or ImageMagick from: https://imagemagick.org/script/download.php

## Usage

1. Start the server:
```bash
npm start
```

2. Send a POST request to `/ocr` with a PDF file (key: "file")

3. The server will process the PDF, convert each page to an image, and return the paths to the generated images

## API Endpoints

- `POST /ocr`: Upload a PDF file for OCR processing
  - Request: multipart/form-data with PDF file (key: "file")
  - Response: JSON with processing results and image file paths # bhumio
