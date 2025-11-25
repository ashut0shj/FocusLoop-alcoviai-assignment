import { useContext } from 'react';
import StudentContext from '../context/StudentContext';

export default function useStudent() {
  const context = useContext(StudentContext);
  if (!context) {
    throw new Error('useStudent must be used within a StudentProvider');
  }
  return context;
}

