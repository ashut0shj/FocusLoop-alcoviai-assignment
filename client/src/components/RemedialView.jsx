import React from 'react';
import useStudent from '../hooks/useStudent';

const RemedialView = () => {
  const { currentTask, completeCurrentTask, loading } = useStudent();

  return (
    <div className="card p-6">
      <div className="text-center mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-pink-100 mb-4">
          <svg
            className="w-8 h-8 text-accent"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Mentor Task</h2>
        <p className="text-gray-600">
          Complete the assigned task to return to focus mode. Mentors get notified automatically.
        </p>
      </div>

      <div className="bg-gray-50 p-4 rounded-lg mb-6 text-left">
        <p className="text-sm uppercase tracking-wide text-gray-500 mb-1">Assigned Task</p>
        <p className="text-gray-900 font-medium">
          {currentTask?.task || 'No pending tasks. Please contact your mentor.'}
        </p>
      </div>

      <button
        type="button"
        onClick={completeCurrentTask}
        disabled={loading || !currentTask}
        className="btn bg-accent hover:bg-opacity-90 text-white w-full disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {loading ? 'Updating...' : 'Mark Task Complete'}
      </button>
    </div>
  );
};

export default RemedialView;
