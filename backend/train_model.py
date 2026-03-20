"""
Doctor Green - Model Training Script
=====================================
Dataset: https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset
Architecture: ResNet50 (Transfer Learning)

SETUP:
1. pip install kaggle torch torchvision pillow tqdm
2. Set up Kaggle API: https://www.kaggle.com/docs/api
3. Run: python train_model.py

The script will:
- Download the dataset from Kaggle
- Preprocess and create DataLoaders
- Train ResNet50 with transfer learning
- Evaluate on validation set
- Save model to backend/model/doctor_green_model.pt
- Save class names to backend/data/class_names.json
"""

import os
import json
import zipfile
import subprocess
import sys
import time

import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, models, transforms
from tqdm import tqdm

BASE_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.join(BASE_DIR, 'dataset')
MODEL_DIR = os.path.join(BASE_DIR, 'model')
DATA_OUT_DIR = os.path.join(BASE_DIR, 'data')
os.makedirs(MODEL_DIR, exist_ok=True)
os.makedirs(DATA_OUT_DIR, exist_ok=True)

MODEL_PATH = os.path.join(MODEL_DIR, 'doctor_green_model.pt')
CLASS_NAMES_PATH = os.path.join(DATA_OUT_DIR, 'class_names.json')

BATCH_SIZE = 32
NUM_EPOCHS = 10
LEARNING_RATE = 0.001
NUM_WORKERS = 2
DEVICE = torch.device('cuda' if torch.cuda.is_available() else 'cpu')


def download_dataset():
    """Download dataset from Kaggle."""
    train_dir = os.path.join(DATA_DIR, 'New Plant Diseases Dataset(Augmented)', 'New Plant Diseases Dataset(Augmented)', 'train')
    if os.path.exists(train_dir):
        print("[INFO] Dataset already exists. Skipping download.")
        return train_dir

    print("[INFO] Downloading dataset from Kaggle...")
    print("[INFO] Make sure kaggle.json is in ~/.kaggle/")
    os.makedirs(DATA_DIR, exist_ok=True)

    try:
        result = subprocess.run(
            ['kaggle', 'datasets', 'download', '-d', 'vipoooool/new-plant-diseases-dataset', '-p', DATA_DIR],
            capture_output=True, text=True, timeout=600
        )
        if result.returncode != 0:
            print(f"[ERROR] Kaggle download failed: {result.stderr}")
            print("[INFO] Please manually download the dataset from:")
            print("       https://www.kaggle.com/datasets/vipoooool/new-plant-diseases-dataset")
            print(f"       and extract to: {DATA_DIR}")
            sys.exit(1)

        zip_path = os.path.join(DATA_DIR, 'new-plant-diseases-dataset.zip')
        if os.path.exists(zip_path):
            print("[INFO] Extracting dataset...")
            with zipfile.ZipFile(zip_path, 'r') as z:
                z.extractall(DATA_DIR)
            os.remove(zip_path)
    except FileNotFoundError:
        print("[ERROR] kaggle CLI not found. Install with: pip install kaggle")
        print("[INFO] Alternatively, manually download from Kaggle and extract to:", DATA_DIR)
        sys.exit(1)

    # Find the train directory
    for root, dirs, files in os.walk(DATA_DIR):
        if 'train' in dirs and 'valid' in dirs:
            return os.path.join(root, 'train')

    print(f"[ERROR] Could not find train directory. Dataset structure may differ.")
    print(f"[INFO] Expected structure: {DATA_DIR}/*/train/ and {DATA_DIR}/*/valid/")
    sys.exit(1)


def find_data_dirs():
    """Find train and valid directories."""
    for root, dirs, files in os.walk(DATA_DIR):
        if 'train' in dirs and 'valid' in dirs:
            return os.path.join(root, 'train'), os.path.join(root, 'valid')
    return None, None


def get_transforms():
    train_transform = transforms.Compose([
        transforms.Resize((256, 256)),
        transforms.RandomCrop(224),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])
    val_transform = transforms.Compose([
        transforms.Resize((224, 224)),
        transforms.ToTensor(),
        transforms.Normalize([0.485, 0.456, 0.406],
                             [0.229, 0.224, 0.225])
    ])
    return train_transform, val_transform


