class StateMachine {
  static STATES = {
    NORMAL: 'normal',
    LOCKED: 'locked',
    REMEDIAL: 'remedial'
  };

  static async updateStudentState(supabase, studentId, newState) {
    const { data, error } = await supabase
      .from('students')
      .update({ state: newState })
      .eq('id', studentId)
      .select()
      .single();

    if (error) {
      throw new Error(`Failed to update student state: ${error.message}`);
    }

    return data;
  }

  static async checkAndUpdateState(supabase, studentId, quizScore, focusMinutes) {
    if (quizScore > 7 && focusMinutes > 60) {
      return await this.updateStudentState(supabase, studentId, this.STATES.NORMAL);
    } else {
      return await this.updateStudentState(supabase, studentId, this.STATES.LOCKED);
    }
  }

  static async handleInterventionAssigned(supabase, studentId) {
    return await this.updateStudentState(supabase, studentId, this.STATES.REMEDIAL);
  }

  static async handleTaskCompletion(supabase, studentId) {
    return await this.updateStudentState(supabase, studentId, this.STATES.NORMAL);
  }
}

module.exports = StateMachine;
