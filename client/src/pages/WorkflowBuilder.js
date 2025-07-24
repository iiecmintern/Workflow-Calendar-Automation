import React, { useState, useCallback, useRef, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useWorkflow } from "../contexts/WorkflowContext";
import ReactFlow, {
  MiniMap,
  Controls,
  Background,
  addEdge,
  useNodesState,
  useEdgesState,
  Handle,
  Position,
} from "reactflow";
import {
  FaBolt,
  FaPlay,
  FaCodeBranch,
  FaClock,
  FaGlobe,
  FaCheckCircle,
  FaWpforms,
  FaBell,
  FaTrash,
  FaArrowDown,
  FaArrowUp,
  FaCode,
} from "react-icons/fa";
import "reactflow/dist/style.css";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const NODE_TYPES = [
  {
    type: "trigger",
    label: "Trigger",
    color: "bg-green-500",
    icon: <FaBolt />,
  },
  {
    type: "schedule",
    label: "Schedule",
    color: "bg-lime-500",
    icon: <FaClock />,
  },
  { type: "action", label: "Action", color: "bg-blue-500", icon: <FaPlay /> },
  {
    type: "logic",
    label: "Logic",
    color: "bg-yellow-500",
    icon: <FaCodeBranch />,
  },
  { type: "delay", label: "Delay", color: "bg-purple-500", icon: <FaClock /> },
  {
    type: "webhook-inbound",
    label: "Inbound Webhook",
    color: "bg-cyan-500",
    icon: <FaArrowDown />,
  },
  {
    type: "webhook-outbound",
    label: "Outbound Webhook",
    color: "bg-teal-500",
    icon: <FaArrowUp />,
  },
  {
    type: "api",
    label: "API Call",
    color: "bg-indigo-500",
    icon: <FaCode />,
  },
  {
    type: "approval",
    label: "Approval",
    color: "bg-pink-500",
    icon: <FaCheckCircle />,
  },
  { type: "form", label: "Form", color: "bg-orange-500", icon: <FaWpforms /> },
  {
    type: "notification",
    label: "Notification",
    color: "bg-red-500",
    icon: <FaBell />,
  },
];

