import os
import json
import csv
import base64
import urllib.request
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image
import torch
import torch.nn as nn
from torchvision import models, transforms

app = Flask(__name__)
CORS(app)

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
MODEL_PATH = os.path.join(BASE_DIR, 'model', 'doctor_green_model.pt')
CLASS_NAMES_PATH = os.path.join(BASE_DIR, 'data', 'class_names.json')
DISEASE_INFO_PATH = os.path.join(BASE_DIR, 'data', 'disease_info.csv')
SUPPLEMENT_INFO_PATH = os.path.join(BASE_DIR, 'data', 'supplement_info.csv')
UPLOAD_FOLDER = os.path.join(BASE_DIR, 'uploads')
os.makedirs(UPLOAD_FOLDER, exist_ok=True)
os.makedirs(os.path.join(BASE_DIR, 'model'), exist_ok=True)

device = torch.device('cuda' if torch.cuda.is_available() else 'cpu')
model = None
class_names = []
disease_info = {}
supplement_info = {}


def download_model_if_needed():
    """Auto-download model from HuggingFace if MODEL_URL env var is set."""
    model_url = os.environ.get('MODEL_URL', '').strip()
    print(f"[INFO] MODEL_URL = '{model_url}'")

    if os.path.exists(MODEL_PATH):
        size = os.path.getsize(MODEL_PATH)
        print(f"[INFO] Model file found locally. Size: {size / 1024 / 1024:.1f} MB")
        if size < 1000000:
            print(f"[WARNING] Model file too small ({size} bytes), re-downloading...")
            os.remove(MODEL_PATH)
        else:
            return

    if not model_url:
        print("[WARNING] No MODEL_URL set and no local model found. Running in demo mode.")
        return

    print(f"[INFO] Downloading model from: {model_url}")
    print("[INFO] This may take 2-3 minutes...")
    try:
        os.makedirs(os.path.dirname(MODEL_PATH), exist_ok=True)
        import urllib.request
        def progress(count, block_size, total_size):
            if total_size > 0 and count % 100 == 0:
                pct = count * block_size * 100 / total_size
                print(f"[INFO] Download progress: {pct:.1f}%")
        urllib.request.urlretrieve(model_url, MODEL_PATH, reporthook=progress)
        size = os.path.getsize(MODEL_PATH)
        print(f"[INFO] Model downloaded. Size: {size / 1024 / 1024:.1f} MB")
    except Exception as e:
        print(f"[ERROR] Failed to download model: {e}")
        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)


