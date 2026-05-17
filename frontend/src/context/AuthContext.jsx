import React, { createContext, useContext, useState } from "react";

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem("user");
    return stored ? JSON.parse(stored) : null;
  });

  const [token, setToken] = useState(() => {
    return localStorage.getItem("token") || null;
  });

  const [showAuthModal, setShowAuthModal] = useState(false);

  const login = (userData) => {
    const userInfo = { username: userData.username };
    const userToken = userData.token;

    // ✅ Save to localStorage
    localStorage.setItem("user", JSON.stringify(userInfo));
    localStorage.setItem("token", userToken);

    setUser(userInfo);
    setToken(userToken);
    setShowAuthModal(false);
  };

  const logout = () => {
    // ✅ Clear localStorage on logout
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    setUser(null);
    setToken(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user,
        login,
        logout,
        showAuthModal,
        setShowAuthModal,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
