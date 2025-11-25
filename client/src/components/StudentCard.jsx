import React from 'react';
import useStudent from '../hooks/useStudent';

const STATE_STYLES = {
  normal: 'bg-green-100 text-green-700',
  locked: 'bg-blue-100 text-blue-700',
  remedial: 'bg-pink-100 text-pink-700',
};

const StudentCard = () => {
  const { student, state } = useStudent();

  if (!student) {
    return null;
  }

  const badgeClass = STATE_STYLES[state] || 'bg-gray-100 text-gray-700';

  return (
    <div className="card mb-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wide">Student</p>
          <h2 className="text-2xl font-semibold text-gray-900">{student.name}</h2>
          <p className="text-xs text-gray-400 mt-1">ID: {student.id}</p>
        </div>
        <span className={`px-4 py-1.5 rounded-full text-sm font-medium ${badgeClass}`}>
          {state?.toUpperCase()}
        </span>
      </div>

      <div className="grid grid-cols-2 gap-4 text-sm">
        <div>
          <p className="text-gray-500">Avg Quiz</p>
          <p className="text-lg font-semibold text-gray-900">
            {student.stats?.average_quiz_score ?? '--'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Avg Focus (min)</p>
          <p className="text-lg font-semibold text-gray-900">
            {student.stats?.average_focus_minutes ?? '--'}
          </p>
        </div>
        <div>
          <p className="text-gray-500">Logs (7d)</p>
          <p className="text-lg font-semibold text-gray-900">{student.stats?.total_logs ?? 0}</p>
        </div>
        <div>
          <p className="text-gray-500">Last Updated</p>
          <p className="text-lg font-semibold text-gray-900">
            {student.stats?.last_updated
              ? new Date(student.stats.last_updated).toLocaleDateString()
              : '--'}
          </p>
        </div>
      </div>
    </div>
  );
};

export default StudentCard;
