import React, { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import useStudent from '../hooks/useStudent';
import LoadingSpinner from '../components/LoadingSpinner';

const Login = () => {
  const {
    student,
    loading,
    directoryLoading,
    students,
    createStudent,
    selectStudent,
    fetchStudentDirectory,
    error,
  } = useStudent();
  const [name, setName] = useState('');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    fetchStudentDirectory();
  }, [fetchStudentDirectory]);

  if (student) {
    return <Navigate to="/home" replace />;
  }

  const handleCreateStudent = async (event) => {
    event.preventDefault();
    if (!name.trim()) {
      setFormError('Name is required');
      return;
    }
    setFormError('');
    await createStudent(name.trim());
    setName('');
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-12 space-y-8">
      <div className="card">
        {error && (
          <div className="mb-4 text-sm text-red-600 bg-red-50 border border-red-100 rounded-xl px-4 py-2">
            {error}
          </div>
        )}
        <h2 className="text-2xl font-semibold mb-2">Welcome to FocusLoop</h2>
        <p className="text-gray-600 mb-6">
          Create a student profile or pick an existing learner to jump into their dashboard.
        </p>
        <form onSubmit={handleCreateStudent} className="space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-gray-700">Student Name</span>
            <input
              type="text"
              className="input-field mt-2"
              placeholder="e.g. Ada Lovelace"
              value={name}
              onChange={(event) => setName(event.target.value)}
              disabled={loading}
            />
          </label>
          {formError && <p className="text-sm text-red-500">{formError}</p>}
          <button
            type="submit"
            className="btn btn-primary w-full disabled:opacity-50 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? 'Creating...' : 'Create & Continue'}
          </button>
        </form>
      </div>

      <div className="card">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold">Existing Students</h3>
            <p className="text-sm text-gray-500">
              Pick a profile to resume their focus plan instantly.
            </p>
          </div>
          {directoryLoading && <LoadingSpinner small />}
        </div>

        {students.length === 0 ? (
          <p className="text-sm text-gray-500">No students yet. Create one above to get started.</p>
        ) : (
          <div className="space-y-3 max-h-64 overflow-y-auto pr-1">
            {students.map((entry) => (
              <button
                type="button"
                key={entry.id}
                onClick={() => selectStudent(entry.id)}
                className="w-full text-left border border-gray-200 rounded-xl px-4 py-3 hover:border-primary hover:bg-purple-50 transition-colors"
              >
                <p className="font-medium text-gray-900">{entry.name}</p>
                <p className="text-xs text-gray-500">ID: {entry.id}</p>
              </button>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default Login;

