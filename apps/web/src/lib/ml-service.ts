/**
 * ML Service Client
 * Communicates with Python FastAPI microservice for ML predictions
 */

const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5000';

interface MLResponse {
  score: number;
  is_phishing: boolean;
  confidence: number;
  model_version: string;
}

interface MLServiceHealth {
  status: string;
  models_loaded: {
    text: boolean;
    url: boolean;
    email: boolean;
  };
  tensorflow_version: string;
}

/**
 * Check if ML service is available
 */
export async function isMLServiceAvailable(): Promise<boolean> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000), // 2s timeout
    });
    
    if (!response.ok) return false;
    
    const health: MLServiceHealth = await response.json();
    return health.status === 'healthy';
  } catch (error) {
    console.warn('ML service unavailable:', error);
    return false;
  }
}

/**
 * Analyze text using ML model
 * @param text - Email or message content
 * @returns Score between 0-1 (1 = phishing) or null if service unavailable
 */
export async function analyzeTextML(text: string): Promise<number | null> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/analyze/text`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      console.error('ML text analysis failed:', response.status);
      return null;
    }

    const result: MLResponse = await response.json();
    console.log(`✅ Text ML analysis: score=${result.score.toFixed(3)}, model=${result.model_version}`);
    return result.score;
  } catch (error) {
    console.error('Error in text ML analysis:', error);
    return null;
  }
}

/**
 * Analyze URL using ML model
 * @param url - URL to analyze
 * @returns Score between 0-1 (1 = phishing) or null if service unavailable
 */
export async function analyzeUrlML(url: string): Promise<number | null> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/analyze/url`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ url }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      console.error('ML URL analysis failed:', response.status);
      return null;
    }

    const result: MLResponse = await response.json();
    console.log(`✅ URL ML analysis: score=${result.score.toFixed(3)}, model=${result.model_version}`);
    return result.score;
  } catch (error) {
    console.error('Error in URL ML analysis:', error);
    return null;
  }
}

/**
 * Analyze email using ML model
 * @param subject - Email subject
 * @param body - Email body
 * @param sender - Sender email address
 * @returns Score between 0-1 (1 = phishing) or null if service unavailable
 */
export async function analyzeEmailML(
  subject: string,
  body: string,
  sender: string
): Promise<number | null> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/analyze/email`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ subject, body, sender }),
      signal: AbortSignal.timeout(5000), // 5s timeout
    });

    if (!response.ok) {
      console.error('ML email analysis failed:', response.status);
      return null;
    }

    const result: MLResponse = await response.json();
    console.log(`✅ Email ML analysis: score=${result.score.toFixed(3)}, model=${result.model_version}`);
    return result.score;
  } catch (error) {
    console.error('Error in email ML analysis:', error);
    return null;
  }
}

/**
 * Get ML service status for debugging
 */
export async function getMLServiceStatus(): Promise<MLServiceHealth | null> {
  try {
    const response = await fetch(`${ML_SERVICE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(2000),
    });

    if (!response.ok) return null;

    return await response.json();
  } catch (error) {
    console.error('Error getting ML service status:', error);
    return null;
  }
}
