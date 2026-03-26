import React, { createContext, useContext, useState, useEffect } from 'react';

/**
 * Auth Context for ThreatLens
 * Manages user authentication state and JWT tokens
 */
const AuthContext = createContext(null);

/**
 * AuthProvider component
 * Wraps application to provide authentication context
 */
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  /**
   * Initialize auth state from localStorage on component mount
   */
  useEffect(() => {
    const initializeAuth = () => {
      try {
        // Read token from localStorage
        const storedToken = localStorage.getItem('threatlens_token');
        const storedUser = localStorage.getItem('threatlens_user');

        if (storedToken && storedUser) {
          // Parse stored user data
          const userData = JSON.parse(storedUser);

          // Set token and user to state
          setToken(storedToken);
          setUser(userData);

          console.log('[AuthContext] Initialized with stored credentials');
        } else {
          console.log('[AuthContext] No stored credentials found');
        }
      } catch (err) {
        console.error('[AuthContext] Error initializing auth:', err.message);
        setError(err.message);

        // Clear corrupted data
        localStorage.removeItem('threatlens_token');
        localStorage.removeItem('threatlens_user');
      } finally {
        setLoading(false);
      }
    };

    initializeAuth();
  }, []);

  /**
   * Login function
   * Saves token and user to localStorage and state
   * @param {string} newToken - JWT token
   * @param {object} userData - User data object with id, email, etc.
   */
  const login = (newToken, userData) => {
    try {
      if (!newToken || !userData) {
        throw new Error('Token and user data are required');
      }

      // Save to localStorage
      localStorage.setItem('threatlens_token', newToken);
      localStorage.setItem('threatlens_user', JSON.stringify(userData));

      // Update state
      setToken(newToken);
      setUser(userData);
      setError(null);

      console.log('[AuthContext] Login successful for user:', userData.email);
    } catch (err) {
      console.error('[AuthContext] Login error:', err.message);
      setError(err.message);
      throw err;
    }
  };

  /**
   * Logout function
   * Clears token and user from localStorage and state
   */
  const logout = () => {
    try {
      // Clear localStorage
      localStorage.removeItem('threatlens_token');
      localStorage.removeItem('threatlens_user');

      // Clear state
      setToken(null);
      setUser(null);
      setError(null);

      console.log('[AuthContext] Logout successful');
    } catch (err) {
      console.error('[AuthContext] Logout error:', err.message);
      setError(err.message);
    }
  };

  /**
   * Update user data
   * Useful for updating user info without re-logging in
   * @param {object} updatedUserData - Updated user data
   */
  const updateUser = (updatedUserData) => {
    try {
      const newUserData = { ...user, ...updatedUserData };

      localStorage.setItem('threatlens_user', JSON.stringify(newUserData));
      setUser(newUserData);

      console.log('[AuthContext] User data updated');
    } catch (err) {
      console.error('[AuthContext] Error updating user:', err.message);
      setError(err.message);
    }
  };

  /**
   * Check if user is authenticated
   */
  const isAuthenticated = token !== null && user !== null;

  // Context value
  const value = {
    user,
    token,
    loading,
    error,
    isAuthenticated,
    login,
    logout,
    updateUser
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

/**
 * useAuth hook
 * Custom hook to access auth context in components
 * @returns {object} Auth context value
 * @throws {Error} If hook is used outside AuthProvider
 */
export const useAuth = () => {
  const context = useContext(AuthContext);

  if (context === null) {
    throw new Error('useAuth must be used within AuthProvider');
  }

  return context;
};

export default AuthContext;
