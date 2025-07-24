import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  BarChart3,
  ArrowLeft,
  Users,
  Star,
  TrendingUp,
  Calendar,
  MessageSquare,
  CheckSquare,
  Sliders,
} from "lucide-react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const SurveyAnalytics = () => {
  const { id } = useParams();
  const { token } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [survey, setSurvey] = useState(null);
  const [analytics, setAnalytics] = useState(null);

  useEffect(() => {
    fetchSurveyAndAnalytics();
  }, [id]);

  const fetchSurveyAndAnalytics = async () => {
    try {
      // Fetch survey details
      const surveyRes = await axios.get(`/api/surveys/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSurvey(surveyRes.data);

      // Fetch analytics
      const analyticsRes = await axios.get(`/api/surveys/${id}/analytics`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAnalytics(analyticsRes.data);
    } catch (err) {
      setError("Failed to fetch survey analytics");
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
        return <BarChart3 className="w-4 h-4 text-gray-500" />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading analytics...</p>
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
              Survey Analytics
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium drop-shadow text-center">
            {survey?.name} - Insights & Performance
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
                to={`/surveys/${id}/responses`}
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition"
              >
                View Responses
              </Link>
            </div>
          </div>

          {/* Overview Stats */}
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
                    {analytics?.totalResponses || 0}
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
                <TrendingUp className="w-8 h-8 text-green-500" />
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-800">
                    {analytics?.completionRate
                      ? `${analytics.completionRate.toFixed(1)}%`
                      : "0%"}
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
                    {analytics?.averageRating
                      ? analytics.averageRating.toFixed(1)
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

          {/* Sentiment Analysis */}
          {analytics?.sentimentCounts &&
            Object.keys(analytics.sentimentCounts).length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Sentiment Analysis
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {Object.entries(analytics.sentimentCounts).map(
                    ([sentiment, count]) => (
                      <div
                        key={sentiment}
                        className={`p-4 rounded-lg ${
                          sentiment === "positive"
                            ? "bg-green-100 text-green-800"
                            : sentiment === "negative"
                            ? "bg-red-100 text-red-800"
                            : "bg-gray-100 text-gray-800"
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="capitalize font-medium">
                            {sentiment}
                          </span>
                          <span className="text-2xl font-bold">{count}</span>
                        </div>
                      </div>
                    )
                  )}
                </div>
              </div>
            )}

          {/* Question Analytics */}
          {analytics?.questionAnalytics &&
            analytics.questionAnalytics.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Question Performance
                </h2>
                <div className="space-y-4">
                  {analytics.questionAnalytics.map((question, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: index * 0.1 }}
                      className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm"
                    >
                      <div className="flex items-start justify-between mb-4">
                        <div className="flex items-center gap-3">
                          {getQuestionTypeIcon(question.type)}
                          <div>
                            <h3 className="font-semibold text-gray-800">
                              {question.question}
                            </h3>
                            <p className="text-sm text-gray-600 capitalize">
                              {question.type.replace("_", " ")} •{" "}
                              {question.responseCount} responses
                            </p>
                          </div>
                        </div>
                      </div>

                      {question.type === "rating" && question.averageRating && (
                        <div className="flex items-center gap-2">
                          <span className="text-sm text-gray-600">
                            Average Rating:
                          </span>
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-500 fill-current" />
                            <span className="font-semibold">
                              {question.averageRating.toFixed(1)}
                            </span>
                          </div>
                        </div>
                      )}

                      {question.type === "multiple_choice" &&
                        question.answerDistribution && (
                          <div className="mt-4">
                            <h4 className="text-sm font-medium text-gray-700 mb-2">
                              Answer Distribution:
                            </h4>
                            <div className="space-y-2">
                              {Object.entries(question.answerDistribution).map(
                                ([answer, count]) => (
                                  <div
                                    key={answer}
                                    className="flex items-center justify-between"
                                  >
                                    <span className="text-sm text-gray-600">
                                      {answer}
                                    </span>
                                    <span className="text-sm font-medium text-gray-800">
                                      {count}
                                    </span>
                                  </div>
                                )
                              )}
                            </div>
                          </div>
                        )}
                    </motion.div>
                  ))}
                </div>
              </div>
            )}

          {/* Recent Responses */}
          {analytics?.recentResponses &&
            analytics.recentResponses.length > 0 && (
              <div className="mt-8">
                <h2 className="text-xl font-bold text-gray-800 mb-4">
                  Recent Responses
                </h2>
                <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Respondent
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Rating
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Sentiment
                          </th>
                          <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                            Date
                          </th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {analytics.recentResponses
                          .slice(0, 5)
                          .map((response, index) => (
                            <tr key={index}>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.respondentName ||
                                  response.respondentEmail ||
                                  "Anonymous"}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                {response.overallRating ? (
                                  <div className="flex items-center gap-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span>{response.overallRating}</span>
                                  </div>
                                ) : (
                                  "N/A"
                                )}
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap">
                                <span
                                  className={`px-2 py-1 text-xs font-medium rounded-full ${
                                    response.sentiment === "positive"
                                      ? "bg-green-100 text-green-800"
                                      : response.sentiment === "negative"
                                      ? "bg-red-100 text-red-800"
                                      : "bg-gray-100 text-gray-800"
                                  }`}
                                >
                                  {response.sentiment || "N/A"}
                                </span>
                              </td>
                              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                {new Date(
                                  response.createdAt
                                ).toLocaleDateString()}
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                </div>
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

export default SurveyAnalytics;
