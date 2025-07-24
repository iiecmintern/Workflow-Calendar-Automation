import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  Trash2,
  Save,
  Send,
  BarChart3,
  Copy,
  Settings,
  Eye,
  Star,
  MessageSquare,
  CheckSquare,
  Hash,
  Sliders,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const SurveyBuilder = () => {
  const { token } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams();
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [survey, setSurvey] = useState({
    name: "",
    description: "",
    questions: [
      {
        question: "How would you rate your overall experience?",
        type: "rating",
        required: true,
        order: 0,
        maxRating: 5,
      },
    ],
    triggers: {
      sendAfterMeeting: true,
      sendAfterHours: 1,
      sendReminders: true,
      maxReminders: 2,
    },
    settings: {
      allowAnonymous: false,
      showProgress: true,
      allowPartial: false,
    },
  });

  useEffect(() => {
    if (id) {
      fetchSurvey();
    }
  }, [id]);

  const fetchSurvey = async () => {
    setLoading(true);
    try {
      const res = await axios.get(`/api/surveys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSurvey(res.data);
    } catch (err) {
      setError("Failed to fetch survey");
    }
    setLoading(false);
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    setSuccess("");

    try {
      if (id) {
        await axios.put(`/api/surveys/${id}`, survey, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Survey updated successfully!");
      } else {
        const res = await axios.post("/api/surveys", survey, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setSuccess("Survey created successfully!");
        // Navigate to surveys list instead of non-existent route
        setTimeout(() => {
          navigate("/surveys");
        }, 1500);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to save survey");
    }
    setSaving(false);
  };

  const addQuestion = (type) => {
    const newQuestion = {
      question: "",
      type,
      required: false,
      order: survey.questions.length,
      options:
        type === "multiple_choice"
          ? [{ label: "Option 1", value: "option1" }]
          : [],
      maxRating: type === "rating" ? 5 : undefined,
    };

    setSurvey((prev) => ({
      ...prev,
      questions: [...prev.questions, newQuestion],
    }));
  };

  const updateQuestion = (index, field, value) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === index ? { ...q, [field]: value } : q
      ),
    }));
  };

  const removeQuestion = (index) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.filter((_, i) => i !== index),
    }));
  };

  const addOption = (questionIndex) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: [
                ...q.options,
                {
                  label: `Option ${q.options.length + 1}`,
                  value: `option${q.options.length + 1}`,
                },
              ],
            }
          : q
      ),
    }));
  };

  const updateOption = (questionIndex, optionIndex, field, value) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.map((opt, j) =>
                j === optionIndex ? { ...opt, [field]: value } : opt
              ),
            }
          : q
      ),
    }));
  };

  const removeOption = (questionIndex, optionIndex) => {
    setSurvey((prev) => ({
      ...prev,
      questions: prev.questions.map((q, i) =>
        i === questionIndex
          ? {
              ...q,
              options: q.options.filter((_, j) => j !== optionIndex),
            }
          : q
      ),
    }));
  };

  const getQuestionIcon = (type) => {
    switch (type) {
      case "rating":
        return <Star className="w-5 h-5" />;
      case "text":
        return <MessageSquare className="w-5 h-5" />;
      case "multiple_choice":
        return <CheckSquare className="w-5 h-5" />;
      case "yes_no":
        return <CheckSquare className="w-5 h-5" />;
      case "scale":
        return <Sliders className="w-5 h-5" />;
      default:
        return <Hash className="w-5 h-5" />;
    }
  };

  const getQuestionTypeLabel = (type) => {
    switch (type) {
      case "rating":
        return "Rating";
      case "text":
        return "Text";
      case "multiple_choice":
        return "Multiple Choice";
      case "yes_no":
        return "Yes/No";
      case "scale":
        return "Scale";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading survey...</p>
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

      <div className="w-full max-w-4xl mx-auto rounded-3xl mt-10 mb-10 overflow-hidden shadow-2xl relative z-10">
        <div
          className="bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 p-8 flex flex-col items-center gap-4"
          style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="text-white text-4xl drop-shadow-lg" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
              Survey Builder
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium drop-shadow text-center">
            Create engaging surveys to collect feedback from your meeting
            participants
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-b-3xl shadow-2xl p-8 border-t-0 border border-blue-100">
          {error && (
            <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6 text-center font-semibold">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6 text-center font-semibold">
              {success}
            </div>
          )}

          {/* Survey Basic Info */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Survey Information
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Survey Name *
                </label>
                <input
                  type="text"
                  value={survey.name}
                  onChange={(e) =>
                    setSurvey({ ...survey, name: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="e.g., Meeting Feedback Survey"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Description
                </label>
                <input
                  type="text"
                  value={survey.description}
                  onChange={(e) =>
                    setSurvey({ ...survey, description: e.target.value })
                  }
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Brief description of the survey"
                />
              </div>
            </div>
          </div>

          {/* Questions */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-bold text-gray-800">Questions</h2>
              <div className="flex gap-2">
                <button
                  onClick={() => addQuestion("rating")}
                  className="flex items-center gap-2 px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Rating
                </button>
                <button
                  onClick={() => addQuestion("text")}
                  className="flex items-center gap-2 px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Text
                </button>
                <button
                  onClick={() => addQuestion("multiple_choice")}
                  className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Multiple Choice
                </button>
                <button
                  onClick={() => addQuestion("yes_no")}
                  className="flex items-center gap-2 px-4 py-2 bg-orange-100 text-orange-700 rounded-lg hover:bg-orange-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Yes/No
                </button>
                <button
                  onClick={() => addQuestion("scale")}
                  className="flex items-center gap-2 px-4 py-2 bg-pink-100 text-pink-700 rounded-lg hover:bg-pink-200 transition"
                >
                  <Plus className="w-4 h-4" />
                  Scale
                </button>
              </div>
            </div>

            <div className="space-y-6">
              {survey.questions.map((question, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-3">
                      {getQuestionIcon(question.type)}
                      <span className="text-sm font-medium text-gray-500 bg-gray-100 px-2 py-1 rounded">
                        {getQuestionTypeLabel(question.type)}
                      </span>
                    </div>
                    <button
                      onClick={() => removeQuestion(index)}
                      className="text-red-500 hover:text-red-700 p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Question *
                      </label>
                      <input
                        type="text"
                        value={question.question}
                        onChange={(e) =>
                          updateQuestion(index, "question", e.target.value)
                        }
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter your question"
                      />
                    </div>

                    <div className="flex items-center gap-4">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={question.required}
                          onChange={(e) =>
                            updateQuestion(index, "required", e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">Required</span>
                      </label>
                    </div>

                    {/* Question-specific settings */}
                    {question.type === "rating" && (
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Maximum Rating
                        </label>
                        <select
                          value={question.maxRating}
                          onChange={(e) =>
                            updateQuestion(
                              index,
                              "maxRating",
                              parseInt(e.target.value)
                            )
                          }
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          <option value={3}>3 Stars</option>
                          <option value={5}>5 Stars</option>
                          <option value={10}>10 Stars</option>
                        </select>
                      </div>
                    )}

                    {question.type === "multiple_choice" && (
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <label className="block text-sm font-medium text-gray-700">
                            Options
                          </label>
                          <button
                            onClick={() => addOption(index)}
                            className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                          >
                            + Add Option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {question.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) =>
                                  updateOption(
                                    index,
                                    optionIndex,
                                    "label",
                                    e.target.value
                                  )
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Option text"
                              />
                              <input
                                type="text"
                                value={option.value}
                                onChange={(e) =>
                                  updateOption(
                                    index,
                                    optionIndex,
                                    "value",
                                    e.target.value
                                  )
                                }
                                className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Value"
                              />
                              <button
                                onClick={() => removeOption(index, optionIndex)}
                                className="text-red-500 hover:text-red-700 p-1"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {question.type === "scale" && (
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Minimum Label
                          </label>
                          <input
                            type="text"
                            value={question.scaleLabels?.min || ""}
                            onChange={(e) =>
                              updateQuestion(index, "scaleLabels", {
                                ...question.scaleLabels,
                                min: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Poor"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 mb-2">
                            Maximum Label
                          </label>
                          <input
                            type="text"
                            value={question.scaleLabels?.max || ""}
                            onChange={(e) =>
                              updateQuestion(index, "scaleLabels", {
                                ...question.scaleLabels,
                                max: e.target.value,
                              })
                            }
                            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                            placeholder="e.g., Excellent"
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Survey Settings */}
          <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-800 mb-4">
              Survey Settings
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Triggers
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={survey.triggers.sendAfterMeeting}
                      onChange={(e) =>
                        setSurvey({
                          ...survey,
                          triggers: {
                            ...survey.triggers,
                            sendAfterMeeting: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Send after meeting ends
                    </span>
                  </label>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Send after (hours)
                    </label>
                    <input
                      type="number"
                      value={survey.triggers.sendAfterHours}
                      onChange={(e) =>
                        setSurvey({
                          ...survey,
                          triggers: {
                            ...survey.triggers,
                            sendAfterHours: parseInt(e.target.value),
                          },
                        })
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      min="0"
                    />
                  </div>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={survey.triggers.sendReminders}
                      onChange={(e) =>
                        setSurvey({
                          ...survey,
                          triggers: {
                            ...survey.triggers,
                            sendReminders: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Send reminders
                    </span>
                  </label>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-700 mb-3">
                  Options
                </h3>
                <div className="space-y-3">
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={survey.settings.allowAnonymous}
                      onChange={(e) =>
                        setSurvey({
                          ...survey,
                          settings: {
                            ...survey.settings,
                            allowAnonymous: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Allow anonymous responses
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={survey.settings.showProgress}
                      onChange={(e) =>
                        setSurvey({
                          ...survey,
                          settings: {
                            ...survey.settings,
                            showProgress: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Show progress bar
                    </span>
                  </label>
                  <label className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={survey.settings.allowPartial}
                      onChange={(e) =>
                        setSurvey({
                          ...survey,
                          settings: {
                            ...survey.settings,
                            allowPartial: e.target.checked,
                          },
                        })
                      }
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm text-gray-700">
                      Allow partial completion
                    </span>
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200">
            <div className="flex gap-3">
              <button
                onClick={() => navigate("/surveys")}
                className="px-6 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              {id && (
                <button
                  onClick={() => navigate(`/surveys/${id}/analytics`)}
                  className="flex items-center gap-2 px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition"
                >
                  <BarChart3 className="w-4 h-4" />
                  View Analytics
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleSave}
                disabled={
                  saving || !survey.name || survey.questions.length === 0
                }
                className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Save className="w-4 h-4" />
                {saving ? "Saving..." : "Save Survey"}
              </button>
            </div>
          </div>
        </div>
      </div>
      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

export default SurveyBuilder;
