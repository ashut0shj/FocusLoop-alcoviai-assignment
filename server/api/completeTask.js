const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const StateMachine = require('../utils/stateMachine');

router.post('/', async (req, res) => {
  try {
    const { intervention_id } = req.body;

    // Input validation
    if (!intervention_id) {
      return res.status(400).json({ 
        error: 'Missing required field: intervention_id is required' 
      });
    }

    // Get the intervention to find the student_id
    const { data: intervention, error: fetchError } = await supabase
      .from('interventions')
      .select('*')
      .eq('id', intervention_id)
      .single();

    if (fetchError || !intervention) {
      return res.status(404).json({ 
        error: 'Intervention not found' 
      });
    }

    // Update intervention status to completed
    const { data: updatedIntervention, error: updateError } = await supabase
      .from('interventions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', intervention_id)
      .select()
      .single();

    if (updateError) throw updateError;

    // Update student state to normal
    await StateMachine.handleTaskCompletion(supabase, intervention.student_id);

    res.status(200).json({ 
      message: 'Task marked as completed',
      intervention: updatedIntervention
    });

  } catch (error) {
    console.error('Complete task error:', error);
    res.status(500).json({ 
      error: 'Failed to complete task',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
module.exports.handler = require('serverless-http')(router);
