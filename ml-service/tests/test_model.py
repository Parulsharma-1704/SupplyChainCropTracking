#!/usr/bin/env python3
"""
Phase 3: Unit Tests for Model Training & Components
Tests model loading, training, and prediction functions
"""

import unittest
import sys
import os
import json
import tempfile
import numpy as np
import pandas as pd
from pathlib import Path

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from models.price_predictor import PricePredictor
from training.data_preprocessing import load_and_clean_data


class TestDataPreprocessing(unittest.TestCase):
    """Test data loading and preprocessing"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.data_path = 'data/crop_prices_final.csv'
    
    def test_data_file_exists(self):
        """Test that training data file exists"""
        self.assertTrue(
            os.path.exists(self.data_path),
            f"Training data file not found: {self.data_path}"
        )
    
    def test_data_can_be_loaded(self):
        """Test that data can be loaded without errors"""
        try:
            df = pd.read_csv(self.data_path)
            self.assertGreater(len(df), 100, "Dataset should have 100+ records")
            self.assertGreater(len(df.columns), 5, "Dataset should have multiple columns")
        except Exception as e:
            self.fail(f"Failed to load data: {e}")
    
    def test_required_columns_exist(self):
        """Test that all required columns are present"""
        required_cols = ['date', 'crop_type', 'region', 'quality', 'quantity_kg', 'market_price']
        df = pd.read_csv(self.data_path)
        
        for col in required_cols:
            self.assertIn(col, df.columns, f"Missing required column: {col}")
    
    def test_data_no_missing_values(self):
        """Test that critical columns have no missing values"""
        df = pd.read_csv(self.data_path)
        critical_cols = ['crop_type', 'region', 'quality', 'market_price', 'quantity_kg']
        
        for col in critical_cols:
            missing_count = df[col].isnull().sum()
            self.assertEqual(missing_count, 0, f"Column '{col}' has {missing_count} missing values")
    
    def test_prices_are_positive(self):
        """Test that all prices are positive"""
        df = pd.read_csv(self.data_path)
        self.assertTrue(
            (df['market_price'] > 0).all(),
            "All prices should be positive"
        )
    
    def test_quantities_are_positive(self):
        """Test that all quantities are positive"""
        df = pd.read_csv(self.data_path)
        self.assertTrue(
            (df['quantity_kg'] > 0).all(),
            "All quantities should be positive"
        )
    
    def test_data_distribution(self):
        """Test that data has good distribution across crops"""
        df = pd.read_csv(self.data_path)
        crop_counts = df['crop_type'].value_counts()
        
        # Each crop should have at least 5 records
        min_crops = crop_counts.min()
        self.assertGreaterEqual(
            min_crops, 5,
            f"Some crops have too few records: {min_crops}"
        )


class TestModelLoading(unittest.TestCase):
    """Test model loading and initialization"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.predictor = PricePredictor()
        self.model_path = 'models/price_model_v2.pkl'
    
    def test_model_file_exists(self):
        """Test that trained model file exists"""
        self.assertTrue(
            os.path.exists(self.model_path),
            f"Model file not found: {self.model_path}"
        )
    
    def test_model_can_be_loaded(self):
        """Test that model can be loaded without errors"""
        success = self.predictor.load_model()
        self.assertTrue(success, "Failed to load model")
        self.assertIsNotNone(self.predictor.model, "Model object is None")
    
    def test_scaler_files_exist(self):
        """Test that scaler files are saved"""
        scaler_path = 'models/scaler_v2.pkl'
        encoders_path = 'models/label_encoders_v2.pkl'
        
        self.assertTrue(os.path.exists(scaler_path), "Scaler file not found")
        self.assertTrue(os.path.exists(encoders_path), "Encoders file not found")
    
    def test_metrics_file_exists(self):
        """Test that metrics file is saved"""
        metrics_path = 'models/price_model_v2_metrics.json'
        self.assertTrue(os.path.exists(metrics_path), "Metrics file not found")
    
    def test_metrics_are_valid(self):
        """Test that saved metrics are valid"""
        metrics_path = 'models/price_model_v2_metrics.json'
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        
        # Check best model
        self.assertIn('best_model', metrics, "Missing 'best_model' in metrics")
        self.assertEqual(metrics['best_model'], 'gradient_boosting', "Best model should be gradient_boosting")
        
        # Check metrics values
        best_metrics = metrics['best_metrics']
        self.assertGreater(best_metrics['r2'], 0.80, "R² should be > 0.80")
        self.assertLess(best_metrics['rmse'], 15, "RMSE should be < 15")
        self.assertLess(best_metrics['mae'], 10, "MAE should be < 10")


