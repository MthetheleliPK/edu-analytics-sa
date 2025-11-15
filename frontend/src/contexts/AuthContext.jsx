import React, { createContext, useState, useContext, useEffect } from 'react';
import { authService } from '../services/api';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [school, setSchool] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      authService.getProfile()
        .then(response => {
          setUser(response.data);
          setSchool(response.data.schoolId);
        })
        .catch(() => {
          localStorage.removeItem('token');
        })
        .finally(() => {
          setLoading(false);
        });
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email, password) => {
    const response = await authService.login(email, password);
    const { token, user: userData, school: schoolData } = response.data;
    
  
    // Store user data including role
    localStorage.setItem('user', JSON.stringify(userData));
    setUser(userData);
  
    return userData; //
    
  };

  const register = async (schoolData, userData) => {
    const response = await authService.register(schoolData, userData);
    const { token, user: newUser, school: newSchool } = response.data;
    
    localStorage.setItem('token', token);
    setUser(newUser);
    setSchool(newSchool);
    
    return response.data;
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    setSchool(null);
  };

  const value = {
    user,
    school,
    login,
    register,
    logout,
    loading
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};