import React from 'react';

const LoadingSpinner = ({ small = false }) => {
  const containerClass = small ? 'flex items-center justify-center' : 'flex justify-center items-center p-8';
  const sizeClass = small ? 'h-6 w-6 border' : 'h-12 w-12 border-t-2 border-b-2';

  return (
    <div className={containerClass}>
      <div className={`animate-spin rounded-full ${sizeClass} border-primary`} />
    </div>
  );
};

export default LoadingSpinner;
