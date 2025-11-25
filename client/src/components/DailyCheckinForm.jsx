import React, { useState } from 'react';
import useStudent from '../hooks/useStudent';

const DailyCheckinForm = () => {
  const {
    quizScore,
    setQuizScore,
    focusMinutes,
    submitDailyCheckin,
    loading,
    state,
  } = useStudent();
  const [localError, setLocalError] = useState('');

  const handleSubmit = async (event) => {
    event.preventDefault();
    const score = Number(quizScore);
    if (Number.isNaN(score) || score < 1 || score > 10) {
      setLocalError('Quiz score must be between 1 and 10.');
      return;
    }
    if (focusMinutes <= 0) {
      setLocalError('Log at least one minute of focused study time.');
      return;
    }

    setLocalError('');
    await submitDailyCheckin();
  };

  const disabled = state !== 'normal' || loading;

  return (
    <form onSubmit={handleSubmit} className="card">
      <h2 className="text-xl font-semibold mb-4">Daily Check-in</h2>
      <p className="text-sm text-gray-500 mb-6">
        Submit your quiz score and focus minutes to keep your mentor in the loop.
      </p>

      <div className="space-y-5">
        <label className="block">
          <span className="text-sm font-medium text-gray-700">Quiz Score (1-10)</span>
          <input
            type="number"
            min="1"
            max="10"
            value={quizScore}
            onChange={(event) => setQuizScore(event.target.value)}
            className="input-field mt-2"
            placeholder="How did you score today?"
            disabled={disabled}
            required
          />
        </label>

        <label className="block">
          <span className="text-sm font-medium text-gray-700">Focus Minutes</span>
          <input
            type="number"
            min="1"
            value={focusMinutes}
            readOnly
            className="input-field mt-2 bg-gray-50"
          />
          <p className="text-xs text-gray-400 mt-1">Captured from the focus timer above.</p>
        </label>

        {localError && <p className="text-sm text-red-500">{localError}</p>}

        <button
          type="submit"
          disabled={disabled}
          className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Submitting...' : 'Submit Check-in'}
        </button>
      </div>
    </form>
  );
};

export default DailyCheckinForm;

