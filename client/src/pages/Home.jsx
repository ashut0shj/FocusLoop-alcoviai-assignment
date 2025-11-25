import React from 'react';
import { Navigate } from 'react-router-dom';
import useStudent from '../hooks/useStudent';
import StudentCard from '../components/StudentCard';
import FocusTimer from '../components/FocusTimer';
import DailyCheckinForm from '../components/DailyCheckinForm';
import LockedView from '../components/LockedView';
import RemedialView from '../components/RemedialView';
import LoadingSpinner from '../components/LoadingSpinner';

const Home = () => {
  const { state, loading, initializing, student, error } = useStudent();

  if (initializing) {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  if (!student) {
    return <Navigate to="/login" replace />;
  }

  if (loading && state !== 'locked') {
    return (
      <div className="flex justify-center items-center min-h-[60vh]">
        <LoadingSpinner />
      </div>
    );
  }

  const renderStateView = () => {
    if (state === 'locked') return <LockedView />;
    if (state === 'remedial') return <RemedialView />;
    return (
      <>
        <FocusTimer />
        <DailyCheckinForm />
      </>
    );
  };

  return (
    <section className="max-w-3xl mx-auto px-4 py-10 space-y-6">
      <StudentCard />
      {error && (
        <div className="border border-red-100 bg-red-50 text-red-700 text-sm rounded-xl px-4 py-3">
          {error}
        </div>
      )}
      {renderStateView()}
    </section>
  );
};

export default Home;
