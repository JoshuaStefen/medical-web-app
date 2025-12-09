import React, { useState, useEffect } from "react";
import DoctorForm from "../build/contracts/DoctorForm.json"; // Adjust the path if needed
import PatientRegistration from "../build/contracts/PatientRegistration.json"; // Import the PatientRegistration contract ABI
import UploadEhr from "../build/contracts/UploadEhr.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "../big_css/CreateEHR.css";
import NavBar_Logout from "./NavBar_Logout";
import { create } from 'ipfs-http-client';
import { Buffer } from 'buffer';

const ipfs = create({ url: "http://127.0.0.1:5002" });

const DoctorConsultancy = () => {
  const navigate = useNavigate();
  const { hhNumber } = useParams(); // Retrieve account address from URL
  const [file, setFile] = useState(null);
  const [web3Instance, setWeb3Instance] = useState(null);
  const [recId, setRecId] = useState("EHR" + uuidv4());
  const [formData, setFormData] = useState({
    patientWalletAddress: "",
    doctorAddress: "",
    gender: "",
    diagnosis: "",
    prescription: "",
    coronaryHeartDiseasePercentage: "",
    coronaryArteryDiseaseRiskLevel: ""
  });
  const [errors, setErrors] = useState({
    patientWalletAddress: "",
    doctorAddress: "",
    gender: "",
    diagnosis: "",
    prescription: "",
    coronaryHeartDiseasePercentage: "",
    coronaryArteryDiseaseRiskLevel: ""
  });

  useEffect(() => {
    connectToMetaMask();
  }, []);

  const connectToMetaMask = async () => {
    try {
      if (window.ethereum) {
        const web3 = new Web3(window.ethereum);
        await window.ethereum.enable(); // Request account access
        setWeb3Instance(web3);
        console.log("✅ DoctorForm: MetaMask connected.");
      } else {
        console.error("❌ DoctorForm: MetaMask not detected. Please install MetaMask.");
      }
    } catch (error) {
      console.error("❌ DoctorForm: Error connecting to MetaMask:", error);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevData) => ({
      ...prevData,
      [name]: value,
    }));
    setErrors((prevErrors) => ({
      ...prevErrors,
      [name]: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log("⏳ DoctorForm: Form submitted with data:", formData);

    // Validate form fields
    let formValid = true;
    const newErrors = { ...errors };

    if (formData.patientWalletAddress.trim() === "") {
      newErrors.patientWalletAddress = "Patient Address is required";
      formValid = false;
    }
    if (formData.doctorAddress.trim() === "") {
      newErrors.doctorAddress = "Doctor Address is required";
      formValid = false;
    }
    if (formData.gender.trim() === "") {
      newErrors.gender = "Gender is required";
      formValid = false;
    }
    if (formData.diagnosis.trim() === "") {
      newErrors.diagnosis = "Diagnosis is required";
      formValid = false;
    }
    if (formData.prescription.trim() === "") {
      newErrors.prescription = "Prescription is required";
      formValid = false;
    }
    setErrors(newErrors);

    if (!formValid) {
      console.log("⚠️ DoctorForm: Form validation failed.");
      return;
    }

    console.log("✅ DoctorForm: Form validation passed.");
    try {
      const networkId = await web3Instance.eth.net.getId();
      console.log("🌐 DoctorForm: Network ID:", networkId);
      const deployedDoctorNetwork = DoctorForm.networks[networkId];
      if (!deployedDoctorNetwork) {
        throw new Error("DoctorForm contract not deployed to this network");
      }
      const accounts = await web3Instance.eth.getAccounts();
      console.log("👤 DoctorForm: Current accounts:", accounts);
      const doctorContract = new web3Instance.eth.Contract(
        DoctorForm.abi,
        deployedDoctorNetwork.address
      );
      console.log("Contract Address:", deployedDoctorNetwork.address);

      // Check that a file is selected (if required)
      if (!file) {
        alert("Please upload a prescription file.");
        return;
      }
      const fileBuffer = await file.arrayBuffer();
      const ipfsResponse = await ipfs.add(Buffer.from(fileBuffer), { pin: true });
      if (!ipfsResponse || !ipfsResponse.cid) {
        console.error("❌ DoctorForm: IPFS upload failed: No CID received.");
        alert("IPFS upload failed. Please try again.");
        return;
      }
      const cidString = ipfsResponse.path
        ? ipfsResponse.path
        : ipfsResponse.cid.toString();
      console.log("✅ DoctorForm: IPFS Upload Successful. CID:", cidString);

      // Send the EHR record (including doctor's predictions) to DoctorForm.sol
      console.log("📤 DoctorForm: Sending EHR to DoctorForm.sol");
      console.log("  Record ID:", recId);
      console.log("  Patient Wallet Address:", formData.patientWalletAddress);
      console.log("  Doctor Wallet Address:", formData.doctorAddress);
      console.log("  Gender:", formData.gender);
      console.log("  Diagnosis:", formData.diagnosis);
      console.log("  Prescription:", formData.prescription);
      console.log("  Doctor's CHD %:", formData.coronaryHeartDiseasePercentage);
      console.log("  Doctor's Risk Level:", formData.coronaryArteryDiseaseRiskLevel);

      const createEhrTx = await doctorContract.methods
        .createEHR(
          recId,
          formData.patientWalletAddress,
          formData.doctorAddress,
          formData.gender,
          formData.diagnosis,
          formData.prescription,
          formData.coronaryHeartDiseasePercentage,
          formData.coronaryArteryDiseaseRiskLevel
        )
        .send({ from: formData.doctorAddress });
      console.log("✅ DoctorForm: createEHR transaction successful:", createEhrTx.transactionHash);

      // --------------------------
      // New: Call PatientRegistration.sol to update doctor's prediction
      // --------------------------
      const deployedPatientNetwork = PatientRegistration.networks[networkId];
      if (!deployedPatientNetwork) {
        console.error("❌ DoctorForm: PatientRegistration contract not deployed on this network");
        return;
      }
      const patientContract = new web3Instance.eth.Contract(
        PatientRegistration.abi,
        deployedPatientNetwork.address
      );
      console.log("📤 DoctorForm: Sending doctor's prediction data to PatientRegistration.sol");
      // We call a new function (here named updateDoctorPrediction) that you will implement in PatientRegistration.sol.
      // It takes the patient wallet address, doctor's predicted percentage, and doctor's risk level.
      const patientUpdateTx = await patientContract.methods
        .updateDoctorPrediction(
          formData.patientWalletAddress,
          formData.coronaryHeartDiseasePercentage,
          formData.coronaryArteryDiseaseRiskLevel
        )
        .send({ from: formData.doctorAddress });
      console.log("✅ DoctorForm: PatientRegistration update transaction successful:", patientUpdateTx.transactionHash);

      // --------------------------
      // Existing: Upload prescription file with UploadEhr.sol
      // --------------------------
      const deployedUploadNetwork = UploadEhr.networks[networkId];
      if (!deployedUploadNetwork) {
        console.error("❌ DoctorForm: UploadEhr contract not deployed on this network");
        return;
      }
      const uploadEhrContract = new web3Instance.eth.Contract(
        UploadEhr.abi,
        deployedUploadNetwork.address
      );
      const timestamp = new Date().toISOString();
      const uploadEhrTx = await uploadEhrContract.methods
        .addRecord(formData.patientWalletAddress, timestamp, cidString)
        .send({ from: formData.doctorAddress });
      console.log("✅ DoctorForm: UploadEhr record created successfully. Transaction:", uploadEhrTx.transactionHash);

      console.log("✅ DoctorForm: EHR created successfully.");
      setFormData({
        patientWalletAddress: "",
        doctorAddress: "",
        gender: "",
        diagnosis: "",
        prescription: "",
        coronaryHeartDiseasePercentage: "",
        coronaryArteryDiseaseRiskLevel: ""
      });
      const newRecId = "EHR" + uuidv4();
      setRecId(newRecId);
      console.log("🔄 DoctorForm: Form reset. New recId:", newRecId);
      navigate(-1);
    } catch (error) {
      console.error("❌ DoctorForm: EHR creation failed:", error);
    }
  };

  const cancelOperation = async () => {
    try {
      navigate(-1);
    } catch (error) {
      console.error("❌ DoctorForm: Error navigating back:", error);
    }
  };

  return (
    <div>
      <NavBar_Logout />
      <div className="createehr min-h-screen flex items-center justify-center p-4 bg-gradient-to-b from-black to-gray-800 font-mono">
        <div className="w-full max-w-2xl">
          <h2 className="text-3xl text-white mb-6 font-bold text-center">
            Consultancy
          </h2>
          <form
            className="bg-gray-900 p-6 rounded-lg shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {/* <div>
              <label className="block text-white" htmlFor="recordId">
                Record Id :
              </label>
              <span className="mt-2 p-2 text-white font-bold">{recId}</span>
            </div> */}
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="patientWalletAddress">
                Patient Wallet Address:
              </label>
              <input
                type="text"
                id="patientWalletAddress"
                name="patientWalletAddress"
                value={formData.patientWalletAddress}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.patientWalletAddress && (
                <p className="text-red-500">{errors.patientWalletAddress}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="doctorAddress">
                Doctor Wallet Address:
              </label>
              <input
                type="text"
                id="doctorAddress"
                name="doctorAddress"
                value={formData.doctorAddress}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.doctorAddress && (
                <p className="text-red-500">{errors.doctorAddress}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="gender">
                Gender:
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              >
                <option value="">Select Gender</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="others">Others</option>
              </select>
              {errors.gender && (
                <p className="text-red-500">{errors.gender}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="diagnosis">
                Diagnosis:
              </label>
              <textarea
                id="diagnosis"
                name="diagnosis"
                value={formData.diagnosis}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white h-24 bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              ></textarea>
              {errors.diagnosis && (
                <p className="text-red-500">{errors.diagnosis}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="prescription">
                Prescription:
              </label>
              <textarea
                id="prescription"
                name="prescription"
                value={formData.prescription}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full h-24 text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              ></textarea>
              {errors.prescription && (
                <p className="text-red-500">{errors.prescription}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="prescriptionFile">
                Prescription File:
              </label>
              <input
                type="file"
                id="prescriptionFile"
                onChange={(e) => setFile(e.target.files[0])}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
            </div>
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="coronaryHeartDiseasePercentage">
                Heart Disease Prediction (%):
              </label>
              <input
                type="text"
                id="coronaryHeartDiseasePercentage"
                name="coronaryHeartDiseasePercentage"
                value={formData.coronaryHeartDiseasePercentage}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.coronaryHeartDiseasePercentage && (
                <p className="text-red-500">{errors.coronaryHeartDiseasePercentage}</p>
              )}
            </div>
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="coronaryArteryDiseaseRiskLevel">
                Heart Disease Risk Level:
              </label>
              <input
                type="text"
                id="coronaryArteryDiseaseRiskLevel"
                name="coronaryArteryDiseaseRiskLevel"
                value={formData.coronaryArteryDiseaseRiskLevel}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.coronaryArteryDiseaseRiskLevel && (
                <p className="text-red-500">{errors.coronaryArteryDiseaseRiskLevel}</p>
              )}
            </div>
            <div className="col-span-full">
              <center>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
                >
                  Create Record
                </button>
              </center>
            </div>
          </form>
          <center>
            <button
              onClick={cancelOperation}
              className="px-5 py-2.5 text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
            >
              Cancel
            </button>
          </center>
        </div>
      </div>
    </div>
  );
};

export default DoctorConsultancy;
