const Notification = require('../models/Notification');

// GET /api/notifications/student - get student notifications
const getStudentNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { relatedUserId: req.user._id }, // notifications for this student
        { type: { $in: ['quiz_published', 'course_created'] } } // general notifications
      ]
    })
      .sort({ createdAt: -1 })
      .limit(20);

    res.json(notifications);
  } catch (err) {
    console.error('getStudentNotifications error:', err.message);
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/notifications/:id/read - mark notification as read
const markAsRead = async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );
    if (!notification) return res.status(404).json({ message: 'Notification not found' });
    res.json(notification);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = { getStudentNotifications, markAsRead };
