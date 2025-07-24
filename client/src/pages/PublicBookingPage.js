import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import { FaCalendarAlt, FaClock, FaCheck } from "react-icons/fa";
import { useAuth } from "../contexts/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const PublicBookingPage = () => {
  const { slug } = useParams();
  const { token } = useAuth();
  const [page, setPage] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    date: "",
  });
  const [customFormResponses, setCustomFormResponses] = useState({});
  const [selectedSlot, setSelectedSlot] = useState(null);
  const [availableSlots, setAvailableSlots] = useState([]);
  const [aiSuggestions, setAiSuggestions] = useState([]);
  const [slotsLoading, setSlotsLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState("");

  // For owner creation
  const [ownerPage, setOwnerPage] = useState(null);
  const [ownerForm, setOwnerForm] = useState({
    slug: "",
    title: "",
    description: "",
    color: "#2563eb",
    meetingTypes: [
      {
        type: "1-on-1",
        label: "1-on-1 Meeting",
        duration: 30,
        maxParticipants: 1,
        roundRobin: false,
      },
      {
        type: "group",
        label: "Group Meeting",
        duration: 60,
        maxParticipants: 10,
        roundRobin: false,
      },
    ],
  });
  const [ownerError, setOwnerError] = useState("");
  const [ownerSuccess, setOwnerSuccess] = useState("");
  const [ownerLoading, setOwnerLoading] = useState(false);
  const [selectedTypeIdx, setSelectedTypeIdx] = useState(0);

  // Fetch public page info
  useEffect(() => {
    const fetchPage = async () => {
      setLoading(true);
      setError("");
      try {
        const res = await axios.get(`/api/booking-pages/${slug}`);
        console.log("Fetched booking page data:", res.data);
        console.log("Meeting types:", res.data.meetingTypes);

        // Debug: Check if meeting types are duplicated
        if (res.data.meetingTypes && res.data.meetingTypes.length > 0) {
          const types = res.data.meetingTypes.map((mt) => mt.type);
          const labels = res.data.meetingTypes.map((mt) => mt.label);
          console.log("Meeting type types:", types);
          console.log("Meeting type labels:", labels);

          // Check for duplicates
          const uniqueTypes = [...new Set(types)];
          const uniqueLabels = [...new Set(labels)];
          console.log("Unique types:", uniqueTypes);
          console.log("Unique labels:", uniqueLabels);

          if (uniqueTypes.length !== types.length) {
            console.warn("Duplicate meeting types detected!");

            // Deduplicate meeting types
            const seen = new Set();
            const deduplicatedMeetingTypes = res.data.meetingTypes.filter(
              (mt) => {
                const key = `${mt.type}-${mt.label}`;
                if (seen.has(key)) {
                  return false;
                }
                seen.add(key);
                return true;
              }
            );

            console.log(
              "Deduplicated meeting types:",
              deduplicatedMeetingTypes
            );
            res.data.meetingTypes = deduplicatedMeetingTypes;
          }
        }

        setPage(res.data);
      } catch (err) {
        console.error(
          "Frontend error fetching booking page:",
          err.response?.data || err.message
        );
        setError(
          err.response?.data?.message || "Booking page not found or inactive."
        );
      }
      setLoading(false);
    };
    if (slug !== "me") fetchPage();
  }, [slug]);

  // Fetch available slots when date changes
  useEffect(() => {
    const fetchAvailableSlots = async () => {
      if (!form.date || slug === "me") return;

      setSlotsLoading(true);
      setSelectedSlot(null);
      try {
        const res = await axios.get(
          `/api/booking-pages/${slug}/availability?date=${form.date}`
        );
        setAvailableSlots(res.data.availableSlots || []);
        setAiSuggestions(res.data.aiSuggestions || []);
      } catch (err) {
        console.error("Error fetching available slots:", err);
        setAvailableSlots([]);
        setAiSuggestions([]);
      }
      setSlotsLoading(false);
    };

    fetchAvailableSlots();
  }, [form.date, slug]);

  // Fetch or create owner page if /book/me and logged in
  useEffect(() => {
    const fetchOwnerPage = async () => {
      setOwnerLoading(true);
      setOwnerError("");
      try {
        const res = await axios.get("/api/booking-pages/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOwnerPage(res.data);
      } catch (err) {
        setOwnerPage(null);
      }
      setOwnerLoading(false);
    };
    if (token && slug === "me") fetchOwnerPage();
  }, [token, slug]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedSlot) {
      setError("Please select a time slot");
      return;
    }

    setSubmitting(true);
    setError("");
    setSuccess("");
    try {
      const bookingData = {
        name: form.name,
        email: form.email,
        phone: form.phone,
        start: selectedSlot.start,
        end: selectedSlot.end,
      };

      const bookingResponse = await axios.post(
        `/api/booking-pages/${slug}/book`,
        bookingData
      );

      // Submit custom form responses if any
      if (page?.forms && page.forms.length > 0) {
        for (const form of page.forms) {
          if (form.type === "pre-booking" && customFormResponses[form._id]) {
            try {
              await axios.post(`/api/forms/${form._id}/submit`, {
                bookingId: bookingResponse.data._id,
                responses: customFormResponses[form._id],
              });
            } catch (formError) {
              console.error("Error submitting form response:", formError);
            }
          }
        }
      }

      setSuccess("Booking successful! Check your email for confirmation.");
      setForm({ name: "", email: "", phone: "", date: "" });
      setCustomFormResponses({});
      setSelectedSlot(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to create booking. Please try another slot."
      );
    }
    setSubmitting(false);
  };

  // Owner booking page creation
  const handleOwnerFormChange = (e) => {
    setOwnerForm({ ...ownerForm, [e.target.name]: e.target.value });
  };

  // Meeting type editing for owner
  const handleMeetingTypeChange = (idx, field, value) => {
    setOwnerForm((prev) => ({
      ...prev,
      meetingTypes: prev.meetingTypes.map((mt, i) =>
        i === idx ? { ...mt, [field]: value } : mt
      ),
    }));
  };

  const addMeetingType = () => {
    setOwnerForm((prev) => {
      // Get existing types to avoid duplicates
      const existingTypes = prev.meetingTypes.map((mt) => mt.type);

      // Find next available type
      const availableTypes = ["1-on-1", "group", "panel", "round-robin"];
      const nextType =
        availableTypes.find((type) => !existingTypes.includes(type)) ||
        "1-on-1";

      return {
        ...prev,
        meetingTypes: [
          ...prev.meetingTypes,
          {
            type: nextType,
            label: `${
              nextType.charAt(0).toUpperCase() + nextType.slice(1)
            } Meeting`,
            duration: 30,
            maxParticipants: nextType === "1-on-1" ? 1 : 5,
            roundRobin: nextType === "round-robin",
          },
        ],
      };
    });
  };

  const removeMeetingType = (idx) => {
    setOwnerForm((prev) => ({
      ...prev,
      meetingTypes: prev.meetingTypes.filter((_, i) => i !== idx),
    }));
  };

  const handleOwnerFormSubmit = async (e) => {
    e.preventDefault();
    setOwnerError("");
    setOwnerSuccess("");
    try {
      console.log(
        "Submitting owner form with meeting types:",
        ownerForm.meetingTypes
      );
      const res = await axios.post("/api/booking-pages", ownerForm, {
        headers: { Authorization: `Bearer ${token}` },
      });
      console.log("Response from booking page creation:", res.data);
      setOwnerPage(res.data);
      setOwnerSuccess("Booking page created!");
    } catch (err) {
      console.error(
        "Frontend error creating booking page:",
        err.response?.data || err.message
      );
      setOwnerError(
        err?.response?.data?.message || "Failed to create booking page."
      );
    }
  };

  // If /book/me and logged in, show owner create/view page
  if (slug === "me" && token) {
    return (
      <div className="min-h-screen w-full flex flex-col items-center justify-center py-0 px-0 relative overflow-hidden">
        <img
          src={BG_IMAGE}
          alt="Background"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80 z-0"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-purple-100/20 to-pink-100/20 z-0" />
        <div
          className="flex flex-col items-center w-full z-10"
          style={{ minHeight: "100vh" }}
        >
          <div className="w-full max-w-2xl mx-auto rounded-3xl mt-10 mb-10 overflow-hidden shadow-2xl relative">
            <div
              className="bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 p-10 flex flex-col items-center gap-6"
              style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
            >
              <FaCalendarAlt className="text-white text-5xl drop-shadow-lg" />
              <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2 text-center">
                Your Booking Page
              </h1>
              <p className="text-white/90 text-lg font-medium drop-shadow text-center">
                Create and share your public booking page link.
              </p>
            </div>
            <div className="bg-white/90 backdrop-blur-lg rounded-b-3xl shadow-2xl p-10 border-t-0 border border-blue-100 flex flex-col gap-6">
              {ownerLoading ? (
                <div className="text-center text-lg text-blue-700">
                  Loading...
                </div>
              ) : ownerPage ? (
                <div className="flex flex-col gap-4 items-center">
                  <div className="text-xl font-bold text-blue-700">
                    {ownerPage.title}
                  </div>
                  <div className="text-gray-700">{ownerPage.description}</div>
                  <div className="text-gray-600">
                    Public Link:{" "}
                    <a
                      href={`/book/${ownerPage.slug}`}
                      className="text-blue-600 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      /book/{ownerPage.slug}
                    </a>
                  </div>
                  <div className="text-sm text-gray-400">
                    (Share this link with anyone to let them book with you)
                  </div>
                  <button
                    type="button"
                    onClick={async () => {
                      try {
                        const res = await axios.post(
                          "/api/booking-pages/fix-labels",
                          {},
                          {
                            headers: { Authorization: `Bearer ${token}` },
                          }
                        );
                        alert(res.data.message);
                        window.location.reload();
                      } catch (err) {
                        alert("Failed to fix meeting type labels");
                      }
                    }}
                    className="mt-4 px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 font-semibold"
                  >
                    Fix Meeting Type Labels
                  </button>
                </div>
              ) : (
                <form onSubmit={handleOwnerFormSubmit} className="space-y-6">
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-blue-700">
                      Page Slug (URL):
                    </label>
                    <input
                      type="text"
                      name="slug"
                      className="border rounded px-3 py-2 w-full"
                      placeholder="e.g. aman"
                      value={ownerForm.slug}
                      onChange={handleOwnerFormChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-blue-700">
                      Title:
                    </label>
                    <input
                      type="text"
                      name="title"
                      className="border rounded px-3 py-2 w-full"
                      placeholder="e.g. Book with Aman"
                      value={ownerForm.title}
                      onChange={handleOwnerFormChange}
                      required
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-blue-700">
                      Description:
                    </label>
                    <textarea
                      name="description"
                      className="border rounded px-3 py-2 w-full"
                      placeholder="Describe your booking page..."
                      value={ownerForm.description}
                      onChange={handleOwnerFormChange}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-blue-700">
                      Brand Color:
                    </label>
                    <input
                      type="color"
                      name="color"
                      className="w-16 h-10 border rounded"
                      value={ownerForm.color}
                      onChange={handleOwnerFormChange}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <label className="font-semibold text-blue-700">
                      Meeting Types:
                    </label>
                    {ownerForm.meetingTypes.map((mt, idx) => (
                      <div
                        key={idx}
                        className="flex flex-col md:flex-row gap-2 items-center border rounded p-2 mb-2 bg-blue-50/50"
                      >
                        <select
                          className="border rounded px-2 py-1"
                          value={mt.type}
                          onChange={(e) =>
                            handleMeetingTypeChange(idx, "type", e.target.value)
                          }
                        >
                          <option value="1-on-1">1-on-1</option>
                          <option value="group">Group</option>
                          <option value="panel">Panel</option>
                          <option value="round-robin">Round Robin</option>
                        </select>
                        <input
                          type="text"
                          className="border rounded px-2 py-1"
                          value={mt.label}
                          onChange={(e) =>
                            handleMeetingTypeChange(
                              idx,
                              "label",
                              e.target.value
                            )
                          }
                          placeholder="Label"
                        />
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          value={mt.duration}
                          min={5}
                          onChange={(e) =>
                            handleMeetingTypeChange(
                              idx,
                              "duration",
                              Number(e.target.value)
                            )
                          }
                          placeholder="Duration (min)"
                        />
                        <input
                          type="number"
                          className="border rounded px-2 py-1 w-20"
                          value={mt.maxParticipants}
                          min={1}
                          onChange={(e) =>
                            handleMeetingTypeChange(
                              idx,
                              "maxParticipants",
                              Number(e.target.value)
                            )
                          }
                          placeholder="Max"
                        />
                        <label className="flex items-center gap-1 text-xs">
                          <input
                            type="checkbox"
                            checked={mt.roundRobin}
                            onChange={(e) =>
                              handleMeetingTypeChange(
                                idx,
                                "roundRobin",
                                e.target.checked
                              )
                            }
                          />
                          Round Robin
                        </label>
                        <button
                          type="button"
                          className="text-red-500 hover:underline ml-2"
                          onClick={() => removeMeetingType(idx)}
                        >
                          Remove
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      className="mt-2 px-4 py-1 bg-blue-100 rounded hover:bg-blue-200 font-semibold text-blue-700"
                      onClick={addMeetingType}
                    >
                      Add Meeting Type
                    </button>
                  </div>
                  {ownerError && (
                    <div className="text-red-600 text-center font-semibold">
                      {ownerError}
                    </div>
                  )}
                  {ownerSuccess && (
                    <div className="text-green-600 text-center font-semibold">
                      {ownerSuccess}
                    </div>
                  )}
                  <button
                    type="submit"
                    className="px-8 py-3 rounded bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white font-bold shadow hover:from-blue-700 hover:to-pink-600 transition text-lg w-full"
                  >
                    Create Booking Page
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>
        <style>{`
          body { background: none !important; }
        `}</style>
      </div>
    );
  }

  // Helper to format slot times if missing
  function formatSlotTimes(slot) {
    if (slot.startTime && slot.endTime) return slot;
    const start = new Date(slot.start);
    const end = new Date(slot.end);
    return {
      ...slot,
      startTime: start.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
      endTime: end.toLocaleTimeString([], {
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      }),
    };
  }

  // Always format AI suggestions before rendering
  const formattedAiSuggestions = aiSuggestions.map(formatSlotTimes);

  // Public booking page (not /book/me or not logged in)
  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-0 px-0 relative overflow-hidden">
      <img
        src={BG_IMAGE}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-80 z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-purple-100/20 to-pink-100/20 z-0" />
      <div
        className="flex flex-col items-center w-full z-10"
        style={{ minHeight: "100vh" }}
      >
        <div className="w-full max-w-2xl mx-auto rounded-3xl mt-10 mb-10 overflow-hidden shadow-2xl relative">
          <div
            className="bg-gradient-to-r from-blue-500 via-purple-400 to-pink-400 p-10 flex flex-col items-center gap-6"
            style={{ borderTopLeftRadius: 32, borderTopRightRadius: 32 }}
          >
            {page && page.logo ? (
              <img
                src={page.logo}
                alt="Logo"
                className="w-20 h-20 rounded-full shadow-lg border-4 border-white bg-white object-contain"
              />
            ) : (
              <FaCalendarAlt className="text-white text-5xl drop-shadow-lg" />
            )}
            <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2 text-center">
              {page ? page.title : "Booking Page"}
            </h1>
            <p className="text-white/90 text-lg font-medium drop-shadow text-center">
              {page ? page.description : "Book a meeting with us!"}
            </p>
          </div>
          <div className="bg-white/90 backdrop-blur-lg rounded-b-3xl shadow-2xl p-10 border-t-0 border border-blue-100 flex flex-col gap-6">
            {loading ? (
              <div className="text-center text-lg text-blue-700">
                Loading...
              </div>
            ) : error ? (
              <div className="text-center text-red-600 font-semibold">
                {error}
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-6">
                {page && page.meetingTypes && page.meetingTypes.length > 0 && (
                  <div className="flex flex-col gap-2 mb-2">
                    <label className="font-semibold text-blue-700">
                      Select Meeting Type:
                    </label>
                    <select
                      className="border rounded px-2 py-1"
                      value={selectedTypeIdx}
                      onChange={(e) =>
                        setSelectedTypeIdx(Number(e.target.value))
                      }
                    >
                      {page.meetingTypes.map((mt, idx) => {
                        const displayLabel =
                          mt.label || mt.type || `Meeting Type ${idx + 1}`;
                        return (
                          <option key={idx} value={idx}>
                            {displayLabel}
                          </option>
                        );
                      })}
                    </select>
                  </div>
                )}
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="text"
                    name="name"
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Your Name"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                  <input
                    type="email"
                    name="email"
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Your Email"
                    value={form.email}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="flex flex-col md:flex-row gap-4">
                  <input
                    type="tel"
                    name="phone"
                    className="border rounded px-3 py-2 w-full"
                    placeholder="Your Phone Number (optional)"
                    value={form.phone}
                    onChange={handleChange}
                  />
                </div>

                {/* Custom Forms */}
                {page?.forms && page.forms.length > 0 && (
                  <div className="space-y-4">
                    {page.forms
                      .filter((form) => form.type === "pre-booking")
                      .map((form) => (
                        <div
                          key={form._id}
                          className="border border-gray-200 rounded-lg p-4 bg-gray-50"
                        >
                          <h3 className="font-semibold text-blue-700 mb-3">
                            {form.name}
                          </h3>
                          {form.description && (
                            <p className="text-gray-600 text-sm mb-4">
                              {form.description}
                            </p>
                          )}
                          <div className="space-y-3">
                            {form.fields.map((field, fieldIndex) => (
                              <div key={fieldIndex}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                  {field.label}
                                  {field.required && (
                                    <span className="text-red-500">*</span>
                                  )}
                                </label>
                                {field.type === "text" && (
                                  <input
                                    type="text"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                                {field.type === "email" && (
                                  <input
                                    type="email"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                                {field.type === "phone" && (
                                  <input
                                    type="tel"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                                {field.type === "textarea" && (
                                  <textarea
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    rows="3"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                                {field.type === "select" && (
                                  <select
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  >
                                    <option value="">Select an option</option>
                                    {field.options.map(
                                      (option, optionIndex) => (
                                        <option
                                          key={optionIndex}
                                          value={option.value}
                                        >
                                          {option.label}
                                        </option>
                                      )
                                    )}
                                  </select>
                                )}
                                {field.type === "checkbox" && (
                                  <div className="flex items-center">
                                    <input
                                      type="checkbox"
                                      className="mr-2"
                                      onChange={(e) => {
                                        const newResponses = {
                                          ...customFormResponses,
                                        };
                                        if (!newResponses[form._id])
                                          newResponses[form._id] = [];
                                        newResponses[form._id][fieldIndex] = {
                                          fieldId: field._id,
                                          value: e.target.checked,
                                        };
                                        setCustomFormResponses(newResponses);
                                      }}
                                    />
                                    <span className="text-sm text-gray-700">
                                      {field.label}
                                    </span>
                                  </div>
                                )}
                                {field.type === "radio" && (
                                  <div className="space-y-2">
                                    {field.options.map(
                                      (option, optionIndex) => (
                                        <div
                                          key={optionIndex}
                                          className="flex items-center"
                                        >
                                          <input
                                            type="radio"
                                            name={`field-${field._id}`}
                                            value={option.value}
                                            className="mr-2"
                                            onChange={(e) => {
                                              const newResponses = {
                                                ...customFormResponses,
                                              };
                                              if (!newResponses[form._id])
                                                newResponses[form._id] = [];
                                              newResponses[form._id][
                                                fieldIndex
                                              ] = {
                                                fieldId: field._id,
                                                value: e.target.value,
                                              };
                                              setCustomFormResponses(
                                                newResponses
                                              );
                                            }}
                                          />
                                          <span className="text-sm text-gray-700">
                                            {option.label}
                                          </span>
                                        </div>
                                      )
                                    )}
                                  </div>
                                )}
                                {field.type === "file" && (
                                  <input
                                    type="file"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.files[0],
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                                {field.type === "date" && (
                                  <input
                                    type="date"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                                {field.type === "time" && (
                                  <input
                                    type="time"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                                {field.type === "number" && (
                                  <input
                                    type="number"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                    placeholder={field.placeholder}
                                    required={field.required}
                                    onChange={(e) => {
                                      const newResponses = {
                                        ...customFormResponses,
                                      };
                                      if (!newResponses[form._id])
                                        newResponses[form._id] = [];
                                      newResponses[form._id][fieldIndex] = {
                                        fieldId: field._id,
                                        value: e.target.value,
                                      };
                                      setCustomFormResponses(newResponses);
                                    }}
                                  />
                                )}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                  </div>
                )}
                <div className="flex flex-col gap-4">
                  <label className="font-semibold text-blue-700 flex items-center gap-2">
                    <FaCalendarAlt /> Select Date:
                  </label>
                  <input
                    type="date"
                    name="date"
                    className="border rounded px-3 py-2 w-full"
                    value={form.date}
                    onChange={handleChange}
                    min={new Date().toISOString().split("T")[0]}
                    required
                  />
                </div>

                {form.date && (
                  <div className="flex flex-col gap-4">
                    <label className="font-semibold text-blue-700 flex items-center gap-2">
                      <FaClock /> Select Time Slot:
                    </label>
                    {slotsLoading ? (
                      <div className="text-center text-gray-600 py-4">
                        Loading available slots...
                      </div>
                    ) : availableSlots.length === 0 ? (
                      <div className="text-center text-gray-600 py-4">
                        No available slots for this date. Please try another
                        date.
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2 max-h-60 overflow-y-auto">
                        {/* Show AI suggestions first, then the rest */}
                        {formattedAiSuggestions.length > 0 && (
                          <>
                            {formattedAiSuggestions.map((slot, idx) => (
                              <button
                                key={"ai-" + idx}
                                type="button"
                                onClick={() => setSelectedSlot(slot)}
                                className={`relative pt-6 p-3 border-2 rounded-lg text-sm font-medium transition-colors flex flex-col items-center ${
                                  selectedSlot?.start === slot.start
                                    ? "bg-blue-600 text-white border-blue-600"
                                    : idx === 0
                                    ? "bg-yellow-50 border-yellow-400 text-yellow-900 shadow-lg"
                                    : "bg-white text-gray-700 border-blue-300 hover:bg-blue-50 hover:border-blue-400"
                                }`}
                              >
                                <span
                                  className={`mb-1 text-xs font-bold px-2 py-0.5 rounded ${
                                    idx === 0
                                      ? "bg-yellow-400 text-yellow-900"
                                      : "bg-blue-100 text-blue-700"
                                  }`}
                                  style={{
                                    position: "absolute",
                                    top: 6,
                                    left: "50%",
                                    transform: "translateX(-50%)",
                                  }}
                                >
                                  Recommended by AI{idx === 0 ? " (Best)" : ""}
                                </span>
                                <div className="flex items-center justify-center gap-1 mt-3">
                                  {selectedSlot?.start === slot.start && (
                                    <FaCheck className="text-xs" />
                                  )}
                                  {slot.startTime}
                                </div>
                                <div className="text-xs opacity-75">
                                  {slot.endTime}
                                </div>
                              </button>
                            ))}
                          </>
                        )}
                        {/* Show the rest of the slots that are not in AI suggestions */}
                        {availableSlots
                          .filter(
                            (slot) =>
                              !aiSuggestions.some(
                                (ai) =>
                                  ai.start === slot.start && ai.end === slot.end
                              )
                          )
                          .map((slot, idx) => (
                            <button
                              key={"slot-" + idx}
                              type="button"
                              onClick={() => setSelectedSlot(slot)}
                              className={`p-3 border rounded-lg text-sm font-medium transition-colors ${
                                selectedSlot?.start === slot.start
                                  ? "bg-blue-600 text-white border-blue-600"
                                  : "bg-white text-gray-700 border-gray-300 hover:bg-blue-50 hover:border-blue-300"
                              }`}
                            >
                              <div className="flex items-center justify-center gap-1">
                                {selectedSlot?.start === slot.start && (
                                  <FaCheck className="text-xs" />
                                )}
                                {slot.startTime}
                              </div>
                              <div className="text-xs opacity-75">
                                {slot.endTime}
                              </div>
                            </button>
                          ))}
                      </div>
                    )}
                  </div>
                )}

                {error && (
                  <div className="text-red-600 text-center font-semibold">
                    {error}
                  </div>
                )}
                {success && (
                  <div className="text-green-600 text-center font-semibold">
                    {success}
                  </div>
                )}
                <button
                  type="submit"
                  className="px-8 py-3 rounded bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white font-bold shadow hover:from-blue-700 hover:to-pink-600 transition text-lg w-full disabled:opacity-50 disabled:cursor-not-allowed"
                  disabled={submitting || !selectedSlot}
                >
                  {submitting ? "Booking..." : "Book Now"}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

export default PublicBookingPage;
