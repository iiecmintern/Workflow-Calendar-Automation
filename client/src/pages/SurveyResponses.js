import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Eye,
  ArrowLeft,
  Users,
  Star,
  Calendar,
  MessageSquare,
  CheckSquare,
  Sliders,
  Download,
  Filter,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const SurveyResponses = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [survey, setSurvey] = useState(null);
  const [responses, setResponses] = useState([]);
  const [filter, setFilter] = useState("all"); // all, completed, started, abandoned

  useEffect(() => {
    fetchSurveyAndResponses();
  }, [id]);

  const fetchSurveyAndResponses = async () => {
    try {
      // Fetch survey details
      const surveyRes = await axios.get(`/api/surveys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSurvey(surveyRes.data);

      // Fetch responses
      const responsesRes = await axios.get(`/api/surveys/${id}/responses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResponses(responsesRes.data);
    } catch (err) {
      setError("Failed to fetch survey responses");
    } finally {
      setLoading(false);
    }
  };

  const getQuestionTypeIcon = (type) => {
    switch (type) {
      case "rating":
        return <Star className="w-4 h-4 text-yellow-500" />;
      case "text":
        return <MessageSquare className="w-4 h-4 text-blue-500" />;
      case "multiple_choice":
        return <CheckSquare className="w-4 h-4 text-green-500" />;
      case "yes_no":
        return <CheckSquare className="w-4 h-4 text-purple-500" />;
      case "scale":
        return <Sliders className="w-4 h-4 text-orange-500" />;
      default:
        return <Eye className="w-4 h-4 text-gray-500" />;
    }
  };

  const getFilteredResponses = () => {
    if (filter === "all") return responses;
    return responses.filter((response) => response.status === filter);
  };

  const exportResponses = () => {
    const csvContent = generateCSV();
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${survey?.name || "survey"}_responses.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const generateCSV = () => {
    if (!survey || responses.length === 0) return "";

    const headers = [
      "Respondent",
      "Email",
      "Status",
      "Started At",
      "Completed At",
      "Overall Rating",
      "Sentiment",
    ];
    survey.questions.forEach((question, index) => {
      headers.push(`Q${index + 1}: ${question.question}`);
    });

    const rows = responses.map((response) => {
      const row = [
        response.respondentName || "Anonymous",
        response.respondentEmail || "",
        response.status,
        new Date(response.startedAt).toLocaleString(),
        response.completedAt
          ? new Date(response.completedAt).toLocaleString()
          : "",
        response.overallRating || "",
        response.sentiment || "",
      ];

      // Add question responses
      survey.questions.forEach((question, index) => {
        const questionResponse = response.responses.find(
          (r) => r.questionIndex === index
        );
        row.push(questionResponse ? questionResponse.answer : "");
      });

      return row.join(",");
    });

    return [headers.join(","), ...rows].join("\n");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading responses...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Error</h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <Link
            to="/surveys"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Back to Surveys
          </Link>
        </div>
      </div>
    );
  }

  const filteredResponses = getFilteredResponses();

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
            <Eye className="text-white text-4xl drop-shadow-lg" />
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
              Survey Responses
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium drop-shadow text-center">
            {survey?.name} - Individual Responses
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-b-3xl shadow-2xl p-8 border-t-0 border border-blue-100">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Link
                to="/surveys"
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 transition"
              >
                <ArrowLeft className="w-4 h-4" />
                Back to Surveys
              </Link>
            </div>
            <div className="flex gap-3">
              <Link
                to={`/survey-builder/${id}`}
                className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition"
              >
                Edit Survey
              </Link>
              <Link
                to={`/surveys/${id}/analytics`}
                className="px-4 py-2 bg-green-100 text-green-700 rounded-lg hover:bg-green-200 transition"
              >
                View Analytics
              </Link>
              <button
                onClick={exportResponses}
                className="flex items-center gap-2 px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
              >
                <Download className="w-4 h-4" />
                Export CSV
              </button>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Users className="w-8 h-8 text-blue-500" />
                <div>
                  <p className="text-sm text-gray-600">Total Responses</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {responses.length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <CheckSquare className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Completed</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {responses.filter((r) => r.status === "completed").length}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Star className="w-8 h-8 text-yellow-500" />
                <div>
                  <p className="text-sm text-gray-600">Avg Rating</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {responses.filter((r) => r.overallRating).length > 0
                      ? (
                          responses
                            .filter((r) => r.overallRating)
                            .reduce((sum, r) => sum + r.overallRating, 0) /
                          responses.filter((r) => r.overallRating).length
                        ).toFixed(1)
                      : "N/A"}
                  </p>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm"
            >
              <div className="flex items-center gap-3">
                <Calendar className="w-8 h-8 text-purple-500" />
                <div>
                  <p className="text-sm text-gray-600">Questions</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {survey?.questions?.length || 0}
                  </p>
                </div>
              </div>
            </motion.div>
          </div>

          {/* Filter */}
          <div className="mb-6">
            <div className="flex items-center gap-4">
              <Filter className="w-5 h-5 text-gray-600" />
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="all">All Responses ({responses.length})</option>
                <option value="completed">
                  Completed (
                  {responses.filter((r) => r.status === "completed").length})
                </option>
                <option value="started">
                  Started (
                  {responses.filter((r) => r.status === "started").length})
                </option>
                <option value="abandoned">
                  Abandoned (
                  {responses.filter((r) => r.status === "abandoned").length})
                </option>
              </select>
            </div>
          </div>

          {/* Responses List */}
          {filteredResponses.length === 0 ? (
            <div className="text-center py-12">
              <Eye className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                No responses yet
              </h3>
              <p className="text-gray-500">
                {filter === "all"
                  ? "No responses have been submitted for this survey yet."
                  : `No ${filter} responses found.`}
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {filteredResponses.map((response, index) => (
                <motion.div
                  key={response._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {response.respondentName ||
                          response.respondentEmail ||
                          "Anonymous"}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {response.respondentEmail && response.respondentName
                          ? response.respondentEmail
                          : ""}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          response.status === "completed"
                            ? "bg-green-100 text-green-800"
                            : response.status === "started"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {response.status}
                      </span>
                      {response.overallRating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-500 fill-current" />
                          <span className="text-sm font-medium">
                            {response.overallRating}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4 text-sm text-gray-600">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4" />
                      <span>
                        Started: {new Date(response.startedAt).toLocaleString()}
                      </span>
                    </div>
                    {response.completedAt && (
                      <div className="flex items-center gap-2">
                        <CheckSquare className="w-4 h-4" />
                        <span>
                          Completed:{" "}
                          {new Date(response.completedAt).toLocaleString()}
                        </span>
                      </div>
                    )}
                    {response.sentiment && (
                      <div className="flex items-center gap-2">
                        <MessageSquare className="w-4 h-4" />
                        <span className="capitalize">{response.sentiment}</span>
                      </div>
                    )}
                  </div>

                  {/* Question Responses */}
                  {survey?.questions && (
                    <div className="space-y-3">
                      <h4 className="font-medium text-gray-800">Responses:</h4>
                      {survey.questions.map((question, qIndex) => {
                        const questionResponse = response.responses.find(
                          (r) => r.questionIndex === qIndex
                        );
                        return (
                          <div
                            key={qIndex}
                            className="bg-gray-50 rounded-lg p-3"
                          >
                            <div className="flex items-start gap-2 mb-2">
                              {getQuestionTypeIcon(question.type)}
                              <div className="flex-1">
                                <p className="font-medium text-gray-800">
                                  {question.question}
                                </p>
                                <p className="text-xs text-gray-600 capitalize">
                                  {question.type.replace("_", " ")}
                                </p>
                              </div>
                            </div>
                            <div className="ml-6">
                              {questionResponse ? (
                                <div className="text-gray-700">
                                  {question.type === "rating" && (
                                    <div className="flex items-center gap-1">
                                      <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                      <span>
                                        {questionResponse.answer} out of{" "}
                                        {question.maxRating || 5}
                                      </span>
                                    </div>
                                  )}
                                  {question.type === "text" && (
                                    <p className="text-sm">
                                      {questionResponse.answer}
                                    </p>
                                  )}
                                  {question.type === "multiple_choice" && (
                                    <span className="text-sm font-medium">
                                      {questionResponse.answer}
                                    </span>
                                  )}
                                  {question.type === "yes_no" && (
                                    <span
                                      className={`text-sm font-medium ${
                                        questionResponse.answer === "yes"
                                          ? "text-green-600"
                                          : "text-red-600"
                                      }`}
                                    >
                                      {questionResponse.answer.toUpperCase()}
                                    </span>
                                  )}
                                  {question.type === "scale" && (
                                    <span className="text-sm font-medium">
                                      {questionResponse.answer}/10
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <p className="text-sm text-gray-500 italic">
                                  No response
                                </p>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
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

export default SurveyResponses;
