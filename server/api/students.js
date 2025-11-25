const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');

// Create a new student
router.post('/', async (req, res) => {
  try {
    const { name } = req.body;
    
    if (!name) {
      return res.status(400).json({ error: 'Name is required' });
    }

    const student = {
      id: uuidv4(),
      name,
      state: 'normal',
      created_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('students')
      .insert([student])
      .select();

    if (error) throw error;

    res.status(201).json({
      message: 'Student created successfully',
      student: data[0]
    });

  } catch (error) {
    console.error('Create student error:', error);
    res.status(500).json({ 
      error: 'Failed to create student',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

// Get all students
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Get students error:', error);
    res.status(500).json({ 
      error: 'Failed to fetch students',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
module.exports.handler = require('serverless-http')(router);
