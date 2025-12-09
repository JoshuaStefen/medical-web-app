import React from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";
// No need to import "./LandingPage.css" if you are using Tailwind CSS classes

const RegisterPage = () => {
  const navigate = useNavigate();

  return (
    <div>
        <NavBar></NavBar>
    <div className="bg-gray-900 min-h-screen flex items-center justify-center font-mono">
      <div className="space-y-6 mt-[-50px] w-full max-w-xs mx-auto">
        <button
          className="text-white font-bold py-2 px-4 rounded w-full duration-300 ease-in-out bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-110" // Added transform and grey color for hover
          onClick={() => {
            navigate("/doctor_registration");
          }}
        >
          Doctor Registration
        </button>
        <button
          className="text-white font-bold py-2 px-4 rounded w-full duration-300 ease-in-out bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-110" // Added transform and grey color for hover
          onClick={() => {
            navigate("/patient_registration");
          }}
        >
          Patient Registration
        </button>
        <button
          className="text-white font-bold py-2 px-4 rounded w-full duration-300 ease-in-out bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-110" // Added transform and grey color for hover
          onClick={() => {
            navigate("/diagnostic_registration");
          }}
        >
          Diagnostics Registration
        </button>
      </div>
      </div>
      </div>
  );
};

export default RegisterPage;
