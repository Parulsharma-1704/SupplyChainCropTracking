# ml-service/app.py
from flask import Flask, request, jsonify
from flask_cors import CORS
import os
from dotenv import load_dotenv
import sys
from datetime import datetime

# Add project path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Load environment variables
load_dotenv()

# Import modules
from models.price_predictor import PricePredictor
from utils.logger import setup_logger
from api.predict import predict_price_route

# Setup logger
logger = setup_logger('ml_service')

# Initialize Flask app
app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Initialize ML model
predictor = PricePredictor()
model_loaded = False

def load_model_on_startup():
    """Load ML model when app starts"""
    global model_loaded
    try:
        model_loaded = predictor.load_model()
        if model_loaded:
            logger.info("ML model loaded successfully")
        else:
            logger.warning("No trained model found. Please train first.")
    except Exception as e:
        logger.error(f"Error loading model: {e}")
        model_loaded = False

# Load model on startup
load_model_on_startup()

@app.route('/')
def home():
    """Root endpoint - API information"""
    return jsonify({
        'service': 'Supply Chain ML Service',
        'version': '1.0.0',
        'status': 'running',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat(),
        'endpoints': {
            'GET /': 'API information',
            'GET /health': 'Health check',
            'POST /api/predict': 'Predict crop price',
            'POST /api/train': 'Train/retrain model',
            'GET /api/model/info': 'Get model information'
        }
    })

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'model_loaded': model_loaded,
        'timestamp': datetime.now().isoformat()
    })

@app.route('/api/predict', methods=['POST'])
def predict():
    """Predict crop price - uses api.predict module"""
    return predict_price_route(request, predictor, model_loaded, logger)

@app.route('/api/train', methods=['POST'])
def train():
    """Train or retrain the model"""
    try:
        from training.train_model import train_and_save_model
        
        logger.info("Starting model training...")
        success = train_and_save_model()
        
        if success:
            # Reload the model
            global model_loaded
            model_loaded = predictor.load_model()
            
            return jsonify({
                'success': True,
                'message': 'Model trained successfully',
                'model_loaded': model_loaded
            }), 200
        else:
            return jsonify({
                'success': False,
                'error': 'Failed to train model'
            }), 500
            
    except Exception as e:
        logger.error(f"Training error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

@app.route('/api/model/info', methods=['GET'])
def model_info():
    """Get information about the loaded model"""
    try:
        if not model_loaded:
            return jsonify({
                'success': False,
                'error': 'Model not loaded'
            }), 404
        
        info = predictor.get_model_info()
        
        return jsonify({
            'success': True,
            'model_info': info
        }), 200
        
    except Exception as e:
        logger.error(f"Model info error: {e}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500

if __name__ == '__main__':
    port = int(os.getenv('FLASK_PORT', 5001))
    debug = os.getenv('FLASK_ENV', 'development') == 'development'
    
    print("\n" + "="*50)
    print("SUPPLY CHAIN ML SERVICE")
    print("="*50)
    print(f"Server: http://localhost:{port}")
    print(f"Model loaded: {model_loaded}")
    print(f"Debug mode: {debug}")
    print("="*50 + "\n")
    
    app.run(debug=debug, port=port, host='0.0.0.0')