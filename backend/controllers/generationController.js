const { extractTextFromPDF } = require('../utils/pdfParser');
const { generateMCQsFromText } = require('../utils/mcqGenerator');
const Quiz = require('../models/Quiz');
const QuestionFactory = require('../patterns/factory/QuestionFactory');

/**
 * POST /api/quizzes/generate-from-notes
 * Upload PDF and generate MCQ questions
 */
const generateFromNotes = async (req, res) => {
  try {
    // Check if file was uploaded
    if (!req.file) {
      return res.status(400).json({ message: 'No PDF file provided' });
    }

    console.log(`Generating MCQs from PDF: ${req.file.originalname}`);

    // Extract text from PDF
    const extractedText = await extractTextFromPDF(req.file.buffer);
    const textPreview = extractedText.substring(0, 200);

    // Get number of questions from query param (default 10)
    const numQuestions = Math.min(parseInt(req.query.numQuestions) || 10, 20);

    // Generate MCQs using OpenAI
    const generatedQuestions = await generateMCQsFromText(extractedText, numQuestions);

    // Validate questions using QuestionFactory
    const validatedQuestions = generatedQuestions.map((q) => {
      try {
        return QuestionFactory.create(q.type, q);
      } catch (err) {
        console.warn(`Question validation failed, marking as invalid: ${err.message}`);
        return null;
      }
    }).filter(q => q !== null);

    console.log(`Generated and validated ${validatedQuestions.length} questions from PDF`);

    res.json({
      success: true,
      questions: validatedQuestions,
      extractedTextPreview: textPreview,
      totalCharacters: extractedText.length,
    });
  } catch (err) {
    console.error('generateFromNotes error:', err.message);

    // Distinguish between different error types
    if (err.message.includes('PDF') || err.message.includes('file')) {
      return res.status(400).json({ message: err.message });
    }
    if (err.message.includes('API key') || err.message.includes('OpenAI')) {
      return res.status(503).json({ message: 'AI service temporarily unavailable. Please try again later.' });
    }

    res.status(500).json({ message: err.message });
  }
};

/**
 * POST /api/quizzes/save-generated
 * Save generated questions as a new quiz
 */
const saveGeneratedQuiz = async (req, res) => {
  try {
    const { title, subject, description, timeLimit, randomizeQuestions, questions, startDate, endDate } = req.body;

    // Validate required fields
    if (!title || !subject || !questions || questions.length === 0) {
      return res.status(400).json({
        message: 'Missing required fields: title, subject, and at least one question',
      });
    }

    // Build questions using QuestionFactory (validates each question)
    const builtQuestions = questions.map((q) => {
      // Ensure type is set to 'mcq' if not already
      if (!q.type) {
        q.type = 'mcq';
      }
      return QuestionFactory.create(q.type, q);
    });

    // Create quiz object
    const quiz = await Quiz.create({
      title,
      subject,
      description,
      timeLimit,
      randomizeQuestions,
      questions: builtQuestions,
      startDate,
      endDate,
      department: req.user.department, // Auto-assign from lecturer's department
      createdBy: req.user._id,
    });

    console.log(`Saved generated quiz: ${quiz._id} with ${builtQuestions.length} questions`);

    res.status(201).json(quiz);
  } catch (err) {
    console.error('saveGeneratedQuiz error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

module.exports = { generateFromNotes, saveGeneratedQuiz };
