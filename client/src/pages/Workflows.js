import React, { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useWorkflow } from "../contexts/WorkflowContext";
import { FaPlusCircle, FaProjectDiagram } from "react-icons/fa";

const HEADER_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1200&q=80";
const EMPTY_IMAGE =
  "https://assets-global.website-files.com/5f6b719079b2b1c8d1e3e7c2/63e3e2e2e2e2e2e2e2e2e2e2_workflow-empty-state.svg";

const Workflows = () => {
  const { workflows, loading, error, createWorkflow, deleteWorkflow } =
    useWorkflow();
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ name: "", description: "" });
  const [creating, setCreating] = useState(false);
  const [localError, setLocalError] = useState("");
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    setCreating(true);
    setLocalError("");
    try {
      const wf = await createWorkflow({
        name: form.name,
        description: form.description,
      });
      setForm({ name: "", description: "" });
      setShowForm(false);
      navigate(`/workflows/${wf._id}`);
    } catch (err) {
      setLocalError("Failed to create workflow");
    } finally {
      setCreating(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this workflow?")) return;
    try {
      await deleteWorkflow(id);
    } catch {
      setLocalError("Failed to delete workflow");
    }
  };

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 pb-20">
      {/* Header Banner */}
      <div className="w-full h-56 md:h-64 lg:h-72 relative flex items-center justify-center overflow-hidden rounded-b-3xl shadow-lg mb-8">
        <img
          src={HEADER_IMAGE}
          alt="Workflow Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 via-purple-600/40 to-green-500/30" />
        <div className="absolute top-8 right-8 flex gap-4 z-20">
          <button
            className="px-6 py-2 rounded-lg bg-pink-600 text-white font-semibold shadow hover:bg-pink-700 transition"
            onClick={() => navigate("/approvals")}
          >
            Approvals
          </button>
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-blue-600 to-green-500 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all text-lg"
            onClick={() => setShowForm((v) => !v)}
            style={{ boxShadow: "0 8px 32px 0 rgba(60, 72, 180, 0.15)" }}
          >
            <FaPlusCircle className="w-6 h-6" /> New Workflow
          </button>
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
            Your Workflows
          </h1>
          <p className="mt-2 text-lg md:text-xl text-white/90 font-medium">
            Automate, organize, and boost your productivity
          </p>
        </div>
      </div>
      {/* Create Workflow Form */}
      {showForm && (
        <form
          onSubmit={handleCreate}
          className="mx-auto mt-8 mb-8 bg-white/90 rounded-2xl shadow-xl p-8 max-w-xl w-full flex flex-col gap-4 border border-blue-100"
        >
          <h2 className="text-2xl font-bold text-blue-700 mb-2">
            Create New Workflow
          </h2>
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              className="w-full border rounded px-3 py-2"
              value={form.name}
              onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">
              Description
            </label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={form.description}
              onChange={(e) =>
                setForm((f) => ({ ...f, description: e.target.value }))
              }
            />
          </div>
          <div className="flex gap-2 mt-2">
            <button
              type="submit"
              className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold shadow hover:scale-105 transition"
              disabled={creating}
            >
              {creating ? "Creating..." : "Create"}
            </button>
            <button
              type="button"
              className="px-5 py-2 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition"
              onClick={() => setShowForm(false)}
            >
              Cancel
            </button>
          </div>
          {localError && (
            <div className="text-red-600 text-sm mt-2">{localError}</div>
          )}
        </form>
      )}
      {/* Workflow List or Empty State */}
      <div className="flex flex-col items-center gap-8 max-w-3xl w-full mx-auto mt-8">
        {loading && <div>Loading...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {workflows.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center bg-white/90 rounded-2xl shadow-xl p-10 border border-blue-100 mt-8">
            <img
              src={EMPTY_IMAGE}
              alt="No workflows"
              className="w-48 h-48 object-contain mb-4"
            />
            <div className="text-2xl font-bold text-blue-700 mb-2">
              No workflows yet
            </div>
            <div className="text-gray-500 text-lg mb-4">
              Click{" "}
              <span className="text-primary-600 font-semibold">
                New Workflow
              </span>{" "}
              to get started!
            </div>
          </div>
        )}
        {workflows.map((wf) => (
          <div
            key={wf._id}
            className="bg-white/90 rounded-2xl shadow-xl p-6 flex items-center justify-between w-full border border-blue-100 hover:shadow-2xl transition-all"
          >
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-14 h-14 rounded-xl bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 shadow-inner">
                <FaProjectDiagram className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <Link
                  to={`/workflows/${wf._id}`}
                  className="text-2xl font-bold text-blue-700 hover:underline"
                >
                  {wf.name}
                </Link>
                <div className="text-gray-500 text-md mt-1">
                  {wf.description}
                </div>
              </div>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/workflows/${wf._id}`}
                className="px-5 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow hover:bg-blue-200 transition text-lg"
                title="Edit"
              >
                Edit
              </Link>
              <button
                onClick={() => handleDelete(wf._id)}
                className="px-5 py-2 rounded-lg bg-red-100 text-red-700 font-semibold shadow hover:bg-red-200 transition text-lg"
                title="Delete"
              >
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Workflows;
 