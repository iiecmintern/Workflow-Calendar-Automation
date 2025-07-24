import React from "react";
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

const Dashboard = () => {
  const { user } = useAuth();

  const stats = [
    {
      title: "Active Workflows",
      value: "12",
      change: "+2",
      changeType: "positive",
      icon: Zap,
      color: "from-purple-500 to-purple-600",
    },
    {
      title: "Scheduled Tasks",
      value: "47",
      change: "+8",
      changeType: "positive",
      icon: Calendar,
      color: "from-blue-500 to-blue-600",
    },
    {
      title: "Time Saved",
      value: "23.5h",
      change: "+5.2h",
      changeType: "positive",
      icon: Clock,
      color: "from-green-500 to-green-600",
    },
    {
      title: "Team Members",
      value: "8",
      change: "+1",
      changeType: "positive",
      icon: Users,
      color: "from-pink-500 to-pink-600",
    },
  ];

  const recentActivities = [
    {
      id: 1,
      type: "workflow",
      title: "Email Campaign Started",
      description: "Automated email sequence initiated for new leads",
      time: "2 minutes ago",
      status: "running",
      icon: Play,
    },
    {
      id: 2,
      type: "meeting",
      title: "Team Standup Scheduled",
      description: "Daily standup meeting scheduled for tomorrow",
      time: "15 minutes ago",
      status: "completed",
      icon: CheckCircle,
    },
    {
      id: 3,
      type: "task",
      title: "Report Generation",
      description: "Monthly analytics report generation completed",
      time: "1 hour ago",
      status: "completed",
      icon: BarChart3,
    },
    {
      id: 4,
      type: "workflow",
      title: "Invoice Processing",
      description: "Invoice processing workflow paused due to error",
      time: "2 hours ago",
      status: "paused",
      icon: Pause,
    },
  ];

  const upcomingTasks = [
    {
      id: 1,
      title: "Client Meeting",
      time: "10:00 AM",
      date: "Today",
      priority: "high",
      type: "meeting",
    },
    {
      id: 2,
      title: "Review Q4 Reports",
      time: "2:00 PM",
      date: "Today",
      priority: "medium",
      type: "task",
    },
    {
      id: 3,
      title: "Team Retrospective",
      time: "4:00 PM",
      date: "Tomorrow",
      priority: "medium",
      type: "meeting",
    },
    {
      id: 4,
      title: "Update Documentation",
      time: "11:00 AM",
      date: "Tomorrow",
      priority: "low",
      type: "task",
    },
  ];

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
          {stats.map((stat, index) => {
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
                    <div className="flex items-center mt-1">
                      <TrendingUp
                        className={`w-4 h-4 mr-1 ${
                          stat.changeType === "positive"
                            ? "text-green-500"
                            : "text-red-500"
                        }`}
                      />
                      <span
                        className={`text-sm font-medium ${
                          stat.changeType === "positive"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {stat.change}
                      </span>
                      <span className="text-sm text-gray-500 ml-1">
                        from last week
                      </span>
                    </div>
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
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View all
                </button>
              </div>

              <div className="space-y-4">
                {recentActivities.map((activity, index) => {
                  const Icon = activity.icon;
                  return (
                    <motion.div
                      key={activity.id}
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
                          {activity.time}
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
                <button className="text-primary-600 hover:text-primary-700 text-sm font-medium">
                  View calendar
                </button>
              </div>

              <div className="space-y-4">
                {upcomingTasks.map((task, index) => (
                  <motion.div
                    key={task.id}
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
                <button className="w-full flex items-center justify-center px-4 py-2 border border-primary-300 text-primary-700 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors duration-200">
                  <Zap className="w-4 h-4 mr-2" />
                  Create New Workflow
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200">
                  <Calendar className="w-4 h-4 mr-2" />
                  Schedule Meeting
                </button>
                <button className="w-full flex items-center justify-center px-4 py-2 border border-gray-300 text-gray-700 bg-white rounded-lg hover:bg-gray-50 transition-colors duration-200">
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
