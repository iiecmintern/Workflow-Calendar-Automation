import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { FaClock } from "react-icons/fa";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?auto=format&fit=crop&w=1500&q=80";

const DAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

const defaultHour = {
  dayOfWeek: "Monday",
  startTime: "09:00",
  endTime: "17:00",
};

const AvailabilitySettings = () => {
  const { token } = useAuth();
  const [workingHours, setWorkingHours] = useState([]);
  const [timezone, setTimezone] = useState("UTC");
  const [bufferBefore, setBufferBefore] = useState(0);
  const [bufferAfter, setBufferAfter] = useState(0);
  const [holidays, setHolidays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  useEffect(() => {
    const fetchAvailability = async () => {
      setLoading(true);
      try {
        const res = await axios.get("/api/calendar/availability", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setWorkingHours(res.data.workingHours || []);
        setTimezone(res.data.timezone || "UTC");
        setBufferBefore(res.data.bufferBefore || 0);
        setBufferAfter(res.data.bufferAfter || 0);
        setHolidays(
          res.data.holidays ? res.data.holidays.map((d) => d.slice(0, 10)) : []
        );
      } catch (err) {
        setError("Failed to load availability settings");
      }
      setLoading(false);
    };
    if (token) fetchAvailability();
  }, [token]);

  const handleHourChange = (idx, field, value) => {
    setWorkingHours((prev) =>
      prev.map((slot, i) => (i === idx ? { ...slot, [field]: value } : slot))
    );
  };

  const addHour = () => setWorkingHours([...workingHours, { ...defaultHour }]);
  const removeHour = (idx) =>
    setWorkingHours(workingHours.filter((_, i) => i !== idx));

  const addHoliday = (date) => {
    if (!holidays.includes(date)) setHolidays([...holidays, date]);
  };
  const removeHoliday = (date) =>
    setHolidays(holidays.filter((d) => d !== date));

  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    setError("");
    setSuccess("");
    try {
      await axios.post(
        "/api/calendar/availability",
        { timezone, workingHours, bufferBefore, bufferAfter, holidays },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setSuccess("Availability settings saved!");
    } catch (err) {
      setError("Failed to save settings");
    }
    setSaving(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-0 px-0 relative overflow-hidden">
      <img
        src={BG_IMAGE}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-80 z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-purple-400/60 via-pink-300/40 to-blue-200/40 z-0" />
      <div
        className="flex flex-col items-center w-full z-10"
        style={{ minHeight: "100vh" }}
      >
        {/* Header Banner */}
        <div className="w-full max-w-5xl mx-auto rounded-3xl mt-8 mb-12 overflow-hidden shadow-2xl relative">
          <div className="bg-gradient-to-r from-purple-500 via-pink-400 to-blue-400 p-10 flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex items-center gap-4">
              <FaClock className="text-white text-5xl drop-shadow-lg" />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">
                  Availability Settings
                </h1>
                <p className="text-white/90 text-lg font-medium drop-shadow">
                  Set your working hours, buffer times, and holidays for smart
                  scheduling.
                </p>
              </div>
            </div>
          </div>
        </div>
        {/* Card Form */}
        <div className="max-w-2xl w-full mx-auto bg-white/90 backdrop-blur-lg rounded-2xl shadow-2xl p-10 border border-blue-100">
          {loading ? (
            <div className="text-center text-lg text-blue-700">Loading...</div>
          ) : (
            <form onSubmit={handleSave} className="space-y-8">
              <div>
                <label className="block font-semibold mb-1 text-blue-700 text-lg">
                  Timezone
                </label>
                <input
                  type="text"
                  className="border rounded px-3 py-2 w-full"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                />
              </div>
              <div>
                <label className="block font-semibold mb-1 text-blue-700 text-lg">
                  Working Hours
                </label>
                <div className="space-y-2">
                  {workingHours.map((slot, idx) => (
                    <div key={idx} className="flex gap-2 items-center">
                      <select
                        className="border rounded px-2 py-1"
                        value={slot.dayOfWeek}
                        onChange={(e) =>
                          handleHourChange(idx, "dayOfWeek", e.target.value)
                        }
                      >
                        {DAYS.map((d) => (
                          <option key={d} value={d}>
                            {d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        className="border rounded px-2 py-1"
                        value={slot.startTime}
                        onChange={(e) =>
                          handleHourChange(idx, "startTime", e.target.value)
                        }
                      />
                      <span>to</span>
                      <input
                        type="time"
                        className="border rounded px-2 py-1"
                        value={slot.endTime}
                        onChange={(e) =>
                          handleHourChange(idx, "endTime", e.target.value)
                        }
                      />
                      <button
                        type="button"
                        className="text-red-500 hover:underline ml-2"
                        onClick={() => removeHour(idx)}
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    className="mt-2 px-4 py-1 bg-blue-100 rounded hover:bg-blue-200 font-semibold text-blue-700"
                    onClick={addHour}
                  >
                    Add Working Hour
                  </button>
                </div>
              </div>
              <div className="flex gap-4">
                <div>
                  <label className="block font-semibold mb-1 text-blue-700 text-lg">
                    Buffer Before (min)
                  </label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20"
                    value={bufferBefore}
                    min={0}
                    onChange={(e) => setBufferBefore(Number(e.target.value))}
                  />
                </div>
                <div>
                  <label className="block font-semibold mb-1 text-blue-700 text-lg">
                    Buffer After (min)
                  </label>
                  <input
                    type="number"
                    className="border rounded px-2 py-1 w-20"
                    value={bufferAfter}
                    min={0}
                    onChange={(e) => setBufferAfter(Number(e.target.value))}
                  />
                </div>
              </div>
              <div>
                <label className="block font-semibold mb-1 text-blue-700 text-lg">
                  Holidays
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {holidays.map((date) => (
                    <span
                      key={date}
                      className="bg-red-100 text-red-700 px-3 py-1 rounded-full flex items-center gap-2"
                    >
                      {date}
                      <button
                        type="button"
                        className="ml-1 text-red-500 hover:underline"
                        onClick={() => removeHoliday(date)}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="date"
                  className="border rounded px-2 py-1"
                  onChange={(e) => addHoliday(e.target.value)}
                />
              </div>
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
                className="px-8 py-3 rounded bg-gradient-to-r from-blue-600 via-purple-500 to-pink-500 text-white font-bold shadow hover:from-blue-700 hover:to-pink-600 transition text-lg w-full"
                disabled={saving}
              >
                {saving ? "Saving..." : "Save Settings"}
              </button>
            </form>
          )}
        </div>
      </div>
      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

export default AvailabilitySettings;