def build_model(num_classes):
    print(f"[INFO] Building ResNet50 model for {num_classes} classes...")
    model = models.resnet50(weights=models.ResNet50_Weights.IMAGENET1K_V1)

    # Freeze early layers for faster training
    for name, param in model.named_parameters():
        if 'layer4' not in name and 'fc' not in name:
            param.requires_grad = False

    model.fc = nn.Linear(model.fc.in_features, num_classes)
    return model.to(DEVICE)


def train_epoch(model, loader, criterion, optimizer):
    model.train()
    running_loss, correct, total = 0.0, 0, 0
    for images, labels in tqdm(loader, desc='Training', leave=False):
        images, labels = images.to(DEVICE), labels.to(DEVICE)
        optimizer.zero_grad()
        outputs = model(images)
        loss = criterion(outputs, labels)
        loss.backward()
        optimizer.step()
        running_loss += loss.item()
        _, predicted = outputs.max(1)
        total += labels.size(0)
        correct += predicted.eq(labels).sum().item()
    return running_loss / len(loader), 100.0 * correct / total


def validate(model, loader, criterion):
    model.eval()
    running_loss, correct, total = 0.0, 0, 0
    with torch.no_grad():
        for images, labels in tqdm(loader, desc='Validating', leave=False):
            images, labels = images.to(DEVICE), labels.to(DEVICE)
            outputs = model(images)
            loss = criterion(outputs, labels)
            running_loss += loss.item()
            _, predicted = outputs.max(1)
            total += labels.size(0)
            correct += predicted.eq(labels).sum().item()
    return running_loss / len(loader), 100.0 * correct / total


def main():
    print("=" * 60)
    print(" Doctor Green - ResNet50 Training")
    print(f" Device: {DEVICE}")
    print("=" * 60)

    # Download dataset
    download_dataset()

    train_dir, val_dir = find_data_dirs()
    if not train_dir:
        print("[ERROR] Dataset not found. Please download manually.")
        sys.exit(1)

    print(f"[INFO] Train dir: {train_dir}")
    print(f"[INFO] Valid dir: {val_dir}")

    train_transform, val_transform = get_transforms()

    train_dataset = datasets.ImageFolder(train_dir, transform=train_transform)
    val_dataset = datasets.ImageFolder(val_dir, transform=val_transform)

    class_names = train_dataset.classes
    num_classes = len(class_names)
    print(f"[INFO] Found {num_classes} classes, {len(train_dataset)} train, {len(val_dataset)} val images")

    # Save class names
    with open(CLASS_NAMES_PATH, 'w') as f:
        json.dump(class_names, f, indent=2)
    print(f"[INFO] Saved class names to {CLASS_NAMES_PATH}")

    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True,
                              num_workers=NUM_WORKERS, pin_memory=True)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False,
                            num_workers=NUM_WORKERS, pin_memory=True)

    model = build_model(num_classes)
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(filter(lambda p: p.requires_grad, model.parameters()),
                           lr=LEARNING_RATE, weight_decay=1e-4)
    scheduler = optim.lr_scheduler.StepLR(optimizer, step_size=3, gamma=0.5)

    best_val_acc = 0.0
    history = []

    for epoch in range(1, NUM_EPOCHS + 1):
        start = time.time()
        train_loss, train_acc = train_epoch(model, train_loader, criterion, optimizer)
        val_loss, val_acc = validate(model, val_loader, criterion)
        scheduler.step()
        elapsed = time.time() - start

        history.append({
            'epoch': epoch, 'train_loss': train_loss, 'train_acc': train_acc,
            'val_loss': val_loss, 'val_acc': val_acc
        })

        print(f"Epoch [{epoch:02d}/{NUM_EPOCHS}] "
              f"Train: loss={train_loss:.4f} acc={train_acc:.2f}% | "
              f"Val: loss={val_loss:.4f} acc={val_acc:.2f}% | "
              f"Time: {elapsed:.1f}s")

        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), MODEL_PATH)
            print(f"  [SAVED] Best model at epoch {epoch} (val_acc={val_acc:.2f}%)")

    print("\n" + "=" * 60)
    print(f" Training Complete!")
    print(f" Best Validation Accuracy: {best_val_acc:.2f}%")
    print(f" Model saved: {MODEL_PATH}")
    print(f" Class names: {CLASS_NAMES_PATH}")
    print("=" * 60)

    # Save training history
    history_path = os.path.join(MODEL_DIR, 'training_history.json')
    with open(history_path, 'w') as f:
        json.dump(history, f, indent=2)
    print(f" Training history: {history_path}")


if __name__ == '__main__':
    main()
