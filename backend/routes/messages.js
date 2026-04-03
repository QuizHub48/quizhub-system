const express = require('express');
const router = express.Router();
const Message = require('../models/Message');
const Course = require('../models/Course');
const User = require('../models/User');
const { protect, authorize } = require('../middleware/auth');

// POST /api/messages — user sends a message to admin
router.post('/', protect, authorize('student', 'lecturer'), async (req, res) => {
  try {
    const { subject, content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Message content is required' });
    const msg = await Message.create({
      sender:     req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      subject:    subject || '',
      content:    content.trim(),
    });
    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/my — user's own message thread
router.get('/my', protect, authorize('student', 'lecturer'), async (req, res) => {
  try {
    const msgs = await Message.find({ sender: req.user._id }).sort({ createdAt: 1 });
    // Mark all as read by user (admin has replied and user now views)
    await Message.updateMany({ sender: req.user._id, readByUser: false }, { readByUser: true });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/my/unread-count — how many have unread admin replies
router.get('/my/unread-count', protect, authorize('student', 'lecturer'), async (req, res) => {
  try {
    const count = await Message.countDocuments({ sender: req.user._id, readByUser: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages — admin: all messages grouped by sender
router.get('/', protect, authorize('admin'), async (req, res) => {
  try {
    const msgs = await Message.find({})
      .populate('sender', 'name email role department')
      .sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/thread/:userId — admin view full conversation with a given user
router.get('/thread/:userId', protect, authorize('admin'), async (req, res) => {
  try {
    const userId = req.params.userId;
    const msgs = await Message.find({
      $or: [
        { sender: userId, recipient: req.user._id },
        { sender: req.user._id, recipient: userId }
      ]
    })
      .populate('sender', 'name email role department')
      .populate('recipient', 'name email role department')
      .sort({ createdAt: 1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/unread-count — admin unread count
router.get('/unread-count', protect, authorize('admin'), async (req, res) => {
  try {
    const count = await Message.countDocuments({ readByAdmin: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/messages/:id/read — admin marks message as read
router.put('/:id/read', protect, authorize('admin'), async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { readByAdmin: true }, { new: true });
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/:id/reply — admin replies to a message
router.post('/:id/reply', protect, authorize('admin'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Reply content is required' });
    const msg = await Message.findById(req.params.id);
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    msg.replies.push({ content: content.trim() });
    msg.readByAdmin = true;
    msg.readByUser = false; // notify user of new reply
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/direct — student sends to lecturer
router.post('/direct', protect, authorize('student'), async (req, res) => {
  try {
    const { recipient, subject, content } = req.body;
    if (!recipient || !content?.trim()) return res.status(400).json({ message: 'Recipient and content are required' });

    // Check if lecturer is assigned to student's course/module
    const Course = require('../models/Course');
    const Module = require('../models/Module');

    const studentCourses = await Course.find({ students: req.user._id });
    const studentModules = await Module.find({ students: req.user._id }).populate('course');

    const assignedLecturerIds = new Set();

    studentCourses.forEach((course) => {
      if (course.lecturer) assignedLecturerIds.add(course.lecturer.toString());
      if (Array.isArray(course.lecturers)) {
        course.lecturers.forEach((lec) => assignedLecturerIds.add(lec.toString()));
      }
    });

    studentModules.forEach((module) => {
      if (module.lecturers?.length) {
        module.lecturers.forEach((lec) => assignedLecturerIds.add(lec.toString()));
      }
      if (module.course) {
        if (module.course.lecturer) assignedLecturerIds.add(module.course.lecturer.toString());
        if (Array.isArray(module.course.lecturers)) {
          module.course.lecturers.forEach((lec) => assignedLecturerIds.add(lec.toString()));
        }
      }
    });

    if (!assignedLecturerIds.has(recipient.toString())) {
      return res.status(403).json({ message: 'You can only message lecturers assigned to your courses' });
    }

    const msg = await Message.create({
      sender: req.user._id,
      senderName: req.user.name,
      senderRole: req.user.role,
      recipient,
      recipientRole: 'lecturer',
      subject: subject || '',
      content: content.trim(),
    });

    res.status(201).json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/direct/assigned-lecturers — student sees only assigned lecturers
router.get('/direct/assigned-lecturers', protect, authorize('student'), async (req, res) => {
  try {
    const courses = await Course.find({ students: req.user._id });
    const moduleRecords = await require('../models/Module').find({ students: req.user._id }).populate('course');

    const byCourseLecturers = courses.flatMap(c => [c.lecturer, ...(c.lecturers || [])]);
    const byModuleLecturers = moduleRecords.flatMap(m => [m.course?.lecturer, ...(m.course?.lecturers || []), ...(m.lecturers || [])]);

    const lecturerIds = [...new Set([...byCourseLecturers, ...byModuleLecturers].filter(Boolean).map(id => id.toString()))];
    const lecturers = await User.find({ _id: { $in: lecturerIds }, role: 'lecturer' }).select('name email department');

    res.json(lecturers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/direct — lecturer gets messages from students
router.get('/direct', protect, authorize('lecturer'), async (req, res) => {
  try {
    const msgs = await Message.find({ recipient: req.user._id })
      .populate('sender', 'name email department')
      .sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/messages/direct/:id/reply — lecturer replies to student
router.post('/direct/:id/reply', protect, authorize('lecturer'), async (req, res) => {
  try {
    const { content } = req.body;
    if (!content?.trim()) return res.status(400).json({ message: 'Reply content is required' });
    const msg = await Message.findById(req.params.id);
    if (!msg || msg.recipient.toString() !== req.user._id.toString()) return res.status(404).json({ message: 'Message not found' });
    msg.replies.push({ sender: req.user._id, senderName: req.user.name, content: content.trim() });
    msg.readByRecipient = true;
    msg.readBySender = false; // notify sender of reply
    await msg.save();
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// PUT /api/messages/direct/:id/read — lecturer marks as read
router.put('/direct/:id/read', protect, authorize('lecturer'), async (req, res) => {
  try {
    const msg = await Message.findByIdAndUpdate(req.params.id, { readByRecipient: true }, { new: true });
    if (!msg) return res.status(404).json({ message: 'Message not found' });
    res.json(msg);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// GET /api/messages/direct/unread-count — lecturer unread count
router.get('/direct/unread-count', protect, authorize('lecturer'), async (req, res) => {
  try {
    const count = await Message.countDocuments({ recipient: req.user._id, readByRecipient: false });
    res.json({ count });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
