import React from "react";

const Footer = () => (
  <footer className="w-full bg-white border-t border-gray-100 py-4 px-6 text-center text-gray-500 text-sm mt-auto">
    <span>
      &copy; {new Date().getFullYear()} WorkflowSuite. All rights reserved.
    </span>
    <span className="mx-2">|</span>
    <a href="/privacy" className="hover:underline">
      Privacy Policy
    </a>
    <span className="mx-2">|</span>
    <a href="/terms" className="hover:underline">
      Terms of Service
    </a>
  </footer>
);

export default Footer;
