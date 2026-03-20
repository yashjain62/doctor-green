import os
import json
import csv
import base64
import urllib.request
from io import BytesIO
from flask import Flask, request, jsonify
from flask_cors import CORS
from PIL import Image

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

model = None
class_names = []
disease_info = {}
supplement_info = {}


def download_model_if_needed():
    model_url = os.environ.get('MODEL_URL', '').strip()
    print(f"[INFO] MODEL_URL = '{model_url}'")
    if os.path.exists(MODEL_PATH):
        size = os.path.getsize(MODEL_PATH)
        print(f"[INFO] Model file found. Size: {size / 1024 / 1024:.1f} MB")
        if size > 1000000:
            return
        os.remove(MODEL_PATH)
    if not model_url:
        print("[WARNING] No MODEL_URL set. Running in demo mode.")
        return
    print("[INFO] Downloading model from HuggingFace...")
    try:
        urllib.request.urlretrieve(model_url, MODEL_PATH)
        print(f"[INFO] Model downloaded. Size: {os.path.getsize(MODEL_PATH) / 1024 / 1024:.1f} MB")
    except Exception as e:
        print(f"[ERROR] Download failed: {e}")
        if os.path.exists(MODEL_PATH):
            os.remove(MODEL_PATH)


def load_disease_info():
    global disease_info
    try:
        with open(DISEASE_INFO_PATH, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                disease_info[row['class'].strip()] = {
                    'description': row['description'].strip(),
                    'prevention': row['prevention'].strip(),
                    'supplement': row['supplement'].strip()
                }
        print(f"[INFO] Loaded {len(disease_info)} disease records.")
    except Exception as e:
        print(f"[ERROR] disease_info.csv: {e}")


def load_supplement_info():
    global supplement_info
    try:
        with open(SUPPLEMENT_INFO_PATH, newline='', encoding='utf-8') as f:
            for row in csv.DictReader(f):
                supplement_info[row['class'].strip()] = {
                    'supplement': row['supplement'].strip(),
                    'buy_link': row['buy_link'].strip()
                }
        print(f"[INFO] Loaded {len(supplement_info)} supplement records.")
    except Exception as e:
        print(f"[ERROR] supplement_info.csv: {e}")


def load_model():
    global model, class_names
    import torch, torch.nn as nn
    from torchvision import models as tv_models
    import gc

    if not os.path.exists(CLASS_NAMES_PATH):
        print("[WARNING] class_names.json not found.")
        class_names = list(disease_info.keys())
        return

    with open(CLASS_NAMES_PATH, 'r') as f:
        class_names = json.load(f)

    if not os.path.exists(MODEL_PATH):
        print("[WARNING] Model file not found. Running in demo mode.")
        return

    try:
        m = tv_models.resnet50(weights=None)
        m.fc = nn.Linear(m.fc.in_features, len(class_names))
        state = torch.load(MODEL_PATH, map_location='cpu', weights_only=True)
        m.load_state_dict(state)
        m.eval()
        gc.collect()
        model = m
        print(f"[INFO] Model loaded. Classes: {len(class_names)}")
    except Exception as e:
        print(f"[ERROR] Loading model: {e}")


def predict_image(img):
    if model is None:
        import hashlib
        buf = BytesIO()
        img.save(buf, format='JPEG')
        h = int(hashlib.md5(buf.getvalue()[:1024]).hexdigest(), 16)
        all_classes = list(disease_info.keys()) or ['Apple___Cedar_apple_rust']
        idx = h % len(all_classes)
        demo_class = all_classes[idx]
        conf = min(round(95.0 + (h % 50) / 10, 1), 99.9)
        rem = round(100 - conf, 1)
        idx2, idx3 = (idx + 1) % len(all_classes), (idx + 2) % len(all_classes)
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
                {'class': all_classes[idx2], 'confidence': round(rem * 0.6, 1)},
                {'class': all_classes[idx3], 'confidence': round(rem * 0.4, 1)},
            ],
            'demo_mode': True,
            'note': 'Running in DEMO mode. Model not loaded.'
        }

    import torch
    from torchvision import transforms
    tf = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406], [0.229, 0.224, 0.225])
    ])
    tensor = tf(img).unsqueeze(0)
    with torch.no_grad():
        probs = torch.softmax(model(tensor), dim=1)[0]
    top3_idx = probs.topk(3).indices.tolist()
    top3_probs = probs.topk(3).values.tolist()
    top_class = class_names[top3_idx[0]]
    confidence = round(top3_probs[0] * 100, 2)
    is_healthy = 'healthy' in top_class.lower()
    info = disease_info.get(top_class, {})
    supp = supplement_info.get(top_class, {})
    return {
        'status': 'healthy' if is_healthy else 'diseased',
        'top_prediction': top_class,
        'confidence': confidence,
        'description': info.get('description', 'No description available.'),
        'prevention': info.get('prevention', 'No prevention info.'),
        'supplement': supp.get('supplement', '') if not is_healthy else '',
        'buy_link': supp.get('buy_link', '') if not is_healthy else '',
        'top3': [{'class': class_names[top3_idx[i]], 'confidence': round(top3_probs[i] * 100, 2)} for i in range(3)]
    }


@app.route('/', methods=['GET'])
def index():
    return jsonify({'message': 'Doctor Green API running', 'status': 'ok'})


@app.route('/predict', methods=['POST'])
def predict():
    try:
        img = None
        if 'image' in request.files:
            img = Image.open(request.files['image'].stream).convert('RGB')
        elif request.is_json:
            data = request.get_json()
            if 'image' in data:
                img_data = data['image']
                if ',' in img_data:
                    img_data = img_data.split(',')[1]
                img = Image.open(BytesIO(base64.b64decode(img_data))).convert('RGB')
        if img is None:
            return jsonify({'error': 'No image provided'}), 400
        return jsonify(predict_image(img))
    except Exception as e:
        return jsonify({'error': str(e)}), 500


@app.route('/supplements', methods=['GET'])
def get_supplements():
    try:
        seen, supps = set(), []
        for cls, data in supplement_info.items():
            if data['supplement'] not in seen:
                seen.add(data['supplement'])
                supps.append({'class': cls, 'supplement': data['supplement'], 'buy_link': data['buy_link']})
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
    app.run(debug=False, host='0.0.0.0', port=5000)
