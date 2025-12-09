# ✅ **FINAL README.md (Copy–Paste as-is into your repo)**

```markdown
# Secure Medical Records Management Using Blockchain with ML-Based Heart Disease Prediction (2025)

A full-stack medical records system built on a **private blockchain** with integrated **machine learning** for real-time heart disease prediction.  
Patients, doctors, and diagnostic centres interact through a secure, tamper-proof, role-based platform where medical records and AI-generated health insights are stored with transparency and authenticity.

---

## 🚀 Features

### 🔗 Blockchain (EHR Management)
- Private blockchain built using **Ganache + Truffle**.
- Smart contracts written in **Solidity** for:
  - Patient, Doctor & Diagnostic Centre registration  
  - Medical record creation & updates  
  - Access control with expiry-based permissions  
- Records stored on **IPFS**, with immutable CIDs referenced on-chain.
- Role-based workflows: Patient → Doctor → Diagnostic Centre.

### 🤖 Machine Learning (Heart Disease Prediction)
- Predicts heart disease probability + risk level.
- Built using **NGBoost** with **Bayesian Optimization**.
- Flask API returns real-time predictions to the frontend.
- Predictions are saved to the patient’s blockchain profile.

---

## 🛠️ Tech Stack

### Blockchain & Web
- Ganache GUI  
- Truffle  
- Solidity  
- Web3.js / Ethers.js  
- MetaMask  
- React.js (TypeScript)  
- Node.js  

### Machine Learning
- Python  
- Flask  
- Scikit-learn  
- NGBoost  
- Pandas, NumPy  
- IPFS Desktop  

---

## 📁 Project Structure

Med Chain/
├── Heart-Disease-Prediction/
│   ├── heart_disease_app.py      # Flask API
│   ├── modelngb.pkl              # NGBoost model
│   ├── Heart_Disease_Classification.ipynb
│   ├── data.csv
│   └── static/templates          # UI assets for ML demo
│
└── Patients Record Management/
├── src/                      # React frontend
├── public/
├── package.json
└── smart-contracts/          # Solidity contracts

````

---

## 🧩 System Workflow

### 🧑‍⚕️ Patient
- Registers and logs into the blockchain.
- Uploads/view medical records (IPFS + blockchain timestamp).
- Runs heart disease prediction → receives probability & risk level.
- Predicted results are saved in their profile on-chain.
- Can request appointments from doctors.
- Grants time-limited access permissions to doctors.

### 👨‍⚕️ Doctor
- Views consultation requests → accept or waitlist.
- After acceptance, can access patient bio for a limited time.
- Reviews patient history and adds medical updates.
- Cardiologists enter heart disease assessments manually.

### 🧪 Diagnostic Centre
- Views doctor-issued prescriptions.
- Uploads diagnostic reports for patients using their blockchain ID.

---

## 🔒 Access Control

- Doctors can only view patient data **after** accepting the consultation request.
- Patients can set an **expiration time** to limit doctor access.
- All medical updates require the **patient’s blockchain ID**, issued by the hospital (private chain).

---

## 🧠 Novelty / Contributions
- **Dynamic Base Learner Selection** for NGBoost.
- **NGBoost + Bayesian Optimization** for higher predictive accuracy.
- Tight integration of **AI predictions into blockchain EHR**.
- Full role-based medical workflow deployed on a private blockchain.

---

## 🏁 Getting Started

### 1️⃣ Start Blockchain
```bash
ganache-gui
````

### 2️⃣ Deploy Smart Contracts

```bash
truffle compile
truffle migrate --network development
```

### 3️⃣ Start ML Prediction API

```bash
cd Med Chain/Heart-Disease-Prediction
python heart_disease_app.py
```

### 4️⃣ Start React Frontend

```bash
cd Med Chain/Patients Record Management
npm install
npm start
```

Open: **[http://localhost:3000](http://localhost:3000)**

---

## 📌 Future Enhancements

* Multi-hospital network via consortium chain.
* Zero-knowledge proofs for privacy-preserving validation.
* HIPAA-compliant production deployment.

---

## 👤 Author

**Joshua S (2025)**
Master’s Thesis Project — Blockchain + Machine Learning Integrated Medical System



Just tell me what you need.
```
