import React from 'react';
import LoadingSpinner from './LoadingSpinner';
import useStudent from '../hooks/useStudent';

const LockedView = () => {
  const { student } = useStudent();

  return (
    <div className="card text-center p-8">
      <div className="mb-6">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-blue-100 mb-4">
          <svg
            className="w-8 h-8 text-secondary"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold mb-2">Analysis In Progress</h2>
        <p className="text-gray-600">Waiting for mentor review for {student?.name || 'this student'}.</p>
      </div>
      <div className="mt-6">
        <LoadingSpinner />
        <p className="text-sm text-gray-500 mt-4">
          We auto-refresh every 3 seconds. You can keep the tab open—no additional action needed.
        </p>
      </div>
    </div>
  );
};

export default LockedView;
