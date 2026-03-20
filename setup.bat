@echo off
echo.
echo  Doctor Green - Setup Script (Windows)
echo  ======================================
echo.

REM ── Backend ──────────────────────────────────────────────────
echo [1/4] Setting up Python backend...
cd backend

python --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Python not found. Install from https://www.python.org
    pause
    exit /b 1
)

python -m venv venv
call venv\Scripts\activate.bat
pip install --upgrade pip -q
pip install -r requirements.txt -q
echo  Backend dependencies installed

REM ── Class names ──────────────────────────────────────────────
echo.
echo [2/4] Saving class names...
python -c "import json,os; classes=['Apple___Apple_scab','Apple___Black_rot','Apple___Cedar_apple_rust','Apple___healthy','Blueberry___healthy','Cherry_(including_sour)___Powdery_mildew','Cherry_(including_sour)___healthy','Corn_(maize)___Cercospora_leaf_spot Gray_leaf_spot','Corn_(maize)___Common_rust_','Corn_(maize)___Northern_Leaf_Blight','Corn_(maize)___healthy','Grape___Black_rot','Grape___Esca_(Black_Measles)','Grape___Leaf_blight_(Isariopsis_Leaf_Spot)','Grape___healthy','Orange___Haunglongbing_(Citrus_greening)','Peach___Bacterial_spot','Peach___healthy','Pepper,_bell___Bacterial_spot','Pepper,_bell___healthy','Potato___Early_blight','Potato___Late_blight','Potato___healthy','Raspberry___healthy','Soybean___healthy','Squash___Powdery_mildew','Strawberry___Leaf_scorch','Strawberry___healthy','Tomato___Bacterial_spot','Tomato___Early_blight','Tomato___Late_blight','Tomato___Leaf_Mold','Tomato___Septoria_leaf_spot','Tomato___Spider_mites Two-spotted_spider_mite','Tomato___Target_Spot','Tomato___Tomato_Yellow_Leaf_Curl_Virus','Tomato___Tomato_mosaic_virus','Tomato___healthy']; os.makedirs('data',exist_ok=True); open('data/class_names.json','w').write(json.dumps(classes,indent=2)); print('38 classes saved')"
call venv\Scripts\deactivate.bat
cd ..

REM ── Frontend ─────────────────────────────────────────────────
echo.
echo [3/4] Setting up React frontend...
node --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Node.js not found. Install from https://nodejs.org
    pause
    exit /b 1
)

cd frontend
call npm install --silent
cd ..

REM ── Done ─────────────────────────────────────────────────────
echo.
echo [4/4] Setup complete!
echo.
echo  =========================================
echo   HOW TO RUN
echo  =========================================
echo.
echo   Open TWO Command Prompt windows:
echo.
echo   Window 1 (Backend):
echo     cd backend
echo     venv\Scripts\activate
echo     python app.py
echo.
echo   Window 2 (Frontend):
echo     cd frontend
echo     npm start
echo.
echo   Then open: http://localhost:3000
echo.
echo   NOTE: Running in DEMO MODE until trained.
echo   To train: cd backend ^& python train_model.py
echo.
echo  =========================================
pause
