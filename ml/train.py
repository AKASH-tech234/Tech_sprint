"""
Urban Issues Image Classifier Training Script
Uses the Kaggle urban-issues-dataset for training a CNN model with PyTorch
"""

import os
import json
import kagglehub
import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader
from torchvision import datasets, transforms, models
from PIL import Image
import numpy as np

# Configuration
IMG_SIZE = 224
BATCH_SIZE = 32
EPOCHS = 15
LEARNING_RATE = 0.001
DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")

# Category mapping - maps dataset folder names to standardized categories
CATEGORY_MAPPING = {
    "Potholes and RoadCracks": "ROAD_POTHOLE",
    "Garbage": "GARBAGE",
    "DamagedElectricalPoles": "STREETLIGHT",
    "Damaged concrete structures": "INFRASTRUCTURE",
    "DamagedRoadSigns": "ROAD_SIGNS",
    "DeadAnimalsPollution": "POLLUTION",
    "FallenTrees": "FALLEN_TREES",
    "Graffitti": "GRAFFITI",
    "IllegalParking": "ILLEGAL_PARKING"
}

# Department mapping for each category
DEPARTMENT_MAPPING = {
    "ROAD_POTHOLE": "Public Works Department (PWD)",
    "GARBAGE": "Sanitation Department",
    "STREETLIGHT": "Electrical Department",
    "INFRASTRUCTURE": "Public Works Department (PWD)",
    "ROAD_SIGNS": "Traffic Department",
    "POLLUTION": "Environmental Health Department",
    "FALLEN_TREES": "Parks & Recreation Department",
    "GRAFFITI": "Municipal Cleaning Department",
    "ILLEGAL_PARKING": "Traffic Police Department"
}

# Priority mapping
PRIORITY_MAPPING = {
    "ROAD_POTHOLE": "high",
    "GARBAGE": "medium",
    "STREETLIGHT": "high",
    "INFRASTRUCTURE": "high",
    "ROAD_SIGNS": "medium",
    "POLLUTION": "high",
    "FALLEN_TREES": "high",
    "GRAFFITI": "low",
    "ILLEGAL_PARKING": "low"
}


def download_dataset():
    """Download the urban issues dataset from Kaggle or use cached version"""
    # Check for cached dataset first
    cached_path = r"C:\Users\akash\.cache\kagglehub\datasets\akinduhiman\urban-issues-dataset\versions\19"
    
    if os.path.exists(cached_path):
        print(f"✅ Using cached dataset at: {cached_path}")
        return cached_path
    
    print("📥 Downloading dataset from Kaggle...")
    try:
        import kagglehub
        path = kagglehub.dataset_download("akinduhiman/urban-issues-dataset")
        print(f"✅ Dataset downloaded to: {path}")
        return path
    except Exception as e:
        print(f"❌ Failed to download dataset: {e}")
        print("💡 Please ensure you have internet connection or the dataset is cached.")
        raise


class CivicIssueClassifier(nn.Module):
    """CNN model for civic issue classification using transfer learning"""
    
    def __init__(self, num_classes):
        super(CivicIssueClassifier, self).__init__()
        # Use pretrained ResNet18 as backbone
        self.backbone = models.resnet18(weights=models.ResNet18_Weights.DEFAULT)
        
        # Replace the final fully connected layer
        num_features = self.backbone.fc.in_features
        self.backbone.fc = nn.Sequential(
            nn.Dropout(0.5),
            nn.Linear(num_features, 256),
            nn.ReLU(),
            nn.Dropout(0.3),
            nn.Linear(256, num_classes)
        )
    
    def forward(self, x):
        return self.backbone(x)


def get_data_transforms():
    """Get data augmentation transforms"""
    train_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.RandomHorizontalFlip(),
        transforms.RandomRotation(15),
        transforms.ColorJitter(brightness=0.2, contrast=0.2, saturation=0.2),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    val_transform = transforms.Compose([
        transforms.Resize((IMG_SIZE, IMG_SIZE)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], std=[0.229, 0.224, 0.225])
    ])
    
    return train_transform, val_transform


