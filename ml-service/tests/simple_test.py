#!/usr/bin/env python3
"""
Phase 3: Simple Test Runner - Core functionality tests
"""

import sys
import os
import json

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.price_predictor import PricePredictor


def test_data_files():
    """Test that all required data files exist"""
    print("\n" + "="*60)
    print("✓ TESTING: Data Files")
    print("="*60)
    
    files_to_check = [
        'data/crop_prices_final.csv',
        'models/price_model_v2.pkl',
        'models/scaler_v2.pkl',
        'models/label_encoders_v2.pkl',
        'models/price_model_v2_metrics.json'
    ]
    
    all_exist = True
    for filepath in files_to_check:
        exists = os.path.exists(filepath)
        status = "[OK]" if exists else "[FAIL]"
        print(f"  {status} {filepath}")
        if not exists:
            all_exist = False
    
    return all_exist


def test_model_loading():
    """Test model can be loaded"""
    print("\n" + "="*60)
    print("✓ TESTING: Model Loading")
    print("="*60)
    
    try:
        predictor = PricePredictor()
        loaded = predictor.load_model()
        
        if loaded:
            print("  ✓ Model loaded successfully")
            print(f"  ✓ Model type: {type(predictor.model).__name__}")
            return True
        else:
            print("  ✗ Failed to load model")
            return False
    except Exception as e:
        print(f"  ✗ Error loading model: {e}")
        return False


def test_model_predictions():
    """Test model predictions"""
    print("\n" + "="*60)
    print("✓ TESTING: Model Predictions")
    print("="*60)
    
    try:
        predictor = PricePredictor()
        predictor.load_model()
        
        test_cases = [
            {
                'name': 'Wheat (Premium, North)',
                'features': {
                    'crop_type': 'Wheat',
                    'region': 'North',
                    'quality': 'Premium',
                    'quantity_kg': 1000,
                    'season': 'Winter',
                    'weather': 'Cold',
                    'market_demand': 'High',
                    'year': 2024,
                    'month': 1
                }
            },
            {
                'name': 'Rice (Grade_A, East)',
                'features': {
                    'crop_type': 'Rice',
                    'region': 'East',
                    'quality': 'Grade_A',
                    'quantity_kg': 1500,
                    'season': 'Spring',
                    'weather': 'Moderate',
                    'market_demand': 'Medium',
                    'year': 2024,
                    'month': 3
                }
            },
            {
                'name': 'Corn (Grade_B, South)',
                'features': {
                    'crop_type': 'Corn',
                    'region': 'South',
                    'quality': 'Grade_B',
                    'quantity_kg': 2000,
                    'season': 'Summer',
                    'weather': 'Hot',
                    'market_demand': 'Low',
                    'year': 2024,
                    'month': 6
                }
            }
        ]
        
        all_passed = True
        for test in test_cases:
            try:
                price = predictor.predict(test['features'])
                if 0 < price < 200:
                    print(f"  ✓ {test['name']}: ₹{price:.2f}/kg")
                else:
                    print(f"  ✗ {test['name']}: Price out of range (₹{price:.2f})")
                    all_passed = False
            except Exception as e:
                print(f"  ✗ {test['name']}: {e}")
                all_passed = False
        
        return all_passed
    except Exception as e:
        print(f"  ✗ Error in predictions: {e}")
        return False


