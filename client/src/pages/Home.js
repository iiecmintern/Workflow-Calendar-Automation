import React from "react";
import {
  AiOutlineThunderbolt,
  AiOutlineCalendar,
  AiOutlineTeam,
  AiOutlineBarChart,
  AiOutlineLock,
  AiOutlineClockCircle,
} from "react-icons/ai";
import { FaRegSmileBeam, FaPlayCircle } from "react-icons/fa";

const features = [
  {
    icon: <AiOutlineThunderbolt className="text-purple-600 w-8 h-8" />,
    title: "Automated Workflows",
    desc: "Automate repetitive tasks and focus on what matters most.",
    image: "/images/feature-analytics.png",
  },
  {
    icon: <AiOutlineCalendar className="text-blue-600 w-8 h-8" />,
    title: "Smart Scheduling",
    desc: "Book meetings, send reminders, and avoid conflicts effortlessly.",
    image: "/images/feature-scheduling.png",
  },
  {
    icon: <AiOutlineTeam className="text-green-600 w-8 h-8" />,
    title: "Team Collaboration",
    desc: "Coordinate with your team and manage shared calendars with ease.",
    image: "/images/feature-team.png",
  },
  {
    icon: <AiOutlineBarChart className="text-yellow-500 w-8 h-8" />,
    title: "Analytics & Insights",
    desc: "Track productivity and gain insights with powerful analytics.",
    image: "/images/feature-analytics.png",
  },
  {
    icon: <AiOutlineLock className="text-pink-500 w-8 h-8" />,
    title: "Enterprise Security",
    desc: "Your data is protected with industry-leading security features.",
    image: "/images/feature-security.png",
  },
  {
    icon: <AiOutlineClockCircle className="text-indigo-500 w-8 h-8" />,
    title: "Auto-Rescheduling",
    desc: "Never miss a meeting—let automation handle changes for you.",
    image: "/images/feature-scheduling.png",
  },
];

const testimonials = [
  {
    name: "Aman Kumar Sharma",
    feedback:
      "WorkflowSuite has completely transformed how our team manages meetings and deadlines. The automation features are a game changer!",
    avatar: "/images/feature-team.png",
  },
  {
    name: "Priya Verma",
    feedback:
      "I love how easy it is to schedule and reschedule meetings. The reminders and analytics help me stay on top of my work.",
    avatar: "/images/feature-analytics.png",
  },
  {
    name: "Rahul Mehta",
    feedback:
      "The security and reliability of WorkflowSuite gives us peace of mind. Our data is always safe!",
    avatar: "/images/feature-security.png",
  },
  {
    name: "Sneha Kapoor",
    feedback:
      "The team collaboration tools are fantastic. We save hours every week!",
    avatar: "/images/feature-team.png",
  },
];

