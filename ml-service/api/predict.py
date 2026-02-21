# ml-service/api/predict.py
from flask import jsonify
from datetime import datetime
import traceback

def get_fallback_prediction(features):
    """Fallback prediction when ML model is unavailable"""
    base_prices = {
        'Wheat': 45.0,
        'Rice': 65.0,
        'Corn': 35.0,
        'Pulses': 85.0,
        'Vegetables': 32.0,
        'Fruits': 55.0,
        'Sugarcane': 40.0,
        'Cotton': 60.0,
        'Soybean': 50.0
    }
    
    crop_type = features.get('crop_type', 'Wheat')
    quality = features.get('quality', 'Grade_A')
    quantity = features.get('quantity_kg', 1000)
    
    # Get base price
    base_price = base_prices.get(crop_type, 40.0)
    
    # Quality multipliers
    quality_multiplier = {
        'Premium': 1.2,
        'Grade_A': 1.0,
        'Grade_B': 0.8,
        'Grade_C': 0.6
    }
    
    # Region adjustment
    region = features.get('region', 'North')
    region_multiplier = {
        'North': 1.0,
        'South': 1.05,
        'East': 0.95,
        'West': 1.02
    }
    
    # Season adjustment
    season = features.get('season', 'Winter')
    season_multiplier = {
        'Winter': 1.0,
        'Spring': 1.1,
        'Summer': 0.95,
        'Autumn': 1.05
    }
    
    # Calculate price
    price = base_price
    price *= quality_multiplier.get(quality, 1.0)
    price *= region_multiplier.get(region, 1.0)
    price *= season_multiplier.get(season, 1.0)
    
    # Bulk discount
    if quantity > 5000:
        price *= 0.9  # 10% discount
    elif quantity > 2000:
        price *= 0.95  # 5% discount
    
    return round(price, 2)

def validate_input(data):
    """Validate input data for prediction"""
    required_fields = ['crop_type', 'region', 'quality', 'quantity_kg']
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return False, f"Missing required fields: {missing_fields}"
    
    # Validate quantity
    try:
        if float(data['quantity_kg']) <= 0:
            return False, "Quantity must be positive"
    except (ValueError, TypeError):
        return False, "Quantity must be a number"
    
    return True, "Valid"

def prepare_features(data):
    """Prepare features for prediction"""
    current_date = datetime.now()
    
    # Add default values for optional fields
    features = {
        'crop_type': data.get('crop_type'),
        'region': data.get('region'),
        'quality': data.get('quality'),
        'quantity_kg': float(data.get('quantity_kg', 1000)),
        'season': data.get('season', get_season_from_month(current_date.month)),
        'weather': data.get('weather', 'Normal'),
        'market_demand': data.get('market_demand', 'Medium'),
        'year': data.get('year', current_date.year),
        'month': data.get('month', current_date.month)
    }
    
    return features

def get_season_from_month(month):
    """Get season from month number"""
    if month in [12, 1, 2]:
        return 'Winter'
    elif month in [3, 4, 5]:
        return 'Spring'
    elif month in [6, 7, 8]:
        return 'Summer'
    elif month in [9, 10, 11]:
        return 'Autumn'
    return 'Winter'

def predict_price_route(request, predictor, model_loaded, logger):
    """Handle price prediction requests"""
    try:
        # Get JSON data
        data = request.get_json()
        
        if not data:
            return jsonify({
                'success': False,
                'error': 'No data provided'
            }), 400
        
        # Log incoming request
        logger.info(f"Prediction request received: {data}")
        
        # Validate input
        is_valid, message = validate_input(data)
        if not is_valid:
            return jsonify({
                'success': False,
                'error': message
            }), 400
        
        # Prepare features
        features = prepare_features(data)
        
        # Make prediction
        if model_loaded:
            try:
                predicted_price = predictor.predict(features)
                confidence = 0.85
                method = 'ml_model'
                logger.info(f"ML prediction successful: ₹{predicted_price}/kg")
            except Exception as e:
                logger.warning(f"ML prediction failed: {e}")
                predicted_price = get_fallback_prediction(features)
                confidence = 0.65
                method = 'fallback'
        else:
            predicted_price = get_fallback_prediction(features)
            confidence = 0.65
            method = 'fallback'
        
        # Calculate total value
        total_value = predicted_price * features['quantity_kg']
        
        # Prepare response
        response = {
            'success': True,
            'predicted_price': round(predicted_price, 2),
            'confidence': confidence,
            'method': method,
            'currency': 'INR',
            'unit': 'per kg',
            'total_value': round(total_value, 2),
            'total_value_unit': f"for {features['quantity_kg']} kg",
            'input_features': features,
            'timestamp': datetime.now().isoformat()
        }
        
        # Log prediction
        logger.info(f"Prediction result: {response}")
        
        return jsonify(response), 200
        
    except Exception as e:
        logger.error(f"Prediction error: {e}\n{traceback.format_exc()}")
        return jsonify({
            'success': False,
            'error': str(e)
        }), 500