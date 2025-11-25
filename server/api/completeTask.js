const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');
const StateMachine = require('../utils/stateMachine');

router.post('/', async (req, res) => {
  try {
    const { intervention_id: interventionIdFromBody, student_id } = req.body;

    if (!interventionIdFromBody && !student_id) {
      return res.status(400).json({ 
        error: 'intervention_id or student_id is required' 
      });
    }

    let intervention = null;
    let interventionId = interventionIdFromBody;

    // Resolve intervention by student_id when id is not provided
    if (!interventionId) {
      const { data: pendingIntervention, error: pendingError } = await supabase
        .from('interventions')
        .select('id, student_id, task, status')
        .eq('student_id', student_id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (pendingError || !pendingIntervention) {
        return res.status(404).json({ 
          error: 'Pending intervention not found for this student' 
        });
      }

      intervention = pendingIntervention;
      interventionId = pendingIntervention.id;
    }

    // Fetch intervention details if not already loaded
    if (!intervention) {
      const { data, error: fetchError } = await supabase
        .from('interventions')
        .select('*')
        .eq('id', interventionId)
        .single();

      if (fetchError || !data) {
        return res.status(404).json({ 
          error: 'Intervention not found' 
        });
      }

      intervention = data;
    }

    // Update intervention status to completed
    const { data: updatedIntervention, error: updateError } = await supabase
      .from('interventions')
      .update({ 
        status: 'completed',
        completed_at: new Date().toISOString()
      })
      .eq('id', interventionId)
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
