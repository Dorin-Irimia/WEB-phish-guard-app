# PhishGuard ML Service Setup Guide

## 📋 Prerequisites

- Python 3.11+ installed
- Docker Desktop (optional, for containerized deployment)
- Your trained model files from Colab (`.h5` format)

## 🚀 Quick Start

### Step 1: Get Your Model Files

You need the **original `.h5` model files** from your Colab notebooks, not the TensorFlow.js converted versions.

#### Option A: Re-export from Colab

In each Colab notebook, run:

```python
# For text model (PhishGuardText.ipynb)
model.save('text_model.h5')
from google.colab import files
files.download('text_model.h5')

# For URL model (PhishGuardURLs.ipynb)  
model.save('url_model.h5')
files.download('url_model.h5')
```

#### Option B: Convert from TensorFlow.js (if H5 not available)

```bash
# Install converter
pip install tensorflowjs

# Convert back to Keras H5
tensorflowjs_converter \
  --input_format=tfjs_layers_model \
  --output_format=keras_saved_model \
  apps/web/ml-models/text/tfjs_text_model/model.json \
  ml-service/models/text_model.h5
```

### Step 2: Copy Model Files

```bash
# Create models directory if not exists
mkdir -p ml-service/models

# Copy your downloaded H5 files
copy path\to\text_model.h5 ml-service\models\
copy path\to\url_model.h5 ml-service\models\

# Copy vocabulary files (already exist)
copy apps\web\ml-models\text\text_word_index.json ml-service\models\
copy apps\web\ml-models\url\url_char_index.json ml-service\models\
```

Your `ml-service/models/` should now have:
```
ml-service/models/
├── text_model.h5
├── text_word_index.json
├── url_model.h5
└── url_char_index.json
```

### Step 3: Start the ML Service

#### Option A: Docker (Recommended)

```bash
# Build and start the service
docker-compose up ml-service

# Or start everything (PostgreSQL + ML Service)
docker-compose up -d
```

#### Option B: Local Python

```bash
cd ml-service

# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Start the service
python app.py
```

The ML service will be available at **http://localhost:5000**

### Step 4: Verify It's Working

```bash
# Check health
curl http://localhost:5000/health

# Should return:
# {
#   "status": "healthy",
#   "models_loaded": {
#     "text": true,
#     "url": true,
#     "email": false
#   },
#   "tensorflow_version": "2.15.0"
# }
```

### Step 5: Test ML Predictions

```bash
# Test text analysis
curl -X POST http://localhost:5000/analyze/text ^
  -H "Content-Type: application/json" ^
  -d "{\"text\": \"URGENT: Your account will be suspended. Click here to verify.\"}"

# Should return something like:
# {
#   "score": 0.95,
#   "is_phishing": true,
#   "confidence": 0.95,
#   "model_version": "text-lstm-v1"
# }

# Test URL analysis
curl -X POST http://localhost:5000/analyze/url ^
  -H "Content-Type: application/json" ^
  -d "{\"url\": \"http://paypal-secure-login-verify.tk\"}"
```

### Step 6: Start Next.js App

The Next.js app is already configured to use the ML service:

```bash
# In a new terminal
bun run dev
```

The app will automatically detect and use the ML service if it's available at `http://localhost:5000`.

## 🔍 Testing the Integration

1. Open http://localhost:3001/analyze
2. Test with a phishing URL: `http://paypal-secure-login-verify.tk`
3. You should see:
   - Higher confidence scores (88%+ vs 80%)
   - "AI-powered detection" in the analysis message
   - Specific ML detection threats

## 🐛 Troubleshooting

### Problem: "ML service unavailable"

**Check if service is running:**
```bash
docker ps | findstr ml-service
# or
netstat -ano | findstr :5000
```

**Check logs:**
```bash
docker-compose logs ml-service
```

### Problem: "Text model not available"

**Verify model files exist:**
```bash
dir ml-service\models
```

Should show:
- text_model.h5
- text_word_index.json
- url_model.h5
- url_char_index.json

### Problem: TensorFlow errors in container

**Check TensorFlow version compatibility:**
```bash
# In container
docker exec -it phishguard-ml-service python -c "import tensorflow as tf; print(tf.__version__)"
```

Models should be trained with TensorFlow 2.x (ideally 2.15.x).

### Problem: CORS errors from Next.js

The ML service already has CORS configured for `http://localhost:3001`. If you're using a different port, update `app.py`:

```python
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:YOUR_PORT"],
    ...
)
```

## 📊 Performance

- **Cold start**: ~2-3 seconds (first request while models load)
- **Prediction latency**: ~10-50ms per request
- **Memory usage**: ~500MB (both models loaded)
- **Concurrent requests**: Handled by Uvicorn

## 🚀 Production Deployment

For production, add environment variables:

```bash
# .env
ML_SERVICE_URL=https://ml-service.yourdomain.com
```

And update Next.js config:
```typescript
// next.config.ts
env: {
  ML_SERVICE_URL: process.env.ML_SERVICE_URL
}
```

## 📝 API Documentation

Once the service is running, view interactive docs at:
- **Swagger UI**: http://localhost:5000/docs
- **ReDoc**: http://localhost:5000/redoc

## 🎯 Next Steps

1. ✅ Verify health endpoint returns `"status": "healthy"`
2. ✅ Test text and URL predictions with curl
3. ✅ Test from Next.js app at /analyze page
4. 🔄 (Optional) Add email model when ready
5. 🔄 (Optional) Add caching for common URLs
6. 🔄 (Optional) Add batch prediction endpoint

## 💡 Tips

- Models are loaded once at startup and cached in memory
- Service gracefully degrades if models are missing
- Next.js app falls back to heuristics if ML service is down
- Use Docker for consistent environment across development/production
