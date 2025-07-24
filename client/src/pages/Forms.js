import React, { useState, useEffect } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import {
  FaPlus,
  FaEdit,
  FaTrash,
  FaEye,
  FaCopy,
  FaSave,
  FaTimes,
  FaPlusCircle,
  FaFileAlt,
  FaCheckCircle,
} from "react-icons/fa";

const HEADER_IMAGE =
  "https://images.unsplash.com/photo-1551434678-e076c223a692?auto=format&fit=crop&w=1200&q=80";
const EMPTY_IMAGE =
  "https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&w=400&q=80";

const Forms = () => {
  const { token } = useAuth();
  const [forms, setForms] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showFormBuilder, setShowFormBuilder] = useState(false);
  const [editingForm, setEditingForm] = useState(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    type: "pre-booking",
    fields: [],
  });

  const fieldTypes = [
    { value: "text", label: "Text Input", icon: "Aa" },
    { value: "email", label: "Email", icon: "✉️" },
    { value: "phone", label: "Phone Number", icon: "📞" },
    { value: "textarea", label: "Text Area", icon: "📝" },
    { value: "select", label: "Dropdown", icon: "▼" },
    { value: "checkbox", label: "Checkbox", icon: "☑️" },
    { value: "radio", label: "Radio Buttons", icon: "🔘" },
    { value: "file", label: "File Upload", icon: "📎" },
    { value: "date", label: "Date", icon: "📅" },
    { value: "time", label: "Time", icon: "⏰" },
    { value: "number", label: "Number", icon: "🔢" },
  ];

  useEffect(() => {
    if (token) {
      fetchForms();
    }
  }, [token]);

  const fetchForms = async () => {
    try {
      const response = await axios.get("/api/forms", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setForms(response.data);
    } catch (error) {
      console.error("Error fetching forms:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateForm = () => {
    setFormData({
      name: "",
      description: "",
      type: "pre-booking",
      fields: [],
    });
    setEditingForm(null);
    setShowFormBuilder(true);
  };

  const handleEditForm = (form) => {
    setFormData({
      name: form.name,
      description: form.description,
      type: form.type,
      fields: form.fields,
    });
    setEditingForm(form);
    setShowFormBuilder(true);
  };

  const handleSaveForm = async () => {
    try {
      if (editingForm) {
        await axios.put(`/api/forms/${editingForm._id}`, formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      } else {
        await axios.post("/api/forms", formData, {
          headers: { Authorization: `Bearer ${token}` },
        });
      }
      setShowFormBuilder(false);
      fetchForms();
    } catch (error) {
      console.error("Error saving form:", error);
    }
  };

  const handleDeleteForm = async (formId) => {
    if (window.confirm("Are you sure you want to delete this form?")) {
      try {
        await axios.delete(`/api/forms/${formId}`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        fetchForms();
      } catch (error) {
        console.error("Error deleting form:", error);
      }
    }
  };

  const addField = () => {
    const newField = {
      label: "",
      type: "text",
      required: false,
      placeholder: "",
      options: [],
      validation: {},
      order: formData.fields.length,
    };
    setFormData({
      ...formData,
      fields: [...formData.fields, newField],
    });
  };

  const updateField = (index, field) => {
    const updatedFields = [...formData.fields];
    updatedFields[index] = field;
    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  const removeField = (index) => {
    const updatedFields = formData.fields.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  const addOption = (fieldIndex) => {
    const updatedFields = [...formData.fields];
    updatedFields[fieldIndex].options.push({ label: "", value: "" });
    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  const updateOption = (fieldIndex, optionIndex, option) => {
    const updatedFields = [...formData.fields];
    updatedFields[fieldIndex].options[optionIndex] = option;
    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  const removeOption = (fieldIndex, optionIndex) => {
    const updatedFields = [...formData.fields];
    updatedFields[fieldIndex].options.splice(optionIndex, 1);
    setFormData({
      ...formData,
      fields: updatedFields,
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">
            Loading your forms...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 pb-20">
      {/* Header Banner */}
      <div className="w-full h-56 md:h-64 lg:h-72 relative flex items-center justify-center overflow-hidden rounded-b-3xl shadow-lg mb-8">
        <img
          src={HEADER_IMAGE}
          alt="Forms Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 via-purple-600/40 to-green-500/30" />
        <div className="absolute top-8 right-8 flex gap-4 z-20">
          <button
            className="flex items-center gap-2 px-6 py-3 rounded-full bg-gradient-to-r from-pink-500 to-purple-600 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all text-lg"
            onClick={handleCreateForm}
            style={{ boxShadow: "0 8px 32px 0 rgba(236, 72, 153, 0.15)" }}
          >
            <FaPlusCircle className="w-6 h-6" /> New Form
          </button>
        </div>
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
            Custom Forms
          </h1>
          <p className="mt-2 text-lg md:text-xl text-white/90 font-medium">
            Create beautiful forms to collect information from your clients
          </p>
        </div>
      </div>

      {/* Form Builder */}
      {showFormBuilder && (
        <div className="mx-auto mt-8 mb-8 bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 max-w-4xl w-full border border-blue-100">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-3xl font-bold text-blue-700">
              {editingForm ? "Edit Form" : "Create New Form"}
            </h2>
            <div className="flex gap-3">
              <button
                onClick={handleSaveForm}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <FaSave className="w-5 h-5" />
                Save Form
              </button>
              <button
                onClick={() => setShowFormBuilder(false)}
                className="px-6 py-3 rounded-lg bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition-all flex items-center gap-2"
              >
                <FaTimes className="w-5 h-5" />
                Cancel
              </button>
            </div>
          </div>

          {/* Form Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Form Name *
              </label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
                placeholder="Enter form name"
              />
            </div>
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-3">
                Form Type *
              </label>
              <select
                value={formData.type}
                onChange={(e) =>
                  setFormData({ ...formData, type: e.target.value })
                }
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
              >
                <option value="pre-booking">Pre-Booking Form</option>
                <option value="post-booking">Post-Booking Form</option>
              </select>
            </div>
          </div>

          <div className="mb-8">
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg"
              rows="3"
              placeholder="Enter form description"
            />
          </div>

          {/* Form Fields */}
          <div className="mb-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-2xl font-bold text-blue-700">Form Fields</h3>
              <button
                onClick={addField}
                className="px-6 py-3 rounded-lg bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:scale-105 transition-all flex items-center gap-2"
              >
                <FaPlus className="w-5 h-5" />
                Add Field
              </button>
            </div>

            {formData.fields.length === 0 ? (
              <div className="text-center py-12 border-2 border-dashed border-gray-300 rounded-xl bg-gray-50">
                <FaFileAlt className="text-6xl text-gray-400 mx-auto mb-4" />
                <p className="text-xl text-gray-500 font-medium">
                  No fields added yet
                </p>
                <p className="text-gray-400 mt-2">
                  Click "Add Field" to get started!
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {formData.fields.map((field, index) => (
                  <div
                    key={index}
                    className="border-2 border-gray-200 rounded-xl p-6 bg-gradient-to-r from-blue-50 to-purple-50 hover:shadow-lg transition-all"
                  >
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Field Label *
                        </label>
                        <input
                          type="text"
                          value={field.label}
                          onChange={(e) =>
                            updateField(index, {
                              ...field,
                              label: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                          placeholder="Enter field label"
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                          Field Type *
                        </label>
                        <select
                          value={field.type}
                          onChange={(e) =>
                            updateField(index, {
                              ...field,
                              type: e.target.value,
                            })
                          }
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        >
                          {fieldTypes.map((type) => (
                            <option key={type.value} value={type.value}>
                              {type.icon} {type.label}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div className="flex items-end">
                        <label className="flex items-center">
                          <input
                            type="checkbox"
                            checked={field.required}
                            onChange={(e) =>
                              updateField(index, {
                                ...field,
                                required: e.target.checked,
                              })
                            }
                            className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                          />
                          <span className="text-sm font-semibold text-gray-700">
                            Required
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="mb-4">
                      <label className="block text-sm font-semibold text-gray-700 mb-2">
                        Placeholder
                      </label>
                      <input
                        type="text"
                        value={field.placeholder || ""}
                        onChange={(e) =>
                          updateField(index, {
                            ...field,
                            placeholder: e.target.value,
                          })
                        }
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Enter placeholder text"
                      />
                    </div>

                    {/* Options for select, checkbox, radio */}
                    {(field.type === "select" || field.type === "radio") && (
                      <div className="mb-4">
                        <div className="flex justify-between items-center mb-3">
                          <label className="block text-sm font-semibold text-gray-700">
                            Options
                          </label>
                          <button
                            onClick={() => addOption(index)}
                            className="text-blue-600 hover:text-blue-700 text-sm font-semibold"
                          >
                            Add Option
                          </button>
                        </div>
                        <div className="space-y-2">
                          {field.options.map((option, optionIndex) => (
                            <div key={optionIndex} className="flex gap-2">
                              <input
                                type="text"
                                value={option.label}
                                onChange={(e) =>
                                  updateOption(index, optionIndex, {
                                    ...option,
                                    label: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Option label"
                              />
                              <input
                                type="text"
                                value={option.value}
                                onChange={(e) =>
                                  updateOption(index, optionIndex, {
                                    ...option,
                                    value: e.target.value,
                                  })
                                }
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                placeholder="Option value"
                              />
                              <button
                                onClick={() => removeOption(index, optionIndex)}
                                className="text-red-600 hover:text-red-700 px-3 py-2"
                              >
                                <FaTrash className="text-sm" />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <button
                        onClick={() => removeField(index)}
                        className="text-red-600 hover:text-red-700 flex items-center gap-1 font-semibold"
                      >
                        <FaTrash className="text-sm" />
                        Remove Field
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Forms List or Empty State */}
      <div className="flex flex-col items-center gap-8 max-w-4xl w-full mx-auto mt-8">
        {forms.length === 0 && !loading && (
          <div className="flex flex-col items-center justify-center bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-12 border border-blue-100 mt-8">
            <img
              src={EMPTY_IMAGE}
              alt="No forms"
              className="w-48 h-48 object-cover rounded-2xl mb-6 shadow-lg"
            />
            <div className="text-3xl font-bold text-blue-700 mb-3">
              No forms yet
            </div>
            <div className="text-gray-500 text-lg mb-6 text-center">
              Create your first custom form to collect information from your
              clients
            </div>
            <button
              onClick={handleCreateForm}
              className="px-8 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-bold shadow-lg hover:scale-105 hover:shadow-xl transition-all text-lg flex items-center gap-3"
            >
              <FaPlusCircle className="w-6 h-6" />
              Create Your First Form
            </button>
          </div>
        )}

        {forms.map((form) => (
          <div
            key={form._id}
            className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 flex items-center justify-between w-full border border-blue-100 hover:shadow-2xl transition-all hover:scale-[1.02]"
          >
            <div className="flex items-center gap-6">
              <div className="flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-100 via-purple-100 to-green-100 shadow-inner">
                <FaFileAlt className="w-8 h-8 text-blue-500" />
              </div>
              <div>
                <h3 className="text-2xl font-bold text-blue-700 mb-2">
                  {form.name}
                </h3>
                <p className="text-gray-500 text-lg mb-2">{form.description}</p>
                <div className="flex items-center gap-4 text-sm text-gray-400">
                  <span className="flex items-center gap-1">
                    <FaCheckCircle className="w-4 h-4" />
                    {form.type}
                  </span>
                  <span>
                    {form.fields.length} field
                    {form.fields.length !== 1 ? "s" : ""}
                  </span>
                </div>
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => handleEditForm(form)}
                className="px-6 py-3 rounded-xl bg-blue-100 text-blue-700 font-semibold shadow-lg hover:bg-blue-200 transition-all flex items-center gap-2"
                title="Edit"
              >
                <FaEdit className="w-4 h-4" />
                Edit
              </button>
              <button
                onClick={() => handleDeleteForm(form._id)}
                className="px-6 py-3 rounded-xl bg-red-100 text-red-700 font-semibold shadow-lg hover:bg-red-200 transition-all flex items-center gap-2"
                title="Delete"
              >
                <FaTrash className="w-4 h-4" />
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Forms;