def test_quality_effect():
    """Test that quality affects price"""
    print("\n" + "="*60)
    print("✓ TESTING: Quality Effect on Price")
    print("="*60)
    
    try:
        predictor = PricePredictor()
        predictor.load_model()
        
        base_features = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quantity_kg': 1000,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High',
            'year': 2024,
            'month': 1
        }
        
        prices = {}
        for quality in ['Premium', 'Grade_A', 'Grade_B', 'Grade_C']:
            features = base_features.copy()
            features['quality'] = quality
            price = predictor.predict(features)
            prices[quality] = price
            print(f"  {quality}: ₹{price:.2f}/kg")
        
        # Premium should be highest, Grade_C lowest
        if prices['Premium'] > prices['Grade_C']:
            print(f"  ✓ Quality properly affects price")
            return True
        else:
            print(f"  ✗ Price hierarchy incorrect")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def test_crop_effect():
    """Test that crop type affects price"""
    print("\n" + "="*60)
    print("✓ TESTING: Crop Type Effect on Price")
    print("="*60)
    
    try:
        predictor = PricePredictor()
        predictor.load_model()
        
        base_features = {
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': 1000,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High',
            'year': 2024,
            'month': 1
        }
        
        crops = ['Wheat', 'Rice', 'Pulses', 'Corn', 'Vegetables']
        prices = {}
        
        for crop in crops:
            features = base_features.copy()
            features['crop_type'] = crop
            price = predictor.predict(features)
            prices[crop] = price
            print(f"  {crop}: ₹{price:.2f}/kg")
        
        # Prices should be different for different crops
        unique_prices = len(set(prices.values()))
        if unique_prices > 1:
            print(f"  ✓ Crop type properly affects price")
            return True
        else:
            print(f"  ✗ All crops have same price")
            return False
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def test_model_metrics():
    """Test model metrics"""
    print("\n" + "="*60)
    print("✓ TESTING: Model Metrics")
    print("="*60)
    
    try:
        metrics_file = 'models/price_model_v2_metrics.json'
        with open(metrics_file, 'r') as f:
            metrics = json.load(f)
        
        best_metrics = metrics['best_metrics']
        
        print(f"  Algorithm: {metrics['best_model']}")
        print(f"  R² Score: {best_metrics['r2']:.4f}")
        print(f"  RMSE: ₹{best_metrics['rmse']:.2f}/kg")
        print(f"  MAE: ₹{best_metrics['mae']:.2f}/kg")
        print(f"  MAPE: {best_metrics['mape']:.2%}")
        print(f"  CV Mean: {best_metrics.get('cv_mean', 'N/A')}")
        
        # Check thresholds
        thresholds_passed = True
        
        if best_metrics['r2'] < 0.80:
            print(f"  ✗ R² score below 0.80")
            thresholds_passed = False
        else:
            print(f"  ✓ R² score > 0.80")
        
        if best_metrics['rmse'] > 15:
            print(f"  ✗ RMSE above ₹15/kg")
            thresholds_passed = False
        else:
            print(f"  ✓ RMSE < ₹15/kg")
        
        if best_metrics['mape'] > 0.20:
            print(f"  ✗ MAPE above 20%")
            thresholds_passed = False
        else:
            print(f"  ✓ MAPE < 20%")
        
        return thresholds_passed
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


def run_all_tests():
    """Run all tests"""
    print("\n" + "="*70)
    print("[TESTING] PHASE 3: ML SERVICE TESTING")
    print("="*70)
    
    results = {
        'Data Files': test_data_files(),
        'Model Loading': test_model_loading(),
        'Predictions': test_model_predictions(),
        'Quality Effect': test_quality_effect(),
        'Crop Type Effect': test_crop_effect(),
        'Model Metrics': test_model_metrics()
    }
    
    # Print summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)
    
    passed = sum(1 for v in results.values() if v)
    total = len(results)
    
    for test_name, result in results.items():
        status = "✓" if result else "✗"
        print(f"  {status} {test_name}")
    
    print(f"\nTotal: {passed}/{total} passed")
    
    if passed == total:
        print("\n" + "="*70)
        print("✅ ALL TESTS PASSED!")
        print("="*70)
        print("\nPhase 3 Status: COMPLETE")
        print("\nThe ML service is ready for:")
        print("  • Integration with backend server")
        print("  • Production deployment")
        print("  • Real-time price predictions")
        return True
    else:
        print("\n" + "="*70)
        print(f"❌ {total - passed} TEST(S) FAILED")
        print("="*70)
        return False


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