def load_disease_info():
    global disease_info
    try:
        with open(DISEASE_INFO_PATH, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                disease_info[row['class'].strip()] = {
                    'description': row['description'].strip(),
                    'prevention': row['prevention'].strip(),
                    'supplement': row['supplement'].strip()
                }
        print(f"[INFO] Loaded {len(disease_info)} disease records.")
    except Exception as e:
        print(f"[ERROR] Loading disease_info.csv: {e}")


def load_supplement_info():
    global supplement_info
    try:
        with open(SUPPLEMENT_INFO_PATH, newline='', encoding='utf-8') as f:
            reader = csv.DictReader(f)
            for row in reader:
                supplement_info[row['class'].strip()] = {
                    'supplement': row['supplement'].strip(),
                    'buy_link': row['buy_link'].strip()
                }
        print(f"[INFO] Loaded {len(supplement_info)} supplement records.")
    except Exception as e:
        print(f"[ERROR] Loading supplement_info.csv: {e}")


def load_model():
    global model, class_names
    if not os.path.exists(CLASS_NAMES_PATH):
        print("[WARNING] class_names.json not found. Using default classes.")
        class_names = list(disease_info.keys())
        return

    with open(CLASS_NAMES_PATH, 'r') as f:
        class_names = json.load(f)

    if not os.path.exists(MODEL_PATH):
        print("[WARNING] Model file not found. Please train the model first using train_model.py")
        return

    try:
        num_classes = len(class_names)
        m = models.resnet50(weights=None)
        m.fc = nn.Linear(m.fc.in_features, num_classes)
        state = torch.load(MODEL_PATH, map_location=device)
        m.load_state_dict(state)
        m.to(device)
        m.eval()
        model = m
        print(f"[INFO] Model loaded. Classes: {num_classes}")
    except Exception as e:
        print(f"[ERROR] Loading model: {e}")


transform = transforms.Compose([
    transforms.Resize((224, 224)),
    transforms.ToTensor(),
    transforms.Normalize([0.485, 0.456, 0.406],
                         [0.229, 0.224, 0.225])
])


def predict_image(img: Image.Image):
    if model is None:
        # Demo mode: use image hash to vary results across different uploads
        import hashlib
        buf = BytesIO()
        img.save(buf, format='JPEG')
        h = int(hashlib.md5(buf.getvalue()[:1024]).hexdigest(), 16)

        all_classes = list(disease_info.keys())
        if not all_classes:
            all_classes = ['Apple___Cedar_apple_rust', 'Tomato___Early_blight', 'Potato___Late_blight']

        idx = h % len(all_classes)
        demo_class = all_classes[idx]
        conf = round(95.0 + (h % 50) / 10, 1)  # 95.0 – 99.9
        conf = min(conf, 99.9)

        # Pick 2 other classes for top3
        idx2 = (idx + 1) % len(all_classes)
        idx3 = (idx + 2) % len(all_classes)
        rem = round(100 - conf, 1)
        c2 = round(rem * 0.6, 1)
        c3 = round(rem * 0.4, 1)

        info = disease_info.get(demo_class, {})
        supp = supplement_info.get(demo_class, {})
        is_healthy = 'healthy' in demo_class.lower()
        return {
            'status': 'healthy' if is_healthy else 'diseased',
            'top_prediction': demo_class,
            'confidence': conf,
            'description': info.get('description', 'No description available.'),
            'prevention': info.get('prevention', 'No prevention info.'),
            'supplement': supp.get('supplement', '') if not is_healthy else '',
            'buy_link': supp.get('buy_link', '') if not is_healthy else '',
            'top3': [
                {'class': demo_class, 'confidence': conf},
                {'class': all_classes[idx2], 'confidence': c2},
                {'class': all_classes[idx3], 'confidence': c3},
            ],
            'demo_mode': True,
            'note': 'Running in DEMO mode. Train model with: python train_model.py for real predictions.'
        }

    img_tensor = transform(img).unsqueeze(0).to(device)
    with torch.no_grad():
        outputs = model(img_tensor)
        probs = torch.softmax(outputs, dim=1)[0]

    top3_idx = probs.topk(3).indices.tolist()
    top3_probs = probs.topk(3).values.tolist()

    top_class = class_names[top3_idx[0]]
    confidence = round(top3_probs[0] * 100, 2)
    is_healthy = 'healthy' in top_class.lower()

    info = disease_info.get(top_class, {})
    supp = supplement_info.get(top_class, {})

    top3 = [
        {'class': class_names[top3_idx[i]], 'confidence': round(top3_probs[i] * 100, 2)}
        for i in range(len(top3_idx))
    ]

    return {
        'status': 'healthy' if is_healthy else 'diseased',
        'top_prediction': top_class,
        'confidence': confidence,
        'description': info.get('description', 'No description available.'),
        'prevention': info.get('prevention', 'No prevention info.'),
        'supplement': supp.get('supplement', 'N/A') if not is_healthy else '',
        'buy_link': supp.get('buy_link', '#') if not is_healthy else '',
        'top3': top3
    }


@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Doctor Green API running', 'status': 'ok'})


@app.route('/predict', methods=['POST'])
def predict():
    try:
        img = None

        if 'image' in request.files:
            file = request.files['image']
            img = Image.open(file.stream).convert('RGB')

        elif request.is_json:
            data = request.get_json()
            if 'image' in data:
                img_data = data['image']
                if ',' in img_data:
                    img_data = img_data.split(',')[1]
                img_bytes = base64.b64decode(img_data)
                img = Image.open(BytesIO(img_bytes)).convert('RGB')

        if img is None:
            return jsonify({'error': 'No image provided'}), 400

        result = predict_image(img)
        return jsonify(result)

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/supplements', methods=['GET'])
def get_supplements():
    try:
        supps = []
        seen = set()
        for cls, data in supplement_info.items():
            s_name = data['supplement']
            if s_name not in seen:
                seen.add(s_name)
                supps.append({
                    'class': cls,
                    'supplement': s_name,
                    'buy_link': data['buy_link']
                })
        return jsonify({'supplements': supps})
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok',
        'model_loaded': model is not None,
        'classes_loaded': len(class_names),
        'diseases_loaded': len(disease_info)
    })


# Initialize
download_model_if_needed()
load_disease_info()
load_supplement_info()
load_model()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)