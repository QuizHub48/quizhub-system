const express = require('express');
const router  = express.Router();
const Faculty = require('../models/Faculty');
const { protect, authorize } = require('../middleware/auth');

// GET /api/faculties — public
router.get('/', async (req, res) => {
  try {
    const faculties = await Faculty.find().sort('name');
    res.json(faculties);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculties — admin: create faculty
router.post('/', protect, authorize('admin'), async (req, res) => {
  try {
    const { name } = req.body;
    if (!name?.trim()) return res.status(400).json({ message: 'Faculty name is required' });
    const faculty = await Faculty.create({ name: name.trim(), departments: [] });
    res.status(201).json(faculty);
  } catch (err) {
    if (err.code === 11000) return res.status(400).json({ message: 'Faculty already exists' });
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/faculties/:id — admin: delete faculty
router.delete('/:id', protect, authorize('admin'), async (req, res) => {
  try {
    await Faculty.findByIdAndDelete(req.params.id);
    res.json({ message: 'Faculty deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// POST /api/faculties/:id/departments — admin: add department
router.post('/:id/departments', protect, authorize('admin'), async (req, res) => {
  try {
    const { name, prefix } = req.body;
    if (!name?.trim() || !prefix?.trim())
      return res.status(400).json({ message: 'Department name and prefix are required' });
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    faculty.departments.push({ name: name.trim(), prefix: prefix.trim().toUpperCase() });
    await faculty.save();
    res.json(faculty);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
});

// DELETE /api/faculties/:id/departments/:deptId — admin: remove department
router.delete('/:id/departments/:deptId', protect, authorize('admin'), async (req, res) => {
  try {
    const faculty = await Faculty.findById(req.params.id);
    if (!faculty) return res.status(404).json({ message: 'Faculty not found' });
    faculty.departments = faculty.departments.filter(
      d => d._id.toString() !== req.params.deptId
    );
    await faculty.save();
    res.json(faculty);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
