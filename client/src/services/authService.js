import api from './api';

const readStorage = (key) => {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
};

const writeStorage = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    // Storage can fail in private browsing or restricted environments.
  }
};

const removeStorage = (key) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // Ignore storage failures during logout/cleanup.
  }
};

export const persistSession = ({ token, user }) => {
  if (token) writeStorage('token', token);
  if (user) writeStorage('user', JSON.stringify(user));
};

// Register user
export const register = async (userData) => {
  const response = await api.post('/auth/register', userData);
  return response.data;
};

export const startRegistration = async (userData) => {
  const response = await api.post('/auth/register/start', userData);
  return response.data;
};

export const resendRegistrationOtp = async ({ email, phone }) => {
  const response = await api.post('/auth/register/resend', { email, phone });
  return response.data;
};

export const verifyEmailOtp = async ({ email, phone, otp }) => {
  const response = await api.post('/auth/register/verify-email', { email, phone, otp });
  return response.data;
};

export const completeRegistration = async ({ email, phone }) => {
  const response = await api.post('/auth/register/complete', { email, phone });
  return response.data;
};

export const forgotPassword = async ({ email }) => {
  const response = await api.post('/auth/forgot-password', { email });
  return response.data;
};

export const verifyResetOtp = async ({ email, otp }) => {
  const response = await api.post('/auth/verify-otp', { email, otp });
  return response.data;
};

export const resetPassword = async ({ resetToken, newPassword, confirmPassword }) => {
  const response = await api.post('/auth/reset-password', { resetToken, newPassword, confirmPassword });
  return response.data;
};

// Login user
export const login = async (credentials) => {
  const response = await api.post('/auth/login', credentials);
  return response.data;
};

export const loginWithGoogle = async (credential) => {
  const response = await api.post('/auth/google', { credential });
  return response.data;
};

// Get user profile
export const getProfile = async () => {
  const response = await api.get('/auth/me');
  return response.data;
};

// Get current user from localStorage
export const getCurrentUser = () => {
  const user = readStorage('user');
  if (!user) return null;
  try {
    return JSON.parse(user);
  } catch {
    removeStorage('user');
    return null;
  }
};

// Get auth token
export const getToken = () => {
  return readStorage('token');
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getToken();
};

// Check user role
export const getUserRole = () => {
  const user = getCurrentUser();
  return user ? user.role : null;
};

// Role check helpers
export const isAdmin = () => getUserRole() === 'admin';
export const isProvider = () => getUserRole() === 'service_provider';
export const isUser = () => getUserRole() === 'user';

// Logout
export const logout = () => {
  removeStorage('token');
  removeStorage('user');
};

export const getDashboardRouteForRole = (role) => {
  switch (role) {
    case 'admin':
      return '/dashboard/admin';
    case 'service_provider':
      return '/dashboard/provider';
    case 'user':
      return '/dashboard/user';
    default:
      return '/';
  }
};

// Get dashboard route based on stored role
export const getDashboardRoute = () => getDashboardRouteForRole(getUserRole());
