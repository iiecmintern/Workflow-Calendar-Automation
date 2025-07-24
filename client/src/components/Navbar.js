import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import {
  AiOutlineMenu,
  AiOutlineHome,
  AiOutlineCalendar,
  AiOutlineSetting,
  AiOutlineUser,
  AiOutlineLogout,
  AiOutlineBarChart,
  AiOutlineClockCircle,
  AiOutlineThunderbolt,
  AiOutlineForm,
} from "react-icons/ai";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { useAuth } from "../contexts/AuthContext";
import { FaSignInAlt, FaUserPlus, FaCalendarAlt } from "react-icons/fa";
import axios from "axios";
import { FaGlobe } from "react-icons/fa";

const Navbar = () => {
  const [collapsed, setCollapsed] = useState(false);
  const { user, logout, isAuthenticated, token } = useAuth();
  const location = useLocation();
  const [bookingSlug, setBookingSlug] = useState(null);

  useEffect(() => {
    const fetchBookingPage = async () => {
      if (isAuthenticated && token) {
        try {
          const res = await axios.get("/api/booking-pages/me", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setBookingSlug(res.data.slug);
        } catch {
          setBookingSlug(null);
        }
      }
    };
    fetchBookingPage();
  }, [isAuthenticated, token]);

  const navItems = [
    // { name: "Home", path: "/", icon: AiOutlineHome },
    // {
    //   name: "Calendar Automation",
    //   path: "/calendar-automation",
    //   icon: AiOutlineCalendar,
    // },
  ];
  const authenticatedNavItems = [
    { name: "Dashboard", path: "/dashboard", icon: AiOutlineBarChart },
    { name: "Workflows", path: "/workflows", icon: AiOutlineThunderbolt },
    { name: "Webhooks", path: "/webhooks", icon: FaGlobe },
    { name: "Calendar", path: "/calendar", icon: AiOutlineCalendar },
    { name: "Scheduling", path: "/scheduling", icon: AiOutlineClockCircle },
    { name: "Availability", path: "/availability", icon: AiOutlineClockCircle },
    { name: "Forms", path: "/forms", icon: AiOutlineForm },
    { name: "Surveys", path: "/surveys", icon: AiOutlineBarChart },
    {
      name: "Auto-Reschedule",
      path: "/auto-reschedule",
      icon: AiOutlineThunderbolt,
    },
    {
      name: "Booking Page",
      path: bookingSlug ? `/book/${bookingSlug}` : "/book/me",
      icon: FaCalendarAlt,
    },
    // { name: "Settings", path: "/settings", icon: AiOutlineSetting },
  ];

  return (
    <div className="flex min-h-screen">
      {/* Sidebar */}
      <motion.nav
        animate={{ width: collapsed ? 72 : 250 }}
        className="backdrop-blur-lg bg-white/70 border-r border-gray-200 shadow-xl flex flex-col transition-all duration-300 h-screen sticky top-0 z-50 glassmorphism"
        style={{ minWidth: collapsed ? 72 : 250 }}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <Link to="/" className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-gradient-to-br from-primary-500 to-primary-700 rounded-lg flex items-center justify-center shadow-md">
              <AiOutlineCalendar className="w-5 h-5 text-white" />
            </div>
            {!collapsed && (
              <span className="text-xl font-bold text-gray-900">
                WorkflowSuite
              </span>
            )}
          </Link>
          <button
            onClick={() => setCollapsed((c) => !c)}
            className="ml-2 p-2 rounded-full bg-white/80 hover:bg-primary-100 shadow transition-colors duration-200 border border-gray-200"
            aria-label="Toggle sidebar"
          >
            {collapsed ? (
              <ChevronRight className="w-5 h-5" />
            ) : (
              <ChevronLeft className="w-5 h-5" />
            )}
          </button>
        </div>
        <div className="flex-1 flex flex-col py-4 space-y-2">
          {(isAuthenticated ? authenticatedNavItems : navItems).map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={`nav-link flex items-center group ${
                  location.pathname === item.path
                    ? "active bg-primary-100/80 text-primary-700"
                    : "hover:bg-primary-50/80 hover:text-primary-700"
                } ${
                  collapsed ? "justify-center" : ""
                } transition-all duration-200`}
                title={collapsed ? item.name : undefined}
              >
                <Icon className="w-5 h-5 mr-0.5 group-hover:scale-110 transition-transform duration-200" />
                {!collapsed && (
                  <span className="ml-2 font-medium">{item.name}</span>
                )}
              </Link>
            );
          })}
        </div>
        <div className="border-t border-gray-100 py-4 px-2 flex flex-col gap-2">
          {isAuthenticated ? (
            <>
              <Link
                to="/profile"
                className={`nav-link flex items-center group ${
                  collapsed ? "justify-center" : ""
                } hover:bg-primary-50/80 hover:text-primary-700 transition-all duration-200`}
                title={collapsed ? "Profile" : undefined}
              >
                <AiOutlineUser className="w-5 h-5 mr-0.5 group-hover:scale-110 transition-transform duration-200" />
                {!collapsed && (
                  <span className="ml-2 font-medium">Profile</span>
                )}
              </Link>
              <button
                onClick={logout}
                className={`nav-link flex items-center w-full text-left group ${
                  collapsed ? "justify-center" : ""
                } hover:bg-red-50/80 hover:text-red-600 transition-all duration-200`}
                title={collapsed ? "Logout" : undefined}
              >
                <AiOutlineLogout className="w-5 h-5 mr-0.5 group-hover:scale-110 transition-transform duration-200" />
                {!collapsed && <span className="ml-2 font-medium">Logout</span>}
              </button>
            </>
          ) : (
            <>
              <div
                className={`flex ${
                  collapsed ? "flex-col gap-2 items-center" : "flex-row gap-2"
                } mt-auto mb-4`}
              >
                <Link
                  to="/login"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-100 text-blue-700 font-semibold shadow hover:bg-blue-200 transition text-base"
                >
                  <FaSignInAlt />
                  {!collapsed && "Login"}
                </Link>
                <Link
                  to="/signup"
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-blue-600 text-white font-semibold shadow hover:bg-blue-700 transition text-base"
                >
                  <FaUserPlus />
                  {!collapsed && "Sign Up"}
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.nav>
      <div className="flex-1 flex flex-col min-h-screen">
        {/* The rest of the app will be rendered here */}
      </div>
    </div>
  );
};

export default Navbar;
