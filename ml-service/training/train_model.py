# ml-service/training/train_model.py
import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.price_predictor import PricePredictor
from training.data_preprocessing import load_and_clean_data
from utils.logger import get_logger
import json
from datetime import datetime

logger = get_logger('train_model')

def train_and_save_model(data_path='data/crop_prices_final.csv', model_type='random_forest'):
    """Train and save the price prediction model with expanded dataset"""
    
    print("\n" + "="*60)
    print("CROP PRICE PREDICTION MODEL TRAINING")
    print("="*60)
    print(f"Data source: {data_path}")
    print(f"Model type: {model_type}")
    
    # Initialize predictor
    predictor = PricePredictor()
    
    # Load and preprocess data
    logger.info(f"Loading data from {data_path}")
    df = predictor.load_data(data_path)
    
    if df is None or df.empty:
        logger.error("Failed to load data")
        return False
    
    print(f"✓ Loaded {len(df)} records")
    
    # Create sample data if needed
    if len(df) < 100:
        logger.warning("Limited data available. Consider collecting more data...")
        print("⚠️  Warning: Small dataset may affect model generalization")
    
    # Preprocess data
    logger.info("Preprocessing data...")
    X, y = predictor.preprocess_data(df)
    
    if X is None or y is None:
        logger.error("Failed to preprocess data")
        return False
    
    print(f"✓ Data preprocessed: {len(X)} samples, {X.shape[1]} features")
    
    # Train model
    logger.info("Training model...")
    metrics = predictor.train(X, y)
    
    # Save model
    if predictor.save_model():
        logger.info("Model training completed successfully!")
        
        # Print summary
        print("\n" + "="*60)
        print("✅ TRAINING SUMMARY")
        print("="*60)
        print(f"Model saved to: {predictor.model_path}")
        print(f"\nPerformance Metrics:")
        print(f"  Training R² Score: {metrics['train_score']:.4f}")
        print(f"  Testing R² Score:  {metrics['test_score']:.4f}")
        print(f"  MAE (Mean Absolute Error): ₹{metrics['mae']:.2f}")
        print(f"  RMSE (Root Mean Squared Error): ₹{metrics['rmse']:.2f}")
        print(f"  R² Score: {metrics['r2']:.4f}")
        
        if 'feature_importance' in metrics and metrics['feature_importance']:
            print(f"\nTop Features:")
            for feature, importance in list(metrics['feature_importance'].items())[:5]:
                print(f"  - {feature}: {importance:.4f}")
        
        print("="*60)
        
        return True
    else:
        logger.error("Failed to save model")
        return False

def test_predictions():
    """Test the trained model with sample predictions"""
    
    print("\n" + "="*60)
    print("TESTING MODEL PREDICTIONS")
    print("="*60)
    
    predictor = PricePredictor()
    
    if not predictor.load_model():
        print("Model not found. Please train first.")
        return
    
    # Test cases
    test_cases = [
        {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': 1000,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High',
            'year': 2024,
            'month': 1
        },
        {
            'crop_type': 'Rice',
            'region': 'East',
            'quality': 'Grade_A',
            'quantity_kg': 1500,
            'season': 'Spring',
            'weather': 'Moderate',
            'market_demand': 'Medium',
            'year': 2024,
            'month': 3
        },
        {
            'crop_type': 'Corn',
            'region': 'South',
            'quality': 'Premium',
            'quantity_kg': 2000,
            'season': 'Summer',
            'weather': 'Hot',
            'market_demand': 'High',
            'year': 2024,
            'month': 6
        }
    ]
    
    for i, features in enumerate(test_cases, 1):
        try:
            price = predictor.predict(features)
            print(f"\n Test Case {i}:")
            print(f"  Crop: {features['crop_type']} ({features['quality']})")
            print(f"  Region: {features['region']}, Season: {features['season']}")
            print(f"  Quantity: {features['quantity_kg']} kg")
            print(f"  Predicted Price: ₹{price:.2f}/kg")
            print(f"  Total Value: ₹{price * features['quantity_kg']:.2f}")
        except Exception as e:
            print(f"\n Test Case {i} failed: {e}")

if __name__ == "__main__":
    # Train model
    success = train_and_save_model()
    
    if success:
        # Test predictions
        test_predictions()