def train_model():
    """Main training function"""
    print(f"🖥️ Using device: {DEVICE}")
    
    # Download dataset
    dataset_path = download_dataset()
    
    # Get transforms
    train_transform, val_transform = get_data_transforms()
    
    print(f"\n📂 Loading data from: {dataset_path}")
    
    # Load full dataset to get class info
    full_dataset = datasets.ImageFolder(dataset_path, transform=train_transform)
    class_names = full_dataset.classes
    num_classes = len(class_names)
    
    print(f"\n📊 Found {num_classes} classes:")
    
    # Create class mappings
    class_to_idx = full_dataset.class_to_idx
    idx_to_class = {v: k for k, v in class_to_idx.items()}
    
    index_to_category = {}
    for folder_name, index in class_to_idx.items():
        category = CATEGORY_MAPPING.get(folder_name, folder_name.upper().replace(" ", "_"))
        index_to_category[index] = {
            "category": category,
            "original_name": folder_name,
            "department": DEPARTMENT_MAPPING.get(category, "General Municipal Department"),
            "priority": PRIORITY_MAPPING.get(category, "medium")
        }
        print(f"  {index}: {folder_name} -> {category}")
    
    # Split dataset
    train_size = int(0.8 * len(full_dataset))
    val_size = len(full_dataset) - train_size
    train_dataset, val_dataset = torch.utils.data.random_split(
        full_dataset, [train_size, val_size]
    )
    
    # Apply different transform to validation set
    val_dataset.dataset.transform = val_transform
    
    # Create data loaders
    train_loader = DataLoader(train_dataset, batch_size=BATCH_SIZE, shuffle=True, num_workers=0)
    val_loader = DataLoader(val_dataset, batch_size=BATCH_SIZE, shuffle=False, num_workers=0)
    
    print(f"\n📈 Dataset split: {train_size} training, {val_size} validation")
    
    # Save class mappings
    os.makedirs("model", exist_ok=True)
    
    mappings = {
        "class_to_idx": class_to_idx,
        "idx_to_class": idx_to_class,
        "index_to_category": {str(k): v for k, v in index_to_category.items()},
        "category_mapping": CATEGORY_MAPPING,
        "department_mapping": DEPARTMENT_MAPPING,
        "priority_mapping": PRIORITY_MAPPING,
        "num_classes": num_classes
    }
    
    with open("model/class_mappings.json", "w") as f:
        json.dump(mappings, f, indent=2)
    print("\n✅ Class mappings saved to model/class_mappings.json")
    
    # Create model
    model = CivicIssueClassifier(num_classes).to(DEVICE)
    
    # Loss and optimizer
    criterion = nn.CrossEntropyLoss()
    optimizer = optim.Adam(model.parameters(), lr=LEARNING_RATE)
    scheduler = optim.lr_scheduler.ReduceLROnPlateau(optimizer, mode='min', patience=3, factor=0.5)
    
    # Training loop
    print("\n🚀 Starting training...")
    best_val_acc = 0.0
    history = {"train_loss": [], "train_acc": [], "val_loss": [], "val_acc": []}
    
    for epoch in range(EPOCHS):
        # Training phase
        model.train()
        train_loss = 0.0
        train_correct = 0
        train_total = 0
        
        for batch_idx, (inputs, labels) in enumerate(train_loader):
            inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
            
            optimizer.zero_grad()
            outputs = model(inputs)
            loss = criterion(outputs, labels)
            loss.backward()
            optimizer.step()
            
            train_loss += loss.item()
            _, predicted = outputs.max(1)
            train_total += labels.size(0)
            train_correct += predicted.eq(labels).sum().item()
            
            if (batch_idx + 1) % 50 == 0:
                print(f"  Epoch {epoch+1}/{EPOCHS} - Batch {batch_idx+1}/{len(train_loader)} - Loss: {loss.item():.4f}")
        
        train_loss /= len(train_loader)
        train_acc = 100.0 * train_correct / train_total
        
        # Validation phase
        model.eval()
        val_loss = 0.0
        val_correct = 0
        val_total = 0
        
        with torch.no_grad():
            for inputs, labels in val_loader:
                inputs, labels = inputs.to(DEVICE), labels.to(DEVICE)
                outputs = model(inputs)
                loss = criterion(outputs, labels)
                
                val_loss += loss.item()
                _, predicted = outputs.max(1)
                val_total += labels.size(0)
                val_correct += predicted.eq(labels).sum().item()
        
        val_loss /= len(val_loader)
        val_acc = 100.0 * val_correct / val_total
        
        # Update learning rate
        scheduler.step(val_loss)
        
        # Save history
        history["train_loss"].append(train_loss)
        history["train_acc"].append(train_acc)
        history["val_loss"].append(val_loss)
        history["val_acc"].append(val_acc)
        
        print(f"Epoch {epoch+1}/{EPOCHS}: Train Loss: {train_loss:.4f}, Train Acc: {train_acc:.2f}% | Val Loss: {val_loss:.4f}, Val Acc: {val_acc:.2f}%")
        
        # Save best model
        if val_acc > best_val_acc:
            best_val_acc = val_acc
            torch.save(model.state_dict(), "model/civic_classifier_best.pth")
            print(f"  ✅ New best model saved! Val Acc: {val_acc:.2f}%")
    
    # Save final model
    torch.save(model.state_dict(), "model/civic_classifier.pth")
    print("\n✅ Final model saved to model/civic_classifier.pth")
    
    # Save training history
    with open("model/training_history.json", "w") as f:
        json.dump(history, f, indent=2)
    
    print(f"\n📊 Final Results:")
    print(f"   Best Validation Accuracy: {best_val_acc:.2f}%")
    
    return model, history


if __name__ == "__main__":
    train_model()
