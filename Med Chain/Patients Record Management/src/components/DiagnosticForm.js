import React, { useState, useEffect } from "react";
import DiagnosticForm from "../build/contracts/DiagnosticForm.json";
import UploadEhr from "../build/contracts/UploadEhr.json";
import Web3 from "web3";
import { useNavigate, useParams } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import "../big_css/CreateEHR.css";
import { create } from 'ipfs-http-client';
import NavBar_Logout from "./NavBar_Logout";
import { Buffer } from 'buffer';

const ipfs = create({ url: "http://127.0.0.1:5002" });

const DiagnosticUpload = () => {
  const navigate = useNavigate();
  const { hhNumber } = useParams();
  const [web3Instance, setWeb3Instance] = useState(null);
  const [recId, setRecId] = useState("EHR" + uuidv4());
  const [formData, setFormData] = useState({
    patientName: "",
    doctorName: "",
    patientAddress: "",
    diagnosticAddress: "",
    age: "",
    gender: "",
    bg: ""
  });

  const [errors, setErrors] = useState({
    patientName: "",
    doctorName: "",
    patientAddress: "",
    diagnosticAddress: "",
    age: "",
    gender: "",
    bg: "",
    file: ""
  });

  const [file, setFile] = useState(null);
  const [cid, setCid] = useState(null);
  const [retrievedFileURL, setRetrievedFileURL] = useState(null);
  const fileInput = React.useRef(null);

  useEffect(() => {
    connectToMetaMask();
  }, []);

  const onFileChange = (event) => {
    setFile(event.target.files[0]);
    setErrors((prevErrors) => ({
      ...prevErrors,
      file: ""
    }));
  };

  const connectToMetaMask = async () => {
    try {
      if (window.ethereum) {
        const web3Instance = new Web3(window.ethereum);
        await window.ethereum.enable();
        setWeb3Instance(web3Instance);
      } else {
        console.error("MetaMask not detected. Please install MetaMask.");
      }
    } catch (error) {
      console.error("Error connecting to MetaMask:", error);
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

    let formValid = true;
    const newErrors = { ...errors };

    if (formData.patientName.trim() === "") {
      newErrors.patientName = "Patient Name is required";
      formValid = false;
    }
    if (formData.doctorName.trim() === "") {
      newErrors.doctorName = "Doctor Name is required";
      formValid = false;
    }
    if (formData.patientAddress.trim() === "") {
      newErrors.patientAddress = "Patient Address is required";
      formValid = false;
    }
    if (formData.diagnosticAddress.trim() === "") {
      newErrors.diagnosticAddress = "Diagnostic Address is required";
      formValid = false;
    }
    if (formData.age.trim() === "") {
      newErrors.age = "Age is required";
      formValid = false;
    }
    if (formData.gender.trim() === "") {
      newErrors.gender = "Gender is required";
      formValid = false;
    }
    if (formData.bg.trim() === "") {
      newErrors.bg = "Blood Group is required";
      formValid = false;
    }
    if (!file) {
      newErrors.file = "File upload is required";
      alert("Please upload a file.");
      formValid = false;
    }

    setErrors(newErrors);

    if (formValid) {
      let cidString;
      try {
        const networkId = await web3Instance.eth.net.getId();
        const deployedNetwork = DiagnosticForm.networks[networkId];
        if (!deployedNetwork) {
          throw new Error("Contract not deployed to this network");
        }

        console.log("Uploading file to IPFS...");

        if (!file) {
          console.error("No file selected for upload.");
          return;
        }

        let report;
        try {
          const fileBuffer = await file.arrayBuffer();
          report = await ipfs.add(Buffer.from(fileBuffer), { pin: true });

          if (!report || !report.cid) {
            console.error("IPFS upload failed: No CID received.");
            alert("IPFS upload failed. Please try again.");
            return;
          }



          console.log("IPFS Upload Response:", report);
          cidString = report.path ? report.path : report.cid.toString();

          console.log("IPFS Upload Successful. CID:", cidString);
          setCid(cidString);

          // Pin file to IPFS
          await fetch(`http://127.0.0.1:5002/api/v0/pin/add?arg=${cidString}`, {
            method: "POST",
          });

          alert("File uploaded successfully with CID: " + cidString);
        } catch (error) {
          console.error("IPFS upload failed:", error);
          return;
        }

        const contract = new web3Instance.eth.Contract(
          DiagnosticForm.abi,
          deployedNetwork.address
        );

        await contract.methods
          .createEHR(
            recId,
            formData.doctorName,
            formData.patientName,
            parseInt(formData.age),
            formData.gender,
            formData.bg,
            formData.diagnosticAddress,
            formData.patientAddress,
            cidString
          )
          .send({ from: formData.diagnosticAddress });

        console.log("EHR created successfully.");
        alert("EHR created successfully.");
        setRecId("EHR" + uuidv4());
      } catch (error) {
        console.error("EHR creation failed:", error);
      }
    }
  };


  const cancelOperation = async () => {
    try {
      navigate("/diagnostic/" + hhNumber);
    } catch (error) {
      console.error("Error checking permission:", error);
    }
  };

  const uploadEhr = async (e) => {
    e.preventDefault();
    let report;
    try {
      const networkId = await web3Instance.eth.net.getId();
      const deployedNetwork = UploadEhr.networks[networkId];
      if (!deployedNetwork) {
        throw new Error("Contract not deployed to this network");
      }
      if (!file) {
        alert("File not uploaded");
        return;
      }

      try {

        const fileBuffer = await file.arrayBuffer();
        report = await ipfs.add(Buffer.from(fileBuffer), { pin: true });

        if (!report || !report.cid) {
          console.error("Cannot create EHR: CID is undefined.");
          return;
        }

        if (!report || !report.cid.toString()) {
          console.error("Failed to upload file to IPFS.");
          return;
        }
        console.log("File successfully uploaded to IPFS:", report.cid.toString());

        const ehrContract = new web3Instance.eth.Contract(
          UploadEhr.abi,
          deployedNetwork.address
        );

        const timestamp = Date().toString();

        console.log("Storing record for patient address:", formData.patientAddress);

        await ehrContract.methods
          .addRecord(
            formData.patientAddress,
            timestamp,
            report.cid.toString()
          )
          .send({ from: formData.patientAddress });

      } catch (error) {
        console.error("Failed to store EHR in contract:", error);
      }

      if (report && report.cid) {
        console.log("IPFS Upload Response:", report);
        console.log("IPFS Upload Response:", JSON.stringify(report, null, 2));
        const cidString = report.path ? report.path : report.cid.toString();

        await fetch(`http://127.0.0.1:5002/api/v0/pin/add?arg=${cidString}`, {
          method: "POST",
        });
      } else {
        console.error("Failed to retrieve CID from IPFS upload.");
        return;
      }

      setFile(null);
      fileInput.current.value = "";
      navigate("/diagnostic/" + hhNumber);
    } catch (error) {
      console.error("EHR creation failed:", error);
    }
  };

  return (
    <div>
      <NavBar_Logout></NavBar_Logout>
      <div className="createehr min-h-screen flex items-center justify-center p-4 bg-gray-900 font-mono">
        <div className="w-full max-w-2xl">
          <h2 className="text-3xl text-white mb-6 font-bold text-center">
            Create Lab Report
          </h2>
          <form
            className="bg-gray-900 p-6 rounded-lg shadow-lg grid grid-cols-1 sm:grid-cols-2 gap-4"
            onSubmit={handleSubmit}
          >
            {/*}
            <div>
              <label className="block text-white" htmlFor="recordId">
                Record Id :
              </label>
              <span className="mt-2 p-2 text-white font-bold">{recId}</span>
            </div>
              */}
            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="doctorName">
                Doctor Name:
              </label>
              <input
                type="text"
                id="doctorName"
                name="doctorName"
                value={formData.doctorName}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.doctorName && (
                <p className="text-red-500">{errors.doctorName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="patientName">
                Patient Name:
              </label>
              <input
                type="text"
                id="patientName"
                name="patientName"
                value={formData.patientName}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.patientName && (
                <p className="text-red-500">{errors.patientName}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="age">
                Age:
              </label>
              <input
                type="number"
                id="age"
                name="age"
                value={formData.age}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.age && (
                <p className="text-red-500">{errors.age}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="gender">
                Gender
              </label>
              <select
                id="gender"
                name="gender"
                value={formData.gender}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              >
                <option value="">Select Gender</option>
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
              {errors.gender && (
                <p className="text-red-500">{errors.gender}</p>
              )}
            </div>

            <div className="mb-4">
              <label className="block font-bold text-white" htmlFor="bg">
                Blood Group
              </label>
              <select
                id="bg"
                name="bg"
                value={formData.bg}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              >
                <option value="">Select Blood Group</option>
                <option value="A+">A+</option>
                <option value="A-">A-</option>
                <option value="B+">B+</option>
                <option value="B-">B-</option>
                <option value="O+">O+</option>
                <option value="O-">O-</option>
                <option value="AB+">AB+</option>
                <option value="AB-">AB-</option>
              </select>
              {errors.bg && (
                <p className="text-red-500">{errors.bg}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                className="block font-bold text-white"
                htmlFor="patientAddress"
              >
                Patient Wallet Address:
              </label>
              <input
                type="text"
                id="patientAddress"
                name="patientAddress"
                value={formData.patientAddress}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.patientAddress && (
                <p className="text-red-500">{errors.patientAddress}</p>
              )}
            </div>

            <div className="mb-4">
              <label
                className="block font-bold text-white"
                htmlFor="diagnosticAddress"
              >
                Diagnostic Wallet Address:
              </label>
              <input
                type="text"
                id="diagnosticAddress"
                name="diagnosticAddress"
                value={formData.diagnosticAddress}
                onChange={handleInputChange}
                className="mt-2 p-2 w-full text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.diagnosticAddress && (
                <p className="text-red-500">{errors.diagnosticAddress}</p>
              )}
            </div>

            <div className="mb-4 col-span-full">
              <h2 className="text-white">Upload Final Report</h2>
              <input
                type="file"
                onChange={onFileChange}
                ref={fileInput}
                className="mt-2 p-2 text-white bg-gray-700 border border-gray-600 rounded-md hover:bg-gray-800 transition duration-200"
              />
              {errors.file && (
                <p className="text-red-500">{errors.file}</p>
              )}
            </div>

            <div className="col-span-full">
              <center>
                <button
                  type="submit"
                  className="px-5 py-2.5 text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
                >
                  Create Record
                </button>
                <button
                  onClick={uploadEhr}
                  className="px-5 py-2.5 text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
                >
                  Upload Report
                </button>
              </center>
            </div>
          </form>
          <center>
            <button
              onClick={cancelOperation}
              className="px-5 py-2.5 text-white font-bold text-lg rounded-lg cursor-pointer mt-3 mr-5 bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-200 transform hover:scale-105"
            >
              Cancel
            </button>
          </center>
        </div>
      </div>
    </div>
  );
};

export default DiagnosticUpload;