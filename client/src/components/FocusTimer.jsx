import React, { useEffect, useState } from 'react';
import useStudent from '../hooks/useStudent';

const FocusTimer = () => {
  const {
    isTimerRunning,
    setIsTimerRunning,
    focusMinutes,
    setFocusMinutes,
    state,
  } = useStudent();

  const [seconds, setSeconds] = useState(0);

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
    <div className="card mb-6">
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
