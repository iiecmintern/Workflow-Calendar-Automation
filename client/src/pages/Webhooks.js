import React, { useState, useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";
import {
  FaArrowDown,
  FaArrowUp,
  FaCode,
  FaTrash,
  FaEdit,
  FaPlay,
  FaCopy,
  FaEye,
  FaClock,
  FaCheckCircle,
  FaTimesCircle,
} from "react-icons/fa";

const Webhooks = () => {
  const { token } = useAuth();
  const [webhooks, setWebhooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedWebhook, setSelectedWebhook] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    fetchWebhooks();
  }, [token]);

  const fetchWebhooks = async () => {
    try {
      setLoading(true);
      const response = await axios.get("/api/webhooks", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhooks(response.data);
    } catch (err) {
      setError("Failed to fetch webhooks");
      console.error("Error fetching webhooks:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (webhookId) => {
    if (!window.confirm("Are you sure you want to delete this webhook?")) {
      return;
    }

    try {
      await axios.delete(`/api/webhooks/${webhookId}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWebhooks(webhooks.filter((w) => w._id !== webhookId));
    } catch (err) {
      setError("Failed to delete webhook");
      console.error("Error deleting webhook:", err);
    }
  };

  const handleTest = async (webhookId) => {
    try {
      setTesting(true);
      setTestResult(null);
      const response = await axios.post(
        `/api/webhooks/${webhookId}/test`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setTestResult(response.data);
    } catch (err) {
      setTestResult({
        success: false,
        error: err.response?.data?.message || "Test failed",
      });
    } finally {
      setTesting(false);
    }
  };

  const copyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    // You could add a toast notification here
  };

  const getWebhookIcon = (type) => {
    switch (type) {
      case "inbound":
        return <FaArrowDown className="text-cyan-500" />;
      case "outbound":
        return <FaArrowUp className="text-teal-500" />;
      default:
        return <FaCode className="text-indigo-500" />;
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "success":
        return "text-green-600 bg-green-100";
      case "failed":
        return "text-red-600 bg-red-100";
      case "pending":
        return "text-yellow-600 bg-yellow-100";
      default:
        return "text-gray-600 bg-gray-100";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Webhooks</h1>
          <p className="text-gray-600">
            Manage your inbound and outbound webhooks for workflow automation.
          </p>
        </div>

        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
            {error}
          </div>
        )}

        {testResult && (
          <div
            className={`border px-4 py-3 rounded mb-6 ${
              testResult.success
                ? "bg-green-100 border-green-400 text-green-700"
                : "bg-red-100 border-red-400 text-red-700"
            }`}
          >
            <div className="flex items-center gap-2">
              {testResult.success ? (
                <FaCheckCircle className="text-green-500" />
              ) : (
                <FaTimesCircle className="text-red-500" />
              )}
              <span className="font-semibold">
                {testResult.success ? "Test Successful" : "Test Failed"}
              </span>
            </div>
            {testResult.execution && (
              <div className="mt-2 text-sm">
                <p>Status Code: {testResult.execution.response?.statusCode}</p>
                <p>Duration: {testResult.execution.duration}ms</p>
              </div>
            )}
            {testResult.error && <p className="mt-2">{testResult.error}</p>}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
          {webhooks.map((webhook) => (
            <div
              key={webhook._id}
              className="bg-white rounded-lg shadow-md border border-gray-200 overflow-hidden"
            >
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    {getWebhookIcon(webhook.type)}
                    <div>
                      <h3 className="font-semibold text-gray-900">
                        {webhook.name}
                      </h3>
                      <p className="text-sm text-gray-500 capitalize">
                        {webhook.type} Webhook
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedWebhook(webhook);
                        setShowDetails(true);
                      }}
                      className="p-2 text-gray-400 hover:text-gray-600"
                      title="View Details"
                    >
                      <FaEye />
                    </button>
                    <button
                      onClick={() => handleDelete(webhook._id)}
                      className="p-2 text-red-400 hover:text-red-600"
                      title="Delete"
                    >
                      <FaTrash />
                    </button>
                  </div>
                </div>

                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-medium text-gray-700">
                      Workflow
                    </p>
                    <p className="text-sm text-gray-600">
                      {webhook.workflow?.name || "Unknown"}
                    </p>
                  </div>

                  {webhook.type === "inbound" && webhook.inbound?.endpoint && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Endpoint URL
                      </p>
                      <div className="flex items-center gap-2">
                        <code className="text-xs bg-gray-100 px-2 py-1 rounded flex-1">
                          {`${window.location.origin}${webhook.inbound.endpoint}`}
                        </code>
                        <button
                          onClick={() =>
                            copyToClipboard(
                              `${window.location.origin}${webhook.inbound.endpoint}`
                            )
                          }
                          className="p-1 text-gray-400 hover:text-gray-600"
                          title="Copy URL"
                        >
                          <FaCopy />
                        </button>
                      </div>
                    </div>
                  )}

                  {webhook.type === "outbound" && webhook.outbound?.url && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Target URL
                      </p>
                      <p className="text-xs text-gray-600 truncate">
                        {webhook.outbound.url}
                      </p>
                    </div>
                  )}

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Executions
                      </p>
                      <p className="text-sm text-gray-600">
                        {webhook.stats?.totalExecutions || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Success Rate
                      </p>
                      <p className="text-sm text-gray-600">
                        {webhook.stats?.totalExecutions > 0
                          ? Math.round(
                              (webhook.stats.successfulExecutions /
                                webhook.stats.totalExecutions) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                  </div>

                  {webhook.stats?.lastExecuted && (
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Last Executed
                      </p>
                      <p className="text-sm text-gray-600">
                        {formatDate(webhook.stats.lastExecuted)}
                      </p>
                    </div>
                  )}

                  <div className="flex gap-2 pt-3">
                    {webhook.type === "outbound" && (
                      <button
                        onClick={() => handleTest(webhook._id)}
                        disabled={testing}
                        className="flex items-center gap-2 px-3 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50 text-sm"
                      >
                        <FaPlay className="text-xs" />
                        {testing ? "Testing..." : "Test"}
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setSelectedWebhook(webhook);
                        setShowDetails(true);
                      }}
                      className="flex items-center gap-2 px-3 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 text-sm"
                    >
                      <FaEye className="text-xs" />
                      Details
                    </button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {webhooks.length === 0 && (
          <div className="text-center py-12">
            <FaCode className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No webhooks yet
            </h3>
            <p className="text-gray-600 mb-6">
              Create webhooks in your workflows to enable external integrations.
            </p>
            <button
              onClick={() => window.history.back()}
              className="bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700"
            >
              Go to Workflows
            </button>
          </div>
        )}
      </div>

      {/* Webhook Details Modal */}
      {showDetails && selectedWebhook && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-gray-900">
                  Webhook Details
                </h2>
                <button
                  onClick={() => setShowDetails(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FaTimesCircle />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">
                    {selectedWebhook.name}
                  </h3>
                  <p className="text-sm text-gray-600 capitalize">
                    {selectedWebhook.type} Webhook
                  </p>
                </div>

                {selectedWebhook.type === "inbound" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Inbound Configuration
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Endpoint URL
                        </p>
                        <div className="flex items-center gap-2">
                          <code className="text-sm bg-gray-100 px-3 py-2 rounded flex-1">
                            {`${window.location.origin}${selectedWebhook.inbound.endpoint}`}
                          </code>
                          <button
                            onClick={() =>
                              copyToClipboard(
                                `${window.location.origin}${selectedWebhook.inbound.endpoint}`
                              )
                            }
                            className="p-2 text-gray-400 hover:text-gray-600"
                          >
                            <FaCopy />
                          </button>
                        </div>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          HTTP Method
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedWebhook.inbound.method}
                        </p>
                      </div>
                      {selectedWebhook.inbound.secret && (
                        <div>
                          <p className="text-sm font-medium text-gray-700">
                            Secret
                          </p>
                          <p className="text-sm text-gray-600">
                            {selectedWebhook.inbound.secret}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {selectedWebhook.type === "outbound" && (
                  <div>
                    <h4 className="font-medium text-gray-900 mb-2">
                      Outbound Configuration
                    </h4>
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Target URL
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedWebhook.outbound.url}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          HTTP Method
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedWebhook.outbound.method}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Timeout
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedWebhook.outbound.timeout}ms
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-700">
                          Retry Count
                        </p>
                        <p className="text-sm text-gray-600">
                          {selectedWebhook.outbound.retryCount}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                <div>
                  <h4 className="font-medium text-gray-900 mb-2">Statistics</h4>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Total Executions
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedWebhook.stats?.totalExecutions || 0}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Success Rate
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedWebhook.stats?.totalExecutions > 0
                          ? Math.round(
                              (selectedWebhook.stats.successfulExecutions /
                                selectedWebhook.stats.totalExecutions) *
                                100
                            )
                          : 0}
                        %
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Average Response Time
                      </p>
                      <p className="text-lg font-semibold text-gray-900">
                        {selectedWebhook.stats?.averageResponseTime
                          ? `${Math.round(
                              selectedWebhook.stats.averageResponseTime
                            )}ms`
                          : "N/A"}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-700">
                        Last Executed
                      </p>
                      <p className="text-sm text-gray-600">
                        {selectedWebhook.stats?.lastExecuted
                          ? formatDate(selectedWebhook.stats.lastExecuted)
                          : "Never"}
                      </p>
                    </div>
                  </div>
                </div>

                {selectedWebhook.executions &&
                  selectedWebhook.executions.length > 0 && (
                    <div>
                      <h4 className="font-medium text-gray-900 mb-2">
                        Recent Executions
                      </h4>
                      <div className="space-y-2 max-h-40 overflow-y-auto">
                        {selectedWebhook.executions
                          .slice(-5)
                          .reverse()
                          .map((execution, index) => (
                            <div
                              key={index}
                              className="flex items-center justify-between p-2 bg-gray-50 rounded"
                            >
                              <div className="flex items-center gap-2">
                                <span
                                  className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                                    execution.status
                                  )}`}
                                >
                                  {execution.status}
                                </span>
                                <span className="text-sm text-gray-600">
                                  {execution.response?.statusCode || "N/A"}
                                </span>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-gray-500">
                                <FaClock className="text-xs" />
                                {formatDate(execution.timestamp)}
                              </div>
                            </div>
                          ))}
                      </div>
                    </div>
                  )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-6 border-t">
                <button
                  onClick={() => setShowDetails(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Close
                </button>
                {selectedWebhook.type === "outbound" && (
                  <button
                    onClick={() => handleTest(selectedWebhook._id)}
                    disabled={testing}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
                  >
                    {testing ? "Testing..." : "Test Webhook"}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Webhooks;
