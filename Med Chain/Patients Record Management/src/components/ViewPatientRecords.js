import React, { useEffect, useState } from "react";
import Web3 from "web3";
import UploadEhr from "../build/contracts/UploadEhr.json";
import PatientRegistration from "../build/contracts/PatientRegistration.json";
import { useNavigate, useParams } from "react-router-dom";
import "../CSS/ContractInteraction.css";
import axios from "axios";
import NavBar_Logout from "./NavBar_Logout";

function formatTimestampCustom(isoString) {
  const date = new Date(isoString);
  // Get individual parts in the Asia/Kolkata time zone (IST)
  const weekday = date.toLocaleString("en-US", { weekday: 'short', timeZone: "Asia/Kolkata" });
  const month = date.toLocaleString("en-US", { month: 'short', timeZone: "Asia/Kolkata" });
  const day = date.toLocaleString("en-US", { day: '2-digit', timeZone: "Asia/Kolkata" });
  const year = date.toLocaleString("en-US", { year: 'numeric', timeZone: "Asia/Kolkata" });
  const time = date.toLocaleString("en-US", { 
    hour: '2-digit', 
    minute: '2-digit', 
    second: '2-digit', 
    hour12: true, 
    timeZone: "Asia/Kolkata" 
  });
  
  // Hard-code the GMT offset for IST and the label
  return `${weekday} ${month} ${day} ${year} ${time} GMT+0530 (Indian Standard Time)`;
}



function ViewPatientRecords() {
  const navigate = useNavigate();
  const { hhNumber } = useParams();
  const [web3, setWeb3] = useState(null);
  const [records, setRecords] = useState([]);
  const [patientDetails, setPatientDetails] = useState(null);

  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = PatientRegistration.networks[networkId];
          const patientContract = new web3Instance.eth.Contract(
            PatientRegistration.abi,
            deployedNetwork && deployedNetwork.address,
          );

          const result = await patientContract.methods.getPatientDetails(hhNumber).call();
          setPatientDetails(result);
        } else {
          console.log('Please install MetaMask extension');
        }
      } catch (error) {
        console.error('Error:', error);
      }
    };

    init();
  }, [hhNumber]);

  useEffect(() => {
    let intervalId;
    async function fetchRecords() {
      if (typeof window.ethereum !== "undefined" && patientDetails) {
        const web3 = new Web3(window.ethereum);
        try {
          await window.ethereum.enable();
          const networkId = await web3.eth.net.getId();
          const deployedNetwork = UploadEhr.networks[networkId];
          if (!deployedNetwork) {
            console.error("UploadEhr contract not deployed on this network");
            return;
          }
          const contractAddress = deployedNetwork.address;

          const uploadEhrContract = new web3.eth.Contract(
            UploadEhr.abi,
            contractAddress
          );

          console.log("Fetching records for patient address:", patientDetails.walletAddress);

          // Fetch records from the contract
          const fetchedRecords = await uploadEhrContract.methods
            .getRecords(patientDetails.walletAddress)
            .call();

          console.log("Fetched records:", fetchedRecords);
          setRecords(fetchedRecords);
        } catch (error) {
          console.error("Error fetching records:", error);
        }
      } else {
        console.error("Please install MetaMask extension.");
      }
    }

    if (patientDetails) {
      fetchRecords();
      intervalId = setInterval(fetchRecords, 5000); // poll every 5 seconds
    }
    return ()=> {
      if (intervalId) clearInterval(intervalId);
    };
  }, [patientDetails]);

  const cancelOperation = () => {
    navigate(-1);
  };

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-900 text-white p-10 font-mono">
        <h1 className="text-4xl font-bold text-center mb-10">Record Viewer (Total Records: {records.length}) </h1>
        <ul>
          {records.map((record, index) => (
            <li
              key={index}
              className="flex justify-between items-start border-white border p-5 mb-5 flex-wrap"
            >
              <div className="flex-none w-1/2 pr-5">
                <strong className="text-yellow-500">Record :</strong>{" "}
                {index + 1}
                <br />
                <strong className="text-yellow-500">Uploaded on : </strong>{" "}
                {formatTimestampCustom(record.timeStamp)}
                <br />
                <strong className="text-yellow-500">CID : </strong>{" "}
                {record.medicalRecordHash}
                <br />
              </div>

              <div className="flex-none">
                <a
                  href={`http://localhost:8081/ipfs/${record.medicalRecordHash}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <button className="px-8 py-3 rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105">
                    View
                  </button>
                </a>
              </div>
            </li>
          ))}
        </ul>
        <center>
          <button
            onClick={cancelOperation}
            className="px-20 py-5 text-white font-bold text-lg rounded-lg cursor-pointer bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Back
          </button>
        </center>
      </div>
    </div>
  );
}

export default ViewPatientRecords;
