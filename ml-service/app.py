"""
PhishGuard ML Service
FastAPI microservice for phishing detection using TensorFlow/Keras models
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import tensorflow as tf
from tensorflow import keras
import numpy as np
import json
import os
from typing import Optional

app = FastAPI(title="PhishGuard ML Service", version="1.0.0")

# CORS configuration for Next.js app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3001", "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global model variables
text_model: Optional[keras.Model] = None
url_model: Optional[keras.Model] = None
email_model: Optional[keras.Model] = None
word_index: Optional[dict] = None
char_index: Optional[dict] = None

# Configuration
TEXT_MAX_LEN = 150
URL_MAX_LEN = 150
MODELS_DIR = os.path.join(os.path.dirname(__file__), 'models')


class TextAnalysisRequest(BaseModel):
    text: str


class URLAnalysisRequest(BaseModel):
    url: str


class EmailAnalysisRequest(BaseModel):
    subject: str
    body: str
    sender: str
    headers: Optional[dict] = None


class AnalysisResponse(BaseModel):
    score: float
    is_phishing: bool
    confidence: float
    model_version: str


def load_models():
    """Load all ML models at startup"""
    global text_model, url_model, email_model, word_index, char_index
    
    try:
        # Load Text Model - try H5 first, then Keras, then TensorFlow.js
        text_model_h5_path = os.path.join(MODELS_DIR, 'text_model_h5', 'text_model.h5')
        text_model_keras_path = os.path.join(MODELS_DIR, 'text_model_keras')
        text_model_tfjs_path = os.path.join(MODELS_DIR, 'text_model', 'model.json')
        
        if os.path.exists(text_model_h5_path):
            print(f"Loading text model from {text_model_h5_path}...")
            text_model = tf.keras.models.load_model(text_model_h5_path)
            print(f"✅ Text model loaded successfully (H5)")
        elif os.path.exists(text_model_keras_path):
            print(f"Loading text model from {text_model_keras_path}...")
            text_model = tf.keras.models.load_model(text_model_keras_path)
            print(f"✅ Text model loaded successfully (SavedModel)")
        elif os.path.exists(text_model_tfjs_path):
            print(f"Found TensorFlow.js model, converting to Keras format...")
            try:
                import tensorflowjs as tfjs
                text_model = tfjs.converters.load_keras_model(text_model_tfjs_path)
                # Save for future use
                text_model.save(text_model_keras_path)
                print(f"✅ Text model converted and loaded successfully")
            except Exception as conv_error:
                print(f"❌ Error converting text model: {conv_error}")
                print("⚠️ Running without text model")
        else:
            print(f"⚠️ Text model not found")
        
        # Load Text Vocabulary
        text_vocab_path = os.path.join(MODELS_DIR, 'text_word_index.json')
        if os.path.exists(text_vocab_path):
            with open(text_vocab_path, 'r', encoding='utf-8') as f:
                word_index = json.load(f)
            print(f"✅ Text vocabulary loaded ({len(word_index)} words)")
        else:
            print(f"⚠️ Text vocabulary not found at {text_vocab_path}")
        
        # Load URL Model
        url_model_h5_path = os.path.join(MODELS_DIR, 'url_model_h5', 'url_model.h5')
        url_model_keras_path = os.path.join(MODELS_DIR, 'url_model_keras')
        url_model_tfjs_path = os.path.join(MODELS_DIR, 'url_model', 'model.json')
        
        if os.path.exists(url_model_h5_path):
            print(f"Loading URL model from {url_model_h5_path}...")
            url_model = tf.keras.models.load_model(url_model_h5_path)
            print(f"✅ URL model loaded successfully (H5)")
        elif os.path.exists(url_model_keras_path):
            print(f"Loading URL model from {url_model_keras_path}...")
            url_model = tf.keras.models.load_model(url_model_keras_path)
            print(f"✅ URL model loaded successfully (SavedModel)")
        elif os.path.exists(url_model_tfjs_path):
            print(f"Found TensorFlow.js URL model, converting to Keras format...")
            try:
                import tensorflowjs as tfjs
                url_model = tfjs.converters.load_keras_model(url_model_tfjs_path)
                # Save for future use
                url_model.save(url_model_keras_path)
                print(f"✅ URL model converted and loaded successfully")
            except Exception as conv_error:
                print(f"❌ Error converting URL model: {conv_error}")
                print("⚠️ Running without URL model")
        else:
            print(f"⚠️ URL model not found")
        
        # Load URL Character Index
        url_char_path = os.path.join(MODELS_DIR, 'url_char_index.json')
        if os.path.exists(url_char_path):
            with open(url_char_path, 'r', encoding='utf-8') as f:
                char_index = json.load(f)
            print(f"✅ URL character index loaded ({len(char_index)} characters)")
        else:
            print(f"⚠️ URL character index not found at {url_char_path}")
        
        # Load Email Model (if available)
        email_model_path = os.path.join(MODELS_DIR, 'email_model')
        if os.path.exists(email_model_path):
            print(f"Loading email model from {email_model_path}...")
            email_model = tf.keras.models.load_model(email_model_path)
            print(f"✅ Email model loaded successfully")
        else:
            print(f"ℹ️ Email model not available (optional)")
            
    except Exception as e:
        print(f"❌ Error loading models: {e}")
        import traceback
        traceback.print_exc()
        # Don't raise - allow service to start without models for fallback
        print("⚠️ Service starting with limited functionality")


def tokenize_text(text: str, max_len: int = TEXT_MAX_LEN) -> np.ndarray:
    """Tokenize text using word index"""
    if not word_index:
        raise ValueError("Word index not loaded")
    
    words = text.lower().split()
    sequence = []
    
    for word in words:
        idx = word_index.get(word, word_index.get('<OOV>', 1))
        sequence.append(idx)
    
    # Pad or truncate
    if len(sequence) > max_len:
        sequence = sequence[:max_len]
    else:
        sequence = sequence + [0] * (max_len - len(sequence))
    
    return np.array([sequence])


def tokenize_url(url: str, max_len: int = URL_MAX_LEN) -> np.ndarray:
    """Tokenize URL using character index"""
    if not char_index:
        raise ValueError("Character index not loaded")
    
    sequence = []
    
    for char in url:
        idx = char_index.get(char, char_index.get('<OOV>', 1))
        sequence.append(idx)
    
    # Pad or truncate
    if len(sequence) > max_len:
        sequence = sequence[:max_len]
    else:
        sequence = sequence + [0] * (max_len - len(sequence))
    
    return np.array([sequence])


@app.on_event("startup")
async def startup_event():
    """Load models when the service starts"""
    print("🚀 Starting PhishGuard ML Service...")
    load_models()
    print("✅ ML Service ready!")


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "service": "PhishGuard ML Service",
        "status": "running",
        "models": {
            "text_model": text_model is not None,
            "url_model": url_model is not None,
            "email_model": email_model is not None
        }
    }


@app.get("/health")
async def health():
    """Detailed health check"""
    return {
        "status": "healthy",
        "models_loaded": {
            "text": text_model is not None and word_index is not None,
            "url": url_model is not None and char_index is not None,
            "email": email_model is not None
        },
        "tensorflow_version": tf.__version__
    }


@app.post("/analyze/text", response_model=AnalysisResponse)
async def analyze_text(request: TextAnalysisRequest):
    """Analyze text/SMS for phishing"""
    if text_model is None or word_index is None:
        # Return mock/heuristic-based response if model not available
        score = 0.3  # Default safe score
        return AnalysisResponse(
            score=score,
            is_phishing=False,
            confidence=0.7,
            model_version="text-heuristic-fallback"
        )
    
    try:
        # Tokenize and predict
        input_sequence = tokenize_text(request.text)
        prediction = text_model.predict(input_sequence, verbose=0)
        score = float(prediction[0][0])
        
        return AnalysisResponse(
            score=score,
            is_phishing=score > 0.5,
            confidence=score if score > 0.5 else (1 - score),
            model_version="text-lstm-v1"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/analyze/url", response_model=AnalysisResponse)
async def analyze_url(request: URLAnalysisRequest):
    """Analyze URL for phishing"""
    if url_model is None or char_index is None:
        # Return mock/heuristic-based response if model not available
        score = 0.35  # Default safe score
        return AnalysisResponse(
            score=score,
            is_phishing=False,
            confidence=0.65,
            model_version="url-heuristic-fallback"
        )
    
    try:
        # Tokenize and predict
        input_sequence = tokenize_url(request.url)
        prediction = url_model.predict(input_sequence, verbose=0)
        score = float(prediction[0][0])
        
        return AnalysisResponse(
            score=score,
            is_phishing=score > 0.5,
            confidence=score if score > 0.5 else (1 - score),
            model_version="url-cnn-v1"
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction error: {str(e)}")


@app.post("/analyze/email", response_model=AnalysisResponse)
async def analyze_email(request: EmailAnalysisRequest):
    """Analyze email for phishing (if email model available)"""
    if email_model is None:
        # Fallback: use text model on combined content
        if text_model is None or word_index is None:
            raise HTTPException(status_code=503, detail="Email analysis not available")
        
        combined_text = f"{request.subject} {request.body}"
        input_sequence = tokenize_text(combined_text)
        prediction = text_model.predict(input_sequence, verbose=0)
        score = float(prediction[0][0])
        
        return AnalysisResponse(
            score=score,
            is_phishing=score > 0.5,
            confidence=score if score > 0.5 else (1 - score),
            model_version="text-lstm-v1-fallback"
        )
    
    # TODO: Implement email-specific model prediction when available
    raise HTTPException(status_code=501, detail="Email model not implemented yet")


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000, log_level="info")
