const express = require('express');
const router = express.Router();
const { v4: uuidv4 } = require('uuid');
const supabase = require('../lib/supabase');
const StateMachine = require('../utils/stateMachine');

router.post('/', async (req, res) => {
  try {
    const { student_id, task } = req.body;

    // Input validation
    if (!student_id || !task) {
      return res.status(400).json({ 
        error: 'Missing required fields: student_id and task are required' 
      });
    }

    // Create intervention
    const { data, error } = await supabase
      .from('interventions')
      .insert([
        { 
          id: uuidv4(),
          student_id, 
          task,
          status: 'pending'
        }
      ])
      .select();

    if (error) throw error;

    // Update student state to remedial
    await StateMachine.handleInterventionAssigned(supabase, student_id);

    res.status(201).json({ 
      message: 'Intervention assigned successfully',
      intervention: data[0]
    });

  } catch (error) {
    console.error('Assign intervention error:', error);
    res.status(500).json({ 
      error: 'Failed to assign intervention',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
module.exports.handler = require('serverless-http')(router);
