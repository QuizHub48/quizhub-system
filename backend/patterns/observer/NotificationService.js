// Observer Pattern - notifies students when quiz is published or results are released
class NotificationService {
  constructor() {
    this.observers = [];
  }

  subscribe(observer) {
    this.observers.push(observer);
  }

  unsubscribe(observer) {
    this.observers = this.observers.filter(obs => obs !== observer);
  }

  notify(event, data) {
    this.observers.forEach(observer => observer.update(event, data));
  }
}

class StudentNotificationObserver {
  constructor(studentId) {
    this.studentId = studentId;
    this.notifications = [];
  }

  update(event, data) {
    const notification = {
      event,
      message: this._buildMessage(event, data),
      timestamp: new Date(),
      read: false
    };
    this.notifications.push(notification);
    console.log(`Notification for student ${this.studentId}: ${notification.message}`);
  }

  _buildMessage(event, data) {
    switch (event) {
      case 'QUIZ_PUBLISHED':
        return `New quiz available: "${data.quizTitle}" in ${data.subject}`;
      case 'RESULT_RELEASED':
        return `Your result for "${data.quizTitle}": ${data.score}/${data.totalMarks}`;
      default:
        return `Event: ${event}`;
    }
  }
}

// Singleton notification service instance
const notificationService = new NotificationService();

module.exports = { notificationService, StudentNotificationObserver };
