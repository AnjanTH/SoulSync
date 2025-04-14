import { auth } from './firebase';
import { onAuthStateChanged, setPersistence, browserLocalPersistence, signOut } from 'firebase/auth';

export const AUTH_TOKEN_KEY = 'soulsync_auth_token';

// Check if running in browser environment
const isBrowser = () => typeof window !== 'undefined';

// Get auth token from localStorage
export const getAuthToken = () => {
  if (isBrowser()) {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  }
  return null;
};

// Set auth token in localStorage
export const setAuthToken = (token) => {
  if (isBrowser()) {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  }
};

// Remove auth token from localStorage
export const removeAuthToken = () => {
  if (isBrowser()) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
  }
};

// Clear all auth-related storage
export const clearAuthStorage = () => {
  if (isBrowser()) {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem('user_preferences');
    localStorage.removeItem('chat_history');
    document.cookie.split(";").forEach(function(c) { 
      document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");
    });
  }
};

// Handle user logout
export const handleLogout = async (router) => {
  try {
    await signOut(auth);
    clearAuthStorage();
    router.push('/');
  } catch (error) {
    console.error('Error during logout:', error);
    throw error;
  }
};

// Handle successful login
export const handleSuccessfulLogin = async (user, router) => {
  try {
    const token = await user.getIdToken();
    setAuthToken(token);
    
    // Check if there's a redirect path stored
    const redirectPath = sessionStorage.getItem('redirectAfterLogin');
    sessionStorage.removeItem('redirectAfterLogin');
    
    router.push(redirectPath || '/dashboard');
  } catch (error) {
    console.error('Error handling successful login:', error);
    throw error;
  }
};

// Check if user is authenticated
export const isAuthenticated = () => {
  return !!getAuthToken() || !!auth.currentUser;
};

// Setup auth persistence
export const setupAuthPersistence = async () => {
  try {
    await setPersistence(auth, browserLocalPersistence);
  } catch (error) {
    console.error('Error setting auth persistence:', error);
  }
};

// Initialize auth state listener
export const initializeAuthListener = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      const token = await user.getIdToken();
      setAuthToken(token);
    } else {
      removeAuthToken();
    }
    if (callback) callback(user);
  });
};

// Check auth and redirect if needed
export const checkAuthAndRedirect = (router) => {
  const publicPaths = ['/', '/login', '/signup', '/reset-password'];
  const currentPath = router.pathname;

  // Store current path if it's not a public path
  if (!publicPaths.includes(currentPath)) {
    sessionStorage.setItem('redirectAfterLogin', currentPath);
  }

  // If user is on login/signup pages and is authenticated, redirect to dashboard
  if ((currentPath === '/login' || currentPath === '/signup') && isAuthenticated()) {
    router.replace('/dashboard');
    return;
  }

  // For protected paths, redirect to login if not authenticated
  if (!publicPaths.includes(currentPath) && !isAuthenticated()) {
    router.replace('/login');
  }
}; 