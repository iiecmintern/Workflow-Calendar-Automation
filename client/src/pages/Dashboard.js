import React, { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Clock,
  Zap,
  BarChart3,
  Users,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Play,
  Pause,
  Settings,
} from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const iconMap = {
  workflow: Zap,
  booking: Calendar,
  meeting: Calendar,
  task: CheckCircle,
  completed: CheckCircle,
  running: Play,
  paused: Pause,
};

const Dashboard = () => {
  const { user, token } = useAuth();
  const [stats, setStats] = useState(null);
  const [recentActivities, setRecentActivities] = useState([]);
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const fetchDashboard = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get("/api/dashboard/summary", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setStats(res.data.stats);
        setRecentActivities(res.data.recentActivities);
        setUpcomingTasks(res.data.upcomingTasks);
      } catch (err) {
        setError(
          err.response?.data?.message ||
            err.message ||
            "Failed to load dashboard."
        );
      }
      setLoading(false);
    };
    if (token) fetchDashboard();
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case "running":
        return "text-green-600 bg-green-100";
      case "completed":
        return "text-blue-600 bg-blue-100";
      case "paused":
        return "text-yellow-600 bg-yellow-100";
      case "error":
        return "text-red-600 bg-red-100";
      case "upcoming":
        return "text-purple-600 bg-purple-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "text-red-600 bg-red-100";
      case "medium":
        return "text-yellow-600 bg-yellow-100";
      case "low":
        return "text-green-600 bg-green-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-gray-500">Loading dashboard...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-xl text-red-500">{error}</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Welcome back, {user?.name || "User"}! 👋
          </h1>
          <p className="text-gray-600">
            Here's what's happening with your workflows and calendar today.
          </p>
        </motion.div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {stats &&
            [
              {
                title: "Active Workflows",
                value: stats.workflows,
                icon: Zap,
                color: "from-purple-500 to-purple-600",
              },
              {
                title: "Scheduled Bookings",
                value: stats.bookings,
                icon: Calendar,
                color: "from-blue-500 to-blue-600",
              },
              {
                title: "Forms",
                value: stats.forms,
                icon: BarChart3,
                color: "from-green-500 to-green-600",
              },
              {
                title: "Surveys",
                value: stats.surveys,
                icon: Users,
                color: "from-pink-500 to-pink-600",
              },
            ].map((stat, index) => {
              const Icon = stat.icon;
              return (
                <motion.div
                  key={stat.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.6, delay: index * 0.1 }}
                  className="card"
                >
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900">
                        {stat.value}
                      </p>
                    </div>
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${stat.color} rounded-lg flex items-center justify-center`}
                    >
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                </motion.div>
              );
            })}
        </div>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Activities */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="lg:col-span-2"
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Recent Activities
                </h2>
                <button
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  onClick={() => navigate("/scheduling")}
                >
                  View all
                </button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = iconMap[activity.type] || Play;
                  return (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.6, delay: 0.5 + index * 0.1 }}
                      className="flex items-start space-x-3 p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors duration-200"
                    >
                      <div
                        className={`w-8 h-8 rounded-full flex items-center justify-center ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        <Icon className="w-4 h-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900">
                          {activity.title}
                        </p>
                        <p className="text-sm text-gray-600">
                          {activity.description}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {typeof activity.time === "string"
                            ? activity.time
                            : new Date(activity.time).toLocaleString()}
                        </p>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(
                          activity.status
                        )}`}
                      >
                        {activity.status}
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </div>
          </motion.div>

          {/* Upcoming Tasks */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.6 }}
          >
            <div className="card">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">
                  Upcoming Tasks
                </h2>
                <button
                  className="text-primary-600 hover:text-primary-700 text-sm font-medium"
                  onClick={() => navigate("/calendar")}
                >
                  View calendar
                </button>
              </div>

              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.6, delay: 0.7 + index * 0.1 }}
                    className="p-4 border border-gray-200 rounded-lg hover:border-primary-300 transition-colors duration-200"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-sm font-medium text-gray-900">
                          {task.title}
                        </h3>
                        <div className="flex items-center mt-1 space-x-2">
                          <span className="text-xs text-gray-500">
                            {task.time}
                          </span>
                          <span className="text-xs text-gray-400">•</span>
                          <span className="text-xs text-gray-500">
                            {task.date}
                          </span>
                        </div>
                      </div>
                      <div
                        className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(
                          task.priority
                        )}`}
                      >
                        {task.priority}
                      </div>
                    </div>
                    <div className="flex items-center mt-3 space-x-2">
                      {task.type === "meeting" ? (
                        <Calendar className="w-4 h-4 text-blue-500" />
                      ) : (
                        <CheckCircle className="w-4 h-4 text-green-500" />
                      )}
                      <span className="text-xs text-gray-600 capitalize">
                        {task.type}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Quick Actions */}
            <div className="card mt-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                Quick Actions
              </h3>
              <div className="space-y-3">
                <button
                  className="w-full flex items-center justify-center px-4 py-2 border border-primary-300 text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors duration-200"
                  onClick={() =>
                    navigate("/workflows", { state: { openNew: true } })
                  }
                >
                  <Zap className="w-4 h-4 mr-2" />
                  Create New Workflow
                </button>
                <button
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => navigate("/calendar")}
                >
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </button>
                <button
                  className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200"
                  onClick={() => navigate("/profile")}
                >
                  <Settings className="w-4 h-4 mr-2" />
                  Settings
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
