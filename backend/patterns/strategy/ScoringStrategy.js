// Strategy Pattern - different scoring logic per question type
class MCQScoringStrategy {
  calculate(question, answer) {
    return answer === question.correctAnswer ? question.marks : 0;
  }
}

class TrueFalseScoringStrategy {
  calculate(question, answer) {
    return answer === question.correctAnswer ? question.marks : 0;
  }
}

class FillBlankScoringStrategy {
  calculate(question, answer) {
    if (!answer) return 0;
    return answer.trim().toLowerCase() === question.correctAnswer.trim().toLowerCase()
      ? question.marks
      : 0;
  }
}

class ScoringContext {
  static getStrategy(type) {
    switch (type) {
      case 'mcq':
        return new MCQScoringStrategy();
      case 'true_false':
        return new TrueFalseScoringStrategy();
      case 'fill_blank':
        return new FillBlankScoringStrategy();
      default:
        return new MCQScoringStrategy();
    }
  }

  static scoreQuiz(questions, answers) {
    let totalScore = 0;
    const gradedAnswers = questions.map((question) => {
      const strategy = ScoringContext.getStrategy(question.type);
      const studentAnswer = answers[question._id.toString()] || '';
      const earned = strategy.calculate(question, studentAnswer);
      totalScore += earned;
      return {
        questionId: question._id,
        questionText: question.questionText,
        selectedAnswer: studentAnswer,
        correctAnswer: question.correctAnswer,
        isCorrect: earned > 0,
        marks: earned
      };
    });
    return { totalScore, gradedAnswers };
  }
}

module.exports = ScoringContext;
