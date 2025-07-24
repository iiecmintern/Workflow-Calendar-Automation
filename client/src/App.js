import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./contexts/AuthContext";
import { WorkflowProvider } from "./contexts/WorkflowContext";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import Workflows from "./pages/Workflows";
import WorkflowBuilder from "./pages/WorkflowBuilder";
import Webhooks from "./pages/Webhooks";
import Profile from "./pages/Profile";
import Approvals from "./pages/Approvals";
import AvailabilitySettings from "./pages/AvailabilitySettings";
import CalendarPage from "./pages/CalendarPage";
import Scheduling from "./pages/Scheduling";
import PublicBookingPage from "./pages/PublicBookingPage";
import Forms from "./pages/Forms";
import SurveyBuilder from "./pages/SurveyBuilder";
import SurveyResponse from "./pages/SurveyResponse";
import Surveys from "./pages/Surveys";
import SurveyAnalytics from "./pages/SurveyAnalytics";
import SurveyResponses from "./pages/SurveyResponses";
import AutoReschedule from "./pages/AutoReschedule";

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }
  return isAuthenticated ? children : <Navigate to="/login" />;
};

// App Content Component
const AppContent = () => {
  const { isAuthenticated } = useAuth();
  return (
    <div className="flex min-h-screen flex-col">
      <div className="flex flex-1 min-h-0">
        <Navbar />
        <main className="flex-1 min-h-0 flex flex-col">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Login />
              }
            />
            <Route
              path="/signup"
              element={
                isAuthenticated ? <Navigate to="/dashboard" /> : <Signup />
              }
            />
            <Route
              path="/dashboard"
              element={
                <ProtectedRoute>
                  <Dashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workflows"
              element={
                <ProtectedRoute>
                  <Workflows />
                </ProtectedRoute>
              }
            />
            <Route
              path="/workflows/:id"
              element={
                <ProtectedRoute>
                  <WorkflowBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/webhooks"
              element={
                <ProtectedRoute>
                  <Webhooks />
                </ProtectedRoute>
              }
            />
            <Route
              path="/calendar-automation"
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      Calendar Automation
                    </h1>
                    <p className="text-gray-600 mb-8">
                      This page is under construction.
                    </p>
                    <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                      <svg
                        className="w-8 h-8 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"
                        />
                      </svg>
                    </div>
                  </div>
                </div>
              }
            />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <Profile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/approvals"
              element={
                <ProtectedRoute>
                  <Approvals />
                </ProtectedRoute>
              }
            />
            <Route
              path="/settings"
              element={
                <ProtectedRoute>
                  <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                    <div className="text-center">
                      <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Settings
                      </h1>
                      <p className="text-gray-600 mb-8">
                        Settings panel coming soon.
                      </p>
                      <div className="w-16 h-16 bg-gradient-to-r from-primary-500 to-purple-600 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <svg
                          className="w-8 h-8 text-white"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                          />
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                          />
                        </svg>
                      </div>
                    </div>
                  </div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/availability"
              element={
                <ProtectedRoute>
                  <AvailabilitySettings />
                </ProtectedRoute>
              }
            />
            <Route
              path="/scheduling"
              element={
                <ProtectedRoute>
                  <Scheduling />
                </ProtectedRoute>
              }
            />
            <Route path="/book/:slug" element={<PublicBookingPage />} />
            <Route path="/survey/:sessionId" element={<SurveyResponse />} />
            <Route
              path="/forms"
              element={
                <ProtectedRoute>
                  <Forms />
                </ProtectedRoute>
              }
            />
            <Route
              path="/survey-builder"
              element={
                <ProtectedRoute>
                  <SurveyBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/survey-builder/:id"
              element={
                <ProtectedRoute>
                  <SurveyBuilder />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys"
              element={
                <ProtectedRoute>
                  <Surveys />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id/analytics"
              element={
                <ProtectedRoute>
                  <SurveyAnalytics />
                </ProtectedRoute>
              }
            />
            <Route
              path="/surveys/:id/responses"
              element={
                <ProtectedRoute>
                  <SurveyResponses />
                </ProtectedRoute>
              }
            />
            <Route
              path="/auto-reschedule"
              element={
                <ProtectedRoute>
                  <AutoReschedule />
                </ProtectedRoute>
              }
            />
            <Route
              path="*"
              element={
                <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                  <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                      404 - Page Not Found
                    </h1>
                    <p className="text-gray-600 mb-8">
                      The page you're looking for doesn't exist.
                    </p>
                    <a href="/" className="btn-primary">
                      Go Home
                    </a>
                  </div>
                </div>
              }
            />
          </Routes>
        </main>
      </div>
      <Footer />
    </div>
  );
};

const App = () => (
  <AuthProvider>
    <WorkflowProvider>
      <AppContent />
    </WorkflowProvider>
  </AuthProvider>
);

export default App;
