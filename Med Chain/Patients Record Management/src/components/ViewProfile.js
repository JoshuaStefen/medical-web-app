import React, { useState, useEffect } from "react";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import DoctorForm from "../build/contracts/DoctorForm.json"; // (Optional if needed elsewhere)
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import "../CSS/PatientWritePermission.css";
import "../big_css/CreateEHR.css";
import NavBar_Logout from "./NavBar_Logout";

const ViewProfile = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [web3Instance, setWeb3Instance] = useState(null);
  const [prContract, setPRContract] = useState(null);
  const [doctorContract, setDoctorContract] = useState(null); // if needed
  const [patientDetails, setPatientDetails] = useState(null);
  const [aiPrediction, setAIPrediction] = useState("Not Available");
  const [aiRiskLevel, setAIRiskLevel] = useState("Not Available");
  const [doctorPrediction, setDoctorPrediction] = useState("Not Available");
  const [doctorRiskLevel, setDoctorRiskLevel] = useState("Not Available");
  const [error, setError] = useState(null);

  useEffect(() => {
    const init = async () => {
      console.log("🟡 Initializing web3 and contracts...");
      if (!window.ethereum) {
        setError("Please install MetaMask extension");
        return;
      }
      try {
        const web3 = new Web3(window.ethereum);
        setWeb3Instance(web3);
        const networkId = await web3.eth.net.getId();
        console.log("🟢 Network ID:", networkId);

        // Initialize PatientRegistration contract instance
        const deployedPRNetwork = PatientRegistration.networks[networkId];
        if (!deployedPRNetwork) {
          throw new Error("PatientRegistration contract not deployed on this network.");
        }
        const prInstance = new web3.eth.Contract(
          PatientRegistration.abi,
          deployedPRNetwork.address
        );
        setPRContract(prInstance);

        // Optionally load DoctorForm contract if needed
        const deployedDFNetwork = DoctorForm.networks[networkId];
        if (deployedDFNetwork) {
          const dfInstance = new web3.eth.Contract(
            DoctorForm.abi,
            deployedDFNetwork.address
          );
          setDoctorContract(dfInstance);
        }

        console.log("✅ Contracts loaded successfully");

        // Fetch Patient Details using the patient's hhNumber
        console.log("📤 Fetching patient details...");
        const patientData = await prInstance.methods.getPatientDetails(hhNumber).call();
        const fetchedPatientDetails = {
          walletAddress: patientData[0],
          name: patientData[1],
          dateOfBirth: patientData[2],
          gender: patientData[3],
          bloodGroup: patientData[4],
          homeAddress: patientData[5],
          email: patientData[6],
          coronaryHeartDiseasePercentage: patientData[7],
          coronaryArteryDiseaseRiskLevel: patientData[8],
        };
        setPatientDetails(fetchedPatientDetails);
        console.log(`✅ Fetched Patient Details for HH ${hhNumber}:`, fetchedPatientDetails);

        // -----------------------------
        // Fetch AI Predictions using a slight delay
        setTimeout(async () => {
          try {
            console.log(`📤 About to call getAIPrediction for HH number: ${hhNumber}`);
            const aiData = await prInstance.methods.getAIPrediction(hhNumber).call();
            console.log(`🔎 AI Prediction for HH ${hhNumber}:`, aiData);

            if (typeof aiData === "object" && aiData !== null) {
              const prediction = aiData[0] || aiData.aiPrediction || "Not Available";
              const riskLevel = aiData[1] || aiData.aiRiskLevel || "Not Available";

              setAIPrediction(prediction);
              setAIRiskLevel(riskLevel);

              console.log(`✅ Corrected AI Prediction: ${prediction}`);
              console.log(`✅ Corrected AI Risk Level: ${riskLevel}`);

            } else {
              console.error("❌ AI Prediction format incorrect:", aiData);
            }
            console.log("🔍 Debugging AI Prediction Response:", aiData);
            console.log("🔍 Type of aiData:", typeof aiData);
            console.log("🔍 Raw Blockchain Response:", aiData);
          } catch (aiError) {
            console.error("❌ Error fetching AI Prediction:", aiError);
          }
        }, 1000); // Delay increased to 3000 ms (3 seconds)

        // -----------------------------

        // Fetch Doctor Predictions using patient wallet address (from our new getter)
        try {
          if (fetchedPatientDetails.walletAddress) {
            console.log("📤 Fetching Doctor predictions from PatientRegistration.sol using wallet address...");
            const docData = await prInstance.methods
              .getDoctorDiagnosisData(fetchedPatientDetails.walletAddress)
              .call();
            console.log(`🔎 Doctor Prediction from contract for patient ${fetchedPatientDetails.walletAddress}:`, docData);
            if (docData && docData[0] && docData[1]) {
              setDoctorPrediction(docData[0]);
              setDoctorRiskLevel(docData[1]);
              console.log(`✅ Doctor Prediction: ${docData[0]}, Risk Level: ${docData[1]}`);
            } else {
              console.warn("⚠️ Doctor Prediction data is empty or not set yet.");
            }
          }
        } catch (docError) {
          console.error("❌ Error fetching Doctor Prediction:", docError);
        }
      } catch (initError) {
        console.error("❌ Error during initialization:", initError);
        setError(initError.message || "Error retrieving patient data");
      }
    };

    init();
  }, [hhNumber]);

  const cancelOperation = () => {
    navigate(`/patient/${hhNumber}`);
  };

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-900 p-4 sm:p-10 font-mono text-white flex flex-col justify-center items-center">
        <div className="h-full max-w-8xl bg-gray-700 p-24 rounded-lg shadow-lg flex flex-col justify-center items-center">
          <h1 className="text-3xl sm:text-4xl font-bold mb-6">Profile</h1>
          {error && (
            <p className="text-red-500 font-bold text-lg">{error}</p>
          )}
          {patientDetails && (
            <center>
              <p className="text-xl sm:text-2xl mb-3">
                Wallet Address: <span className="font-bold text-teal-500">{patientDetails.walletAddress}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-3">
                Name: <span className="font-bold text-yellow-500">{patientDetails.name}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-3">
                DOB: <span className="font-bold text-yellow-500">{patientDetails.dateOfBirth}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-3">
                Gender: <span className="font-bold text-yellow-500">{patientDetails.gender}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-6">
                Blood Group: <span className="font-bold text-yellow-500">{patientDetails.bloodGroup}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-3">
                Address: <span className="font-bold text-yellow-500">{patientDetails.homeAddress}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-3">
                Email-Id: <span className="font-bold text-yellow-500">{patientDetails.email}</span>
              </p>
              <br />
              <p className="text-xl sm:text-2xl mb-6">
                AI's Prediction: <span className="font-bold text-red-500">{aiPrediction}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-6">
                AI's Risk Level: <span className="font-bold text-red-500">{aiRiskLevel}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-3">
                Doctor's Heart Disease Prediction: <span className="font-bold text-green-500">{doctorPrediction}</span>
              </p>
              <p className="text-xl sm:text-2xl mb-3">
                Doctor's Risk Level: <span className="font-bold text-green-500">{doctorRiskLevel}</span>
              </p>
            </center>
          )}
          <div className="col-span-full">
            <button
              onClick={cancelOperation}
              className="px-5 py-2.5 text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ViewProfile;
