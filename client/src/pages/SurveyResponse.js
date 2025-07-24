import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Star,
  MessageSquare,
  CheckSquare,
  Sliders,
  ArrowLeft,
  ArrowRight,
  Check,
  Send,
  BarChart3,
} from "lucide-react";
import axios from "axios";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const SurveyResponse = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [survey, setSurvey] = useState(null);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [responses, setResponses] = useState({});
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    fetchSurvey();
  }, [sessionId]);

  const fetchSurvey = async () => {
    try {
      const res = await axios.get(`/api/survey-responses/${sessionId}`);
      setSurvey(res.data);
      setProgress(res.data.progress || 0);
    } catch (err) {
      setError("Survey not found or has expired");
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer) => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `/api/survey-responses/${sessionId}/answer`,
        {
          questionIndex: currentQuestionIndex,
          answer: answer,
        }
      );

      setResponses((prev) => ({
        ...prev,
        [currentQuestionIndex]: answer,
      }));

      setProgress(res.data.progress);

      if (res.data.completed) {
        setSuccess(
          "Survey completed successfully! Thank you for your feedback."
        );
        setTimeout(() => {
          navigate("/");
        }, 3000);
      } else {
        // Move to next question
        setCurrentQuestionIndex((prev) => prev + 1);
      }
    } catch (err) {
      setError(err.response?.data?.message || "Failed to submit answer");
    } finally {
      setSubmitting(false);
    }
  };

  const handleComplete = async () => {
    setSubmitting(true);
    try {
      const res = await axios.post(
        `/api/survey-responses/${sessionId}/complete`
      );
      setSuccess("Survey completed successfully! Thank you for your feedback.");
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to complete survey");
    } finally {
      setSubmitting(false);
    }
  };

  const getQuestionIcon = (type) => {
    switch (type) {
      case "rating":
        return <Star className="w-6 h-6 text-yellow-500" />;
      case "text":
        return <MessageSquare className="w-6 h-6 text-blue-500" />;
      case "multiple_choice":
        return <CheckSquare className="w-6 h-6 text-green-500" />;
      case "yes_no":
        return <CheckSquare className="w-6 h-6 text-purple-500" />;
      case "scale":
        return <Sliders className="w-6 h-6 text-orange-500" />;
      default:
        return <BarChart3 className="w-6 h-6 text-gray-500" />;
    }
  };

  const renderQuestion = (question, index) => {
    const currentAnswer = responses[index];

    switch (question.type) {
      case "rating":
        return (
          <div className="space-y-4">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: question.maxRating }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i + 1)}
                  disabled={submitting}
                  className={`p-3 rounded-lg transition-all ${
                    currentAnswer === i + 1
                      ? "bg-yellow-500 text-white scale-110"
                      : "bg-gray-100 text-gray-400 hover:bg-yellow-100 hover:text-yellow-500"
                  }`}
                >
                  <Star className="w-8 h-8 fill-current" />
                </button>
              ))}
            </div>
            <p className="text-center text-gray-600">
              {currentAnswer
                ? `${currentAnswer} out of ${question.maxRating} stars`
                : "Select a rating"}
            </p>
          </div>
        );

      case "text":
        return (
          <div className="space-y-4">
            <textarea
              value={currentAnswer || ""}
              onChange={(e) =>
                setResponses((prev) => ({ ...prev, [index]: e.target.value }))
              }
              placeholder="Type your answer here..."
              className="w-full h-32 px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
            />
            <button
              onClick={() => handleAnswer(currentAnswer)}
              disabled={submitting || !currentAnswer?.trim()}
              className="w-full px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {submitting ? "Submitting..." : "Submit Answer"}
            </button>
          </div>
        );

      case "multiple_choice":
        return (
          <div className="space-y-3">
            {question.options.map((option, optionIndex) => (
              <button
                key={optionIndex}
                onClick={() => handleAnswer(option.value)}
                disabled={submitting}
                className={`w-full p-4 text-left border rounded-lg transition-all ${
                  currentAnswer === option.value
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-300 hover:border-blue-300 hover:bg-blue-50"
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>{option.label}</span>
                  {currentAnswer === option.value && (
                    <Check className="w-5 h-5 text-blue-500" />
                  )}
                </div>
              </button>
            ))}
          </div>
        );

      case "yes_no":
        return (
          <div className="flex justify-center space-x-4">
            <button
              onClick={() => handleAnswer("yes")}
              disabled={submitting}
              className={`px-8 py-4 rounded-lg transition-all ${
                currentAnswer === "yes"
                  ? "bg-green-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-green-100 hover:text-green-700"
              }`}
            >
              Yes
            </button>
            <button
              onClick={() => handleAnswer("no")}
              disabled={submitting}
              className={`px-8 py-4 rounded-lg transition-all ${
                currentAnswer === "no"
                  ? "bg-red-500 text-white"
                  : "bg-gray-100 text-gray-700 hover:bg-red-100 hover:text-red-700"
              }`}
            >
              No
            </button>
          </div>
        );

      case "scale":
        return (
          <div className="space-y-4">
            <div className="flex justify-center space-x-2">
              {Array.from({ length: 10 }, (_, i) => (
                <button
                  key={i}
                  onClick={() => handleAnswer(i + 1)}
                  disabled={submitting}
                  className={`w-12 h-12 rounded-lg transition-all ${
                    currentAnswer === i + 1
                      ? "bg-orange-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-orange-100 hover:text-orange-600"
                  }`}
                >
                  {i + 1}
                </button>
              ))}
            </div>
            <div className="flex justify-between text-sm text-gray-600">
              <span>{question.scaleLabels?.min || "Poor"}</span>
              <span>{question.scaleLabels?.max || "Excellent"}</span>
            </div>
            {currentAnswer && (
              <p className="text-center text-gray-600">
                You selected: {currentAnswer}/10
              </p>
            )}
          </div>
        );

      default:
        return <p className="text-gray-500">Unsupported question type</p>;
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

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">
            Survey Not Available
          </h1>
          <p className="text-gray-600 mb-4">{error}</p>
          <button
            onClick={() => navigate("/")}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go Home
          </button>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="text-green-500 text-6xl mb-4">✅</div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Thank You!</h1>
          <p className="text-gray-600">{success}</p>
        </div>
      </div>
    );
  }

  if (!survey || currentQuestionIndex >= survey.questions.length) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-800 mb-4">
            Survey Complete
          </h1>
          <button
            onClick={handleComplete}
            disabled={submitting}
            className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition disabled:opacity-50"
          >
            {submitting ? "Completing..." : "Complete Survey"}
          </button>
        </div>
      </div>
    );
  }

  const currentQuestion = survey.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === survey.questions.length - 1;

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-0 px-0 relative overflow-hidden">
      <img
        src={BG_IMAGE}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-80 z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-purple-100/20 to-pink-100/20 z-0" />

      <div className="w-full max-w-2xl mx-auto rounded-3xl mt-10 mb-10 overflow-hidden shadow-2xl relative z-10">
        <div
          className="bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 p-8 flex flex-col items-center gap-4"
          style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
        >
          <div className="flex items-center gap-3">
            {getQuestionIcon(currentQuestion.type)}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg">
              {survey.name}
            </h1>
          </div>
          <p className="text-white/90 text-lg font-medium drop-shadow text-center">
            {survey.description}
          </p>

          {/* Progress Bar */}
          <div className="w-full bg-white/20 rounded-full h-2 mt-4">
            <div
              className="bg-white h-2 rounded-full transition-all duration-300"
              style={{ width: `${progress * 100}%` }}
            ></div>
          </div>
          <p className="text-white/80 text-sm">
            Question {currentQuestionIndex + 1} of {survey.questions.length}
          </p>
        </div>

        <div className="bg-white/90 backdrop-blur-lg rounded-b-3xl shadow-2xl p-8 border-t-0 border border-blue-100">
          <motion.div
            key={currentQuestionIndex}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="text-center">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">
                {currentQuestion.question}
              </h2>
              {currentQuestion.required && (
                <p className="text-red-500 text-sm">* Required</p>
              )}
            </div>

            <div className="min-h-[200px] flex items-center justify-center">
              {renderQuestion(currentQuestion, currentQuestionIndex)}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between pt-6 border-t border-gray-200">
              <button
                onClick={() =>
                  setCurrentQuestionIndex((prev) => Math.max(0, prev - 1))
                }
                disabled={currentQuestionIndex === 0}
                className="flex items-center gap-2 px-4 py-2 text-gray-600 hover:text-gray-800 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <ArrowLeft className="w-4 h-4" />
                Previous
              </button>

              <div className="flex gap-2">
                {currentQuestionIndex < survey.questions.length - 1 && (
                  <button
                    onClick={() => setCurrentQuestionIndex((prev) => prev + 1)}
                    className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition"
                  >
                    Skip
                    <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      </div>
      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

export default SurveyResponse;
