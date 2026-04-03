// Factory Pattern - creates correct question object based on type
class MCQQuestion {
  constructor(data) {
    this.type = 'mcq';
    this.questionText = data.questionText;
    this.options = data.options; // array of 4 options
    this.correctAnswer = data.correctAnswer;
    this.marks = data.marks || 1;
  }
  validate() {
    return this.options && this.options.length >= 2 && this.correctAnswer;
  }
}

class TrueFalseQuestion {
  constructor(data) {
    this.type = 'true_false';
    this.questionText = data.questionText;
    this.options = ['True', 'False'];
    this.correctAnswer = data.correctAnswer;
    this.marks = data.marks || 1;
  }
  validate() {
    return ['True', 'False'].includes(this.correctAnswer);
  }
}

class FillBlankQuestion {
  constructor(data) {
    this.type = 'fill_blank';
    this.questionText = data.questionText;
    this.options = [];
    this.correctAnswer = data.correctAnswer;
    this.marks = data.marks || 1;
  }
  validate() {
    return this.correctAnswer && this.correctAnswer.length > 0;
  }
}

class QuestionFactory {
  static create(type, data) {
    switch (type) {
      case 'mcq':
        return new MCQQuestion(data);
      case 'true_false':
        return new TrueFalseQuestion(data);
      case 'fill_blank':
        return new FillBlankQuestion(data);
      default:
        throw new Error(`Unknown question type: ${type}`);
    }
  }
}

module.exports = QuestionFactory;
