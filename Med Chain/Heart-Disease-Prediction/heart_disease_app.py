import numpy as np
import pickle
from flask import Flask, request, render_template
from web3 import Web3
import os
import json

# Connect to Blockchain
web3 = Web3(Web3.HTTPProvider("http://127.0.0.1:8545"))  # Change if using another provider

# Dynamically Fetch Contract ABI & Address from Truffle JSON
contract_dir = r"D:\Patients Record Management\Patients Record Management\src\build\contracts"
contract_file = os.path.join(contract_dir, "PatientRegistration.json")

with open(contract_file, 'r') as f:
    contract_json = json.load(f)

contract_abi = contract_json["abi"]

# Get the network ID using web3.net.version (available in web3.py)
network_id = list(contract_json["networks"].keys())[0]  # Pick the first available network

print(f"🔍 Detected Network ID: {network_id}")  # Debugging info

if network_id in contract_json["networks"]:
    contract_address = contract_json["networks"][network_id]["address"]
    print(f"✅ Loaded Contract Address: {contract_address}")
else:
    print(f"❌ Contract not found for network {network_id}. Try 'truffle migrate --reset'")
    print("ℹ️ Available networks in JSON:", contract_json["networks"].keys())  # Debugging info
    raise Exception(f"❌ Contract not deployed on network {network_id}.")


print(f"🔍 Contract ABI Loaded: {len(contract_abi)} methods available.")
# Initialize contract with the correct address and ABI
contract = web3.eth.contract(address=contract_address, abi=contract_abi)


# Load ML model
modelgb = pickle.load(open('modelsv.pkl', 'rb'))
modelrf = pickle.load(open('modelrf.pkl', 'rb'))
modelknn = pickle.load(open('modelknn.pkl', 'rb'))

# Create application
app = Flask(__name__)

# Bind home function to URL


@app.route('/')
def home():
    hh_number = request.args.get("hhNumber", "")
    patient_address = request.args.get("patientAddress", "")

    print(f"🔍 Flask Received hhNumber: {hh_number}")
    print(f"🔍 Flask Received patientAddress: {patient_address}")

    return render_template('index.html', hhNumber=hh_number, patientAddress=patient_address)

# Bind predict function to URL


@app.route('/showknn')
def showknn():
    return render_template('KNN.html')


@app.route('/showgb')
def showgb():
    return render_template('Heart Disease Classifier.html')


@app.route('/showrf')
def showrf():
    return render_template('Random_Forest.html')


def store_prediction_in_blockchain(hh_number, probability, risk_level, patient_address):
    try:
        print(f"🔹 Preparing to store prediction for HH Number: {hh_number}")
        
        # Fetch the patient's registered Ethereum address from the blockchain
        registered_patient_details = contract.functions.getPatientDetails(hh_number).call()
               
        print(f"🔹 Preparing to store prediction for HH Number: {hh_number}")
        print(f"🔍 Full Patient Details from Blockchain: {registered_patient_details}")

        
        registered_patient_address =  web3.to_checksum_address(registered_patient_details[0].strip()) # ✅ Extract correct field
        
         # Trim spaces and ensure lowercase comparison
        provided_patient_address =  web3.to_checksum_address(patient_address.strip())
        
        if not registered_patient_address.startswith("0x"):  # ❌ If it's not an Ethereum address
            print(f"❌ Error: Retrieved non-address value from blockchain: {registered_patient_address}")
            return

        print(f"🔹 Blockchain Registered Address: {registered_patient_address}")
        print(f"🔹 Provided Address: {provided_patient_address}")
        
        # ✅ Get the correct Ethereum account dynamically
        accounts = web3.eth.accounts
        if provided_patient_address not in accounts:
            print(f"❌ Error: Patient address {provided_patient_address} is not found in Ganache accounts.")
            return
        
        print(f"🔹 Sending transaction from: {provided_patient_address}")  # Debugging output
        
        print(f"🔹 Comparing addresses - Registered: {registered_patient_address.lower()} vs Provided: {patient_address.lower()}")
        # Validate if the addresses match
        if registered_patient_address.strip().lower() != patient_address.strip().lower():
            print(f"❌ Error: Patient address mismatch! Registered: {registered_patient_address}, Provided: {patient_address}")
            print(f"🔎 Fixing: Registered (lower): {registered_patient_address.strip().lower()}, Provided (lower): {patient_address.strip().lower()}")
            return


        # Ensure the patient is registered before storing the prediction
        is_registered = contract.functions.isRegisteredPatient(hh_number).call()
        print(f"🔹 Is patient registered? {is_registered}")
        if not is_registered:
            print(f"❌ Error: Patient with HH number {hh_number} is not registered on the blockchain.")
            return

        
         # 🔥 **Ensure that the correct patient address is set as the sender**
        # ✅ Make sure this is the registered account     
        print(f"🔹 Sending transaction from: {provided_patient_address}")  # Debugging output
        
        
        if provided_patient_address not in accounts:
            print(f"❌ Error: Patient address {provided_patient_address} is not found in Ganache accounts.")
            return

        # Ensure the account has enough funds to send a transaction
        balance = web3.eth.get_balance(provided_patient_address)
        if balance == 0:
            print(f"❌ Error: Account {provided_patient_address} has 0 ETH. Fund it in Ganache.")
            return
        valid_sender = provided_patient_address # if provided_patient_address in accounts else accounts[1]
        # Send transaction from the patient's own Ethereum address
        tx_hash = contract.functions.updateAIPrediction(
            hh_number, str(probability), risk_level
        ).transact({'from': valid_sender})

        # Wait for transaction confirmation
        receipt = web3.eth.wait_for_transaction_receipt(tx_hash)
        print("✅ Transaction receipt:", receipt)
        print(f"✅ Transaction Successful! Tx Hash: {receipt.transactionHash.hex()}")

        # Retrieve stored prediction
        stored_prediction = contract.functions.getAIPrediction(hh_number).call()
        print(f"🔎 Stored AI Prediction from Blockchain: {stored_prediction}")
    
    except Exception as e:
        print(f"❌ Error storing prediction in blockchain: {str(e)}")


