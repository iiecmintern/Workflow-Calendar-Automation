import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Plus,
  BarChart3,
  Edit,
  Trash2,
  Send,
  Eye,
  Copy,
  Calendar,
  Users,
  Star,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const Surveys = () => {
  const { token } = useAuth();
  const [surveys, setSurveys] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    fetchSurveys();
  }, []);

  const fetchSurveys = async () => {
    try {
      const res = await axios.get("/api/surveys", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSurveys(res.data);
    } catch (err) {
      setError("Failed to fetch surveys");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (surveyId) => {
    if (!window.confirm("Are you sure you want to delete this survey?")) {
      return;
    }

    try {
      await axios.delete(`/api/surveys/${surveyId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSurveys(surveys.filter((s) => s._id !== surveyId));
      setSuccess("Survey deleted successfully!");
    } catch (err) {
      setError("Failed to delete survey");
    }
  };

  const copySurveyLink = (surveyId) => {
    const link = `${window.location.origin}/survey/${surveyId}`;
    navigator.clipboard.writeText(link);
    setSuccess("Survey link copied to clipboard!");
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case "rating":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "text":
        return <Edit className="w-4 h-4 text-blue-500" />;
      case "multiple_choice":
        return <BarChart3 className="w-4 h-4 text-green-500" />;
      case "yes_no":
        return <BarChart3 className="w-4 h-4 text-purple-500" />;
      case "scale":
        return <BarChart3 className="w-4 h-4 text-orange-500" />;
      default:
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading surveys...</p>
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

      <div className="w-full max-w-6xl mx-auto rounded-3xl mt-10 mb-10 overflow-hidden shadow-2xl relative z-10">
        <div
          className="bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 p-8 flex flex-col items-center gap-4"
          style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
        >
          <div className="flex items-center gap-3">
            <BarChart3 className="text-white text-4xl drop-shadow-lg" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
              Surveys & Feedback
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium drop-shadow text-center">
            Create and manage surveys to collect feedback from your meeting
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

          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">Your Surveys</h2>
              <p className="text-gray-600">
                Manage your feedback collection surveys
              </p>
            </div>
            <Link
              to="/survey-builder"
              className="flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-lg"
            >
              <Plus className="w-5 h-5" />
              Create Survey
            </Link>
          </div>

          {/* Surveys Grid */}
          {surveys.length === 0 ? (
            <div className="text-center py-12">
              <BarChart3 className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No surveys yet
              </h3>
              <p className="text-gray-500 mb-6">
                Create your first survey to start collecting feedback from
                meeting participants
              </p>
              <Link
                to="/survey-builder"
                className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                <Plus className="w-5 h-5" />
                Create Your First Survey
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {surveys.map((survey) => (
                <motion.div
                  key={survey._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="w-5 h-5 text-blue-500" />
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-medium ${
                          survey.isActive
                            ? "bg-green-100 text-green-700"
                            : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {survey.isActive ? "Active" : "Inactive"}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => copySurveyLink(survey._id)}
                        className="p-2 text-gray-400 hover:text-blue-600 transition"
                        title="Copy survey link"
                      >
                        <Copy className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(survey._id)}
                        className="p-2 text-gray-400 hover:text-red-600 transition"
                        title="Delete survey"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <h3 className="text-lg font-semibold text-gray-800 mb-2">
                    {survey.name}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                    {survey.description || "No description provided"}
                  </p>

                  <div className="space-y-3 mb-6">
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Created{" "}
                        {new Date(survey.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <BarChart3 className="w-4 h-4" />
                      <span>{survey.questions.length} questions</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-gray-600">
                      <Users className="w-4 h-4" />
                      <span>0 responses</span>
                    </div>
                  </div>

                  {/* Question Types Preview */}
                  <div className="mb-6">
                    <h4 className="text-sm font-medium text-gray-700 mb-2">
                      Question Types:
                    </h4>
                    <div className="flex flex-wrap gap-1">
                      {survey.questions.slice(0, 3).map((question, index) => (
                        <div
                          key={index}
                          className="flex items-center gap-1 px-2 py-1 bg-gray-100 rounded text-xs"
                          title={question.question}
                        >
                          {getQuestionTypeIcon(question.type)}
                          <span className="capitalize">
                            {question.type.replace("_", " ")}
                          </span>
                        </div>
                      ))}
                      {survey.questions.length > 3 && (
                        <span className="text-xs text-gray-500 px-2 py-1">
                          +{survey.questions.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center gap-2">
                    <Link
                      to={`/survey-builder/${survey._id}`}
                      className="flex items-center gap-1 px-3 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition text-sm"
                    >
                      <Edit className="w-4 h-4" />
                      Edit
                    </Link>
                    <Link
                      to={`/surveys/${survey._id}/analytics`}
                      className="flex items-center gap-1 px-3 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition text-sm"
                    >
                      <BarChart3 className="w-4 h-4" />
                      Analytics
                    </Link>
                    <Link
                      to={`/surveys/${survey._id}/responses`}
                      className="flex items-center gap-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition text-sm"
                    >
                      <Eye className="w-4 h-4" />
                      Responses
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </div>
      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

export default Surveys;