class TestModelPrediction(unittest.TestCase):
    """Test model prediction functionality"""
    
    def setUp(self):
        """Set up test fixtures"""
        self.predictor = PricePredictor()
        self.predictor.load_model()
    
    def test_prediction_returns_number(self):
        """Test that prediction returns a numeric value"""
        features = {
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
        
        prediction = self.predictor.predict(features)
        self.assertIsInstance(prediction, (int, float), "Prediction should be numeric")
        self.assertGreater(prediction, 0, "Prediction should be positive")
    
    def test_prediction_is_positive(self):
        """Test that predictions are always positive"""
        test_cases = [
            {'crop_type': 'Wheat', 'region': 'North', 'quality': 'Premium', 'quantity_kg': 1000},
            {'crop_type': 'Rice', 'region': 'South', 'quality': 'Grade_A', 'quantity_kg': 500},
            {'crop_type': 'Corn', 'region': 'East', 'quality': 'Grade_B', 'quantity_kg': 2000},
        ]
        
        for features in test_cases:
            # Fill with defaults
            features.setdefault('season', 'Winter')
            features.setdefault('weather', 'Sunny')
            features.setdefault('market_demand', 'High')
            features.setdefault('year', 2024)
            features.setdefault('month', 1)
            
            prediction = self.predictor.predict(features)
            self.assertGreater(prediction, 0, f"Prediction for {features['crop_type']} should be positive")
    
    def test_predictions_are_reasonable_range(self):
        """Test that predictions fall within expected price ranges"""
        features = {
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
        
        prediction = self.predictor.predict(features)
        
        # Price should be between 10-200 (reasonable for Indian crops)
        self.assertGreater(prediction, 10, "Price seems too low")
        self.assertLess(prediction, 200, "Price seems too high")
    
    def test_quality_affects_price(self):
        """Test that quality grade affects predicted price"""
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
            prices[quality] = self.predictor.predict(features)
        
        # Premium should have highest price, Grade_C lowest
        self.assertGreater(prices['Premium'], prices['Grade_C'], 
                          "Premium quality should cost more than Grade_C")
    
    def test_crop_type_affects_price(self):
        """Test that crop type affects predicted price"""
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
        
        crops = ['Wheat', 'Rice', 'Pulses', 'Corn']
        prices = {}
        
        for crop in crops:
            features = base_features.copy()
            features['crop_type'] = crop
            prices[crop] = self.predictor.predict(features)
        
        # Different crops should have different prices
        unique_prices = len(set(prices.values()))
        self.assertGreater(unique_prices, 1, "Different crops should have different prices")
    
    def test_quantity_discount_effect(self):
        """Test that larger quantities get better prices (discount)"""
        base_features = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'Premium',
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High',
            'year': 2024,
            'month': 1
        }
        
        prices = {}
        for qty in [100, 1000, 5000, 10000]:
            features = base_features.copy()
            features['quantity_kg'] = qty
            prices[qty] = self.predictor.predict(features)
        
        # Larger quantity = lower per-kg price (bulk discount)
        # Price per kg should decrease with quantity
        self.assertGreater(prices[100], prices[10000],
                          "Bulk quantities should have lower per-kg price")


class TestModelMetrics(unittest.TestCase):
    """Test model performance metrics"""
    
    def test_model_accuracy_threshold(self):
        """Test that model meets minimum accuracy threshold"""
        metrics_path = 'models/price_model_v2_metrics.json'
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        
        r2_score = metrics['best_metrics']['r2']
        self.assertGreater(r2_score, 0.80, 
                          f"Model R² should be > 0.80, got {r2_score}")
    
    def test_cross_validation_stability(self):
        """Test that cross-validation shows stable performance"""
        metrics_path = 'models/price_model_v2_metrics.json'
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        
        cv_std = metrics['best_metrics']['cv_std']
        self.assertLess(cv_std, 0.10, 
                       f"Cross-validation std should be < 0.10, got {cv_std}")
    
    def test_error_metrics_reasonable(self):
        """Test that error metrics are within reasonable bounds"""
        metrics_path = 'models/price_model_v2_metrics.json'
        with open(metrics_path, 'r') as f:
            metrics = json.load(f)
        
        rmse = metrics['best_metrics']['rmse']
        mae = metrics['best_metrics']['mae']
        mape = metrics['best_metrics']['mape']
        
        self.assertLess(rmse, 15, f"RMSE should be < 15, got {rmse}")
        self.assertLess(mae, 10, f"MAE should be < 10, got {mae}")
        self.assertLess(mape, 0.20, f"MAPE should be < 20%, got {mape*100}%")


def run_all_tests():
    """Run all unit tests"""
    print("\n" + "="*60)
    print("🧪 PHASE 3: COMPREHENSIVE UNIT TESTS")
    print("="*60)
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestDataPreprocessing))
    suite.addTests(loader.loadTestsFromTestCase(TestModelLoading))
    suite.addTests(loader.loadTestsFromTestCase(TestModelPrediction))
    suite.addTests(loader.loadTestsFromTestCase(TestModelMetrics))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL TESTS PASSED!")
        return True
    else:
        print("\n❌ SOME TESTS FAILED")
        return False


if __name__ == '__main__':
    success = run_all_tests()
    sys.exit(0 if success else 1)
