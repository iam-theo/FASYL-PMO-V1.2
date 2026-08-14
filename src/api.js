import axios from "axios";

/**
 * The base URL was hard coded to localhost, which makes every non-local build
 * (staging, preview, production) point at the developer's machine.
 */
const BASE_URL =
  import.meta.env?.VITE_API_BASE_URL ?? "http://localhost:5000/api/v1";

export const api = axios.create({
  baseURL: BASE_URL,
  // Match the reports client (see configureReports in src/main.jsx) so a
  // hanging backend fails fast instead of spinning the global loader forever.
  timeout: 20000,
  headers: {
    "Content-Type": "application/json",
  },
});

/* ============================================================
   GLOBAL LOADER STATE
   Tracks how many requests are in flight so React can show a
   full-screen spinner. Consumers subscribe via subscribeToLoading
   and unsubscribe by calling the returned function.
============================================================ */

let pendingRequests = 0;
const loadingListeners = new Set();

const setLoading = (active) => {
  loadingListeners.forEach((listener) => listener(active));
};

export const subscribeToLoading = (listener) => {
  loadingListeners.add(listener);
  return () => loadingListeners.delete(listener);
};

const trackRequestStart = () => {
  const wasIdle = pendingRequests === 0;
  pendingRequests += 1;
  if (wasIdle) setLoading(true);
};

const trackRequestEnd = () => {
  pendingRequests = Math.max(0, pendingRequests - 1);
  if (pendingRequests === 0) setLoading(false);
};

api.interceptors.request.use((config) => {
  // Background requests (polls, prefetches) opt out via config.skipLoader so
  // they never flash the full-screen GlobalLoader while the app is idle.
  if (!config.skipLoader) {
    trackRequestStart();
  }

  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  /**
   * When the payload is FormData the browser must generate the
   * `multipart/form-data` header itself, because only it knows the boundary
   * token. Setting the header by hand produces a boundary-less content type
   * and the backend's multer parser rejects the upload.
   */
  if (config.data instanceof FormData) {
    delete config.headers["Content-Type"];
  }

  return config;
});

api.interceptors.response.use(
  (response) => {
    if (!response.config?.skipLoader) {
      trackRequestEnd();
    }
    return response;
  },
  (error) => {
    if (!error.config?.skipLoader) {
      trackRequestEnd();
    }
    return Promise.reject(error);
  },
);

/** Normalizes rejected requests so callers always see the same error shape. */
const normalizeError = (error, context) => {
  if (axios.isCancel?.(error) || error?.code === "ERR_CANCELED") {
    return Promise.reject(error);
  }

  if (import.meta.env?.DEV) {
    console.error(`${context}:`, error?.response?.data ?? error?.message);
  }

  return Promise.reject(error);
};

export const assignProject = async (projectId, projectManagerEmail) => {
  try {
    const { data } = await api.patch(`/projects/${projectId}/assign`, {
      projectManagerEmail,
    });

    return data;
  } catch (error) {
    return normalizeError(error, "Assign Project Error");
  }
};

export const addProjectResource = async (projectId, resource) => {
  try {
    const { data } = await api.patch(`/projects/${projectId}/resources`, resource);

    return data;
  } catch (error) {
    return normalizeError(error, "Add Resource Error");
  }
};

export const removeProjectResource = async (projectId, recordId) => {
  try {
    const { data } = await api.delete(`/projects/${projectId}/resources/${recordId}`);

    return data;
  } catch (error) {
    return normalizeError(error, "Remove Resource Error");
  }
};

export const getStaff = async () => {
  try {
    const { data } = await api.get("/auth/staff");

    return data;
  } catch (error) {
    return normalizeError(error, "Staff Retrieval Error");
  }
};

export const getEmployees = async () => {
  try {
    const { data } = await api.get("/auth/employees");

    return data;
  } catch (error) {
    return normalizeError(error, "Employee Directory Error");
  }
};

export const createUserAccount = async (payload) => {
  try {
    const { data } = await api.post("/auth/users", payload);

    return data;
  } catch (error) {
    return normalizeError(error, "Create User Account Error");
  }
};

export const changePassword = async (payload) => {
  try {
    const { data } = await api.post("/auth/change-password", payload);

    return data;
  } catch (error) {
    return normalizeError(error, "Change Password Error");
  }
};

export const forgotPassword = async (email) => {
  try {
    const { data } = await api.post("/auth/forgot-password", { email });

    return data;
  } catch (error) {
    return normalizeError(error, "Forgot Password Error");
  }
};

export const resetPassword = async (token, newPassword) => {
  try {
    const { data } = await api.post("/auth/reset-password", {
      token,
      newPassword,
    });

    return data;
  } catch (error) {
    return normalizeError(error, "Reset Password Error");
  }
};

