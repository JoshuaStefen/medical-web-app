import React, { useEffect, useState } from "react";
import Web3 from "web3";
import DiagnosticRegistration from "../build/contracts/DiagnosticRegistration.json";
import { useNavigate, useParams } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";

const AvailableDiagnostics = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [diagnostics, setDiagnostics] = useState([]);

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = DiagnosticRegistration.networks[networkId];

          if (!deployedNetwork) {
            console.error("Contract not deployed on this network.");
            return;
          }

          const contractInstance = new web3Instance.eth.Contract(
            DiagnosticRegistration.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);

          // Fetch all registered diagnostics
          const diagnosticList = await contractInstance.methods.getDiagnosticList().call();
          setDiagnostics(diagnosticList);
        } catch (error) {
          console.error("Error fetching diagnostics:", error);
        }
      }
    };

    init();
  }, []);

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-900 text-white p-10 font-mono min-h-screen flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-10">Available Diagnostics</h1>
        {diagnostics.length === 0 ? (
          <p className="text-xl text-yellow-500"> Diagnostics are not available now .</p>
        ) : (
          <card>
            <ul>
              {diagnostics.map((diagnostic, index) => (
                <li key={index} className="border p-5 mb-5 rounded-lg bg-gray-800">
                  <p><strong className="text-yellow-500">Diagnostic UserID:</strong> {diagnostic.hhNumber}</p>
                  <p><strong className="text-yellow-500">Diagnostic Name:</strong> {diagnostic.diagnosticName}</p>
                  <p><strong className="text-yellow-500">Location:</strong> {diagnostic.diagnosticLocation}</p>
                  <p><strong className="text-yellow-500">Hospital:</strong> {diagnostic.hospitalName}</p>
                  <p><strong className="text-yellow-500">Email:</strong> {diagnostic.email}</p>
                </li>
              ))}
            </ul>
          </card>
        )}
        <center>
          <button
            onClick={() => navigate(-1)}
            className="px-10 py-3 text-white rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Back
          </button>
        </center>
      </div>
    </div>
  );
};

export default AvailableDiagnostics;