const Home = () => {
  return (
    <div className="min-h-screen w-full bg-gradient-to-br from-blue-50 to-purple-100 flex flex-col items-center justify-start">
      {/* Hero Section */}
      <section className="w-full flex flex-col md:flex-row items-center justify-center py-12 px-4 md:px-12 bg-gradient-to-tr from-blue-100 to-purple-200">
        <div className="flex-1 flex flex-col items-start justify-center max-w-xl">
          <h1 className="text-5xl md:text-6xl font-extrabold text-blue-700 mb-4 leading-tight drop-shadow-lg">
            Supercharge Your Productivity
            <br />
            with{" "}
            <span className="text-purple-600">
              Workflow & Calendar Automation
            </span>
          </h1>
          <p className="text-lg md:text-xl text-gray-700 mb-8">
            Automate your scheduling, streamline your meetings, and never miss a
            beat. WorkflowSuite brings you the ultimate calendar automation
            platform—designed for teams and individuals who want to get more
            done, effortlessly.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 w-full">
            <a
              href="/signup"
              className="inline-block px-10 py-4 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-xl font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-200 text-center"
            >
              Start Free Trial
            </a>
            <a
              href="#demo"
              className="inline-block px-8 py-4 bg-white text-blue-700 border-2 border-blue-600 text-xl font-bold rounded-full shadow-lg flex items-center justify-center gap-2 hover:bg-blue-50 transition-transform duration-200 text-center"
            >
              <FaPlayCircle className="w-6 h-6" /> Watch Demo
            </a>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center mt-8 md:mt-0">
          <img
            src="/images/hero-main.png"
            alt="Calendar Automation"
            className="w-full max-w-md rounded-2xl shadow-xl border-4 border-white"
          />
        </div>
      </section>

      {/* Features Section */}
      <section className="w-full max-w-6xl px-4 py-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
        {features.map((feature, idx) => (
          <div
            key={idx}
            className="bg-white/95 rounded-3xl shadow-xl flex flex-col items-center p-6 border-t-4 border-b-4 border-blue-100 hover:border-purple-300 transition-all h-full"
          >
            <img
              src={feature.image}
              alt={feature.title}
              className="w-20 h-20 object-contain rounded-xl mb-4 shadow-md border-2 border-blue-100"
            />
            {feature.icon}
            <h3 className="text-2xl font-bold mt-4 mb-2 text-gray-800 text-center">
              {feature.title}
            </h3>
            <p className="text-gray-600 text-center">{feature.desc}</p>
          </div>
        ))}
      </section>

      {/* Demo Section */}
      <section
        id="demo"
        className="w-full flex flex-col md:flex-row items-center justify-center py-12 px-4 md:px-12 bg-gradient-to-tr from-purple-100 to-blue-50 mb-8 rounded-3xl max-w-6xl"
      >
        <div className="flex-1 flex flex-col items-start justify-center max-w-xl">
          <h2 className="text-3xl md:text-4xl font-extrabold text-purple-700 mb-4">
            See WorkflowSuite in Action
          </h2>
          <p className="text-lg text-gray-700 mb-6">
            Watch our quick demo to discover how easy it is to automate your
            calendar and workflows.
          </p>
          <a
            href="https://www.youtube.com/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white text-lg font-bold rounded-full shadow-lg hover:scale-105 transition-transform duration-200"
          >
            <FaPlayCircle className="w-6 h-6" /> Watch Full Demo
          </a>
        </div>
        <div className="flex-1 flex items-center justify-center mt-8 md:mt-0">
          <img
            src="/images/feature-scheduling.png"
            alt="Demo"
            className="w-full max-w-md rounded-2xl shadow-xl border-4 border-white"
          />
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="w-full max-w-6xl px-4 py-12">
        <h2 className="text-3xl font-extrabold text-center text-purple-700 mb-8 flex items-center justify-center gap-2">
          <FaRegSmileBeam className="inline-block text-yellow-400" /> Loved by
          Productive Teams
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {testimonials.map((t, idx) => (
            <div
              key={idx}
              className="bg-white/95 rounded-2xl shadow-md p-6 flex flex-col items-center border border-purple-100 h-full"
            >
              <img
                src={t.avatar}
                alt={t.name}
                className="w-16 h-16 rounded-full mb-4 border-2 border-blue-200 object-cover"
              />
              <p className="text-gray-700 italic mb-2 text-center">
                "{t.feedback}"
              </p>
              <span className="font-semibold text-blue-700">{t.name}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Call to Action Section */}
      <section className="w-full flex flex-col items-center justify-center py-12 bg-gradient-to-r from-blue-600 to-purple-600 rounded-2xl shadow-xl mb-8 max-w-6xl px-4">
        <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4 text-center">
          Ready to Automate Your Workflow?
        </h2>
        <p className="text-lg text-white/90 mb-6 text-center max-w-2xl">
          Join thousands of productive teams and individuals who trust
          WorkflowSuite to manage their time and automate their calendars. Sign
          up now and experience the future of productivity!
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center">
          <a
            href="/signup"
            className="inline-block px-10 py-4 bg-white text-blue-700 font-bold rounded-full shadow-lg hover:bg-blue-50 transition-transform text-xl text-center"
          >
            Start Free Trial
          </a>
          <a
            href="#demo"
            className="inline-block px-8 py-4 bg-blue-700 text-white font-bold rounded-full shadow-lg flex items-center justify-center gap-2 hover:bg-blue-800 transition-transform text-xl text-center"
          >
            <FaPlayCircle className="w-6 h-6" /> Watch Demo
          </a>
        </div>
      </section>
    </div>
  );
};

export default Home;
