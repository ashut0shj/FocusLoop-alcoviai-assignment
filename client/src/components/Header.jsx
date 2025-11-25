import React from 'react';
import { useNavigate } from 'react-router-dom';
import useStudent from '../hooks/useStudent';

const Header = () => {
  const { student, state, logout } = useStudent();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-white border-b border-gray-100">
      <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
        <div>
          <p className="text-xs uppercase tracking-[0.3em] text-gray-400">FocusLoop</p>
          <h1 className="text-2xl font-semibold text-gray-900">Student Companion</h1>
        </div>
        {student ? (
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-sm font-medium text-gray-900">{student.name}</p>
              <p className="text-xs text-gray-500">State: {state}</p>
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="btn text-sm bg-gray-100 text-gray-700 hover:bg-gray-200"
            >
              Switch Student
            </button>
          </div>
        ) : (
          <p className="text-sm text-gray-500">Select a student to begin</p>
        )}
      </div>
    </header>
  );
};

export default Header;
