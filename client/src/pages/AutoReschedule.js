import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  Settings,
  Play,
  Pause,
  Edit,
  Trash2,
  Eye,
  TestTube,
  Zap,
  Clock,
  AlertTriangle,
  CheckCircle,
  XCircle,
  ArrowRight,
  Filter,
  BarChart3,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const AutoReschedule = () => {
  const { token, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [rules, setRules] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showTestModal, setShowTestModal] = useState(false);
  const [selectedRule, setSelectedRule] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [bookingPages, setBookingPages] = useState([]);
  const [surveys, setSurveys] = useState([]);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!authLoading && token) {
      fetchData();
    }
  }, [authLoading, token]);

  const fetchData = async () => {
    try {
      const [rulesRes, bookingsRes, pagesRes, surveysRes] = await Promise.all([
        axios.get("/api/auto-reschedule", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/bookings", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/booking-pages", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        axios.get("/api/surveys", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ]);

      setRules(rulesRes.data);
      setBookings(bookingsRes.data);
      setBookingPages(pagesRes.data);
      setSurveys(surveysRes.data);
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateRule = async (ruleData) => {
    try {
      const response = await axios.post("/api/auto-reschedule", ruleData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRules([response.data, ...rules]);
      setShowCreateModal(false);
    } catch (error) {
      console.error("Error creating rule:", error);
    }
  };

  const handleUpdateRule = async (ruleData) => {
    try {
      const response = await axios.put(
        `/api/auto-reschedule/${selectedRule._id}`,
        ruleData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRules(
        rules.map((rule) =>
          rule._id === selectedRule._id ? response.data : rule
        )
      );
      setShowEditModal(false);
      setSelectedRule(null);
    } catch (error) {
      console.error("Error updating rule:", error);
    }
  };

  const handleDeleteRule = async (ruleId) => {
    if (!window.confirm("Are you sure you want to delete this rule?")) return;

    try {
      await axios.delete(`/api/auto-reschedule/${ruleId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRules(rules.filter((rule) => rule._id !== ruleId));
    } catch (error) {
      console.error("Error deleting rule:", error);
    }
  };

  const handleToggleRule = async (ruleId) => {
    try {
      const response = await axios.post(
        `/api/auto-reschedule/${ruleId}/toggle`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRules(
        rules.map((rule) =>
          rule._id === ruleId
            ? { ...rule, isActive: response.data.isActive }
            : rule
        )
      );
    } catch (error) {
      console.error("Error toggling rule:", error);
    }
  };

  const handleTestRule = async (ruleId, bookingId) => {
    try {
      const response = await axios.post(
        `/api/auto-reschedule/${ruleId}/test`,
        { bookingId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error testing rule:", error);
      throw error;
    }
  };

  const handleExecuteRule = async (ruleId, bookingId) => {
    try {
      const response = await axios.post(
        `/api/auto-reschedule/${ruleId}/execute`,
        { bookingId },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return response.data;
    } catch (error) {
      console.error("Error executing rule:", error);
      throw error;
    }
  };

  const getFilteredRules = () => {
    if (filter === "all") return rules;
    return rules.filter((rule) => rule.isActive === (filter === "active"));
  };

  const getConditionIcon = (type) => {
    switch (type) {
      case "rating_below":
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case "sentiment_negative":
        return <XCircle className="w-4 h-4 text-red-500" />;
      case "no_show":
        return <Clock className="w-4 h-4 text-orange-500" />;
      case "cancelled":
        return <XCircle className="w-4 h-4 text-gray-500" />;
      case "feedback_missing":
        return <Eye className="w-4 h-4 text-blue-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActionIcon = (type) => {
    switch (type) {
      case "reschedule":
        return <Clock className="w-4 h-4 text-blue-500" />;
      case "follow_up":
        return <ArrowRight className="w-4 h-4 text-green-500" />;
      case "refund":
        return <CheckCircle className="w-4 h-4 text-purple-500" />;
      case "compensation":
        return <Zap className="w-4 h-4 text-yellow-500" />;
      case "escalate":
        return <AlertTriangle className="w-4 h-4 text-red-500" />;
      default:
        return <Settings className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading auto-reschedule rules...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-0 px-0 relative overflow-hidden">
      <img
        src={BG_IMAGE}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-80 z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-purple-100/20 to-pink-100/20 z-0" />

      <div className="w-full max-w-7xl mx-auto rounded-3xl mt-10 mb-10 overflow-hidden shadow-2xl relative z-10">
        <div
          className="bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 p-8 flex flex-col items-center gap-4"
          style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
        >
          <div className="flex items-center gap-3">
            <Zap className="text-white text-4xl drop-shadow-lg" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
              Auto-Reschedule Flows
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium drop-shadow text-center">
            Automatically handle meeting issues with smart workflows
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-b-3xl shadow-2xl p-8 border-t-0 border border-blue-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <h2 className="text-2xl font-bold text-gray-800">Smart Rules</h2>
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-gray-600" />
                <select
                  value={filter}
                  onChange={(e) => setFilter(e.target.value)}
                  className="px-3 py-1 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="all">All Rules ({rules.length})</option>
                  <option value="active">
                    Active ({rules.filter((r) => r.isActive).length})
                  </option>
                  <option value="inactive">
                    Inactive ({rules.filter((r) => !r.isActive).length})
                  </option>
                </select>
              </div>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-200 shadow-lg hover:shadow-xl"
            >
              <Plus className="w-4 h-4" />
              Create Rule
            </button>
          </div>

          {/* Rules Grid */}
          {getFilteredRules().length === 0 ? (
            <div className="text-center py-12">
              <Zap className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                {filter === "all"
                  ? "No auto-reschedule rules yet"
                  : `No ${filter} rules`}
              </h3>
              <p className="text-gray-500 mb-6">
                {filter === "all"
                  ? "Create your first auto-reschedule rule to automatically handle meeting issues."
                  : `No ${filter} rules found.`}
              </p>
              {filter === "all" && (
                <button
                  onClick={() => setShowCreateModal(true)}
                  className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
                >
                  Create Your First Rule
                </button>
              )}
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {getFilteredRules().map((rule) => (
                <motion.div
                  key={rule._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  {/* Rule Header */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold text-gray-800">
                          {rule.name}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded-full ${
                            rule.isActive
                              ? "bg-green-100 text-green-800"
                              : "bg-gray-100 text-gray-800"
                          }`}
                        >
                          {rule.isActive ? "Active" : "Inactive"}
                        </span>
                      </div>
                      {rule.description && (
                        <p className="text-sm text-gray-600">
                          {rule.description}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleToggleRule(rule._id)}
                        className={`p-2 rounded-lg transition ${
                          rule.isActive
                            ? "text-green-600 hover:bg-green-50"
                            : "text-gray-600 hover:bg-gray-50"
                        }`}
                        title={rule.isActive ? "Deactivate" : "Activate"}
                      >
                        {rule.isActive ? (
                          <Pause className="w-4 h-4" />
                        ) : (
                          <Play className="w-4 h-4" />
                        )}
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setShowEditModal(true);
                        }}
                        className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => {
                          setSelectedRule(rule);
                          setShowTestModal(true);
                        }}
                        className="p-2 text-purple-600 hover:bg-purple-50 rounded-lg transition"
                        title="Test"
                      >
                        <TestTube className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteRule(rule._id)}
                        className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Conditions */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Conditions:
                    </h4>
                    <div className="space-y-1">
                      {rule.conditions.map((condition, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          {getConditionIcon(condition.type)}
                          <span className="text-gray-600">
                            {condition.type.replace("_", " ")}{" "}
                            {condition.operator} {condition.value}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="mb-4">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Actions:
                    </h4>
                    <div className="space-y-1">
                      {rule.actions.map((action, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-2 text-sm"
                        >
                          {getActionIcon(action.type)}
                          <span className="text-gray-600 capitalize">
                            {action.type.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Statistics */}
                  <div className="flex items-center justify-between pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-4 text-xs text-gray-500">
                      <div className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        <span>{rule.stats.totalExecutions} executions</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3 text-green-500" />
                        <span>{rule.stats.successfulActions} successful</span>
                      </div>
                    </div>
                    {rule.stats.lastExecuted && (
                      <div className="text-xs text-gray-500">
                        Last:{" "}
                        {new Date(rule.stats.lastExecuted).toLocaleDateString()}
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || showEditModal) && (
        <RuleModal
          rule={selectedRule}
          isEdit={showEditModal}
          onClose={() => {
            setShowCreateModal(false);
            setShowEditModal(false);
            setSelectedRule(null);
          }}
          onSubmit={showCreateModal ? handleCreateRule : handleUpdateRule}
          bookingPages={bookingPages}
          surveys={surveys}
        />
      )}

      {/* Test Modal */}
      {showTestModal && selectedRule && (
        <TestModal
          rule={selectedRule}
          bookings={bookings}
          onClose={() => {
            setShowTestModal(false);
            setSelectedRule(null);
          }}
          onTest={handleTestRule}
          onExecute={handleExecuteRule}
        />
      )}

      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

// Rule Modal Component
const RuleModal = ({
  rule,
  isEdit,
  onClose,
  onSubmit,
  bookingPages,
  surveys,
}) => {
  const [formData, setFormData] = useState({
    name: rule?.name || "",
    description: rule?.description || "",
    conditions: rule?.conditions || [],
    actions: rule?.actions || [],
    settings: rule?.settings || {
      executeImmediately: false,
      executeAfterHours: 1,
      maxExecutions: 1,
      requireConfirmation: false,
    },
    bookingPages: rule?.bookingPages || [],
    surveys: rule?.surveys || [],
  });

  const addCondition = () => {
    setFormData({
      ...formData,
      conditions: [
        ...formData.conditions,
        { type: "rating_below", value: 3, operator: "less_than" },
      ],
    });
  };

  const removeCondition = (index) => {
    setFormData({
      ...formData,
      conditions: formData.conditions.filter((_, i) => i !== index),
    });
  };

  const updateCondition = (index, field, value) => {
    const newConditions = [...formData.conditions];
    newConditions[index] = { ...newConditions[index], [field]: value };
    setFormData({ ...formData, conditions: newConditions });
  };

  const addAction = () => {
    setFormData({
      ...formData,
      actions: [
        ...formData.actions,
        { type: "reschedule", rescheduleSettings: { withinDays: 7 } },
      ],
    });
  };

  const removeAction = (index) => {
    setFormData({
      ...formData,
      actions: formData.actions.filter((_, i) => i !== index),
    });
  };

  const updateAction = (index, field, value) => {
    const newActions = [...formData.actions];
    newActions[index] = { ...newActions[index], [field]: value };
    setFormData({ ...formData, actions: newActions });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            {isEdit
              ? "Edit Auto-Reschedule Rule"
              : "Create Auto-Reschedule Rule"}
          </h2>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-6">
          {/* Basic Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Rule Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <input
                type="text"
                value={formData.description}
                onChange={(e) =>
                  setFormData({ ...formData, description: e.target.value })
                }
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>

          {/* Conditions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Conditions
              </h3>
              <button
                type="button"
                onClick={addCondition}
                className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                Add Condition
              </button>
            </div>
            <div className="space-y-3">
              {formData.conditions.map((condition, index) => (
                <div
                  key={index}
                  className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg"
                >
                  <select
                    value={condition.type}
                    onChange={(e) =>
                      updateCondition(index, "type", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="rating_below">Rating Below</option>
                    <option value="sentiment_negative">
                      Negative Sentiment
                    </option>
                    <option value="no_show">No Show</option>
                    <option value="cancelled">Cancelled</option>
                    <option value="feedback_missing">Feedback Missing</option>
                  </select>
                  <select
                    value={condition.operator}
                    onChange={(e) =>
                      updateCondition(index, "operator", e.target.value)
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="less_than">Less Than</option>
                    <option value="greater_than">Greater Than</option>
                    <option value="equals">Equals</option>
                    <option value="not_equals">Not Equals</option>
                  </select>
                  <input
                    type="number"
                    value={condition.value}
                    onChange={(e) =>
                      updateCondition(
                        index,
                        "value",
                        parseFloat(e.target.value)
                      )
                    }
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Value"
                  />
                  <button
                    type="button"
                    onClick={() => removeCondition(index)}
                    className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-800">Actions</h3>
              <button
                type="button"
                onClick={addAction}
                className="px-3 py-1 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                Add Action
              </button>
            </div>
            <div className="space-y-3">
              {formData.actions.map((action, index) => (
                <div key={index} className="p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <select
                      value={action.type}
                      onChange={(e) =>
                        updateAction(index, "type", e.target.value)
                      }
                      className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="reschedule">Reschedule</option>
                      <option value="follow_up">Follow Up</option>
                      <option value="refund">Refund</option>
                      <option value="compensation">Compensation</option>
                      <option value="escalate">Escalate</option>
                    </select>
                    <button
                      type="button"
                      onClick={() => removeAction(index)}
                      className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Action-specific settings */}
                  {action.type === "reschedule" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Within Days
                        </label>
                        <input
                          type="number"
                          value={action.rescheduleSettings?.withinDays || 7}
                          onChange={(e) =>
                            updateAction(index, "rescheduleSettings", {
                              ...action.rescheduleSettings,
                              withinDays: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}

                  {action.type === "follow_up" && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                          Delay (Hours)
                        </label>
                        <input
                          type="number"
                          value={action.followUpSettings?.delayHours || 24}
                          onChange={(e) =>
                            updateAction(index, "followUpSettings", {
                              ...action.followUpSettings,
                              delayHours: parseInt(e.target.value),
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Settings */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center gap-3">
                <input
                  type="checkbox"
                  id="executeImmediately"
                  checked={formData.settings.executeImmediately}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        executeImmediately: e.target.checked,
                      },
                    })
                  }
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                />
                <label
                  htmlFor="executeImmediately"
                  className="text-sm text-gray-700"
                >
                  Execute immediately
                </label>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Execute After (Hours)
                </label>
                <input
                  type="number"
                  value={formData.settings.executeAfterHours}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      settings: {
                        ...formData.settings,
                        executeAfterHours: parseInt(e.target.value),
                      },
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Associated Items */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-4">
              Associated Items
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Booking Pages (Optional)
                </label>
                <select
                  multiple
                  value={formData.bookingPages}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      bookingPages: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {bookingPages.map((page) => (
                    <option key={page._id} value={page._id}>
                      {page.title}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Surveys (Optional)
                </label>
                <select
                  multiple
                  value={formData.surveys}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      surveys: Array.from(
                        e.target.selectedOptions,
                        (option) => option.value
                      ),
                    })
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  {surveys.map((survey) => (
                    <option key={survey._id} value={survey._id}>
                      {survey.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex items-center justify-end gap-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 text-gray-600 hover:text-gray-800 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
            >
              {isEdit ? "Update Rule" : "Create Rule"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Test Modal Component
const TestModal = ({ rule, bookings, onClose, onTest, onExecute }) => {
  const [selectedBooking, setSelectedBooking] = useState("");
  const [testResult, setTestResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleTest = async () => {
    if (!selectedBooking) return;

    setLoading(true);
    try {
      const result = await onTest(rule._id, selectedBooking);
      setTestResult(result);
    } catch (error) {
      setTestResult({ error: error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleExecute = async () => {
    if (!selectedBooking) return;

    setLoading(true);
    try {
      const result = await onExecute(rule._id, selectedBooking);
      setTestResult({ ...testResult, executionResult: result });
    } catch (error) {
      setTestResult({ ...testResult, executionError: error.message });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-800">
            Test Rule: {rule.name}
          </h2>
        </div>

        <div className="p-6 space-y-6">
          {/* Booking Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Booking to Test
            </label>
            <select
              value={selectedBooking}
              onChange={(e) => setSelectedBooking(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Choose a booking...</option>
              {bookings.map((booking) => (
                <option key={booking._id} value={booking._id}>
                  {booking.title} -{" "}
                  {new Date(booking.start).toLocaleDateString()}
                </option>
              ))}
            </select>
          </div>

          {/* Test Button */}
          <button
            onClick={handleTest}
            disabled={!selectedBooking || loading}
            className="w-full px-6 py-3 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {loading ? "Testing..." : "Test Rule"}
          </button>

          {/* Test Results */}
          {testResult && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Test Results
              </h3>

              {testResult.error ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-800">{testResult.error}</p>
                </div>
              ) : (
                <>
                  <div className="p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="font-medium">Conditions Met:</span>
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          testResult.conditionsMet
                            ? "bg-green-100 text-green-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {testResult.conditionsMet ? "Yes" : "No"}
                      </span>
                    </div>

                    {testResult.booking && (
                      <div className="text-sm text-gray-600">
                        <p>
                          <strong>Booking:</strong> {testResult.booking.title}
                        </p>
                        <p>
                          <strong>Date:</strong>{" "}
                          {new Date(testResult.booking.start).toLocaleString()}
                        </p>
                        <p>
                          <strong>Status:</strong> {testResult.booking.status}
                        </p>
                      </div>
                    )}
                  </div>

                  {testResult.actionPreview && (
                    <div>
                      <h4 className="font-medium text-gray-800 mb-2">
                        Actions Preview:
                      </h4>
                      <div className="space-y-2">
                        {testResult.actionPreview.map((action, index) => (
                          <div
                            key={index}
                            className="flex items-center gap-2 text-sm"
                          >
                            <ArrowRight className="w-4 h-4 text-blue-500" />
                            <span className="text-gray-600">
                              {action.description}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {testResult.conditionsMet && (
                    <button
                      onClick={handleExecute}
                      disabled={loading}
                      className="w-full px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                    >
                      {loading ? "Executing..." : "Execute Rule"}
                    </button>
                  )}

                  {testResult.executionResult && (
                    <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
                      <h4 className="font-medium text-green-800 mb-2">
                        Execution Successful!
                      </h4>
                      <p className="text-green-700 text-sm">
                        {testResult.executionResult.message}
                      </p>
                    </div>
                  )}

                  {testResult.executionError && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                      <h4 className="font-medium text-red-800 mb-2">
                        Execution Failed
                      </h4>
                      <p className="text-red-700 text-sm">
                        {testResult.executionError}
                      </p>
                    </div>
                  )}
                </>
              )}
            </div>
          )}

          {/* Close Button */}
          <div className="flex justify-end pt-6 border-t border-gray-200">
            <button
              onClick={onClose}
              className="px-6 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AutoReschedule;
