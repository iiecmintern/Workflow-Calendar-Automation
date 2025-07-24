import React, { createContext, useContext, useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "./AuthContext";

const WorkflowContext = createContext();
export const useWorkflow = () => useContext(WorkflowContext);

export const WorkflowProvider = ({ children }) => {
  const { token } = useAuth();
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get("/api/workflows", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows(res.data);
    } catch (err) {
      setError("Failed to fetch workflows");
    } finally {
      setLoading(false);
    }
  };

  const createWorkflow = async (data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post("/api/workflows", data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows((prev) => [...prev, res.data]);
      return res.data;
    } catch (err) {
      setError("Failed to create workflow");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getWorkflow = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.get(`/api/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      return res.data;
    } catch (err) {
      setError("Failed to fetch workflow");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateWorkflow = async (id, data) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.put(`/api/workflows/${id}`, data, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows((prev) => prev.map((w) => (w._id === id ? res.data : w)));
      return res.data;
    } catch (err) {
      setError("Failed to update workflow");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const deleteWorkflow = async (id) => {
    setLoading(true);
    setError(null);
    try {
      await axios.delete(`/api/workflows/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWorkflows((prev) => prev.filter((w) => w._id !== id));
    } catch (err) {
      setError("Failed to delete workflow");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const runWorkflow = async (id) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `/api/workflows/${id}/run`,
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      return res.data;
    } catch (err) {
      setError("Failed to run workflow");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (token) fetchWorkflows();
    // eslint-disable-next-line
  }, [token]);

  return (
    <WorkflowContext.Provider
      value={{
        workflows,
        loading,
        error,
        fetchWorkflows,
        createWorkflow,
        getWorkflow,
        updateWorkflow,
        deleteWorkflow,
        runWorkflow,
      }}
    >
      {children}
    </WorkflowContext.Provider>
  );
};
