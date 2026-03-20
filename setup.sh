#!/bin/bash
# Doctor Green - One-Click Setup (Mac/Linux)
# Usage: bash setup.sh

set -e
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

echo ""
echo "🌿 Doctor Green - Setup Script"
echo "================================"

# ── Backend ──────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[1/4] Setting up Python backend...${NC}"
cd backend

if ! command -v python3 &>/dev/null; then
  echo "❌ Python 3 not found. Install from https://www.python.org"
  exit 1
fi

python3 -m venv venv
source venv/bin/activate
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo "✅ Backend dependencies installed"

# ── Class names (no training needed to run) ──────────────────
echo ""
echo -e "${GREEN}[2/4] Setting up class names...${NC}"
python3 -c "
import json, os
classes = [
  'Apple___Apple_scab','Apple___Black_rot','Apple___Cedar_apple_rust','Apple___healthy',
  'Blueberry___healthy','Cherry_(including_sour)___Powdery_mildew','Cherry_(including_sour)___healthy',
  'Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot','Corn_(maize)___Common_rust_',
  'Corn_(maize)___Northern_Leaf_Blight','Corn_(maize)___healthy',
  'Grape___Black_rot','Grape___Esca_(Black_Measles)','Grape___Leaf_blight_(Isariopsis_Leaf_Spot)','Grape___healthy',
  'Orange___Haunglongbing_(Citrus_greening)','Peach___Bacterial_spot','Peach___healthy',
  'Pepper,_bell___Bacterial_spot','Pepper,_bell___healthy',
  'Potato___Early_blight','Potato___Late_blight','Potato___healthy',
  'Raspberry___healthy','Soybean___healthy','Squash___Powdery_mildew',
  'Strawberry___Leaf_scorch','Strawberry___healthy',
  'Tomato___Bacterial_spot','Tomato___Early_blight','Tomato___Late_blight','Tomato___Leaf_Mold',
  'Tomato___Septoria_leaf_spot','Tomato___Spider_mites Two-spotted_spider_mite',
  'Tomato___Target_Spot','Tomato___Tomato_Yellow_Leaf_Curl_Virus','Tomato___Tomato_mosaic_virus','Tomato___healthy'
]
os.makedirs('data', exist_ok=True)
with open('data/class_names.json','w') as f:
  json.dump(classes, f, indent=2)
print('Saved 38 class names')
"
echo "✅ Class names ready"

deactivate
cd ..

# ── Frontend ─────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[3/4] Setting up React frontend...${NC}"
if ! command -v node &>/dev/null; then
  echo "❌ Node.js not found. Install from https://nodejs.org"
  exit 1
fi

cd frontend
npm install --silent
echo "✅ Frontend dependencies installed"
cd ..

# ── Done ─────────────────────────────────────────────────────
echo ""
echo -e "${GREEN}[4/4] Setup complete!${NC}"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${GREEN} HOW TO RUN${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "  Terminal 1 (Backend):"
echo "    cd backend"
echo "    source venv/bin/activate"
echo "    python app.py"
echo ""
echo "  Terminal 2 (Frontend):"
echo "    cd frontend"
echo "    npm start"
echo ""
echo "  Open browser: http://localhost:3000"
echo ""
echo -e "${YELLOW}  ⚠  Running in DEMO MODE (no trained model)${NC}"
echo "  For real AI predictions, run:"
echo "    cd backend && source venv/bin/activate"
echo "    python train_model.py"
echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
