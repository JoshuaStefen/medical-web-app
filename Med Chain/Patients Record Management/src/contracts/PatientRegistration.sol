// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract PatientRegistration {
    struct Patient {
        address walletAddress;
        string name;
        string dateOfBirth;
        string gender;
        string bloodGroup;
        string homeAddress;
        string email;
        string hhNumber;
        string password;
        // ADD THESE FOR DOCTOR FORM INPUT
        string coronaryHeartDiseasePercentage;
        string coronaryArteryDiseaseRiskLevel;
    }

    // Define PatientList struct to store doctor permissions correctly
    struct PatientList {
        string patient_number;
        string patient_name;
    }
    // Add inside PatientRegistration.sol

    struct DoctorDiagnosis {
        string coronaryHeartDiseasePercentage;
        string coronaryArteryDiseaseRiskLevel;
    }

    mapping(address => DoctorDiagnosis) public doctorDiagnosisData;

    function updateDoctorPrediction(
        address _patientAddress,
        string memory _percentage,
        string memory _riskLevel
    ) public {
        doctorDiagnosisData[_patientAddress] = DoctorDiagnosis(
            _percentage,
            _riskLevel
        );
    }

    mapping(string => bool) public isPatientRegistered;
    mapping(string => Patient) public patients;
    mapping(string => PatientList[]) private Dpermission;
    mapping(string => mapping(string => bool)) public doctorPermissions;
    mapping(string => string) private aiPredictions; // Store AI Prediction separately
    mapping(string => string) private aiRiskLevels; // Store Risk Level separately

    mapping(string => string) private doctorPredictions;
    mapping(string => string) private doctorRiskLevels;
    mapping(address => address) public patientToDoctor;

    event PatientRegistered(
        string hhNumber,
        string name,
        address walletAddress
    );
    event AIPredictionUpdated(
        string hhNumber,
        string aiPrediction,
        string aiRiskLevel
    );

    event DebugAIPrediction(
    string hhNumber,
    string storedAIPrediction,
    string storedAIRiskLevel
    );


    function registerPatient(
        address _walletAddress,
        string memory _name,
        string memory _dateOfBirth,
        string memory _gender,
        string memory _bloodGroup,
        string memory _homeAddress,
        string memory _email,
        string memory _hhNumber,
        string memory _password
    ) external {
        require(!isPatientRegistered[_hhNumber], "Patient already registered");

        Patient memory newPatient = Patient({
            walletAddress: _walletAddress,
            name: _name,
            dateOfBirth: _dateOfBirth,
            gender: _gender,
            bloodGroup: _bloodGroup,
            homeAddress: _homeAddress,
            email: _email,
            hhNumber: _hhNumber,
            password: _password, // Store password in the struct
            coronaryHeartDiseasePercentage: "", // initially empty
            coronaryArteryDiseaseRiskLevel: "" // initially empty
        });

        patients[_hhNumber] = newPatient;
        isPatientRegistered[_hhNumber] = true;
        emit PatientRegistered(_hhNumber, _name, _walletAddress);
    }

    function isRegisteredPatient(
        string memory _hhNumber
    ) external view returns (bool) {
        return isPatientRegistered[_hhNumber];
    }

    // Add a function to validate patient's password
    function validatePassword(
        string memory _hhNumber,
        string memory _password
    ) external view returns (bool) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return
            keccak256(abi.encodePacked(_password)) ==
            keccak256(abi.encodePacked(patients[_hhNumber].password));
    }

    function updateAIPrediction(
        string memory _hhNumber,
        string memory _aiPrediction,
        string memory _aiRiskLevel
    ) external {
        require(isPatientRegistered[_hhNumber], "Patient not registered");

        //  Ensure the sender (msg.sender) is the registered patient
        require(
            msg.sender == patients[_hhNumber].walletAddress,
            "Unauthorized: Only the registered patient can update this."
        );

        // Set the predictions
        aiPredictions[_hhNumber] = _aiPrediction;
        aiRiskLevels[_hhNumber] = _aiRiskLevel;

        // Emit the existing event
        emit AIPredictionUpdated(_hhNumber, _aiPrediction, _aiRiskLevel);

        // Emit extra debug information
        emit DebugAIPrediction(_hhNumber, aiPredictions[_hhNumber], aiRiskLevels[_hhNumber]);
    }

    function getPatientDetails(
        string memory _hhNumber
    )
        external
        view
        returns (
            address walletAddress,
            string memory name,
            string memory dateOfBirth,
            string memory gender,
            string memory bloodGroup,
            string memory homeAddress,
            string memory email,
            string memory coronaryHeartDiseasePercentage,
            string memory coronaryArteryDiseaseRiskLevel
        )
    {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        Patient memory patient = patients[_hhNumber];
        return (
            patient.walletAddress,
            patient.name,
            patient.dateOfBirth,
            patient.gender,
            patient.bloodGroup,
            patient.homeAddress,
            patient.email,
            patient.coronaryHeartDiseasePercentage,
            patient.coronaryArteryDiseaseRiskLevel
        );
    }

    function isPermissionGranted(
        string memory _patientNumber,
        string memory _doctorNumber
    ) external view returns (bool) {
        return doctorPermissions[_patientNumber][_doctorNumber];
    }

    function getPatientWallet(
        string memory _hhNumber
    ) public view returns (address) {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return (
            // patients[_hhNumber].name,
            // patients[_hhNumber].gender,
            patients[_hhNumber].walletAddress //  Ensure this returns an Ethereum address
        );
    }

    function getAIPrediction(
        string memory _hhNumber
    )
        external
        view
        returns (string memory aiPrediction, string memory aiRiskLevel)
    {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return (aiPredictions[_hhNumber], aiRiskLevels[_hhNumber]);
    }

    function getPatientList(
        string memory _doctorNumber
    ) public view returns (PatientList[] memory) {
        return Dpermission[_doctorNumber];
    }

    function updateDoctorPrediction(
        string memory _hhNumber,
        string memory _prediction,
        string memory _riskLevel
    ) external {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        // Only doctor can update (optional: add check if msg.sender is a doctor)
        doctorPredictions[_hhNumber] = _prediction;
        doctorRiskLevels[_hhNumber] = _riskLevel;
    }

    function getDoctorPrediction(
        string memory _hhNumber
    )
        external
        view
        returns (string memory prediction, string memory riskLevel)
    {
        require(isPatientRegistered[_hhNumber], "Patient not registered");
        return (doctorPredictions[_hhNumber], doctorRiskLevels[_hhNumber]);
    }

    function requestDoctor(address _doctor) external {
        require(_doctor != address(0), "Invalid doctor address");
        patientToDoctor[msg.sender] = _doctor;
    }

    function getAssignedDoctor(
        address _patient
    ) external view returns (address) {
        return patientToDoctor[_patient];
    }

    function getDoctorDiagnosisData(address _patient) external view returns (string memory, string memory) {
    DoctorDiagnosis memory d = doctorDiagnosisData[_patient];
    return (d.coronaryHeartDiseasePercentage, d.coronaryArteryDiseaseRiskLevel);
}

}
