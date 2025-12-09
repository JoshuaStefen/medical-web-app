import React, { useEffect, useState } from "react";
import Web3 from "web3";
import { useParams, useNavigate } from "react-router-dom";
import "../CSS/PatientDashBoard.css";
import NavBar_Logout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";

const PatientDashBoard = () => {
  const { hhNumber } = useParams(); // Retrieve the hhNumber from the URL parameter

  const navigate = useNavigate();
   
  // ✅ Declare missing state variables for AI Prediction & Risk Level
  const [aiPrediction, setAIPrediction] = useState("Not Available");
  const [aiRiskLevel, setAIRiskLevel] = useState("Not Available");
  const viewRecord = () => {
    navigate("/patient/" + hhNumber + "/viewrecords");
  };

  const grantPermission = () => {
    navigate("/patient/" + hhNumber + "/grantpermission");
  };
  const viewprofile = () => {
    navigate("/patient/" + hhNumber + "/viewprofile");
  };
  const uploadehr = () => {
    navigate("/patient/" + hhNumber + "/uploadehr");
  };
  const viewAvailableDoctors = () => {
    navigate("/patient/" + hhNumber + "/availabledoctors");
  };
  
  const viewAvailableDiagnostics = () => {
    navigate("/patient/" + hhNumber + "/availablediagnostics");
  };

  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [patientPhoneNo, setPatientPhoneNo] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [error, setError] = useState(null);
  const [walletAddress, setWalletAddress] = useState(null);

  useEffect(() => {
    const initWeb3 = async () => {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        setWeb3(web3Instance);

        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = PatientRegistration.networks[networkId];
        const contractInstance = new web3Instance.eth.Contract(
          PatientRegistration.abi,
          deployedNetwork && deployedNetwork.address,
        );
        setContract(contractInstance);
        setPatientPhoneNo(hhNumber);
        try {
          // Fetch patient details
          const result = await contractInstance.methods.getPatientDetails(hhNumber).call();
          setPatientDetails(result);

          // Fetch AI prediction
        const aiData = await contractInstance.methods.getAIPrediction(hhNumber).call();
        console.log(`🔄 Fetched AI Prediction: ${aiData}`);
        setAIPrediction(aiData[0] || "Not Available");
        setAIRiskLevel(aiData[1] || "Not Available");

        // Fetch patient's Ethereum address from MetaMask
        const accounts = await web3Instance.eth.getAccounts();
        setWalletAddress(accounts[0]);  // ✅ Use dynamically fetched Ethereum address

        } catch (error) {
          console.error('❌ Error retrieving patient details:', error);
          setError('Error retrieving patient details');
        }
      } else {
        console.log('❌ Please install MetaMask extension');
        setError('Please install MetaMask extension');
      }
    };

    initWeb3();
  }, [hhNumber]);

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-900 p-4 sm:p-10 font-mono text-white h-screen flex flex-col justify-center items-center">
        <h2 className="text-3xl sm:text-4xl font-bold mb-6">Patient Dashboard</h2>
        {patientDetails && (
          <p className="text-xl sm:text-2xl mb-24">
            Welcome{" "}
            <span className="font-bold text-yellow-500">{patientDetails.name}!</span>
          </p>
        )}
        <div className="flex flex-wrap justify-center gap-5 w-full px-4 sm:px-0">
          <button
            onClick={viewprofile}
            className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            View Profile
          </button>
          <button
            onClick={viewRecord}
            className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            View Record
          </button>
          <button
            onClick={uploadehr}
            className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Upload Past Records
          </button>
          <button
            onClick={viewAvailableDoctors}
            className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Available Doctors
          </button>
          <button
            onClick={viewAvailableDiagnostics}
            className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Available Diagnostics
          </button>
          <button
            onClick={grantPermission}
            className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Get Appointment
          </button>
          <button 
            onClick={() => window.location.href = `http://127.0.0.1:5000/?hhNumber=${hhNumber}&patientAddress=${walletAddress}`} 
            className="my-2 px-4 sm:px-8 py-4 sm:py-5 w-full sm:w-1/4 rounded-lg bg-gradient-to-r from-orange-600 to-red-800 text-white font-semibold hover:from-red-800 hover:to-orange-600 transition-all duration-100 transform hover:scale-105"
          >
            Heart Disease Prediction
          </button>
        </div>
      </div>
    </div>
  );
};

export default PatientDashBoard;
