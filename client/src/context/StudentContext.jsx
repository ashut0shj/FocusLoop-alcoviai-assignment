import React, {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useRef,
  useMemo,
} from 'react';
import {
  getStudents,
  createStudent,
  getStudent,
  dailyCheckin,
  completeTask,
} from '../utils/api';

const STORAGE_KEY = 'focusloop.student_id';

const StudentContext = createContext(null);

export const StudentProvider = ({ children }) => {
  const [studentId, setStudentId] = useState(null);
  const [student, setStudent] = useState(null);
  const [state, setState] = useState('normal');
  const [currentTask, setCurrentTask] = useState(null);
  const [pendingInterventionId, setPendingInterventionId] = useState(null);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(false);
  const [initializing, setInitializing] = useState(true);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [error, setError] = useState(null);
  const [quizScore, setQuizScore] = useState('');
  const [focusMinutes, setFocusMinutes] = useState(0);
  const [isTimerRunning, setIsTimerRunning] = useState(false);

  const studentIdRef = useRef(null);
  useEffect(() => {
    studentIdRef.current = studentId;
  }, [studentId]);

  const mapStudentResponse = useCallback((data) => {
    if (!data) return;
    setStudent(data);
    setState(data.state || 'normal');
    setCurrentTask(data.current_task || (data.task ? { task: data.task } : null));
    setPendingInterventionId(data.pending_intervention_id || data.current_task?.id || null);
  }, []);

  const fetchStudentProfile = useCallback(
    async (targetId, { silent = false } = {}) => {
      const idToFetch = targetId || studentIdRef.current;
      if (!idToFetch) {
        setInitializing(false);
        return null;
      }

      if (!silent) {
        setLoading(true);
      }

      try {
        const profile = await getStudent(idToFetch);
        mapStudentResponse(profile);
        setError(null);
        return profile;
      } catch (err) {
        console.error('Failed to load student profile', err);
        setError(err.message || 'Unable to load student');
        return null;
      } finally {
        if (!silent) {
          setLoading(false);
        }
        setInitializing(false);
      }
    },
    [mapStudentResponse]
  );

  const hydrateFromStorage = useCallback(() => {
    const persisted = localStorage.getItem(STORAGE_KEY);
    const defaultId = import.meta.env.VITE_DEFAULT_STUDENT_ID;
    const initialId = persisted || defaultId;

    if (initialId) {
      setStudentId(initialId);
      studentIdRef.current = initialId;
      fetchStudentProfile(initialId);
    } else {
      setInitializing(false);
    }
  }, [fetchStudentProfile]);

  useEffect(() => {
    hydrateFromStorage();
  }, [hydrateFromStorage]);

  const fetchStudentDirectory = useCallback(async () => {
    setDirectoryLoading(true);
    try {
      const data = await getStudents();
      setStudents(data);
      return data;
    } catch (err) {
      console.error('Failed to fetch students', err);
      setError(err.message || 'Unable to fetch students');
      return [];
    } finally {
      setDirectoryLoading(false);
    }
  }, []);

  const handleSelectStudent = useCallback(
    async (id) => {
      if (!id) return;
      localStorage.setItem(STORAGE_KEY, id);
      setStudentId(id);
      studentIdRef.current = id;
      await fetchStudentProfile(id);
    },
    [fetchStudentProfile]
  );

  const handleCreateStudent = useCallback(
    async (name) => {
      setLoading(true);
      try {
        const result = await createStudent(name);
        const created = result.student || result;
        setStudents((prev) => [created, ...prev]);
        await handleSelectStudent(created.id);
        return created;
      } catch (err) {
        console.error('Failed to create student', err);
        setError(err.message || 'Unable to create student');
        throw err;
      } finally {
        setLoading(false);
      }
    },
    [handleSelectStudent]
  );

  const handleDailyCheckin = useCallback(async () => {
    if (!studentIdRef.current) {
      setError('Select a student first');
      return null;
    }

    setLoading(true);
    try {
      const payload = {
        student_id: studentIdRef.current,
        quiz_score: Number(quizScore),
        focus_minutes: Number(focusMinutes),
      };

      const response = await dailyCheckin(payload);

      if (response.status === 'Pending Mentor Review') {
        setState('locked');
      } else {
        await fetchStudentProfile();
      }

      setQuizScore('');
      setFocusMinutes(0);
      setIsTimerRunning(false);
      setError(null);
      return response;
    } catch (err) {
      console.error('Failed to submit check-in', err);
      setError(err.message || 'Unable to submit check-in');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStudentProfile, focusMinutes, quizScore]);

  const handleCompleteTask = useCallback(async () => {
    if (!studentIdRef.current) return;
    setLoading(true);
    try {
      await completeTask({
        intervention_id: pendingInterventionId,
        student_id: studentIdRef.current,
      });
      await fetchStudentProfile();
      setError(null);
    } catch (err) {
      console.error('Failed to complete task', err);
      setError(err.message || 'Unable to complete task');
      throw err;
    } finally {
      setLoading(false);
    }
  }, [fetchStudentProfile, pendingInterventionId]);

  const logout = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    setStudentId(null);
    studentIdRef.current = null;
    setStudent(null);
    setState('normal');
    setCurrentTask(null);
    setPendingInterventionId(null);
    setQuizScore('');
    setFocusMinutes(0);
    setIsTimerRunning(false);
  }, []);

  // Poll when locked
  useEffect(() => {
    if (state !== 'locked' || !studentIdRef.current) {
      return undefined;
    }

    const interval = setInterval(() => {
      fetchStudentProfile(studentIdRef.current, { silent: true });
    }, 3000);

    return () => clearInterval(interval);
  }, [state, fetchStudentProfile]);

  // Cheater detection
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden && isTimerRunning) {
        setIsTimerRunning(false);
        setFocusMinutes((prev) => Math.max(prev - 1, 0));
        setError('Focus session interrupted. Stay on this tab to keep tracking time.');
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isTimerRunning]);

  const value = useMemo(
    () => ({
      initializing,
      loading,
      directoryLoading,
      error,
      state,
      student,
      studentId,
      currentTask,
      students,
      quizScore,
      setQuizScore,
      focusMinutes,
      setFocusMinutes,
      isTimerRunning,
      setIsTimerRunning,
      submitDailyCheckin: handleDailyCheckin,
      completeCurrentTask: handleCompleteTask,
      refreshStudent: fetchStudentProfile,
      selectStudent: handleSelectStudent,
      createStudent: handleCreateStudent,
      fetchStudentDirectory,
      logout,
    }),
    [
      initializing,
      loading,
      directoryLoading,
      error,
      state,
      student,
      studentId,
      currentTask,
      students,
      quizScore,
      focusMinutes,
      isTimerRunning,
      handleDailyCheckin,
      handleCompleteTask,
      fetchStudentProfile,
      handleSelectStudent,
      handleCreateStudent,
      fetchStudentDirectory,
      logout,
    ]
  );

  return <StudentContext.Provider value={value}>{children}</StudentContext.Provider>;
};

export const useStudentContext = () => useContext(StudentContext);

export default StudentContext;
