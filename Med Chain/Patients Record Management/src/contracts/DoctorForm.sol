// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

contract DoctorForm {
    struct Record {
        string recordId;
        address patientWalletAddress;
        address doctorAddress;
        string gender;
        string diagnosis;
        string prescription;
        string coronaryHeartDiseasePercentage;
        string coronaryArteryDiseaseRiskLevel;
    }

    mapping(address => Record[]) private records;

    event EHRCreated(
        string recordId,
        address patientWalletAddress,
        address doctorAddress,
        string gender,
        string diagnosis,
        string prescription,
        string coronaryHeartDiseasePercentage,
        string coronaryArteryDiseaseRiskLevel
    );

    function createEHR(
        string memory _recordId,
        address _patientWalletAddress,
        address _doctorAddress,
        string memory _gender,
        string memory _diagnosis,
        string memory _prescription,
        string memory _coronaryHeartDiseasePercentage,
        string memory _coronaryArteryDiseaseRiskLevel
    ) public {
        // Check if the record already exists for this doctor and record ID
        Record[] storage doctorRecords = records[msg.sender];
        for (uint i = 0; i < doctorRecords.length; i++) {
            if (
                keccak256(bytes(doctorRecords[i].recordId)) ==
                keccak256(bytes(_recordId))
            ) {
                revert("Record with this ID already exists for the doctor.");
            }
        }

        Record memory newRecord = Record(
            _recordId,
            _patientWalletAddress,
            _doctorAddress,
            _gender,
            _diagnosis,
            _prescription,
            _coronaryHeartDiseasePercentage,
            _coronaryArteryDiseaseRiskLevel
        );

        records[msg.sender].push(newRecord);

        emit EHRCreated(
            _recordId,
            _patientWalletAddress,
            _doctorAddress,
            _gender,
            _diagnosis,
            _prescription,
            _coronaryHeartDiseasePercentage,
            _coronaryArteryDiseaseRiskLevel
        );
    }

    function getRecords() public view returns (Record[] memory) {
        return records[msg.sender];
    }

    function getPatientRecordsByDoctor(
        address _doctor
    ) public view returns (Record[] memory) {
        return records[_doctor];
    }
}
