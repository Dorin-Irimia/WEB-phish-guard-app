# PhishGuard ML Service

FastAPI microservice for AI-powered phishing detection using TensorFlow/Keras models.

## Features

- 🧠 **Text/SMS Analysis**: LSTM model for text-based phishing detection
- 🔗 **URL Analysis**: CNN model for malicious URL detection  
- 📧 **Email Analysis**: Combined model for email phishing (optional)
- 🚀 **Fast**: Native TensorFlow performance
- 🐳 **Docker Ready**: Easy deployment with Docker Compose

## Setup

### Option 1: Docker (Recommended)

```bash
# From project root
docker-compose up ml-service
```

### Option 2: Local Development

```bash
cd ml-service

# Create virtual environment
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the service
python app.py
```

The service will start on http://localhost:5000

## Model Files Required

Place your trained models in the `models/` directory:

```
ml-service/models/
├── text_model.h5           # Text LSTM model (required)
├── text_word_index.json    # Text vocabulary (required)
├── url_model.h5            # URL CNN model (required)
├── url_char_index.json     # URL character index (required)
└── email_model.h5          # Email model (optional)
```

### Converting TensorFlow.js Models Back to H5

If you only have TensorFlow.js models, you need the original `.h5` files from your Colab notebooks:

1. In Colab, save models as H5:
```python
# Instead of converting to TensorFlow.js, save as H5
model.save('text_model.h5')
```

2. Download the `.h5` files and place them in `ml-service/models/`

3. Copy vocabulary files:
```bash
cp apps/web/ml-models/text/text_word_index.json ml-service/models/
cp apps/web/ml-models/url/url_char_index.json ml-service/models/
```

## API Endpoints

### Health Check
```bash
GET http://localhost:5000/health
```

### Analyze Text
```bash
POST http://localhost:5000/analyze/text
Content-Type: application/json

{
  "text": "URGENT: Your account will be suspended. Click here to verify."
}

# Response:
{
  "score": 0.95,
  "is_phishing": true,
  "confidence": 0.95,
  "model_version": "text-lstm-v1"
}
```

### Analyze URL
```bash
POST http://localhost:5000/analyze/url
Content-Type: application/json

{
  "url": "http://paypal-secure-login-verify.tk"
}

# Response:
{
  "score": 0.87,
  "is_phishing": true,
  "confidence": 0.87,
  "model_version": "url-cnn-v1"
}
```

### Analyze Email
```bash
POST http://localhost:5000/analyze/email
Content-Type: application/json

{
  "subject": "Verify your account",
  "body": "Click here to verify your account immediately.",
  "sender": "noreply@paypal-verify.com"
}
```

## Testing

```bash
# Test health endpoint
curl http://localhost:5000/health

# Test text analysis
curl -X POST http://localhost:5000/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "URGENT: Click here to claim your prize!"}'

# Test URL analysis  
curl -X POST http://localhost:5000/analyze/url \
  -H "Content-Type: application/json" \
  -d '{"url": "http://paypal-secure.tk"}'
```

## Environment Variables

- `MODELS_DIR`: Directory containing model files (default: `./models`)
- `PORT`: Service port (default: 5000)

## Performance

- Cold start: ~2-3 seconds (model loading)
- Prediction latency: ~10-50ms per request
- Concurrent requests: Handled by Uvicorn workers

## Troubleshooting

**Models not loading:**
- Check that `.h5` files are in `models/` directory
- Verify file permissions
- Check logs: `docker-compose logs ml-service`

**Service unavailable:**
- Ensure port 5000 is not in use: `netstat -ano | findstr :5000`
- Check Docker container status: `docker ps`

**TensorFlow errors:**
- Ensure models were trained with compatible TensorFlow version
- Try re-exporting models from Colab

## Development

```bash
# Run with auto-reload
uvicorn app:app --reload --host 0.0.0.0 --port 5000

# Run tests (when implemented)
pytest tests/
```
