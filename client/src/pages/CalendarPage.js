import React, { useState, useEffect } from "react";
import Calendar from "react-calendar";
import "react-calendar/dist/Calendar.css";
import {
  FaCalendarAlt,
  FaEdit,
  FaTrash,
  FaGoogle,
  FaSync,
} from "react-icons/fa";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1464983953574-0892a716854b?auto=format&fit=crop&w=1500&q=80";

const CalendarPage = () => {
  const { token } = useAuth();
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [bookings, setBookings] = useState([]);
  const [form, setForm] = useState({ title: "", start: "", end: "" });
  const [error, setError] = useState("");
  const [editId, setEditId] = useState(null);
  const [deleteId, setDeleteId] = useState(null);
  const [alert, setAlert] = useState("");
  const [alertType, setAlertType] = useState("");
  const [availability, setAvailability] = useState(null);
  const [availabilityLoading, setAvailabilityLoading] = useState(true);
  const [googleConnected, setGoogleConnected] = useState(false);
  const [syncing, setSyncing] = useState(false);

  // Fetch user availability on mount
  useEffect(() => {
    const fetchAvailability = async () => {
      setAvailabilityLoading(true);
      try {
        const res = await axios.get("/api/calendar/availability", {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAvailability(res.data);
      } catch (err) {
        setAvailability(null);
      }
      setAvailabilityLoading(false);
    };
    if (token) fetchAvailability();
  }, [token]);

  // Check Google Calendar connection status
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

  // Fetch bookings for the selected date
  useEffect(() => {
    if (!showModal) return;
    const fetchBookings = async () => {
      try {
        // Use local date for query, not UTC
        const localDateStr = `${date.getFullYear()}-${(date.getMonth() + 1)
          .toString()
          .padStart(2, "0")}-${date.getDate().toString().padStart(2, "0")}`;
        const res = await axios.get(
          `/api/calendar/bookings?date=${localDateStr}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        setBookings(
          res.data.map((b) => ({
            ...b,
            start: new Date(b.start),
            end: new Date(b.end),
          }))
        );
        console.log("Fetched bookings for", localDateStr, res.data);
      } catch (err) {
        setBookings([]);
      }
    };
    fetchBookings();
  }, [showModal, date, token]);

  // Helper: is date a holiday?
  const isHoliday = (d) => {
    if (!availability || !availability.holidays) return false;
    return availability.holidays.some(
      (h) =>
        new Date(h).toISOString().slice(0, 10) === d.toISOString().slice(0, 10)
    );
  };

  // Helper: is date within working hours?
  const isWithinWorkingHours = (d) => {
    if (!availability || !availability.workingHours) return false;
    const dayOfWeek = d.toLocaleString("en-US", {
      weekday: "long",
      timeZone: availability.timezone || "UTC",
    });
    return availability.workingHours.some((s) => s.dayOfWeek === dayOfWeek);
  };

  // Helper: get working hours for a day
  const getWorkingHours = (d) => {
    if (!availability || !availability.workingHours) return null;
    const dayOfWeek = d.toLocaleString("en-US", {
      weekday: "long",
      timeZone: availability.timezone || "UTC",
    });
    return availability.workingHours.find((s) => s.dayOfWeek === dayOfWeek);
  };

  // Helper: get disabled times for the selected day
  const getDisabledTimes = () => {
    const now = new Date();
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDay = new Date(date);
    bookingDay.setHours(0, 0, 0, 0);
    let disabled = [];
    // Disable times in the past for today
    if (bookingDay.getTime() === today.getTime()) {
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 5) {
          const t = new Date(
            date.getFullYear(),
            date.getMonth(),
            date.getDate(),
            h,
            m,
            0,
            0
          );
          if (t < now)
            disabled.push(
              t.getHours().toString().padStart(2, "0") +
                ":" +
                t.getMinutes().toString().padStart(2, "0")
            );
        }
      }
    }
    // Disable times outside working hours
    const slot = getWorkingHours(date);
    if (slot) {
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 5) {
          const tStr =
            h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0");
          if (tStr < slot.startTime || tStr >= slot.endTime) {
            disabled.push(tStr);
          }
        }
      }
    } else {
      // If no working hours, disable all
      for (let h = 0; h < 24; h++) {
        for (let m = 0; m < 60; m += 5) {
          disabled.push(
            h.toString().padStart(2, "0") + ":" + m.toString().padStart(2, "0")
          );
        }
      }
    }
    // Disable times that overlap with existing bookings
    bookings.forEach((b) => {
      const start = new Date(b.start);
      const end = new Date(b.end);
      for (let t = new Date(start); t < end; t.setMinutes(t.getMinutes() + 5)) {
        disabled.push(
          t.getHours().toString().padStart(2, "0") +
            ":" +
            t.getMinutes().toString().padStart(2, "0")
        );
      }
    });
    // Buffer logic: disable times within bufferBefore/After of other bookings
    if (availability) {
      const bufferBefore = availability.bufferBefore || 0;
      const bufferAfter = availability.bufferAfter || 0;
      bookings.forEach((b) => {
        // Buffer after
        let t = new Date(b.end);
        for (let i = 1; i <= bufferAfter; i += 5) {
          t = new Date(b.end.getTime() + i * 60000);
          disabled.push(
            t.getHours().toString().padStart(2, "0") +
              ":" +
              t.getMinutes().toString().padStart(2, "0")
          );
        }
        // Buffer before
        t = new Date(b.start);
        for (let i = 1; i <= bufferBefore; i += 5) {
          t = new Date(b.start.getTime() - i * 60000);
          disabled.push(
            t.getHours().toString().padStart(2, "0") +
              ":" +
              t.getMinutes().toString().padStart(2, "0")
          );
        }
      });
    }
    return Array.from(new Set(disabled));
  };

  const disabledTimes = getDisabledTimes();
  // Show all bookings for the selected date
  const bookingsToday = bookings;

  // Handle date click
  const handleDateClick = (value) => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const clicked = new Date(value);
    clicked.setHours(0, 0, 0, 0);
    if (clicked < today) return; // Don't open modal for past dates
    if (availabilityLoading) return;
    if (availability && (isHoliday(clicked) || !isWithinWorkingHours(clicked)))
      return;
    setDate(value);
    setShowModal(true);
    setForm({ title: "", start: "", end: "" });
    setError("");
    setEditId(null);
    setDeleteId(null);
  };

  // Check for overlap
  const isOverlap = (start, end, excludeId = null) => {
    const s = new Date(`${date.toISOString().slice(0, 10)}T${start}`);
    const e = new Date(`${date.toISOString().slice(0, 10)}T${end}`);
    return bookings.some(
      (b) => b._id !== excludeId && s < new Date(b.end) && e > new Date(b.start)
    );
  };

  // Handle booking creation or edit
  const handleCreateOrEdit = async (e) => {
    e.preventDefault();
    setError("");
    const now = new Date();
    const [startHours, startMinutes] = form.start.split(":").map(Number);
    const [endHours, endMinutes] = form.end.split(":").map(Number);
    // Use Date.UTC to ensure UTC storage
    const bookingDate = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        startHours,
        startMinutes,
        0,
        0
      )
    );
    const bookingEndDate = new Date(
      Date.UTC(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        endHours,
        endMinutes,
        0,
        0
      )
    );
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const bookingDay = new Date(date);
    bookingDay.setHours(0, 0, 0, 0);
    if (
      !editId &&
      ((bookingDay.getTime() === today.getTime() && bookingDate < now) ||
        bookingDay < today)
    ) {
      setError("Cannot create bookings in the past.");
      setAlert("Cannot create bookings in the past.");
      setAlertType("error");
      setTimeout(() => setAlert(""), 2000);
      return;
    }
    if (isHoliday(date)) {
      setError("Cannot book on a holiday.");
      return;
    }
    const slot = getWorkingHours(date);
    if (!slot) {
      setError("No working hours set for this day.");
      return;
    }
    if (form.start < slot.startTime || form.end > slot.endTime) {
      setError(
        `Booking must be within working hours: ${slot.startTime} - ${slot.endTime}`
      );
      return;
    }
    if (isOverlap(form.start, form.end, editId)) {
      setError("Select another time: overlaps with an existing booking.");
      return;
    }
    // Buffer logic (UI only, backend is source of truth)
    const bufferBefore = availability?.bufferBefore || 0;
    const bufferAfter = availability?.bufferAfter || 0;
    for (const b of bookings) {
      const s = new Date(`${date.toISOString().slice(0, 10)}T${form.start}`);
      const e = new Date(`${date.toISOString().slice(0, 10)}T${form.end}`);
      if (
        (s >= new Date(b.start) &&
          s < new Date(new Date(b.end).getTime() + bufferAfter * 60000)) ||
        (e > new Date(new Date(b.start).getTime() - bufferBefore * 60000) &&
          e <= new Date(b.end))
      ) {
        setError("Buffer time conflict with another booking.");
        return;
      }
    }
    try {
      const payload = {
        title: form.title,
        start: bookingDate,
        end: bookingEndDate,
      };
      if (editId) {
        await axios.put(`/api/calendar/bookings/${editId}`, payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert("Booking updated successfully!");
        setAlertType("success");
      } else {
        await axios.post("/api/calendar/bookings", payload, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setAlert("Booking created successfully!");
        setAlertType("success");
      }
      setShowModal(false);
      setTimeout(() => setAlert(""), 2000);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          "Failed to save booking. Please check your availability settings."
      );
      setAlert(
        err?.response?.data?.message ||
          "Failed to save booking. Please check your availability settings."
      );
      setAlertType("error");
      setTimeout(() => setAlert(""), 2000);
    }
  };

  // Handle edit click
  const handleEdit = (booking) => {
    setEditId(booking._id);
    setForm({
      title: booking.title,
      start: new Date(booking.start).toISOString().slice(11, 16),
      end: new Date(booking.end).toISOString().slice(11, 16),
    });
    setError("");
  };

  // Handle delete click
  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this booking?"))
      return;
    try {
      await axios.delete(`/api/calendar/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(bookings.filter((b) => b._id !== id));
      setAlert("Booking deleted successfully!");
      setAlertType("success");
      setTimeout(() => setAlert(""), 2000);
    } catch (err) {
      setError("Failed to delete booking");
      setAlert("Failed to delete booking");
      setAlertType("error");
      setTimeout(() => setAlert(""), 2000);
    }
  };

  // Handle Google Calendar sync
  const handleGoogleSync = async () => {
    setSyncing(true);
    try {
      const res = await axios.post(
        "/api/calendar/google/sync",
        {},
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      setAlert(res.data.message);
      setAlertType("success");
      setTimeout(() => setAlert(""), 3000);
    } catch (err) {
      setAlert(
        err.response?.data?.message || "Failed to sync with Google Calendar"
      );
      setAlertType("error");
      setTimeout(() => setAlert(""), 3000);
    }
    setSyncing(false);
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center justify-center py-0 px-0 relative overflow-hidden">
      <img
        src={BG_IMAGE}
        alt="Background"
        className="absolute inset-0 w-full h-full object-cover object-center opacity-80 z-0"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-blue-100/40 via-purple-100/20 to-green-100/10 z-0" />
      <div
        className="flex flex-col items-center justify-center w-full z-10"
        style={{ minHeight: "100vh" }}
      >
        <div className="flex items-center justify-between w-full max-w-4xl mb-8">
          <h1 className="text-4xl font-bold text-blue-700 flex items-center gap-3 drop-shadow-lg">
            <FaCalendarAlt className="text-blue-500" /> Calendar
          </h1>
          {googleConnected && (
            <button
              onClick={handleGoogleSync}
              disabled={syncing}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg shadow hover:bg-green-700 transition-colors disabled:opacity-50"
            >
              <FaSync className={syncing ? "animate-spin" : ""} />
              {syncing ? "Syncing..." : "Sync to Google"}
            </button>
          )}
        </div>
        <div className="flex flex-col items-center w-full">
          <Calendar
            onClickDay={handleDateClick}
            value={date}
            className="rounded-2xl shadow-lg border border-blue-100 mb-10 calendar-zoom bg-white/90"
            tileDisabled={({ date: d }) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const day = new Date(d);
              day.setHours(0, 0, 0, 0);
              return day < today;
            }}
            tileClassName={({ date: d, view }) => {
              const today = new Date();
              today.setHours(0, 0, 0, 0);
              const day = new Date(d);
              day.setHours(0, 0, 0, 0);
              if (day < today) return "calendar-disabled";
              if (
                view === "month" &&
                d.toDateString() === new Date().toDateString()
              )
                return "bg-blue-100 text-blue-700 font-bold";
              return "";
            }}
          />
        </div>
        {showModal && (
          <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50">
            <div className="bg-white rounded-xl shadow-lg p-8 flex flex-col gap-4 w-96">
              <div className="flex justify-between items-center mb-2">
                <h2 className="text-2xl font-bold">
                  Bookings for {date.toLocaleDateString()}
                </h2>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-gray-400 hover:text-gray-700 text-2xl"
                >
                  &times;
                </button>
              </div>
              {alert && (
                <div
                  className={`text-center font-bold py-2 rounded mb-2 ${
                    alertType === "success"
                      ? "bg-green-100 text-green-700"
                      : "bg-red-100 text-red-700"
                  }`}
                >
                  {alert}
                </div>
              )}
              <form
                onSubmit={handleCreateOrEdit}
                className="flex flex-col gap-3"
              >
                <input
                  type="text"
                  className="border rounded p-2"
                  placeholder="Title"
                  value={form.title}
                  onChange={(e) => setForm({ ...form, title: e.target.value })}
                  required
                />
                <div className="flex gap-2">
                  <input
                    type="time"
                    className="border rounded p-2 flex-1"
                    value={form.start}
                    onChange={(e) =>
                      setForm({ ...form, start: e.target.value })
                    }
                    required
                  />
                  <span>to</span>
                  <input
                    type="time"
                    className="border rounded p-2 flex-1"
                    value={form.end}
                    onChange={(e) => setForm({ ...form, end: e.target.value })}
                    required
                  />
                </div>
                {error && <div className="text-red-600">{error}</div>}
                <button
                  type="submit"
                  className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white font-bold py-2 rounded mt-2"
                >
                  {editId ? "Save Changes" : "Create Booking"}
                </button>
                {editId && (
                  <button
                    type="button"
                    className="bg-gray-200 text-gray-700 font-bold py-2 rounded"
                    onClick={() => {
                      setEditId(null);
                      setForm({ title: "", start: "", end: "" });
                    }}
                  >
                    Cancel Edit
                  </button>
                )}
              </form>
              <div className="mt-4">
                <h3 className="font-semibold mb-2">Scheduled Bookings:</h3>
                {bookingsToday.length === 0 ? (
                  <div className="text-gray-500">
                    No bookings for this date.
                  </div>
                ) : (
                  <ul className="space-y-2">
                    {bookingsToday.map((b) => (
                      <li
                        key={b._id}
                        className="p-2 rounded bg-blue-50 flex flex-col relative"
                      >
                        <span className="font-bold text-blue-700">
                          {b.title}
                        </span>
                        <span className="text-gray-600 text-sm">
                          {new Date(b.start).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}{" "}
                          -{" "}
                          {new Date(b.end).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                        <div className="absolute top-2 right-2 flex gap-2">
                          <button
                            className="text-blue-500 hover:text-blue-700"
                            title="Edit"
                            onClick={() => handleEdit(b)}
                          >
                            <FaEdit />
                          </button>
                          <button
                            className="text-red-500 hover:text-red-700"
                            title="Delete"
                            onClick={() => handleDelete(b._id)}
                          >
                            <FaTrash />
                          </button>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
      <style>{`
        .calendar-zoom {
          font-size: 2.1rem;
          width: 1000px;
          max-width: 90vw;
          min-width: 350px;
        }
        .react-calendar__tile--active {
          background: #2563eb !important;
          color: #fff !important;
        }
        .react-calendar__tile--now {
          background: #dbeafe !important;
          color: #2563eb !important;
        }
        .calendar-disabled {
          background: #e5e7eb !important;
          color: #a3a3a3 !important;
          pointer-events: none;
          opacity: 0.7;
          border-radius: 0.75rem;
        }
      `}</style>
    </div>
  );
};

export default CalendarPage;
