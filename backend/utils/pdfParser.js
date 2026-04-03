const pdf = require('pdf-parse');

/**
 * Extract text content from a PDF file buffer
 * @param {Buffer} pdfBuffer - The PDF file buffer from multer
 * @returns {Promise<string>} Extracted text from PDF
 */
const extractTextFromPDF = async (pdfBuffer) => {
  try {
    const data = await pdf(pdfBuffer);

    if (!data || !data.text) {
      throw new Error('No text could be extracted from PDF');
    }

    // Clean up the text
    let text = data.text
      .replace(/\s+/g, ' ') // Replace multiple spaces/newlines with single space
      .trim();

    if (text.length === 0) {
      throw new Error('PDF appears to be empty or contains only images');
    }

    return text;
  } catch (err) {
    console.error('PDF parsing error:', err.message);
    throw new Error(`Failed to extract text from PDF: ${err.message}`);
  }
};

module.exports = { extractTextFromPDF };
