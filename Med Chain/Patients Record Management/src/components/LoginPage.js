import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import NavBar from "./NavBar";

const LoginPage = () => {
  const navigate = useNavigate();
  return (
    <div>
    <NavBar></NavBar>
    <div className="min-h-screen flex items-center justify-center bg-gray-900 font-mono">
      <div className="space-y-6 mt-[-50px] w-full max-w-xs mx-auto">
        <button
          className="text-white font-bold py-2 px-4 rounded w-full transition duration-300 ease-in-out  bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 duration-50 transform hover:scale-105"
          onClick={() => {
            navigate("/doctor_login");
          }}
        >
          Doctor Login
        </button>
        <button
          className= "text-white font-bold py-2 px-4 rounded w-full duration-300 ease-in-out bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          onClick={() => {
            navigate("/patient_login");
          }}
        >
          Patient Login
          </button>
        <button
          className= "text-white font-bold py-2 px-4 rounded w-full duration-300 ease-in-out bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          onClick={() => {
            navigate("/diagnostic_login");
          }}
        >
          Diagnostic Login
        </button>
      </div>
      </div>
      </div>
  );
};

export default LoginPage;
