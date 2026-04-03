const Notification = require('../models/Notification');

const createNotification = async (type, title, description, relatedUserId = null, relatedQuizId = null, relatedCourseId = null, recipientId = null) => {
  try {
    const notif = new Notification({
      type,
      title,
      description,
      relatedUserId,
      relatedQuizId,
      relatedCourseId,
      recipientId,
    });
    await notif.save();
    return notif;
  } catch (err) {
    console.error('Error creating notification:', err.message);
  }
};

module.exports = { createNotification };
