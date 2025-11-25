const API_BASE = (import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api').replace(/\/$/, '');

async function request(path, options = {}) {
  const response = await fetch(`${API_BASE}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    },
    ...options,
  });

  if (!response.ok) {
    let errorPayload = {};
    try {
      errorPayload = await response.json();
    } catch (err) {
      // Ignore JSON parse errors and fall back to status text
    }

    const error = new Error(errorPayload.error || response.statusText || 'Request failed');
    error.status = response.status;
    error.details = errorPayload;
    throw error;
  }

  if (response.status === 204) {
    return {};
  }

  return response.json();
}

export function getHealth() {
  return request('/health');
}

export function getStudents() {
  return request('/students');
}

export function createStudent(name) {
  return request('/students', {
    method: 'POST',
    body: JSON.stringify({ name }),
  });
}

export function getStudent(id) {
  return request(`/student/${id}`);
}

export function dailyCheckin(payload) {
  return request('/daily-checkin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function completeTask(payload) {
  const body = payload.intervention_id
    ? { intervention_id: payload.intervention_id }
    : { student_id: payload.student_id };

  return request('/complete-task', {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

export function logPenalty(payload) {
  return request('/penalties', {
    method: 'POST',
    body: JSON.stringify({
      ...payload,
      timestamp: new Date().toISOString()
    }),
  });
}

export default {
  getHealth,
  getStudents,
  createStudent,
  getStudent,
  dailyCheckin,
  completeTask,
  logPenalty,
};

