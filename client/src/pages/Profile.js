import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { useLocation } from "react-router-dom";
import {
  FaUserCircle,
  FaEnvelope,
  FaUserShield,
  FaCheck,
  FaClock,
  FaEdit,
  FaUpload,
  FaGlobe,
  FaBell,
  FaMoon,
  FaSun,
  FaGoogle,
  FaCalendarAlt,
  FaCog,
  FaUser,
  FaMicrosoft,
  FaCloud,
  FaPhone,
} from "react-icons/fa";

const HEADER_IMAGE =
  "https://images.unsplash.com/photo-1517292983755-87965000862f?auto=format&fit=crop&w=1200&q=80";

const Profile = () => {
  const { token } = useAuth();
  const location = useLocation();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editName, setEditName] = useState("");
  const [editAvatar, setEditAvatar] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef();
  const { user } = useAuth();
  const [googleConnected, setGoogleConnected] = useState(false);
  const [disconnecting, setDisconnecting] = useState(false);
  const [outlookConnected, setOutlookConnected] = useState(false);
  const [zohoConnected, setZohoConnected] = useState(false);
  const [disconnectingOutlook, setDisconnectingOutlook] = useState(false);
  const [disconnectingZoho, setDisconnectingZoho] = useState(false);
  const [success, setSuccess] = useState("");
  // Meeting preferences
  const [meetingPreferences, setMeetingPreferences] = useState({
    defaultMeetingType: "google-meet",
    customMeetingUrl: "",
    autoGenerateLinks: true,
    includePassword: true,
    defaultDuration: 30,
  });
  // Reminder preferences
  const [reminderPreferences, setReminderPreferences] = useState({
    email15min: true,
    email1hour: true,
    email1day: false,
    email1week: false,
    sms15min: false,
    sms1hour: false,
    whatsapp15min: false,
    whatsapp1hour: false,
    call15min: false,
    call1hour: false,
    enableSMS: false,
    enableWhatsApp: false,
    enableCall: false,
  });
  const [changeCurrentPassword, setChangeCurrentPassword] = useState("");
  const [changeNewPassword, setChangeNewPassword] = useState("");
  const [changeConfirmPassword, setChangeConfirmPassword] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await axios.get("/api/auth/me", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setProfile(res.data.user);
        setEditName(res.data.user.name);
        setAvatarPreview(res.data.user.avatar || null);
      } catch (err) {
        setError("Failed to load profile");
      } finally {
        setLoading(false);
      }
    };
    if (token) fetchProfile();
  }, [token]);

  useEffect(() => {
    const checkGoogleStatus = async () => {
      try {
        const res = await axios.get("/api/calendar/google/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setGoogleConnected(res.data.connected);
      } catch (err) {
        setGoogleConnected(false);
      }
    };
    if (token) checkGoogleStatus();
  }, [token]);

  // Check Outlook status
  useEffect(() => {
    const checkOutlookStatus = async () => {
      try {
        const res = await axios.get("/api/calendar/outlook/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setOutlookConnected(res.data.connected);
      } catch (err) {
        setOutlookConnected(false);
      }
    };
    if (token) checkOutlookStatus();
  }, [token]);
  // Check Zoho status
  useEffect(() => {
    const checkZohoStatus = async () => {
      try {
        const res = await axios.get("/api/calendar/zoho/status", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setZohoConnected(res.data.connected);
      } catch (err) {
        setZohoConnected(false);
      }
    };
    if (token) checkZohoStatus();
  }, [token]);

  // Fetch meeting preferences
  useEffect(() => {
    const fetchMeetingPreferences = async () => {
      try {
        const res = await axios.get("/api/users/meeting-preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setMeetingPreferences(res.data);
      } catch (err) {
        console.error("Error fetching meeting preferences:", err);
      }
    };
    if (token) fetchMeetingPreferences();
  }, [token]);

  // Fetch reminder preferences
  useEffect(() => {
    const fetchReminderPreferences = async () => {
      try {
        const res = await axios.get("/api/users/reminder-preferences", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setReminderPreferences(res.data);
      } catch (err) {
        console.error("Error fetching reminder preferences:", err);
      }
    };
    if (token) fetchReminderPreferences();
  }, [token]);

  // Parse URL parameters for OAuth callback messages
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const successParam = params.get("success");
    const errorParam = params.get("error");

    if (successParam) {
      setSuccess("Google Calendar connected successfully!");
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
    if (errorParam) {
      setError("Failed to connect Google Calendar. Please try again.");
      // Clear the URL parameters
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, [location]);

  const handleEdit = () => {
    setEditMode(true);
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setEditAvatar(file);
      const reader = new FileReader();
      reader.onload = (e) => setAvatarPreview(e.target.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const formData = new FormData();
      formData.append("name", editName);
      if (editAvatar) {
        formData.append("avatar", editAvatar);
      }

      const res = await axios.put("/api/auth/profile", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      setProfile(res.data.user);
      setEditMode(false);
      setSuccess("Profile updated successfully!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError("Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  const handleDisconnect = async () => {
    if (
      !window.confirm("Are you sure you want to disconnect Google Calendar?")
    ) {
      return;
    }
    setDisconnecting(true);
    try {
      await axios.post(
        "/api/calendar/google/disconnect",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setGoogleConnected(false);
      setSuccess("Google Calendar disconnected successfully!");
    } catch (err) {
      setError("Failed to disconnect Google Calendar");
    } finally {
      setDisconnecting(false);
    }
  };

  const handleConnectGoogle = async () => {
    try {
      const res = await axios.get("/api/calendar/google/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.authUrl;
    } catch (err) {
      setError("Failed to initiate Google Calendar connection");
    }
  };

  const handleConnectOutlook = async () => {
    try {
      const res = await axios.get("/api/calendar/outlook/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.authUrl;
    } catch (err) {
      setError("Failed to initiate Outlook Calendar connection");
    }
  };
  const handleDisconnectOutlook = async () => {
    if (
      !window.confirm("Are you sure you want to disconnect Outlook Calendar?")
    )
      return;
    setDisconnectingOutlook(true);
    try {
      await axios.post(
        "/api/calendar/outlook/disconnect",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setOutlookConnected(false);
      setSuccess("Outlook Calendar disconnected successfully!");
    } catch (err) {
      setError("Failed to disconnect Outlook Calendar");
    } finally {
      setDisconnectingOutlook(false);
    }
  };
  const handleConnectZoho = async () => {
    try {
      const res = await axios.get("/api/calendar/zoho/auth", {
        headers: { Authorization: `Bearer ${token}` },
      });
      window.location.href = res.data.authUrl;
    } catch (err) {
      setError("Failed to initiate Zoho Calendar connection");
    }
  };
  const handleDisconnectZoho = async () => {
    if (!window.confirm("Are you sure you want to disconnect Zoho Calendar?"))
      return;
    setDisconnectingZoho(true);
    try {
      await axios.post(
        "/api/calendar/zoho/disconnect",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setZohoConnected(false);
      setSuccess("Zoho Calendar disconnected successfully!");
    } catch (err) {
      setError("Failed to disconnect Zoho Calendar");
    } finally {
      setDisconnectingZoho(false);
    }
  };

  const handleMeetingPreferenceChange = (field, value) => {
    setMeetingPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveMeetingPreferences = async () => {
    try {
      await axios.put("/api/users/meeting-preferences", meetingPreferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Meeting preferences saved successfully!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError("Failed to save meeting preferences");
    }
  };

  const handleReminderPreferenceChange = (field, value) => {
    setReminderPreferences((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveReminderPreferences = async () => {
    try {
      await axios.put("/api/users/reminder-preferences", reminderPreferences, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setSuccess("Reminder preferences saved successfully!");
      setTimeout(() => setError(null), 3000);
    } catch (err) {
      setError("Failed to save reminder preferences");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-green-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-xl text-gray-600 font-medium">
            Loading your profile...
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
          alt="Profile Banner"
          className="absolute inset-0 w-full h-full object-cover object-center opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-br from-blue-600/60 via-purple-600/40 to-green-500/30" />
        <div className="relative z-10 text-center">
          <h1 className="text-4xl md:text-5xl font-extrabold text-white drop-shadow-lg tracking-tight">
            Your Profile
          </h1>
          <p className="mt-2 text-lg md:text-xl text-white/90 font-medium">
            Manage your account settings and preferences
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-6xl mx-auto px-6">
        {error && (
          <div className="mb-6 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg">
            {error}
          </div>
        )}
        {success && (
          <div className="mb-6 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded-lg">
            {success}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Profile Card */}
          <div className="lg:col-span-1">
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="text-center">
                <div className="relative inline-block mb-6">
                  <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-lg">
                    {avatarPreview ? (
                      <img
                        src={avatarPreview}
                        alt="Profile"
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <FaUserCircle className="w-full h-full text-gray-400" />
                    )}
                  </div>
                  {editMode && (
                    <button
                      onClick={() => fileInputRef.current.click()}
                      className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
                    >
                      <FaUpload className="w-4 h-4" />
                    </button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    onChange={handleAvatarChange}
                    className="hidden"
                  />
                </div>

                {editMode ? (
                  <form onSubmit={handleSave} className="space-y-4">
                    <input
                      type="text"
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-lg text-center font-semibold"
                      placeholder="Enter your name"
                    />
                    <div className="flex gap-3">
                      <button
                        type="submit"
                        disabled={saving}
                        className="flex-1 px-6 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-green-500 text-white font-semibold shadow-lg hover:scale-105 transition-all"
                      >
                        {saving ? "Saving..." : "Save"}
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditMode(false)}
                        className="px-6 py-3 rounded-xl bg-gray-200 text-gray-700 font-semibold shadow hover:bg-gray-300 transition-all"
                      >
                        Cancel
                      </button>
                    </div>
                  </form>
                ) : (
                  <div>
                    <h2 className="text-2xl font-bold text-blue-700 mb-2">
                      {profile?.name}
                    </h2>
                    <p className="text-gray-600 mb-4 flex items-center justify-center gap-2">
                      <FaEnvelope className="w-4 h-4" />
                      {profile?.email}
                    </p>
                    <button
                      onClick={handleEdit}
                      className="px-6 py-3 rounded-xl bg-blue-100 text-blue-700 font-semibold shadow-lg hover:bg-blue-200 transition-all flex items-center gap-2 mx-auto"
                    >
                      <FaEdit className="w-4 h-4" />
                      Edit Profile
                    </button>
                  </div>
                )}
              </div>

              {/* Status Tags */}
              <div className="mt-6 flex flex-wrap gap-2 justify-center">
                <span className="px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <FaUserShield className="w-3 h-3" />
                  User
                </span>
                <span className="px-3 py-1 bg-green-100 text-green-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <FaCheck className="w-3 h-3" />
                  Active
                </span>
                <span className="px-3 py-1 bg-purple-100 text-purple-700 rounded-full text-sm font-medium flex items-center gap-1">
                  <FaClock className="w-3 h-3" />
                  Last Active: {new Date().toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>

          {/* Settings Cards */}
          <div className="lg:col-span-2 space-y-6">
            {/* Google Calendar Integration */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  <FaGoogle className="w-6 h-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-700">
                    Google Calendar
                  </h3>
                  <p className="text-gray-600">
                    Connect your Google Calendar for seamless integration
                  </p>
                </div>
              </div>

              {googleConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-semibold">
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnect}
                    disabled={disconnecting}
                    className="px-6 py-3 rounded-xl bg-red-100 text-red-700 font-semibold shadow-lg hover:bg-red-200 transition-all"
                  >
                    {disconnecting ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectGoogle}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-600 to-purple-600 text-white font-semibold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <FaGoogle className="w-5 h-5" />
                  Connect Google Calendar
                </button>
              )}
            </div>
            {/* Outlook Calendar Integration */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-100 to-blue-300 flex items-center justify-center">
                  <FaMicrosoft className="w-6 h-6 text-blue-800" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-700">
                    Outlook Calendar
                  </h3>
                  <p className="text-gray-600">
                    Connect your Outlook Calendar for seamless integration
                  </p>
                </div>
              </div>
              {outlookConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-semibold">
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnectOutlook}
                    disabled={disconnectingOutlook}
                    className="px-6 py-3 rounded-xl bg-red-100 text-red-700 font-semibold shadow-lg hover:bg-red-200 transition-all"
                  >
                    {disconnectingOutlook ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectOutlook}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-blue-800 to-blue-400 text-white font-semibold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <FaMicrosoft className="w-5 h-5" />
                  Connect Outlook Calendar
                </button>
              )}
            </div>
            {/* Zoho Calendar Integration */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-yellow-100 to-orange-100 flex items-center justify-center">
                  <FaCloud className="w-6 h-6 text-yellow-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-700">
                    Zoho Calendar
                  </h3>
                  <p className="text-gray-600">
                    Connect your Zoho Calendar for seamless integration
                  </p>
                </div>
              </div>
              {zohoConnected ? (
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                    <span className="text-green-700 font-semibold">
                      Connected
                    </span>
                  </div>
                  <button
                    onClick={handleDisconnectZoho}
                    disabled={disconnectingZoho}
                    className="px-6 py-3 rounded-xl bg-red-100 text-red-700 font-semibold shadow-lg hover:bg-red-200 transition-all"
                  >
                    {disconnectingZoho ? "Disconnecting..." : "Disconnect"}
                  </button>
                </div>
              ) : (
                <button
                  onClick={handleConnectZoho}
                  className="w-full px-6 py-4 rounded-xl bg-gradient-to-r from-yellow-500 to-orange-400 text-white font-semibold shadow-lg hover:scale-105 transition-all flex items-center justify-center gap-3"
                >
                  <FaCloud className="w-5 h-5" />
                  Connect Zoho Calendar
                </button>
              )}
            </div>

            {/* Meeting Preferences */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-green-100 to-emerald-100 flex items-center justify-center">
                  <FaCalendarAlt className="w-6 h-6 text-green-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-700">
                    Meeting Preferences
                  </h3>
                  <p className="text-gray-600">
                    Configure your default meeting settings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Meeting Type
                  </label>
                  <select
                    value={meetingPreferences.defaultMeetingType}
                    onChange={(e) =>
                      handleMeetingPreferenceChange(
                        "defaultMeetingType",
                        e.target.value
                      )
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  >
                    <option value="google-meet">Google Meet</option>
                    <option value="zoom">Zoom</option>
                    <option value="teams">Microsoft Teams</option>
                    <option value="custom">Custom URL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    Default Duration (minutes)
                  </label>
                  <input
                    type="number"
                    value={meetingPreferences.defaultDuration}
                    onChange={(e) =>
                      handleMeetingPreferenceChange(
                        "defaultDuration",
                        parseInt(e.target.value)
                      )
                    }
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    min="15"
                    max="480"
                    step="15"
                  />
                </div>

                {meetingPreferences.defaultMeetingType === "custom" && (
                  <div className="md:col-span-2">
                    <label className="block text-sm font-semibold text-gray-700 mb-2">
                      Custom Meeting URL
                    </label>
                    <input
                      type="url"
                      value={meetingPreferences.customMeetingUrl}
                      onChange={(e) =>
                        handleMeetingPreferenceChange(
                          "customMeetingUrl",
                          e.target.value
                        )
                      }
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-4 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                      placeholder="https://your-custom-meeting-url.com"
                    />
                  </div>
                )}

                <div className="md:col-span-2 flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={meetingPreferences.autoGenerateLinks}
                      onChange={(e) =>
                        handleMeetingPreferenceChange(
                          "autoGenerateLinks",
                          e.target.checked
                        )
                      }
                      className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Auto-generate meeting links
                    </span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={meetingPreferences.includePassword}
                      onChange={(e) =>
                        handleMeetingPreferenceChange(
                          "includePassword",
                          e.target.checked
                        )
                      }
                      className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                    />
                    <span className="text-sm font-semibold text-gray-700">
                      Include meeting passwords
                    </span>
                  </label>
                </div>
              </div>

              <button
                onClick={saveMeetingPreferences}
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
              >
                Save Meeting Preferences
              </button>
            </div>

            {/* Reminder Preferences */}
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                  <FaBell className="w-6 h-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-blue-700">
                    Reminder Preferences
                  </h3>
                  <p className="text-gray-600">
                    Configure automated reminders for your meetings
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="font-semibold text-gray-700 mb-3">
                    Email Reminders
                  </h4>
                  <div className="space-y-3">
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.email15min}
                        onChange={(e) =>
                          handleReminderPreferenceChange(
                            "email15min",
                            e.target.checked
                          )
                        }
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        15 minutes before
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.email1hour}
                        onChange={(e) =>
                          handleReminderPreferenceChange(
                            "email1hour",
                            e.target.checked
                          )
                        }
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        1 hour before
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.email1day}
                        onChange={(e) =>
                          handleReminderPreferenceChange(
                            "email1day",
                            e.target.checked
                          )
                        }
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        1 day before
                      </span>
                    </label>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.email1week}
                        onChange={(e) =>
                          handleReminderPreferenceChange(
                            "email1week",
                            e.target.checked
                          )
                        }
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        1 week before
                      </span>
                    </label>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-gray-700">
                      SMS Reminders
                    </h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.enableSMS}
                        onChange={(e) =>
                          handleReminderPreferenceChange(
                            "enableSMS",
                            e.target.checked
                          )
                        }
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Enable SMS</span>
                    </label>
                  </div>
                  {reminderPreferences.enableSMS && (
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reminderPreferences.sms15min}
                          onChange={(e) =>
                            handleReminderPreferenceChange(
                              "sms15min",
                              e.target.checked
                            )
                          }
                          className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          15 minutes before
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reminderPreferences.sms1hour}
                          onChange={(e) =>
                            handleReminderPreferenceChange(
                              "sms1hour",
                              e.target.checked
                            )
                          }
                          className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          1 hour before
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3 mt-6">
                    <h4 className="font-semibold text-gray-700">
                      WhatsApp Reminders
                    </h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.enableWhatsApp}
                        onChange={(e) =>
                          handleReminderPreferenceChange(
                            "enableWhatsApp",
                            e.target.checked
                          )
                        }
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">
                        Enable WhatsApp
                      </span>
                    </label>
                  </div>
                  {reminderPreferences.enableWhatsApp && (
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reminderPreferences.whatsapp15min}
                          onChange={(e) =>
                            handleReminderPreferenceChange(
                              "whatsapp15min",
                              e.target.checked
                            )
                          }
                          className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          15 minutes before
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reminderPreferences.whatsapp1hour}
                          onChange={(e) =>
                            handleReminderPreferenceChange(
                              "whatsapp1hour",
                              e.target.checked
                            )
                          }
                          className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          1 hour before
                        </span>
                      </label>
                    </div>
                  )}

                  <div className="flex items-center justify-between mb-3 mt-6">
                    <h4 className="font-semibold text-gray-700 flex items-center gap-2">
                      <FaPhone className="w-4 h-4 text-green-600" />
                      Call Reminders
                    </h4>
                    <label className="flex items-center">
                      <input
                        type="checkbox"
                        checked={reminderPreferences.enableCall}
                        onChange={(e) =>
                          handleReminderPreferenceChange(
                            "enableCall",
                            e.target.checked
                          )
                        }
                        className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700">Enable Call</span>
                    </label>
                  </div>
                  {reminderPreferences.enableCall && (
                    <div className="space-y-3">
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reminderPreferences.call15min}
                          onChange={(e) =>
                            handleReminderPreferenceChange(
                              "call15min",
                              e.target.checked
                            )
                          }
                          className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          15 minutes before
                        </span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="checkbox"
                          checked={reminderPreferences.call1hour}
                          onChange={(e) =>
                            handleReminderPreferenceChange(
                              "call1hour",
                              e.target.checked
                            )
                          }
                          className="mr-2 w-4 h-4 text-blue-600 focus:ring-blue-500"
                        />
                        <span className="text-sm text-gray-700">
                          1 hour before
                        </span>
                      </label>
                    </div>
                  )}
                </div>
              </div>

              <button
                onClick={saveReminderPreferences}
                className="mt-6 px-6 py-3 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white font-semibold shadow-lg hover:scale-105 transition-all"
              >
                Save Reminder Preferences
              </button>
            </div>
            {/* Change/Set Password Card */}
            {profile && (
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl p-8 border border-blue-100">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-pink-100 to-red-100 flex items-center justify-center">
                    <FaUser className="w-6 h-6 text-pink-600" />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-blue-700">
                      {profile.provider === "google"
                        ? "Set Password"
                        : "Change Password"}
                    </h3>
                    <p className="text-gray-600">
                      {profile.provider === "google"
                        ? "Set a password to enable email login in addition to Google login."
                        : "Update your account password for better security"}
                    </p>
                  </div>
                </div>
                <form
                  onSubmit={async (e) => {
                    e.preventDefault();
                    setError("");
                    setSuccess("");
                    if (
                      (!changeCurrentPassword &&
                        profile.provider !== "google") ||
                      !changeNewPassword ||
                      !changeConfirmPassword
                    ) {
                      setError("Please fill in all fields.");
                      return;
                    }
                    if (changeNewPassword !== changeConfirmPassword) {
                      setError("New passwords do not match.");
                      return;
                    }
                    try {
                      await axios.put(
                        "/api/auth/change-password",
                        {
                          currentPassword:
                            profile.provider === "google"
                              ? undefined
                              : changeCurrentPassword,
                          newPassword: changeNewPassword,
                        },
                        {
                          headers: { Authorization: `Bearer ${token}` },
                        }
                      );
                      setSuccess(
                        profile.provider === "google"
                          ? "Password set successfully! You can now log in with email and password."
                          : "Password changed successfully!"
                      );
                      setChangeCurrentPassword("");
                      setChangeNewPassword("");
                      setChangeConfirmPassword("");
                    } catch (err) {
                      setError(
                        err.response?.data?.message ||
                          err.message ||
                          "Failed to change password."
                      );
                    }
                  }}
                  className="space-y-4"
                >
                  {profile.provider !== "google" && (
                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Current Password
                      </label>
                      <input
                        type="password"
                        className="w-full border rounded px-3 py-2"
                        value={changeCurrentPassword || ""}
                        onChange={(e) =>
                          setChangeCurrentPassword(e.target.value)
                        }
                        required={profile.provider !== "google"}
                      />
                    </div>
                  )}
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      className="w-full border rounded px-3 py-2"
                      value={changeNewPassword || ""}
                      onChange={(e) => setChangeNewPassword(e.target.value)}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      className="w-full border rounded px-3 py-2"
                      value={changeConfirmPassword || ""}
                      onChange={(e) => setChangeConfirmPassword(e.target.value)}
                      required
                    />
                  </div>
                  <button
                    type="submit"
                    className="px-6 py-3 rounded-xl bg-gradient-to-r from-pink-500 to-red-500 text-white font-semibold shadow-lg hover:scale-105 transition-all w-full"
                  >
                    {profile.provider === "google"
                      ? "Set Password"
                      : "Change Password"}
                  </button>
                </form>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
