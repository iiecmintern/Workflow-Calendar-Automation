import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [token, setToken] = useState(localStorage.getItem("token"));

  useEffect(() => {
    const fetchUser = async () => {
      if (token) {
        try {
          const res = await axios.get("/api/auth/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUser(res.data.user || res.data); // support both {user: ...} and user object
        } catch (err) {
          setUser(null);
          localStorage.removeItem("token");
        }
      }
      setLoading(false);
    };
    fetchUser();
    // eslint-disable-next-line
  }, [token]);

  const register = async (formData) => {
    const res = await axios.post("/api/auth/register", formData);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    return res.data;
  };

  const login = async (formData) => {
    const res = await axios.post("/api/auth/login", formData);
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    return res.data;
  };

  const googleLogin = async (tokenId) => {
    const res = await axios.post("/api/auth/google", { tokenId });
    setUser(res.data.user);
    setToken(res.data.token);
    localStorage.setItem("token", res.data.token);
    localStorage.setItem("user", JSON.stringify(res.data.user));
    return res.data;
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
    localStorage.removeItem("user");
  };

  const value = {
    user,
    token,
    login,
    register,
    googleLogin,
    logout,
    loading,
    isAuthenticated: !!user,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