@app.route('/predictgb', methods=['POST'])
def predictgb():
    
    # 🔎 Print full request data for debugging
    print(f"🔍 Full Request Data: {request.form.to_dict()}")
    
        # Get Patient HH Number from the URL query parameter
    patient_hh_number = request.form.get("hhNumber")  # ✅ Get it safely
    patient_address = request.form.get("patientAddress")  # ✅ Get it safely
    
    
    # 🔍 Debug: Print extracted details
    print(f"➡️ Extracted hhNumber: {patient_hh_number}")
    print(f"➡️ Extracted patientAddress: {patient_address}")
    
     # ✅ Fix: Ensure `hhNumber` and `patientAddress` are valid
    if not patient_hh_number:
        print("❌ Patient identifier missing")
        return "Patient identifier missing", 400

    if not patient_address or not patient_address.startswith("0x"):
        print("❌ Invalid or missing patient address")
        return "Invalid or missing patient address", 400
    
    print(f"➡️ Extracted hhNumber: {patient_hh_number}")
    print(f"➡️ Extracted patientAddress: {patient_address}")

    # Extract numeric features **excluding hhNumber and patientAddress**
    features = []
    for key in request.form:
        if key not in ["hhNumber", "patientAddress"]:  # ✅ Exclude non-numeric fields
            try:
                features.append(float(request.form.get(key)))  
            except ValueError:
                print(f"❌ Error: Could not convert {key}={request.form.get(key)} to float")
                return f"Invalid input detected: {key}={request.form.get(key)}", 400

    array_features = [np.array(features)]
    
    # Use predict_proba to get probabilities
    prob_array = modelgb.predict_proba(array_features)
    pos = prob_array[0][1] * 100  # Get probability of the positive class
    
    # Determine risk level based on probability
    if pos > 70:
        risk_level = "HIGH"
    elif pos > 40:
        risk_level = "MEDIUM"
    else:
        risk_level = "LOW"
    
    print(f"✅ Prediction stored for {patient_hh_number}: {pos}% - {risk_level}")
    # Store the prediction result in the blockchain for this patient
    store_prediction_in_blockchain(patient_hh_number, pos, risk_level, patient_address)

    # Return the result page with the computed values
    return render_template('Heart Disease Classifier.html',
                           result='Probability of having heart disease: ',
                           positive=pos,
                           res2=f'Risk is {risk_level}')

    
@app.route('/predictrf', methods=['POST'])
def predictrf():

    # Put all form entries values in a list
    features = [float(i) for i in request.form.values()]
    # Convert features to array
    array_features = [np.array(features)]
    # Predict features
    prediction = modelrf.predict(array_features)

    output = prediction

    x = modelrf.predict_proba(array_features)
    pos = x[0][1]
    pos = pos*100

    # neg = x[0][0]

    output = prediction

    # Check the output values and retrive the result with html tag based on the value
    if pos > 70:
        return render_template('Random_Forest.html',
                               result='Probablity of having heart disease: ', positive=pos, res2='Risk is HIGH')
    if pos > 40:
        return render_template('Random_Forest.html',
                               result='Probablity of having heart disease: ', positive=pos, res2='Risk is MEDIUM')
    else:
        return render_template('Random_Forest.html',
                               result='Probablity of having heart disease: ', positive=pos, res2='Risk is LOW')


@app.route('/predictknn', methods=['POST'])
def predictknn():

    # Put all form entries values in a list
    features = [float(i) for i in request.form.values()]
    # Convert features to array
    array_features = [np.array(features)]
    # Predict features
    prediction = modelknn.predict(array_features)

    output = prediction

    x = modelknn.predict_proba(array_features)
    pos = x[0][1]
    pos = pos*100

    # neg = x[0][0]

    output = prediction

    # Check the output values and retrive the result with html tag based on the value
    if pos > 70:
        return render_template('KNN.html',
                               result='Probablity of having heart disease: ', positive=pos, res2='Risk is HIGH')
    if pos > 40:
        return render_template('KNN.html',
                               result='Probablity of having heart disease: ', positive=pos, res2='Risk is MEDIUM')
    else:
        return render_template('KNN.html',
                               result='Probablity of having heart disease: ', positive=pos, res2='Risk is LOW')


if __name__ == '__main__':
    # Run the application
    app.run(host='127.0.0.1', port=5000)
