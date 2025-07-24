import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const googleBtnRef = useRef(null);
  const navigate = useNavigate();
  const { login, googleLogin } = useAuth();

  useEffect(() => {
    if (window.google && googleBtnRef.current) {
      window.google.accounts.id.initialize({
        client_id: process.env.REACT_APP_GOOGLE_CLIENT_ID,
        callback: handleGoogleResponse,
      });
      window.google.accounts.id.renderButton(googleBtnRef.current, {
        theme: "outline",
        size: "large",
        width: 300,
        text: "continue_with",
        shape: "pill",
      });
    }
    // eslint-disable-next-line
  }, []);

  const handleGoogleResponse = async (response) => {
    try {
      await googleLogin(response.credential);
      navigate("/dashboard");
    } catch (err) {
      setError(err.message || "Google login failed");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) {
      setError("Please enter both email and password.");
      return;
    }
    try {
      await login({ email, password });
      navigate("/dashboard");
      setError("Login successful!");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Login failed");
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-purple-100 py-8 px-2">
      <div className="w-full max-w-3xl bg-white/90 rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden border border-gray-200">
        <div className="hidden md:flex flex-1 items-center justify-center bg-gradient-to-tr from-blue-100 to-purple-200 p-8">
          <img
            src="/images/feature-analytics.png"
            alt="Login Visual"
            className="w-full max-w-xs rounded-2xl shadow-xl border-4 border-white"
          />
        </div>
        <div className="flex-1 flex flex-col justify-center p-8 md:p-12">
          <h2 className="text-3xl font-extrabold text-blue-700 mb-6 text-center">
            Login to WorkflowSuite
          </h2>
          <div className="flex flex-col items-center mb-6">
            <div ref={googleBtnRef} className="mb-2" />
            <span className="text-gray-400 text-sm">or</span>
          </div>
          {error && (
            <div className="mb-4 text-red-500 text-center">{error}</div>
          )}
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Email
              </label>
              <input
                type="email"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                placeholder="Enter your email"
              />
            </div>
            <div>
              <label className="block mb-1 font-medium text-gray-700">
                Password
              </label>
              <input
                type="password"
                className="w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-400"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Enter your password"
              />
            </div>
            <button
              type="submit"
              className="w-full bg-gradient-to-r from-blue-600 to-purple-600 text-white py-3 rounded-lg font-bold text-lg shadow-lg hover:scale-105 transition-transform"
            >
              Login
            </button>
          </form>
          <div className="mt-6 text-center text-gray-600">
            Don&apos;t have an account?{" "}
            <a
              href="/signup"
              className="text-blue-600 font-semibold hover:underline"
            >
              Sign Up
            </a>
          </div>
        </div>
      </div>
      {/* Google Identity Services script removed; now loaded globally in index.html */}
    </div>
  );
};

export default Login;