export const resendCredentials = async (userId) => {
  try {
    const { data } = await api.post(
      `/auth/users/${userId}/resend-credentials`,
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Resend Credentials Error");
  }
};

export const removeUser = async (userId) => {
  try {
    const { data } = await api.delete(`/auth/users/${userId}`);

    return data;
  } catch (error) {
    return normalizeError(error, "Remove User Error");
  }
};

export const handleChecklist = async (projectId, stageId, updatedChecklist) => {
  try {
    const { data } = await api.patch(
      `/projects/${projectId}/stages/${stageId}/checklist`,
      { checklist: updatedChecklist },
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Update Checklist Error");
  }
};

export const uploadStageDocument = async (projectId, stageId, docKey, file) => {
  const formData = new FormData();

  // Field name must match the backend's upload.single("file")
  formData.append("file", file);

  try {
    const { data } = await api.patch(
      `/projects/${projectId}/stages/${stageId}/docs/${docKey}`,
      formData,
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Upload Stage Document Error");
  }
};

export const deleteStageDocument = async (projectId, stageId, docKey) => {
  try {
    const { data } = await api.delete(
      `/projects/${projectId}/stages/${stageId}/docs/${docKey}`,
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Delete Stage Document Error");
  }
};

export const submitStage = async (projectId, stageOrder) => {
  try {
    const { data } = await api.post(
      `/workflow/submit/${projectId}/${stageOrder}`,
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Submit Stage Error");
  }
};

export const approveStage = async (projectId, stageOrder) => {
  try {
    const { data } = await api.post(
      `/workflow/approve/${projectId}/${stageOrder}`,
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Approve Stage Error");
  }
};

export const rejectStage = async (projectId, stageOrder, reason) => {
  try {
    const { data } = await api.post(
      `/workflow/reject/${projectId}/${stageOrder}`,
      { reason },
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Reject Stage Error");
  }
};

const appendFormDataValue = (formData, key, value) => {
  if (value === undefined || value === null) return;

  if (Array.isArray(value)) {
    value.forEach((item) => {
      if (item !== undefined && item !== null) {
        formData.append(key, item);
      }
    });
    return;
  }

  formData.append(key, value);
};

export const createTask = async (payload) => {
  try {
    const { document, ...taskFields } = payload;

    // When a document is attached the payload must be multipart/form-data so
    // multer can pick the file up. The interceptor deletes the Content-Type
    // header for FormData automatically.
    let request = payload;

    if (document instanceof File) {
      const formData = new FormData();

      Object.entries(taskFields).forEach(([key, value]) => {

        if (value === undefined || value === null) return;

        if (Array.isArray(value)) {
          value.forEach((item) => formData.append(key, item));
          return;
        }

        formData.append(key, value);
      });

      formData.append("file", document);
      request = formData;
    }

    const { data } = await api.post("/tasks", request);

    return data;
  } catch (error) {
    return normalizeError(error, "Create Task Error");
  }
};

export const getTasks = async (projectId, stageOrder) => {
  try {
    const { data } = await api.get(
      `/tasks/project/${projectId}/stage/${stageOrder}`,
    );

    return data;
  } catch (error) {
    return normalizeError(error, "Task Retrieval Error");
  }
};

export const updateTask = async (taskId, payload) => {
  try {
    let request = payload;

    // When the payload carries a file (e.g. proof of completion) it must be
    // multipart/form-data so multer can pick it up.
    const hasFile = Object.values(payload).some(
      (value) => value instanceof File,
    );

    if (hasFile) {
      const formData = new FormData();

      Object.entries(payload).forEach(([key, value]) => {
        appendFormDataValue(formData, key, value);
      });

      request = formData;
    }

    const { data } = await api.patch(`/tasks/${taskId}`, request);

    return data;
  } catch (error) {
    return normalizeError(error, "Task Update Error");
  }
};

export const deleteTask = async (taskId) => {
  try {
    const { data } = await api.delete(`/tasks/${taskId}`);

    return data;
  } catch (error) {
    return normalizeError(error, "Delete Task Error");
  }
};

export const getReminders = async () => {
  try {
    const { data } = await api.get("/reminders/my");

    return data;
  } catch (error) {
    // Previously logged as "Delete Task Error" — a copy/paste leftover that
    // made reminder failures untraceable.
    return normalizeError(error, "Reminder Retrieval Error");
  }
};

export const dismissReminder = async (id) => {
  try {
    const { data } = await api.post(`/reminders/${id}/dismiss`);

    return data;
  } catch (error) {
    return normalizeError(error, "Reminder Dismiss Error");
  }
};

export const getNotifications = async (options = {}) => {
  try {
    const { data } = await api.get("/notifications/my", options);

    return data;
  } catch (error) {
    return normalizeError(error, "Notification Retrieval Error");
  }
};

export const markNotificationRead = async (id) => {
  try {
    const { data } = await api.post(`/notifications/${id}/read`);

    return data;
  } catch (error) {
    return normalizeError(error, "Mark Notification Read Error");
  }
};

export const markAllNotificationsRead = async () => {
  try {
    const { data } = await api.post("/notifications/read-all");

    return data;
  } catch (error) {
    return normalizeError(error, "Mark All Notifications Read Error");
  }
};

export default api;
