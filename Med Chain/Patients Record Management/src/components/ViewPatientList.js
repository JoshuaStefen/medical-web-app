import React, { useEffect, useState } from "react";
import Web3 from "web3";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import { useNavigate, useParams, Link } from "react-router-dom";
import "../CSS/ContractInteraction.css";
import NavBar_Logout from "./NavBar_Logout";

function ViewPatientList() {
  const navigate = useNavigate();
  const { hhNumber } = useParams();
  const [web3, setWeb3] = useState(null);
  const [patientList, setPatientList] = useState([]);
  const [doctorDetails, setDoctorDetails] = useState(null);
  const [acceptedPatients, setAcceptedPatients] = useState({});
  const [buttonStates, setButtonStates] = useState([]);



  useEffect(() => {
    const init = async () => {
      try {
        if (window.ethereum) {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = DoctorRegistration.networks[networkId];
          const patientListContract = new web3Instance.eth.Contract(
            DoctorRegistration.abi,
            deployedNetwork && deployedNetwork.address
          );

          const pList = await patientListContract.methods
            .getPatientList(hhNumber)
            .call();
          setPatientList(pList);
          setButtonStates(pList.reduce((acc, _, i) => ({ ...acc, [i]: false }), {}));

          const storedStates = JSON.parse(localStorage.getItem("acceptedPatients") || "{}");

          const initialStates = pList.reduce((acc, patient, i) => {
            const isAccepted = storedStates[patient.patient_number];
            return { ...acc, [i]: isAccepted || false };
          }, {});
          setButtonStates(initialStates);


          const result = await patientListContract.methods
            .getDoctorDetails(hhNumber)
            .call();
          setDoctorDetails(result);
        } else {
          console.log("Please install MetaMask extension");
        }
      } catch (error) {
        console.error("Error:", error);
      }
    };

    init();
  }, [hhNumber]);

  const removePatient = async (patientNumber) => {
    try {
      if (!web3) throw new Error("Web3 not initialized");
      await window.ethereum.enable();
      const networkId = await web3.eth.net.getId();
      const deployedNetwork = DoctorRegistration.networks[networkId];
      if (!deployedNetwork) {
        throw new Error("Contract not deployed to this network");
      }

      const doctorContract = new web3.eth.Contract(
        DoctorRegistration.abi,
        deployedNetwork.address
      );

      await doctorContract.methods
        .revokePermission(patientNumber, hhNumber)
        .send({ from: doctorDetails[0] });

      // Refresh patient list after removal
      const updatedPatientList = await doctorContract.methods
        .getPatientList(hhNumber)
        .call();
      setPatientList(updatedPatientList);

      // Optional: Provide user feedback (e.g., success message)
      console.log("Patient removed successfully");
    } catch (error) {
      console.error("Error removing patient:", error);
      // Optional: Provide user feedback (e.g., error message)
    }
  };

  const cancelOperation = () => {
    navigate(-1);
  };


  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-900 text-white p-10 font-mono">
        <h1 className="text-4xl font-bold text-center mb-10">
          Appointment History
        </h1>
        <ul>
          {patientList.map((patient, index) => (
            <li
              key={index}
              className="flex justify-between items-start border-white border p-5 mb-5 flex-wrap"
            >
              <div className="flex-none w-1/2 pr-5">
                <strong className="text-yellow-500"> Appointment ID :</strong>{" "}
                {`${new Date().toLocaleDateString('en-GB').split('/').join('-')}-${String(index + 1).padStart(3, "0")}`}
                <br />
                <strong className="text-yellow-500">Name : </strong>{" "}
                {patient.patient_name}
                <br />
              </div>
              <div className="flex-none">
                <button
                  onClick={() => {
                    const updatedStates = { ...buttonStates, [index]: true };

                    const stored = JSON.parse(localStorage.getItem("acceptedPatients") || "{}");
                    stored[patient.patient_number] = true;
                    localStorage.setItem("acceptedPatients", JSON.stringify(stored));

                    setButtonStates(updatedStates);

                    setTimeout(() => {
                      window.location.href = `/doctor/${patient.patient_number}/doctorviewpatient`;
                    }, 200);
                  }}
                  className={`relative px-8 py-3 rounded-lg text-white font-semibold duration-300 ease-in-out transition-all duration-50 transform hover:scale-105 ${buttonStates[index]
                    ? "bg-green-500 hover:bg-green-600"
                    : "bg-pink-600  hover:bg-gradient-to-r from-pink-600 hover:to-green-500 accept-glow"
                    }`}
                >
                  {buttonStates[index] ? "View" : "Accept"}
                </button>

                {"\u00A0\u00A0\u00A0\u00A0"}
                <button
                  onClick={() => removePatient(patient.patient_number)}
                  className="px-8 py-3 rounded-lg bg-orange-500 hover:bg-red-600 transition-all duration-50 transform hover:scale-105"
                >
                  Remove
                </button>
              </div>
            </li>
          ))}
        </ul>
        <center>
          <button
            type="button"
            onClick={cancelOperation}
            className="px-20 py-5 text-white font-bold text-lg rounded-lg cursor-pointer duration-300 ease-in bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Back
          </button>
        </center>
      </div>
    </div>
  );

}

export default ViewPatientList;
