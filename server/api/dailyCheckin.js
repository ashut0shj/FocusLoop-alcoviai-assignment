const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const StateMachine = require('../utils/stateMachine');
const axios = require('axios');

router.post('/', async (req, res) => {
  try {
    const { student_id, quiz_score, focus_minutes } = req.body;

    // Input validation
    if (!student_id || quiz_score === undefined || focus_minutes === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: student_id, quiz_score, and focus_minutes are required' 
      });
    }

    // Insert daily log
    const { data: logData, error: logError } = await supabase
      .from('daily_logs')
      .insert([
        { 
          student_id, 
          quiz_score, 
          focus_minutes 
        }
      ])
      .select();

    if (logError) throw logError;

    // Check and update student state
    const student = await StateMachine.checkAndUpdateState(
      supabase, 
      student_id, 
      quiz_score, 
      focus_minutes
    );

    // If student is on track
    if (quiz_score > 7 && focus_minutes > 60) {
      return res.status(200).json({ status: 'On Track' });
    }

    // If student needs intervention, trigger webhook
    try {
      const studentData = await supabase
        .from('students')
        .select('*')
        .eq('id', student_id)
        .single();

      await axios.post(process.env.N8N_WEBHOOK_URL, {
        student_id,
        quiz_score,
        focus_minutes,
        state: student.state,
        name: studentData.data?.name || 'Unknown',
        timestamp: new Date().toISOString()
      });
    } catch (webhookError) {
      console.error('Failed to trigger webhook:', webhookError);
      // Continue execution even if webhook fails
    }

    res.status(200).json({ status: 'Pending Mentor Review' });

  } catch (error) {
    console.error('Daily check-in error:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
module.exports.handler = require('serverless-http')(router);
