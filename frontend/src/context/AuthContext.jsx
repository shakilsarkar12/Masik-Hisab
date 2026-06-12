import React, { createContext, useContext, useState, useEffect } from 'react';

const AuthContext = createContext(null);

const HARDCODED_USER = {
  name: "Shakil",
  email: "admin@shakil.com",
  password: "shakil@11"
};

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session exists in localStorage
    const authStatus = localStorage.getItem("auth");
    if (authStatus === "true") {
      setIsAuthenticated(true);
    }
    setLoading(false);
  }, []);

  const login = (email, password) => {
    if (email === HARDCODED_USER.email && password === HARDCODED_USER.password) {
      localStorage.setItem("auth", "true");
      setIsAuthenticated(true);
      return { success: true, user: { name: HARDCODED_USER.name, email: HARDCODED_USER.email } };
    } else {
      return { success: false, message: "Invalid email or password" };
    }
  };

  const logout = () => {
    localStorage.removeItem("auth");
    setIsAuthenticated(false);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, loading, user: HARDCODED_USER }}>
      {!loading && children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
