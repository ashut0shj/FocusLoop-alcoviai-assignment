const express = require('express');
const router = express.Router();
const supabase = require('../lib/supabase');

router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Get student data
    const { data: student, error: studentError } = await supabase
      .from('students')
      .select('*')
      .eq('id', id)
      .single();

    if (studentError || !student) {
      return res.status(404).json({ 
        error: 'Student not found' 
      });
    }

    // Get active intervention if any
    let pendingIntervention = null;
    if (student.state === 'remedial') {
      const { data: intervention } = await supabase
        .from('interventions')
        .select('id, task, status, created_at')
        .eq('student_id', id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (intervention) {
        pendingIntervention = intervention;
      }
    }

    // Get recent logs (last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const { data: logs } = await supabase
      .from('daily_logs')
      .select('quiz_score, focus_minutes, created_at')
      .eq('student_id', id)
      .gte('created_at', sevenDaysAgo.toISOString())
      .order('created_at', { ascending: false });

    // Calculate average scores
    let avgQuizScore = 0;
    let avgFocusMinutes = 0;
    
    if (logs && logs.length > 0) {
      const totalScores = logs.reduce((acc, log) => {
        return {
          quiz: acc.quiz + log.quiz_score,
          focus: acc.focus + log.focus_minutes
        };
      }, { quiz: 0, focus: 0 });

      avgQuizScore = totalScores.quiz / logs.length;
      avgFocusMinutes = totalScores.focus / logs.length;
    }

    // Prepare response
    const response = {
      id: student.id,
      name: student.name,
      state: student.state,
      task: pendingIntervention?.task || null,
      pending_intervention_id: pendingIntervention?.id || null,
      current_task: pendingIntervention
        ? {
            id: pendingIntervention.id,
            task: pendingIntervention.task,
            status: pendingIntervention.status,
            assigned_at: pendingIntervention.created_at
          }
        : null,
      stats: {
        average_quiz_score: parseFloat(avgQuizScore.toFixed(2)),
        average_focus_minutes: parseFloat(avgFocusMinutes.toFixed(2)),
        total_logs: logs?.length || 0,
        last_updated: student.updated_at || student.created_at
      },
      recent_logs: logs || []
    };

    res.status(200).json(response);

  } catch (error) {
    console.error('Get student error:', error);
    res.status(500).json({ 
      error: 'Failed to retrieve student data',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
});

module.exports = router;
module.exports.handler = require('serverless-http')(router);
