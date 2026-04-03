/**
 * Generate MCQ questions from extracted text using local processing
 * No API calls needed - completely free!
 * @param {string} text - Extracted text from PDF
 * @param {number} numQuestions - Number of questions to generate (default: 10)
 * @returns {Promise<Array>} Array of MCQ question objects
 */
const generateMCQsFromText = async (text, numQuestions = 10) => {
  try {
    if (!text || text.length < 100) {
      throw new Error('PDF text is too short to generate questions');
    }

    // Split into sentences
    const sentences = text
      .split(/[.!?]+/)
      .map(s => s.trim())
      .filter(s => s.length > 20 && s.split(/\s+/).length > 5); // At least 5 words

    if (sentences.length < numQuestions) {
      throw new Error(`PDF only has ${sentences.length} meaningful sentences, need at least ${numQuestions}`);
    }

    const questions = [];
    const usedSentences = new Set();

    // Generate questions from sentences
    for (let i = 0; i < numQuestions && sentences.length > 0; i++) {
      // Pick random sentence not yet used
      let sentenceIndex = Math.floor(Math.random() * sentences.length);
      let attempts = 0;
      while (usedSentences.has(sentenceIndex) && attempts < 10) {
        sentenceIndex = Math.floor(Math.random() * sentences.length);
        attempts++;
      }

      if (usedSentences.has(sentenceIndex)) continue;

      const sentence = sentences[sentenceIndex];
      usedSentences.add(sentenceIndex);

      const question = generateQuestionFromSentence(sentence, sentences);
      if (question) {
        questions.push(question);
      }
    }

    if (questions.length === 0) {
      throw new Error('Could not generate questions from PDF content');
    }

    console.log(`Successfully generated ${questions.length} MCQ questions (local processing)`);
    return questions;
  } catch (err) {
    console.error('MCQ generation error:', err.message);
    throw new Error(`Failed to generate MCQs: ${err.message}`);
  }
};

/**
 * Generate a single MCQ from a sentence
 */
function generateQuestionFromSentence(sentence, allSentences) {
  const words = sentence.split(/\s+/).filter(w => w.length > 3);
  if (words.length < 5) return null;

  // Strategy 1: Blank out a word and make it a fill-in-the-blank MCQ
  const correctAnswerIndex = Math.floor(Math.random() * Math.min(words.length, 10));
  const correctAnswer = words[correctAnswerIndex];
  const questionText = sentence
    .split(/\s+/)
    .map((w, idx) => (idx === correctAnswerIndex ? '________' : w))
    .join(' ');

  // Generate wrong answers from other sentences
  const wrongAnswers = new Set();
  for (let i = 0; i < allSentences.length && wrongAnswers.size < 3; i++) {
    const otherWords = allSentences[i].split(/\s+/).filter(w => w.length > 3 && w !== correctAnswer);
    if (otherWords.length > 0) {
      const randomWord = otherWords[Math.floor(Math.random() * otherWords.length)];
      if (randomWord.length > 2 && randomWord !== correctAnswer) {
        wrongAnswers.add(randomWord);
      }
    }
  }

  // If not enough wrong answers, create plausible distractors
  while (wrongAnswers.size < 3) {
    const distractor = generateDistractor(correctAnswer);
    if (distractor && distractor !== correctAnswer) {
      wrongAnswers.add(distractor);
    }
  }

  const options = [correctAnswer, ...Array.from(wrongAnswers).slice(0, 3)];

  // Shuffle options
  for (let i = options.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [options[i], options[j]] = [options[j], options[i]];
  }

  return {
    type: 'mcq',
    questionText: `Complete the sentence: "${questionText}"`,
    options,
    correctAnswer,
    marks: 1,
  };
}

/**
 * Generate a plausible distractor word
 */
function generateDistractor(word) {
  const distractors = {
    'is': ['was', 'are', 'been'],
    'the': ['a', 'an', 'this'],
    'and': ['or', 'but', 'with'],
    'of': ['in', 'from', 'to'],
    'to': ['for', 'at', 'by'],
  };

  if (distractors[word.toLowerCase()]) {
    return distractors[word.toLowerCase()][0];
  }

  // Generic distractors based on word length
  const commonWords = [
    'important', 'significant', 'essential', 'critical',
    'process', 'system', 'method', 'approach',
    'example', 'instance', 'case', 'situation',
    'problem', 'issue', 'challenge', 'difficulty',
    'solution', 'answer', 'response', 'result',
  ];

  return commonWords[Math.floor(Math.random() * commonWords.length)];
}

module.exports = { generateMCQsFromText };
