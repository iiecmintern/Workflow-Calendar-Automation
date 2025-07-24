import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "../contexts/AuthContext";
import { FaEdit, FaTrash, FaCalendarAlt } from "react-icons/fa";

const BG_IMAGE =
  "https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=1500&q=80";

const Scheduling = () => {
  const { token } = useAuth();
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [alert, setAlert] = useState("");
  const [editId, setEditId] = useState(null);
  const [editForm, setEditForm] = useState({ title: "", start: "", end: "" });

  useEffect(() => {
    fetchBookings();
    // eslint-disable-next-line
  }, [token]);

  const fetchBookings = async () => {
    setLoading(true);
    setError("");
    try {
      // Fetch all bookings (no date filter)
      const res = await axios.get("/api/calendar/bookings", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBookings(
        res.data.map((b) => ({
          ...b,
          start: new Date(b.start),
          end: new Date(b.end),
        }))
      );
    } catch (err) {
      setError("Failed to fetch bookings");
    }
    setLoading(false);
  };

  const handleEdit = (booking) => {
    setEditId(booking._id);
    setEditForm({
      title: booking.title,
      start: booking.start.toISOString().slice(0, 16),
      end: booking.end.toISOString().slice(0, 16),
    });
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await axios.put(
        `/api/calendar/bookings/${editId}`,
        {
          title: editForm.title,
          start: new Date(editForm.start),
          end: new Date(editForm.end),
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setAlert("Booking updated!");
      setEditId(null);
      fetchBookings();
      setTimeout(() => setAlert(""), 2000);
    } catch (err) {
      setError("Failed to update booking");
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this booking?")) return;
    try {
      await axios.delete(`/api/calendar/bookings/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setAlert("Booking deleted!");
      fetchBookings();
      setTimeout(() => setAlert(""), 2000);
    } catch (err) {
      setError("Failed to delete booking");
    }
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
              <FaCalendarAlt className="text-white text-5xl drop-shadow-lg" />
              <div>
                <h1 className="text-3xl md:text-4xl font-extrabold text-white drop-shadow-lg mb-2">
                  Your Bookings
                </h1>
                <p className="text-white/90 text-lg font-medium drop-shadow">
                  Manage, edit, and review all your scheduled meetings in one
                  place.
                </p>
              </div>
            </div>
            {/* Optionally, add a button for new booking or export */}
          </div>
        </div>
        {/* Alerts */}
        {alert && (
          <div className="bg-green-100 text-green-700 p-2 rounded mb-4 text-center font-semibold w-full max-w-2xl shadow">
            {alert}
          </div>
        )}
        {error && (
          <div className="bg-red-100 text-red-700 p-2 rounded mb-4 text-center font-semibold w-full max-w-2xl shadow">
            {error}
          </div>
        )}
        {/* Booking Cards */}
        <div className="w-full max-w-3xl mx-auto flex flex-col gap-6">
          {loading ? (
            <div className="text-center text-lg text-white/90">Loading...</div>
          ) : bookings.length === 0 ? (
            <div className="text-center text-white/90">No bookings found.</div>
          ) : (
            bookings.map((b) => (
              <div
                key={b._id}
                className="bg-white/90 rounded-2xl shadow-xl p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4 border-l-8 border-blue-400 hover:shadow-2xl transition-all"
              >
                <div className="flex flex-col gap-1">
                  <span className="text-xl font-bold text-blue-700 flex items-center gap-2">
                    <FaCalendarAlt className="text-blue-400" /> {b.title}
                  </span>
                  <span className="text-gray-700 font-medium">
                    {b.start.toLocaleDateString()} &bull;{" "}
                    {b.start.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}{" "}
                    -{" "}
                    {b.end.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="flex gap-3 items-center">
                  <button
                    className="text-blue-600 hover:text-blue-800 bg-blue-100 rounded-full p-3 shadow"
                    onClick={() => handleEdit(b)}
                    title="Edit"
                  >
                    <FaEdit />
                  </button>
                  <button
                    className="text-red-600 hover:text-red-800 bg-red-100 rounded-full p-3 shadow"
                    onClick={() => handleDelete(b._id)}
                    title="Delete"
                  >
                    <FaTrash />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
        {/* Edit Booking Modal */}
        {editId && (
          <form
            onSubmit={handleEditSubmit}
            className="fixed inset-0 flex items-center justify-center bg-black/40 z-50"
          >
            <div className="bg-white rounded-2xl shadow-2xl p-8 w-full max-w-xl flex flex-col gap-4">
              <h2 className="text-2xl font-bold text-blue-700 mb-2 text-center">
                Edit Booking
              </h2>
              <input
                type="text"
                className="border rounded p-2 w-full"
                value={editForm.title}
                onChange={(e) =>
                  setEditForm({ ...editForm, title: e.target.value })
                }
                required
              />
              <div className="flex flex-col md:flex-row gap-4 w-full">
                <input
                  type="datetime-local"
                  className="border rounded p-2 flex-1 min-w-0"
                  value={editForm.start}
                  onChange={(e) =>
                    setEditForm({ ...editForm, start: e.target.value })
                  }
                  required
                />
                <span className="self-center">to</span>
                <input
                  type="datetime-local"
                  className="border rounded p-2 flex-1 min-w-0"
                  value={editForm.end}
                  onChange={(e) =>
                    setEditForm({ ...editForm, end: e.target.value })
                  }
                  required
                />
              </div>
              <div className="flex gap-4 justify-center mt-2">
                <button
                  type="submit"
                  className="bg-blue-600 text-white px-6 py-2 rounded shadow hover:bg-blue-700 font-semibold"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="bg-gray-200 text-gray-700 px-6 py-2 rounded shadow font-semibold"
                  onClick={() => setEditId(null)}
                >
                  Cancel
                </button>
              </div>
            </div>
          </form>
        )}
      </div>
      <style>{`
        body { background: none !important; }
      `}</style>
    </div>
  );
};

export default Scheduling;
