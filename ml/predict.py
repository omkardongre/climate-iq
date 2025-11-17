import sys
import json
import joblib
import numpy as np
import os
import warnings

# Suppress warnings (version mismatch, feature names) for cleaner logs
warnings.filterwarnings("ignore")

def predict_crop(n, p, k, temp, humidity, ph, rainfall):
    try:
        # Load model and encoder
        # Get absolute path to current directory
        current_dir = os.path.dirname(os.path.abspath(__file__))
        model_path = os.path.join(current_dir, 'crop_model.pkl')
        encoder_path = os.path.join(current_dir, 'label_encoder.pkl')
        
        if not os.path.exists(model_path) or not os.path.exists(encoder_path):
            return {"error": "Model files not found. Please train the model first."}
            
        model = joblib.load(model_path)
        encoder = joblib.load(encoder_path)
        
        # Prepare input
        input_data = np.array([[n, p, k, temp, humidity, ph, rainfall]])
        
        # Predict
        prediction_idx = model.predict(input_data)[0]
        prediction_prob = np.max(model.predict_proba(input_data))
        predicted_crop = encoder.inverse_transform([prediction_idx])[0]
        
        # Get top 3 predictions
        probs = model.predict_proba(input_data)[0]
        top3_indices = probs.argsort()[-3:][::-1]
        top3_crops = encoder.inverse_transform(top3_indices)
        top3_probs = probs[top3_indices]
        
        recommendations = []
        for crop, prob in zip(top3_crops, top3_probs):
            recommendations.append({
                "crop": crop,
                "confidence": float(prob)
            })
            
        return {
            "success": True,
            "recommended_crop": predicted_crop,
            "confidence": float(prediction_prob),
            "top_3": recommendations
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    # Read arguments
    if len(sys.argv) < 8:
        print(json.dumps({"error": "Insufficient arguments. Expected: N P K temp humidity ph rainfall"}))
        sys.exit(1)
        
    try:
        n = float(sys.argv[1])
        p = float(sys.argv[2])
        k = float(sys.argv[3])
        temp = float(sys.argv[4])
        humidity = float(sys.argv[5])
        ph = float(sys.argv[6])
        rainfall = float(sys.argv[7])
        
        result = predict_crop(n, p, k, temp, humidity, ph, rainfall)
        print(json.dumps(result))
        
    except ValueError:
        print(json.dumps({"error": "Invalid numeric arguments"}))
        sys.exit(1)
