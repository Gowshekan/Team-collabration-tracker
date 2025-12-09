const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// MongoDB Connection (centralized)
const connectDB = require('./config/db');

if (process.env.MONGODB_URI) {
  connectDB().catch(err => {
    console.error('Unable to establish MongoDB connection:', err);
    // Optional: exit process if DB is critical
    // process.exit(1);
  });
} else {
  console.warn('MONGODB_URI not set — skipping MongoDB connection.');
}

// Import Models
const User = require('./models/User');
const Project = require('./models/Project');
const Task = require('./models/Task');

// Routes

// User Routes
app.post('/api/users/register', async (req, res) => {
  try {
    const { name, email, password, role } = req.body;
    const user = new User({ name, email, password, role: role || 'Member' });
    await user.save();
    res.status(201).json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.post('/api/users/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findOne({ email });
    if (!user || user.password !== password) {
      return res.status(401).json({ success: false, error: 'Invalid credentials' });
    }
    res.json({ success: true, user: { id: user._id, name: user.name, email: user.email, role: user.role } });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/users', async (req, res) => {
  try {
    const users = await User.find().select('-password');
    res.json({ success: true, users });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Project Routes
app.post('/api/projects', async (req, res) => {
  try {
    const { name, description, adminId } = req.body;
    const project = new Project({ name, description, adminId, members: [adminId] });
    await project.save();
    res.status(201).json({ success: true, project });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/projects', async (req, res) => {
  try {
    const projects = await Project.find().populate('adminId', 'name email').populate('members', 'name email');
    res.json({ success: true, projects });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/projects/:id', async (req, res) => {
  try {
    const project = await Project.findById(req.params.id)
      .populate('adminId', 'name email')
      .populate('members', 'name email');
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    res.json({ success: true, project });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/projects/:id', async (req, res) => {
  try {
    const { name, description, members } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (name) project.name = name;
    if (description !== undefined) project.description = description;
    if (members) project.members = members;
    await project.save();
    const updatedProject = await Project.findById(req.params.id)
      .populate('adminId', 'name email')
      .populate('members', 'name email');
    res.json({ success: true, project: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/projects/:id/members', async (req, res) => {
  try {
    const { memberId } = req.body;
    const project = await Project.findById(req.params.id);
    if (!project) {
      return res.status(404).json({ success: false, error: 'Project not found' });
    }
    if (!project.members.includes(memberId)) {
      project.members.push(memberId);
      await project.save();
    }
    const updatedProject = await Project.findById(req.params.id)
      .populate('adminId', 'name email')
      .populate('members', 'name email');
    res.json({ success: true, project: updatedProject });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/projects/:id', async (req, res) => {
  try {
    await Project.findByIdAndDelete(req.params.id);
    await Task.deleteMany({ projectId: req.params.id });
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Task Routes
app.post('/api/tasks', async (req, res) => {
  try {
    const { title, description, projectId, assignedTo, status } = req.body;
    const task = new Task({ title, description, projectId, assignedTo, status: status || 'To Do' });
    await task.save();
    const populatedTask = await Task.findById(task._id)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.status(201).json({ success: true, task: populatedTask });
  } catch (error) {
    res.status(400).json({ success: false, error: error.message });
  }
});

app.get('/api/tasks', async (req, res) => {
  try {
    const { projectId } = req.query;
    const query = projectId ? { projectId } : {};
    const tasks = await Task.find(query)
      .populate('assignedTo', 'name email')
      .populate('projectId', 'name');
    res.json({ success: true, tasks });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { title, description, assignedTo, status } = req.body;
    const task = await Task.findByIdAndUpdate(
      req.params.id,
      { title, description, assignedTo, status },
      { new: true }
    ).populate('assignedTo', 'name email').populate('projectId', 'name');
    if (!task) {
      return res.status(404).json({ success: false, error: 'Task not found' });
    }
    res.json({ success: true, task });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.delete('/api/tasks/:id', async (req, res) => {
  try {
    await Task.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Dashboard Stats
app.get('/api/dashboard/stats', async (req, res) => {
  try {
    const totalProjects = await Project.countDocuments();
    const totalTasks = await Task.countDocuments();
    const tasksByStatus = await Task.aggregate([
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const doneTasks = tasksByStatus.find(s => s._id === 'Done')?.count || 0;
    const progressPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    
    res.json({
      success: true,
      stats: {
        totalProjects,
        totalTasks,
        tasksByStatus,
        progressPercentage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/api/dashboard/project-stats/:projectId', async (req, res) => {
  try {
    const { projectId } = req.params;
    const totalTasks = await Task.countDocuments({ projectId });
    const tasksByStatus = await Task.aggregate([
      { $match: { projectId: new mongoose.Types.ObjectId(projectId) } },
      {
        $group: {
          _id: '$status',
          count: { $sum: 1 }
        }
      }
    ]);
    
    const doneTasks = tasksByStatus.find(s => s._id === 'Done')?.count || 0;
    const progressPercentage = totalTasks > 0 ? Math.round((doneTasks / totalTasks) * 100) : 0;
    
    res.json({
      success: true,
      stats: {
        totalTasks,
        tasksByStatus,
        progressPercentage
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Serve frontend
app.get(/.*/, (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

