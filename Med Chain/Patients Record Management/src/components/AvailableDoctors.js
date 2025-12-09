import React, { useEffect, useState } from "react";
import Web3 from "web3";
import DoctorRegistration from "../build/contracts/DoctorRegistration.json";
import { useNavigate, useParams } from "react-router-dom";
import NavBar_Logout from "./NavBar_Logout";

const AvailableDoctors = () => {
  const { hhNumber } = useParams();
  const navigate = useNavigate();
  const [web3, setWeb3] = useState(null);
  const [contract, setContract] = useState(null);
  const [doctors, setDoctors] = useState([]);
  const [selectedSpecialization, setSelectedSpecialization] = useState("");
  const [selectedDesignation, setSelectedDesignation] = useState("");
  const [searchTime, setSearchTime] = useState(0);
  const [filteredCount, setFilteredCount] = useState(0);



  const handleSpecializationChange = (event) => {
    setSelectedSpecialization(event.target.value);
  };

  const handleDesignationChange = (event) => {
    setSelectedDesignation(event.target.value);
  };


  const [appliedFilters, setAppliedFilters] = useState({
    specialization: "",
    designation: "",
  });

  const applyFilters = () => {
    setAppliedFilters({
      specialization: selectedSpecialization,
      designation: selectedDesignation,
    });
  };

  useEffect(() => {
    const init = async () => {
      if (window.ethereum) {
        try {
          const web3Instance = new Web3(window.ethereum);
          setWeb3(web3Instance);

          const networkId = await web3Instance.eth.net.getId();
          const deployedNetwork = DoctorRegistration.networks[networkId];

          if (!deployedNetwork) {
            console.error("Contract not deployed on this network.");
            return;
          }

          const contractInstance = new web3Instance.eth.Contract(
            DoctorRegistration.abi,
            deployedNetwork.address
          );
          setContract(contractInstance);

          // Fetch all registered doctors
          const doctorList = await contractInstance.methods.getDoctorList().call();

          setDoctors(doctorList);
        } catch (error) {
          console.error("Error fetching doctors:", error);
        }
      }
    };

    init();
  }, []);

  return (
    <div>
      <NavBar_Logout />
      <div className="bg-gray-900 text-white p-10 font-mono min-h-screen flex flex-col items-center">
        <h1 className="text-4xl font-bold text-center mb-10">Available Doctors</h1>
        {doctors.length === 0 ? (
          <p className="text-xl text-yellow-500"> Doctors are not available now.</p>
        ) : (
          <>
            <div className="mb-6 flex flex-wrap gap-4 justify-center items-center">
              <select
                value={selectedSpecialization}
                onChange={handleSpecializationChange}
                className="p-3 border rounded-lg bg-gray-800 text-white"
              >
                <option value="">Select Specialization</option>
                {Array.from(new Set(doctors.map((doc) => doc.specialization))).map((spec, index) => (
                  <option key={index} value={spec}>
                    {spec}
                  </option>
                ))}
              </select>

              <select
                value={selectedDesignation}
                onChange={handleDesignationChange}
                className="p-3 border rounded-lg bg-gray-800 text-white"
              >
                <option value="">Select Designation</option>
                {Array.from(new Set(doctors.map((doc) => doc.designation))).map((des, index) => (
                  <option key={index} value={des}>
                    {des}
                  </option>
                ))}
              </select>

              {/* Align Search Button to the Right */}
              <button
                onClick={applyFilters}
                className="px-10 py-3 text-white rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg hover:shadow-purple-500/50 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
              >
                Search
              </button>
            </div>


            <ul>
              {doctors
                .filter((doctor) =>
                  (appliedFilters.specialization ? doctor.specialization === appliedFilters.specialization : true) &&
                  (appliedFilters.designation ? doctor.designation === appliedFilters.designation : true)
                )
                .map((doctor, index) => (

                  <card>
                    <li key={index} className="border p-5 mb-5 rounded-lg bg-gray-800">
                      <p>
                        <strong className="text-yellow-500">Doctor UserID:</strong> {doctor.hhNumber}
                      </p>
                      <p>
                        <strong className="text-yellow-500">Doctor Name:</strong> {doctor.doctorName}
                      </p>
                      <p>
                        <strong className="text-yellow-500">Specialization:</strong> {doctor.specialization}
                      </p>
                      <p>
                        <strong className="text-yellow-500">Department:</strong> {doctor.department}
                      </p>
                      <p>
                        <strong className="text-yellow-500">Designation:</strong> {doctor.designation}
                      </p>
                      <p>
                        <strong className="text-yellow-500">Hospital:</strong> {doctor.hospitalName}
                      </p>

                    </li>
                  </card>
                ))}
            </ul>
          </>
        )}
        <center>
          <button
            onClick={() => navigate(-1)}
            className="px-10 py-3 text-white rounded-lg bg-gradient-to-r from-purple-500 to-indigo-500 hover:shadow-lg hover:shadow-purple-500/50 hover:from-indigo-600 hover:to-purple-600 transition-all duration-50 transform hover:scale-105"
          >
            Back
          </button>
        </center>
      </div>
    </div>
  );
};
export default AvailableDoctors;