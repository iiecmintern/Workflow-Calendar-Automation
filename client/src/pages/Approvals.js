import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { FaCheckCircle, FaProjectDiagram } from "react-icons/fa";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1465101046530-73398c7f28ca?auto=format&fit=crop&w=1500&q=80";

const Approvals = () => {
  const { token } = useAuth();
  const [pending, setPending] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [approving, setApproving] = useState("");
  const [success, setSuccess] = useState("");

  const fetchPending = async () => {
    setLoading(true);
    setError("");
    try {
      const res = await axios.get("/api/workflows/approvals/pending", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPending(res.data);
    } catch (err) {
      setError("Failed to fetch pending approvals");
    }
    setLoading(false);
  };

  useEffect(() => {
    if (token) fetchPending();
    // eslint-disable-next-line
  }, [token]);

  const handleApprove = async (runId) => {
    setApproving(runId);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        `/api/workflows/approvals/${runId}/approve`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Approved!");
      fetchPending();
      setTimeout(() => setSuccess(""), 2000);
    } catch (err) {
      setError("Failed to approve");
    }
    setApproving("");
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-0 px-0 relative overflow-hidden">
      <img
        src={BG_IMAGE}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-80 z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-pink-200/60 via-purple-200/40 to-blue-100/40 z-0" />
      <div
        className="flex flex-col items-center w-full z-10"
        style={{ minHeight: "100vh" }}
      >
        {/* Header Banner */}
        <div className="w-full max-w-5xl mx-auto rounded-3xl mt-8 mb-12 overflow-hidden shadow-2xl relative">
          <div className="bg-gradient-to-r from-pink-500 via-purple-400 to-blue-400 p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <FaCheckCircle className="text-white text-5xl drop-shadow-lg" />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">
                  Pending Approvals
                </h1>
                <p className="text-white/90 text-lg font-medium drop-shadow">
                  Review and approve workflow runs that require your attention.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Alerts */}
        {success && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-center font-semibold w-full max-w-2xl shadow">
            {success}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center font-semibold w-full max-w-2xl shadow">
            {error}
          </div>
        )}
        {/* Approval Cards */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          {loading ? (
            <div className="text-center text-lg text-white/90">Loading...</div>
          ) : pending.length === 0 ? (
            <div className="text-center text-white/90">
              No pending approvals.
            </div>
          ) : (
            pending.map((run) => (
              <div
                key={run._id}
                className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-8 border-pink-400 hover:shadow-2xl transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-pink-700 flex items-center gap-2">
                    <FaProjectDiagram className="text-pink-400" />{" "}
                    {run.workflowName || "Workflow"}
                  </span>
                  <span className="text-gray-700 font-medium">
                    Started: {new Date(run.startedAt).toLocaleString()}
                    <br />
                    <span className="inline-block bg-pink-100 text-pink-700 px-3 py-1 rounded-full text-xs font-bold mr-2 mt-2">
                      Pending Approval
                    </span>
                    Approver:{" "}
                    <span className="bg-gray-100 text-gray-700 px-2 py-1 rounded-full text-xs font-semibold">
                      {run.approverEmail || "-"}
                    </span>
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    className="text-white bg-pink-500 hover:bg-pink-600 rounded-full px-8 py-3 font-bold text-lg shadow transition"
                    onClick={() => handleApprove(run._id)}
                    disabled={approving === run._id}
                  >
                    {approving === run._id ? "Approving..." : "Approve"}
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

export default Approvals;
