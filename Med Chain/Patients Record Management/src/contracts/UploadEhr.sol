// SPDX-License-Identifier: MIT
pragma solidity ^0.8;

contract UploadEhr {
    
    event RecordAdded(address indexed patient, address indexed creator, string timeStamp, string medicalRecordHash);

    struct PatientRecord {
        string timeStamp;
        string medicalRecordHash;
        address creator; // tracks who created the record
    }

    mapping(address => PatientRecord[]) private records;

    function addRecord(address _patient, string memory _timeStamp, string memory _medicalRecordHash) public {
        PatientRecord memory newRecord = PatientRecord(
            _timeStamp,
            _medicalRecordHash,
            msg.sender // the creator who calls this function
        );
        
        records[_patient].push(newRecord);
      //Emit the event right after adding the record:
        emit RecordAdded(_patient, msg.sender, _timeStamp, _medicalRecordHash);  
    }

    function getRecords(address _patient) public view returns (PatientRecord[] memory) {
        return records[_patient];
    }
}