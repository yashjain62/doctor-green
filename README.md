# 🌿 Doctor Green – AI Plant Disease Detection System

## Project Structure

```
doctor-green/
├── backend/
│   ├── app.py                  ← Flask API server
│   ├── train_model.py          ← ResNet50 training script
│   ├── requirements.txt        ← Python dependencies
│   ├── model/
│   │   └── doctor_green_model.pt  ← Saved model (after training)
│   ├── data/
│   │   ├── class_names.json    ← Class labels (after training)
│   │   ├── disease_info.csv    ← Disease descriptions & prevention
│   │   └── supplement_info.csv ← Supplement & buy links
│   └── uploads/                ← Temp upload folder
└── frontend/
    ├── public/index.html
    ├── src/
    │   ├── App.js              ← Root with routing + language context
    │   ├── App.css             ← Global styles (glassmorphism green)
    │   ├── index.js
    │   ├── components/
    │   │   ├── Navbar.js
    │   │   └── Footer.js
    │   └── pages/
    │       ├── Home.js
    │       ├── Detect.js       ← Upload + Camera capture
    │       ├── Result.js       ← Disease result + Top 3 + History
    │       ├── Supplements.js
    │       └── Contact.js
    ├── .env                    ← API URL config
    └── package.json
```

---

## ⚡ Quick Start

### Step 1 – Backend Setup

```bash
cd doctor-green/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the API server (demo mode – no model required)
python app.py
```

The backend runs at **http://localhost:5000**

> **Demo Mode**: If no trained model exists, the backend returns mock predictions so you can test the full UI immediately.

---

### Step 2 – Frontend Setup

```bash
cd doctor-green/frontend

# Install dependencies
npm install

# Start development server
npm start
```

The frontend runs at **http://localhost:3000**

---

## 🤖 Train the AI Model (Optional but Recommended)

### Prerequisites
1. Kaggle account with API key set up
2. Place `kaggle.json` in `~/.kaggle/`
3. GPU recommended (but CPU works)

```bash
cd doctor-green/backend

# Install kaggle CLI
pip install kaggle

# Run training (auto-downloads dataset)
python train_model.py
```

### What the training script does:
1. **Downloads** the New Plant Diseases Dataset from Kaggle (~2.7 GB)
2. **Preprocesses** images with augmentation (flip, rotation, color jitter)
3. **Trains** ResNet50 with ImageNet pretrained weights (transfer learning)
4. **Evaluates** accuracy on validation set
5. **Saves** model → `backend/model/doctor_green_model.pt`
6. **Saves** class names → `backend/data/class_names.json`

### Expected Results:
- Training time: ~2 hrs (GPU) / ~12 hrs (CPU)
- Expected validation accuracy: **95%+**
- Dataset: 87,000+ images, 38 disease classes

### Manual Dataset Download:
If Kaggle CLI fails:
1. Download from: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
2. Extract to `backend/dataset/`
3. Run `python train_model.py`

---

## 🌐 API Endpoints

### `POST /predict`
Upload a leaf image for disease detection.

**Request:** `multipart/form-data` with `image` field

**Response:**
```json
{
  "status": "diseased",
  "top_prediction": "Apple___Cedar_apple_rust",
  "confidence": 99.1,
  "description": "Orange rust spots on leaves...",
  "prevention": "Remove nearby cedar trees...",
  "supplement": "Rust Protection Spray",
  "buy_link": "https://www.amazon.in/s?k=rust+protection+spray",
  "top3": [
    {"class": "Apple___Cedar_apple_rust", "confidence": 99.1},
    {"class": "Apple___Apple_scab", "confidence": 0.6},
    {"class": "Apple___Black_rot", "confidence": 0.3}
  ]
}
```

### `GET /supplements`
Returns all supplements.

### `GET /health`
Returns server + model status.

---

## 🔧 Features

| Feature | Details |
|---------|---------|
| AI Model | ResNet50, transfer learning, 38 classes |
| Disease Detection | Upload image or capture from camera |
| Result Display | Disease name, confidence bar, description, prevention |
| Supplement Guide | Product recommendations with Amazon buy links |
| Top 3 Predictions | With confidence progress bars |
| Scan History | Last 5 scans stored in localStorage |
| Language Toggle | English ↔ Hindi (complete UI translation) |
| Healthy Plant | Special green UI with care tips |
| Responsive | Works on mobile and desktop |

---

## 🌿 Supported Plant Diseases (38 Classes)

Apple (Scab, Black Rot, Cedar Apple Rust, Healthy), Blueberry, Cherry (Powdery Mildew), Corn (Cercospora, Common Rust, Northern Blight), Grape (Black Rot, Esca, Leaf Blight), Orange (Huanglongbing), Peach (Bacterial Spot), Pepper (Bacterial Spot), Potato (Early/Late Blight), Raspberry, Soybean, Squash (Powdery Mildew), Strawberry (Leaf Scorch), Tomato (8 diseases + Healthy)

---

## 🛠 Troubleshooting

**CORS error in browser:**
- Make sure `flask-cors` is installed and backend is running on port 5000

**Camera not working:**
- Browser requires HTTPS for camera access on non-localhost
- Use localhost for development

**Model not loading:**
- Run `python train_model.py` first OR use demo mode (no action needed)

**Port conflict:**
- Backend: change port in `app.py` → `app.run(port=XXXX)`
- Frontend: set `REACT_APP_API_URL=http://localhost:XXXX` in `.env`
