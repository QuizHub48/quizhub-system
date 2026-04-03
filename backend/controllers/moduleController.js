const Module = require('../models/Module');
const Course = require('../models/Course');
const User   = require('../models/User');
const Quiz   = require('../models/Quiz');

const populate = [
  { path: 'lecturers', select: 'name email department' },
  { path: 'students',  select: 'name email studentId department' },
];

// GET /api/modules/course/:courseId
const getModulesByCourse = async (req, res) => {
  try {
    const modules = await Module.find({ course: req.params.courseId })
      .populate(populate)
      .sort({ order: 1, createdAt: 1 });
    res.json(modules);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/modules
const createModule = async (req, res) => {
  try {
    const { name, description, courseId } = req.body;
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: 'Course not found' });

    const mod = await Module.create({ name, description, course: courseId });
    const populated = await Module.findById(mod._id).populate(populate);
    res.status(201).json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// PUT /api/modules/:id
const updateModule = async (req, res) => {
  try {
    const { name, description } = req.body;
    const mod = await Module.findByIdAndUpdate(
      req.params.id,
      { name, description },
      { new: true }
    ).populate(populate);
    if (!mod) return res.status(404).json({ message: 'Module not found' });
    res.json(mod);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/modules/:id
const deleteModule = async (req, res) => {
  try {
    await Module.findByIdAndDelete(req.params.id);
    res.json({ message: 'Module deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/modules/:id/lecturers — assign lecturer
const assignLecturer = async (req, res) => {
  try {
    const { lecturerId } = req.body;
    const mod = await Module.findById(req.params.id);
    if (!mod) return res.status(404).json({ message: 'Module not found' });

    const lecturer = await User.findById(lecturerId);
    if (!lecturer || lecturer.role !== 'lecturer')
      return res.status(404).json({ message: 'Lecturer not found' });

    if (!mod.lecturers.map(l => l.toString()).includes(lecturerId)) {
      mod.lecturers.push(lecturerId);
      await mod.save();
    }
    const populated = await Module.findById(mod._id).populate(populate);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/modules/:id/lecturers/:lecturerId
const removeLecturer = async (req, res) => {
  try {
    const mod = await Module.findById(req.params.id);
    if (!mod) return res.status(404).json({ message: 'Module not found' });
    mod.lecturers = mod.lecturers.filter(l => l.toString() !== req.params.lecturerId);
    await mod.save();
    const populated = await Module.findById(mod._id).populate(populate);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// POST /api/modules/:id/students — enroll student
const enrollStudent = async (req, res) => {
  try {
    const { studentId } = req.body;
    const mod = await Module.findById(req.params.id).populate('course');
    if (!mod) return res.status(404).json({ message: 'Module not found' });

    const student = await User.findById(studentId);
    if (!student || student.role !== 'student')
      return res.status(404).json({ message: 'Student not found' });

    if (student.department !== mod.course.department)
      return res.status(400).json({ message: `Student's department doesn't match course department` });

    if (!mod.students.map(s => s.toString()).includes(studentId)) {
      mod.students.push(studentId);
      await mod.save();
    }
    const populated = await Module.findById(mod._id).populate(populate);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// DELETE /api/modules/:id/students/:studentId
const unenrollStudent = async (req, res) => {
  try {
    const mod = await Module.findById(req.params.id);
    if (!mod) return res.status(404).json({ message: 'Module not found' });
    mod.students = mod.students.filter(s => s.toString() !== req.params.studentId);
    await mod.save();
    const populated = await Module.findById(mod._id).populate(populate);
    res.json(populated);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// GET /api/modules/:id/quizzes — quizzes whose subject matches module name
const getModuleQuizzes = async (req, res) => {
  try {
    const mod = await Module.findById(req.params.id).populate('course');
    if (!mod) return res.status(404).json({ message: 'Module not found' });
    const quizzes = await Quiz.find({
      department: mod.course.department,
      subject: { $regex: new RegExp(mod.name, 'i') }
    }).select('title subject totalMarks isPublished createdAt endDate');
    res.json(quizzes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

module.exports = {
  getModulesByCourse, createModule, updateModule, deleteModule,
  assignLecturer, removeLecturer, enrollStudent, unenrollStudent, getModuleQuizzes
};
