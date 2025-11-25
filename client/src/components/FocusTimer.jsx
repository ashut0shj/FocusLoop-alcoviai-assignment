import React, { useEffect, useState, useCallback } from 'react';
import useStudent from '../hooks/useStudent';
import { logPenalty } from '../utils/api';

const FocusTimer = () => {
  const {
    isTimerRunning,
    setIsTimerRunning,
    focusMinutes,
    setFocusMinutes,
    state,
    studentId,
  } = useStudent();

  const [seconds, setSeconds] = useState(0);
  const [penalties, setPenalties] = useState(0);
  const [lastPenaltyTime, setLastPenaltyTime] = useState(null);

  const handleVisibilityChange = useCallback(() => {
    if (document.visibilityState === 'hidden' && isTimerRunning) {
      const now = Date.now();
      // Prevent multiple penalties in quick succession
      if (!lastPenaltyTime || (now - lastPenaltyTime) > 5000) {
        setPenalties(prev => {
          const newPenalties = prev + 1;
          // Log penalty to the server
          if (studentId) {
            logPenalty({ 
              studentId, 
              reason: 'tab_switch',
              details: { focusMinutes, penalties: newPenalties }
            }).catch(console.error);
          }
          return newPenalties;
        });
        setLastPenaltyTime(now);
        
        // Reset timer on penalty
        setIsTimerRunning(false);
        setSeconds(0);
        setFocusMinutes(0);
      }
    }
  }, [isTimerRunning, focusMinutes, studentId, lastPenaltyTime, setFocusMinutes, setIsTimerRunning]);

  useEffect(() => {
    // Add event listener for visibility changes
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [handleVisibilityChange]);

  useEffect(() => {
    if (!isTimerRunning) {
      return undefined;
    }

    const interval = setInterval(() => {
      setSeconds((prev) => {
        if (prev === 59) {
          setFocusMinutes((mins) => mins + 1);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isTimerRunning, setFocusMinutes]);

  useEffect(() => {
    if (state !== 'normal' && isTimerRunning) {
      setIsTimerRunning(false);
      setSeconds(0);
    }
  }, [state, isTimerRunning, setIsTimerRunning]);

  const toggleTimer = () => {
    if (isTimerRunning) {
      setSeconds(0);
    }
    setIsTimerRunning(!isTimerRunning);
  };

  const resetTimer = () => {
    setIsTimerRunning(false);
    setSeconds(0);
    setFocusMinutes(0);
  };

  const formatTime = () => {
    const hours = Math.floor(focusMinutes / 60);
    const minutes = focusMinutes % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds
      .toString()
      .padStart(2, '0')}`;
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      {penalties > 0 && (
        <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4" role="alert">
          <p className="font-bold">Penalty Applied</p>
          <p>Switching tabs or minimizing the window will reset your focus session.</p>
          <p className="text-sm mt-1">Penalties: {penalties}</p>
        </div>
      )}
      <div className="flex flex-col gap-4">
        <div>
          <p className="text-sm uppercase tracking-wide text-gray-500 mb-2">Focus Session</p>
          <div className="text-5xl font-bold text-primary font-mono">{formatTime()}</div>
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={toggleTimer}
            className={`btn flex-1 text-white ${
              isTimerRunning ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-opacity-90'
            }`}
          >
            {isTimerRunning ? 'Pause Timer' : 'Start Focus Session'}
          </button>
          <button
            type="button"
            onClick={resetTimer}
            className="btn flex-1 border border-gray-200 text-gray-700 hover:bg-gray-50"
          >
            Reset
          </button>
        </div>

        <label className="text-sm text-gray-600">
          Focus Minutes (manual override)
          <input
            type="number"
            min="0"
            value={focusMinutes}
            onChange={(event) => {
              const value = Number(event.target.value);
              if (Number.isNaN(value) || value < 0) return;
              setFocusMinutes(value);
            }}
            className="input-field mt-1"
          />
        </label>
        <p className="text-xs text-gray-500">
          Timer pauses automatically when you leave the tab. Manual override lets you capture time
          from another device.
        </p>
      </div>
    </div>
  );
};

export default FocusTimer;
