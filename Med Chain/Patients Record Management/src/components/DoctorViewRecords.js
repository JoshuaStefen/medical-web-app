import React, { useState, useEffect } from "react";
import Web3 from "web3";
import { useParams, Link, useNavigate } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorForm from "../build/contracts/DoctorForm.json";

const DoctorViewPatient = () => {
  const { hhNumber } = useParams(); // Retrieve the hhNumber from the URL parameter
  const navigate = useNavigate();

  const doctorForm = () => {
    navigate("/doctor/" + hhNumber + "/doctorform");
  };

  const viewPatientRecords = () => {
    navigate("/patient/" + hhNumber + "/viewrecords");
  };

  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [patientDetails, setPatientDetails] = useState(null);
  const [aiPrediction, setAIPrediction] = useState("");
  const [aiRiskLevel, setAIRiskLevel] = useState("");
  const [error, setError] = useState(null);
  const [doctorPrediction, setDoctorPrediction] = useState("Not Available");
  const [doctorRiskLevel, setDoctorRiskLevel] = useState("Not Available");
  const [patientMedicalRecords, setPatientMedicalRecords] = useState([]);

  // Fetch doctor records (and filter records for the specific patient)  
  useEffect(() => {
    const fetchDoctorRecords = async () => {
      if (!web3 || !hhNumber) return;

      try {
        const accounts = await web3.eth.getAccounts();
        const networkId = await web3.eth.net.getId();
        const deployedNetworkDoctorForm = DoctorForm.networks[networkId];

        if (!deployedNetworkDoctorForm) {
          throw new Error("DoctorForm contract not deployed on this network.");
        }

        const doctorFormInstance = new web3.eth.Contract(
          DoctorForm.abi,
          deployedNetworkDoctorForm.address
        );
        if (!contract) {
          console.error("Smart contract not initialized");
          return;
        }

        // Fetch all records for current doctor from DoctorForm.sol
        const allRecords = await doctorFormInstance.methods.getRecords().call({ from: accounts[0] });
        console.log("🔎 All records from DoctorForm.sol:", allRecords);

        // Fetch patient details from PatientRegistration
        const patientData = await contract.methods.getPatientDetails(hhNumber).call();
        console.log(`🔎 Patient details for HH ${hhNumber}:`, patientData);
        const patientWallet = patientData[0] || patientData.walletAddress;
        console.log(`✅ Patient wallet address: ${patientWallet}`);

        // Filter records based on patient wallet address (convert both to lowercase)
        const matchingRecords = allRecords.filter(
          (rec) =>
            rec.patientWalletAddress &&
            rec.patientWalletAddress.toLowerCase() === patientWallet.toLowerCase()
        );
        console.log("Filtered records for patient based on wallet address:", matchingRecords);

        // Save the filtered records if needed
        setPatientMedicalRecords(matchingRecords);

        // Extract latest record (assuming the last record is the latest)
        if (matchingRecords.length > 0) {
          const latestRecord = matchingRecords[matchingRecords.length - 1];
          console.log("Latest record for doctor predictions:", latestRecord);
          setDoctorPrediction(latestRecord.coronaryHeartDiseasePercentage || "Not Available");
          setDoctorRiskLevel(latestRecord.coronaryArteryDiseaseRiskLevel || "Not Available");
        } else {
          console.warn("No matching doctor records found for patient wallet:", patientWallet);
        }
      } catch (err) {
        console.error("Error fetching doctor records:", err);
      }
    };

    fetchDoctorRecords();
  }, [web3, contract, hhNumber]);

  // Initialize the contracts and fetch patient details along with AI predictions
  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks[networkId];

          if (!deployedNetwork) {
            throw new Error("Contract not deployed on this network.");
          }

          const contractInstance = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);

          if (!hhNumber) return;

          // Fetch Patient Details
          const result = await contractInstance.methods.getPatientDetails(hhNumber).call();
          setPatientDetails(result);
          console.log(`Fetched Patient Details for HH ${hhNumber}:`, result);

          // Fetch AI Prediction
          const aiData = await contractInstance.methods.getAIPrediction(hhNumber).call();
          console.log(`AI Prediction for HH ${hhNumber}:`, aiData);
          setAIPrediction(aiData[0] || "Not Available");
          setAIRiskLevel(aiData[1] || "Not Available");
        } catch (error) {
          console.error("Error retrieving patient details:", error);
          setError("Error retrieving patient details");
        }
      } else {
        console.log("Please install MetaMask extension");
        setError("Please install MetaMask extension");
      }
    };

    init();
  }, [hhNumber]);

  const cancelOperation = () => {
    navigate(-1);
  };

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-900 p-4 sm:p-10 font-mono text-white h-30 flex flex-col justify-center items-center">
        <h2 className="text-2xl sm:text-4xl font-bold mb-6">Patient's Profile</h2>
        <br />
        {patientDetails && (
          <center>
            <p className="text-xl sm:text-3xl mb-6">
              Wallet Address :{" "}
              <span className="font-bold text-teal-500">{patientDetails.walletAddress}</span>{" "} <br />  <br />
              Name :{" "}
              <span className="font-bold text-yellow-500">{patientDetails.name}</span>{" "}
              DOB :{" "}
              <span className="font-bold text-yellow-500">{patientDetails.dateOfBirth}</span>{" "}
              Gender :{" "}
              <span className="font-bold text-yellow-500">{patientDetails.gender}</span>
              <br /><br />
              BloodGroup :{" "}
              <span className="font-bold text-yellow-500">{patientDetails.bloodGroup}</span>{" "}
              Address :{" "}
              <span className="font-bold text-yellow-500">{patientDetails.homeAddress}</span>
              <br /><br />
              Email-Id :{" "}
              <span className="font-bold text-yellow-500">{patientDetails.email}</span>
              <br /><br />
              AI Prediction :{" "}
              <span className="font-bold text-orange-700">{aiPrediction}</span>{" "}
              Risk Level :{" "}
              <span className="font-bold text-orange-700">{aiRiskLevel}</span>
              <br /><br />
              Doctor's Prediction :{" "}
              <span className="font-bold text-green-600">{doctorPrediction}</span>{" "}
              Risk Level :{" "}
              <span className="font-bold text-green-600">{doctorRiskLevel}</span>
            </p>
          </center>
        )}
      </div>
      <div>
        <div className="flex justify-center gap-4 flex-wrap mt-0 mb-4">
          <button
            onClick={viewPatientRecords}
            className="px-4 sm:px-6 py-3 sm:py-4 w-60 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
          >
            View Medical Records
          </button>
          <button
            onClick={doctorForm}
            className="px-4 sm:px-6 py-3 sm:py-4 w-60 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
          >
            Consult
          </button>
          <button
            onClick={cancelOperation}
            className="px-4 sm:px-6 py-3 sm:py-4 w-60 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
          >
            Close
          </button>
        </div>

      </div>
    </div>
  );
};

export default DoctorViewPatient;