const getNodeStyle = (type) => {
  switch (type) {
    case "trigger":
      return {
        background: "#22c55e",
        color: "#fff",
        border: "2px solid #16a34a",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "schedule":
      return {
        background: "linear-gradient(90deg, #bef264 0%, #4ade80 100%)",
        color: "#222",
        border: "2px solid #a3e635",
        borderRadius: 16,
        fontWeight: 700,
        boxShadow: "0 2px 12px 0 rgba(132,204,22,0.15)",
      };
    case "action":
      return {
        background: "#3b82f6",
        color: "#fff",
        border: "2px solid #2563eb",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "logic":
      return {
        background: "#facc15",
        color: "#92400e",
        border: "2px solid #eab308",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "delay":
      return {
        background: "#a78bfa",
        color: "#fff",
        border: "2px solid #7c3aed",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "webhook-inbound":
      return {
        background: "#06b6d4",
        color: "#fff",
        border: "2px solid #0891b2",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "webhook-outbound":
      return {
        background: "#14b8a6",
        color: "#fff",
        border: "2px solid #0f766e",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "api":
      return {
        background: "#6366f1",
        color: "#fff",
        border: "2px solid #3730a3",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "form":
      return {
        background: "#f97316",
        color: "#fff",
        border: "2px solid #ea580c",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "notification":
      return {
        background: "#ef4444",
        color: "#fff",
        border: "2px solid #dc2626",
        borderRadius: 12,
        fontWeight: 600,
      };
    case "approval":
      return {
        background: "#ec4899",
        color: "#fff",
        border: "2px solid #be185d",
        borderRadius: 12,
        fontWeight: 600,
      };
    default:
      return {};
  }
};

const getNodeIcon = (type) => {
  const found = NODE_TYPES.find((n) => n.type === type);
  return found ? found.icon : null;
};

const getNodeFields = (type) => {
  switch (type) {
    case "trigger":
      return [
        {
          key: "triggerType",
          label: "Trigger Type",
          type: "select",
          options: ["Manual", "Webhook", "Schedule"],
          placeholder: "Select trigger type",
        },
        {
          key: "webhookUrl",
          label: "Webhook URL",
          type: "text",
          showIf: (fields) => fields.triggerType === "Webhook",
          placeholder: "e.g. https://... or {{variable}}",
        },
        {
          key: "cron",
          label: "Cron Expression",
          type: "text",
          showIf: (fields) => fields.triggerType === "Schedule",
          placeholder: "e.g. 0 0 * * * or {{variable}}",
        },
      ];
    case "schedule":
      return [
        {
          key: "scheduleType",
          label: "Schedule Type",
          type: "select",
          options: ["Interval", "Time of Day", "Cron Expression"],
          placeholder: "Select schedule type",
        },
        {
          key: "interval",
          label: "Interval (minutes)",
          type: "number",
          showIf: (fields) => fields.scheduleType === "Interval",
          placeholder: "e.g. 60 or {{variable}}",
        },
        {
          key: "timeOfDay",
          label: "Time of Day (HH:mm)",
          type: "text",
          showIf: (fields) => fields.scheduleType === "Time of Day",
          placeholder: "e.g. 09:00 or {{variable}}",
        },
        {
          key: "cron",
          label: "Cron Expression",
          type: "text",
          showIf: (fields) => fields.scheduleType === "Cron Expression",
          placeholder: "e.g. 0 0 * * * or {{variable}}",
        },
      ];
    case "action":
      return [
        {
          key: "actionType",
          label: "Action Type",
          type: "select",
          options: ["Send Email", "HTTP Request"],
          placeholder: "Select action type",
        },
        {
          key: "endpoint",
          label: "Endpoint URL",
          type: "text",
          showIf: (fields) => fields.actionType === "HTTP Request",
          placeholder: "e.g. https://... or {{variable}}",
        },
        {
          key: "emailTo",
          label: "Email To",
          type: "email",
          showIf: (fields) => fields.actionType === "Send Email",
          placeholder: "e.g. user@email.com or {{variable}}",
        },
        {
          key: "emailBody",
          label: "Email Body",
          type: "textarea",
          showIf: (fields) => fields.actionType === "Send Email",
          placeholder: "Type your message or use {{variable}}",
        },
      ];
    case "webhook-inbound":
      return [
        {
          key: "webhookName",
          label: "Webhook Name",
          type: "text",
          placeholder: "e.g. My Webhook or {{variable}}",
        },
        {
          key: "secret",
          label: "Webhook Secret (optional)",
          type: "text",
          placeholder: "e.g. mysecret or {{variable}}",
        },
        {
          key: "method",
          label: "HTTP Method",
          type: "select",
          options: ["GET", "POST", "PUT", "DELETE"],
          placeholder: "Select method",
        },
        {
          key: "description",
          label: "Description",
          type: "textarea",
          placeholder: "Describe webhook or use {{variable}}",
        },
      ];
    case "webhook-outbound":
      return [
        {
          key: "webhookName",
          label: "Webhook Name",
          type: "text",
          placeholder: "e.g. Outbound Webhook or {{variable}}",
        },
        {
          key: "url",
          label: "Webhook URL",
          type: "text",
          placeholder: "e.g. https://... or {{variable}}",
        },
        {
          key: "method",
          label: "HTTP Method",
          type: "select",
          options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          placeholder: "Select method",
        },
        {
          key: "headers",
          label: "Headers (JSON)",
          type: "textarea",
          placeholder: '{"Content-Type": "application/json"} or {{variable}}',
        },
        {
          key: "body",
          label: "Request Body (JSON)",
          type: "textarea",
          placeholder: '{"key": "value"} or {{variable}}',
        },
        {
          key: "timeout",
          label: "Timeout (ms)",
          type: "number",
          placeholder: "e.g. 10000 or {{variable}}",
        },
        {
          key: "retryCount",
          label: "Retry Count",
          type: "number",
          placeholder: "e.g. 3 or {{variable}}",
        },
      ];
    case "api":
      return [
        {
          key: "apiName",
          label: "API Name",
          type: "text",
          placeholder: "e.g. My API or {{variable}}",
        },
        {
          key: "url",
          label: "API URL",
          type: "text",
          placeholder: "e.g. https://... or {{variable}}",
        },
        {
          key: "method",
          label: "HTTP Method",
          type: "select",
          options: ["GET", "POST", "PUT", "DELETE", "PATCH"],
          placeholder: "Select method",
        },
        {
          key: "headers",
          label: "Headers (JSON)",
          type: "textarea",
          placeholder: '{"Authorization": "Bearer token"} or {{variable}}',
        },
        {
          key: "body",
          label: "Request Body (JSON)",
          type: "textarea",
          placeholder: '{"key": "value"} or {{variable}}',
        },
        {
          key: "timeout",
          label: "Timeout (ms)",
          type: "number",
          placeholder: "e.g. 10000 or {{variable}}",
        },
        {
          key: "responseMapping",
          label: "Response Mapping (JSON)",
          type: "textarea",
          placeholder: '{"result": "$.data.result"} or {{variable}}',
        },
      ];
    case "delay":
      return [
        {
          key: "duration",
          label: "Delay Duration (minutes)",
          type: "number",
          placeholder: "e.g. 5 or {{variable}}",
        },
      ];
    case "approval":
      return [
        {
          key: "approver",
          label: "Approver Email",
          type: "email",
          placeholder: "e.g. user@email.com or {{variable}}",
        },
      ];
    case "condition":
      return [
        {
          key: "expression",
          label: "Condition (JS Expression)",
          type: "text",
          placeholder: "e.g. {{api1.data.id}} > 5",
        },
      ];
    case "form":
      return [
        {
          key: "formName",
          label: "Form Name",
          type: "text",
          placeholder: "e.g. Feedback Form or {{variable}}",
        },
        {
          key: "fields",
          label: "Fields (JSON)",
          type: "textarea",
          placeholder: '[{"label": "Name", "type": "text"}] or {{variable}}',
        },
        {
          key: "submitLabel",
          label: "Submit Button Label",
          type: "text",
          placeholder: "e.g. Submit or {{variable}}",
        },
      ];
    case "notification":
      return [
        {
          key: "recipient",
          label: "Recipient (Email/Phone/UserId)",
          type: "text",
          placeholder: "e.g. user@email.com or {{variable}}",
        },
        {
          key: "message",
          label: "Message",
          type: "textarea",
          placeholder: "Type your message or use {{variable}}",
        },
        {
          key: "channel",
          label: "Channel",
          type: "select",
          options: ["Email", "SMS", "In-App"],
          placeholder: "Select channel",
        },
      ];
    case "loop":
      return [
        {
          key: "count",
          label: "Loop Count",
          type: "number",
          placeholder: "e.g. 3 or {{variable}}",
        },
      ];
    case "parallel":
      return [
        {
          key: "branches",
          label: "Branch Node IDs (comma separated)",
          type: "text",
          placeholder: "e.g. node1,node2 or {{variable}}",
        },
      ];
    default:
      return [];
  }
};

const initialPosition = { x: 250, y: 100 };

// --- MOVE NODETYPES OUTSIDE COMPONENT AND MEMOIZE ---
const nodeTypes = {
  default: ({ data, selected }) => (
    <div
      className={`flex flex-col items-center justify-center px-5 py-4 min-w-[120px] min-h-[70px] shadow-md border transition-all duration-200 ${
        selected ? "ring-2 ring-primary-500" : ""
      }`}
      style={{
        ...getNodeStyle(data.type),
        boxShadow: selected
          ? "0 4px 24px 0 rgba(59,130,246,0.15)"
          : "0 2px 12px 0 rgba(0,0,0,0.08)",
        borderRadius: 16,
        borderWidth: 2,
        borderColor:
          getNodeStyle(data.type).border?.replace("2px solid ", "") ||
          "#e5e7eb",
      }}
    >
      <Handle
        type="target"
        position={Position.Left}
        style={{ background: "#6366f1" }}
      />
      <span className="text-2xl mb-1">{getNodeIcon(data.type)}</span>
      <span
        className="font-bold text-base mb-0.5"
        style={{ color: getNodeStyle(data.type).color }}
      >
        {data.label}
      </span>
      <span className="text-xs text-gray-500 uppercase tracking-wide mt-0.5">
        {data.type.replace(/-/g, " ")}
      </span>
      <Handle
        type="source"
        position={Position.Right}
        style={{ background: "#6366f1" }}
      />
    </div>
  ),
};

const WorkflowBuilder = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { getWorkflow, updateWorkflow, createWorkflow } = useWorkflow();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [addingType, setAddingType] = useState(null);
  const [editNode, setEditNode] = useState(null);
  const [editLabel, setEditLabel] = useState("");
  const [editFields, setEditFields] = useState({});
  const [workflowName, setWorkflowName] = useState("Workflow 1");
  const [saving, setSaving] = useState(false);
  const [alert, setAlert] = useState("");
  const paletteRefs = useRef([]);
  const [running, setRunning] = useState(false);
  const [runResult, setRunResult] = useState(null);
  const [runHistory, setRunHistory] = useState([]);
  const [aiDebugResult, setAiDebugResult] = useState(null);
  const [aiDebugLoading, setAiDebugLoading] = useState(false);
  const [aiDebugModalOpen, setAiDebugModalOpen] = useState(false);
  const { token } = useAuth();

  // Load workflow if editing
  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        const wf = await getWorkflow(id);
        setWorkflowName(wf.name || "Workflow 1");
        setNodes(
          (wf.nodes || []).map((n) => ({
            id: n.id,
            type: "default",
            position: n.position || initialPosition,
            data: {
              label: n.label || n.type,
              type: n.type,
              config: n.config || {},
            },
            style: getNodeStyle(n.type),
            icon: getNodeIcon(n.type),
          }))
        );
        setEdges(
          (wf.edges || []).map((e) => ({
            id: e.id,
            source: e.source,
            target: e.target,
            label: e.label,
            data: e.data || {},
          }))
        );
      } catch {
        setAlert("Failed to load workflow");
      }
    })();
    // eslint-disable-next-line
  }, [id]);

  // Fetch run history
  const fetchRunHistory = useCallback(async () => {
    if (!id || !token) return;
    try {
      const res = await axios.get(`/api/workflows/${id}/runs`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setRunHistory(res.data);
    } catch {
      setRunHistory([]);
    }
  }, [id, token]);

  useEffect(() => {
    if (!id || !token) return;
    fetchRunHistory();
  }, [id, token, fetchRunHistory]);

  // Run workflow
  const handleRunWorkflow = async () => {
    if (!id) return;
    setRunning(true);
    setRunResult(null);
    try {
      const res = await axios.post(
        `/api/workflows/${id}/run`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setRunResult(res.data.run);
      fetchRunHistory();
    } catch (err) {
      setRunResult({ error: err?.response?.data?.message || "Run failed" });
    } finally {
      setRunning(false);
    }
  };

  // Add node to canvas
  const onPaneClick = useCallback(
    (event) => {
      if (!addingType) return;
      const bounds = event.target.getBoundingClientRect();
      const x = event.clientX - bounds.left;
      const y = event.clientY - bounds.top;
      const nodeId = `${addingType}-${Date.now()}`;
      setNodes((nds) => [
        ...nds,
        {
          id: nodeId,
          type: "default",
          position: { x, y },
          data: {
            label: addingType.charAt(0).toUpperCase() + addingType.slice(1),
            type: addingType,
            config: {},
          },
          style: getNodeStyle(addingType),
          icon: getNodeIcon(addingType),
        },
      ]);
      setAddingType(null);
    },
    [addingType, setNodes]
  );

  // Single-click node to edit
  const onNodeClick = useCallback((event, node) => {
    console.log("Node clicked:", node); // Debug log
    setEditNode(node);
    setEditLabel(node.data.label);
    setEditFields({
      ...node.data.config,
      label: node.data.label,
      type: node.data.type,
    });
  }, []);

  // Save node config
  const handleEditSave = () => {
    setNodes((nds) =>
      nds.map((n) =>
        n.id === editNode.id
          ? {
              ...n,
              data: {
                ...n.data,
                label: editLabel,
                type: (n.data.type || "").toLowerCase(), // enforce lowercase type
                config: { ...editFields },
              },
            }
          : n
      )
    );
    setEditNode(null);
    setEditLabel("");
    setEditFields({});
  };

  // Delete node
  const handleEditDelete = () => {
    setNodes((nds) => nds.filter((n) => n.id !== editNode.id));
    setEditNode(null);
    setEditLabel("");
    setEditFields({});
  };

  // Cancel modal
  const handleEditCancel = () => {
    setEditNode(null);
    setEditLabel("");
    setEditFields({});
  };

  // Save workflow to backend
  const handleSaveWorkflow = async () => {
    setSaving(true);
    setAlert("");
    try {
      const payload = {
        name: workflowName,
        nodes: nodes.map((n) => ({
          id: n.id,
          type: n.data.type,
          label: n.data.label,
          position: n.position,
          config: n.data.config || {},
        })),
        edges: edges.map((e) => ({
          id: e.id,
          source: e.source,
          target: e.target,
          label: e.label,
          data: e.data || {},
        })),
        status: "draft",
      };
      if (id) {
        await updateWorkflow(id, payload);
        setAlert("Workflow updated successfully!");
      } else {
        const wf = await createWorkflow(payload);
        setAlert("Workflow created successfully!");
        navigate(`/workflows/${wf._id}`);
      }
    } catch {
      setAlert("Failed to save workflow");
    } finally {
      setSaving(false);
      setTimeout(() => setAlert(""), 2000);
    }
  };

  const [focusedField, setFocusedField] = useState(null);

  const handleAIDebug = async (runId) => {
    setAiDebugLoading(true);
    setAiDebugResult(null);
    setAiDebugModalOpen(true);
    try {
      const res = await axios.post(
        `/api/workflows/${id}/debug/${runId}`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAiDebugResult(res.data.explanation);
    } catch (err) {
      setAiDebugResult(
        "AI Debugger failed: " + (err.response?.data?.message || err.message)
      );
    }
    setAiDebugLoading(false);
  };

  return (
    <div className="flex flex-col h-full min-h-screen bg-gray-50">
      <div className="flex items-center gap-4 px-8 pt-8 pb-4">
        <input
          className="text-2xl font-bold border-b-2 border-primary-200 focus:border-primary-500 outline-none bg-transparent flex-1"
          name="name"
          value={workflowName}
          onChange={(e) => setWorkflowName(e.target.value)}
        />
        <button
          className="px-6 py-2 rounded-lg bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition"
          onClick={handleSaveWorkflow}
          disabled={saving}
        >
          {saving ? "Saving..." : "Save"}
        </button>
        {id && (
          <button
            className="px-6 py-2 rounded-lg bg-green-600 text-white font-semibold shadow hover:bg-green-700 transition ml-2"
            onClick={handleRunWorkflow}
            disabled={running}
          >
            {running ? "Running..." : "Run"}
          </button>
        )}
      </div>
      <div className="px-8 pb-8 flex-1 flex min-h-0">
        {/* Node Palette */}
        <div
          className="relative w-56 flex flex-col gap-4 bg-white border rounded-xl shadow p-4 h-full max-h-[70vh] sticky top-24 overflow-y-auto mr-4"
          style={{ minHeight: 500 }}
        >
          <div className="font-semibold mb-2 text-gray-700 text-lg z-10 relative">
            Node Palette
          </div>
          {NODE_TYPES.map((n, idx) => (
            <button
              key={n.type}
              ref={(el) => (paletteRefs.current[idx] = el)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-white font-medium shadow ${n.color} hover:scale-105 transition-transform focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-400 z-10 relative`}
              onClick={() => setAddingType(n.type)}
              type="button"
            >
              <span className="text-xl">{n.icon}</span>
              {n.label}
            </button>
          ))}
          {addingType && (
            <div className="text-xs text-primary-700 mt-2 z-10 relative">
              Click on canvas to place a {addingType} node
            </div>
          )}
        </div>
        {/* Visual Canvas */}
        <div className="flex-1 h-full bg-gradient-to-br from-gray-50 to-gray-100 border rounded-2xl shadow-xl relative overflow-hidden min-h-[500px]">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={useCallback(
              (params) => setEdges((eds) => addEdge(params, eds)),
              [setEdges]
            )}
            onPaneClick={onPaneClick}
            onNodeClick={onNodeClick}
            nodeTypes={nodeTypes}
            fitView
          >
            <MiniMap nodeColor={(n) => getNodeStyle(n.data.type).background} />
            <Controls />
            <Background gap={16} color="#e5e7eb" />
          </ReactFlow>
          {/* Edit Node Modal */}
          {editNode && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30">
              <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-2xl max-h-[90vh] overflow-y-auto flex flex-col md:flex-row gap-10">
                <div className="flex-1 min-w-0">
                  <h2 className="text-xl font-bold mb-4">
                    {editNode.data.label || "Edit Node"}
                  </h2>
                  <label className="block text-sm font-medium mb-1">
                    Label
                  </label>
                  <input
                    className="w-full border rounded px-3 py-2 mb-4"
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                  />
                  {getNodeFields(editNode.data.type).map((field) => {
                    if (field.showIf && !field.showIf(editFields)) return null;
                    if (field.type === "select") {
                      return (
                        <div key={field.key} className="mb-4">
                          <label className="block text-sm font-medium mb-1">
                            {field.label}
                          </label>
                          <select
                            className="w-full border rounded px-3 py-2"
                            value={editFields[field.key] || field.options[0]}
                            onChange={(e) =>
                              setEditFields((f) => ({
                                ...f,
                                [field.key]: e.target.value,
                              }))
                            }
                          >
                            {field.options.map((opt) => (
                              <option key={opt} value={opt}>
                                {opt}
                              </option>
                            ))}
                          </select>
                        </div>
                      );
                    }
                    if (field.type === "textarea") {
                      return (
                        <div key={field.key} className="mb-4">
                          <label className="block text-sm font-medium mb-1">
                            {field.label}
                          </label>
                          <textarea
                            className="w-full border rounded px-3 py-2"
                            value={editFields[field.key] || ""}
                            onChange={(e) =>
                              setEditFields((f) => ({
                                ...f,
                                [field.key]: e.target.value,
                              }))
                            }
                            onFocus={(e) =>
                              setFocusedField({
                                key: field.key,
                                type: "textarea",
                              })
                            }
                          />
                        </div>
                      );
                    }
                    return (
                      <div key={field.key} className="mb-4">
                        <label className="block text-sm font-medium mb-1">
                          {field.label}
                        </label>
                        <input
                          className="w-full border rounded px-3 py-2"
                          type={field.type}
                          value={editFields[field.key] || ""}
                          onChange={(e) =>
                            setEditFields((f) => ({
                              ...f,
                              [field.key]: e.target.value,
                            }))
                          }
                          onFocus={(e) =>
                            setFocusedField({ key: field.key, type: "input" })
                          }
                        />
                      </div>
                    );
                  })}
                  <div className="flex gap-2 justify-between mt-4">
                    <button
                      className="flex items-center gap-2 px-4 py-2 rounded bg-red-100 text-red-700 font-semibold hover:bg-red-200"
                      onClick={handleEditDelete}
                    >
                      <FaTrash /> Delete
                    </button>
                    <div className="flex gap-2">
                      <button
                        className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                        onClick={handleEditCancel}
                      >
                        Cancel
                      </button>
                      <button
                        className="px-4 py-2 rounded bg-primary-600 text-white font-semibold shadow hover:bg-primary-700 transition"
                        onClick={handleEditSave}
                      >
                        Save
                      </button>
                    </div>
                  </div>
                </div>
                {/* Variable Picker Sidebar */}
                <div className="w-full md:w-64 bg-gray-50 border-l border-gray-200 rounded-xl p-4 flex flex-col gap-3 max-h-[70vh] overflow-y-auto mt-6 md:mt-0">
                  <div className="font-semibold text-gray-700 mb-2 text-base">
                    Available Variables
                  </div>
                  {nodes
                    .filter((n) => n.id !== editNode.id)
                    .map((n) => (
                      <div key={n.id} className="mb-3">
                        <div className="font-semibold text-xs text-gray-700 mb-1 uppercase tracking-wide">
                          {n.data.label || n.id}
                          <span className="ml-2 text-gray-400 font-mono text-[10px]">
                            [{n.data.type}]
                          </span>
                        </div>
                        <button
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-primary-50 text-primary-700 border border-primary-200 text-xs font-mono hover:bg-primary-100 transition mb-1 shadow-sm"
                          style={{ wordBreak: "break-all" }}
                          onClick={() => {
                            if (focusedField) {
                              setEditFields((f) => ({
                                ...f,
                                [focusedField.key]:
                                  (f[focusedField.key] || "") + `{{${n.id}}}`,
                              }));
                            }
                          }}
                          title="Insert variable"
                        >
                          <span>&#123;&#123;{n.id}&#125;&#125;</span>
                          <svg
                            className="w-3 h-3 ml-1"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            viewBox="0 0 24 24"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M8 12h8m0 0l-4-4m4 4l-4 4"
                            />
                          </svg>
                        </button>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
      {/* Run Result */}
      {runResult && (
        <div className="max-w-2xl mx-auto mt-6 bg-white border border-green-200 rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-2 text-green-700">Run Result</h3>
          {runResult.error ? (
            <div className="text-red-600">{runResult.error}</div>
          ) : (
            <>
              <div
                className={
                  runResult.status === "pending"
                    ? "text-orange-600 font-semibold mb-2"
                    : "text-green-700 font-semibold mb-2"
                }
              >
                Status:{" "}
                {runResult.status === "pending"
                  ? "pending approval"
                  : runResult.status}
              </div>
              <div className="text-gray-700 text-sm mb-2">
                Started:{" "}
                {runResult.startedAt &&
                  new Date(runResult.startedAt).toLocaleString()}
              </div>
              {runResult.status !== "pending" && (
                <div className="text-gray-700 text-sm mb-2">
                  Finished:{" "}
                  {runResult.finishedAt &&
                    new Date(runResult.finishedAt).toLocaleString()}
                </div>
              )}
              <div className="overflow-x-auto">
                <table className="w-full text-sm border">
                  <thead>
                    <tr className="bg-gray-100">
                      <th className="px-2 py-1">Node</th>
                      <th className="px-2 py-1">Type</th>
                      <th className="px-2 py-1">Status</th>
                      <th className="px-2 py-1">Started</th>
                      <th className="px-2 py-1">Finished</th>
                    </tr>
                  </thead>
                  <tbody>
                    {runResult.steps?.map((step, idx) => (
                      <tr key={idx}>
                        <td className="px-2 py-1">{step.label}</td>
                        <td className="px-2 py-1">{step.type}</td>
                        <td className="px-2 py-1">{step.status}</td>
                        <td className="px-2 py-1">
                          {step.startedAt &&
                            new Date(step.startedAt).toLocaleTimeString()}
                        </td>
                        <td className="px-2 py-1">
                          {step.finishedAt &&
                            new Date(step.finishedAt).toLocaleTimeString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      )}
      {/* Run History */}
      {id && runHistory.length > 0 && (
        <div className="max-w-2xl mx-auto mt-6 bg-white border border-gray-200 rounded-xl shadow p-6">
          <h3 className="text-lg font-bold mb-2 text-gray-700">Recent Runs</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm border">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-2 py-1">Status</th>
                  <th className="px-2 py-1">Started</th>
                  <th className="px-2 py-1">Finished</th>
                  <th className="px-2 py-1">Steps</th>
                  <th className="px-2 py-1">AI Debug</th>
                </tr>
              </thead>
              <tbody>
                {runHistory.map((run) => (
                  <tr key={run._id}>
                    <td className="px-2 py-1">{run.status}</td>
                    <td className="px-2 py-1">
                      {run.startedAt &&
                        new Date(run.startedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1">
                      {run.finishedAt &&
                        new Date(run.finishedAt).toLocaleString()}
                    </td>
                    <td className="px-2 py-1">{run.steps?.length}</td>
                    <td className="px-2 py-1">
                      <button
                        className="px-3 py-1 rounded bg-gradient-to-r from-green-500 to-blue-500 text-white text-xs font-semibold shadow hover:from-green-600 hover:to-blue-600"
                        onClick={() => handleAIDebug(run._id)}
                      >
                        Debug with AI
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
      {/* AI Debugger Modal */}
      {aiDebugModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-xl shadow-xl p-8 w-full max-w-lg max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-bold mb-4 text-blue-700">
              AI Workflow Debugger
            </h2>
            {aiDebugLoading ? (
              <div className="text-center text-lg text-blue-600">
                Analyzing...
              </div>
            ) : (
              <pre className="whitespace-pre-wrap text-gray-800 text-sm">
                {aiDebugResult}
              </pre>
            )}
            <div className="flex justify-end mt-6">
              <button
                className="px-4 py-2 rounded bg-gray-200 text-gray-700 font-semibold hover:bg-gray-300"
                onClick={() => setAiDebugModalOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
      <div className="h-12" />
      {alert && (
        <div className="fixed bottom-8 left-1/2 -translate-x-1/2 bg-white border border-primary-200 shadow-lg rounded-xl px-6 py-3 text-primary-700 font-semibold z-50">
          {alert}
        </div>
      )}
    </div>
  );
};

export default WorkflowBuilder;
