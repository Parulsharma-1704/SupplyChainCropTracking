#!/usr/bin/env python3
"""
Phase 3: Integration Tests for ML Service API
Tests API endpoints and integration with Flask server
"""

import unittest
import json
import sys
import os

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from app import app
from utils.logger import get_logger

logger = get_logger('test_api')


class TestAPIEndpoints(unittest.TestCase):
    """Test ML Service API endpoints"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client"""
        cls.app = app
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()
    
    def test_root_endpoint(self):
        """Test GET / endpoint"""
        response = self.client.get('/')
        self.assertEqual(response.status_code, 200, "Root endpoint should return 200")
        
        data = json.loads(response.data)
        self.assertIn('service', data, "Response should contain 'service' field")
        self.assertIn('version', data, "Response should contain 'version' field")
        self.assertIn('status', data, "Response should contain 'status' field")
    
    def test_health_endpoint(self):
        """Test GET /health endpoint"""
        response = self.client.get('/health')
        self.assertEqual(response.status_code, 200, "Health endpoint should return 200")
        
        data = json.loads(response.data)
        self.assertEqual(data['status'], 'healthy', "Status should be 'healthy'")
        self.assertIn('model_loaded', data, "Response should contain 'model_loaded'")
    
    def test_predict_endpoint_valid_input(self):
        """Test POST /api/predict with valid input"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': 1000,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High'
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 200, "Prediction should return 200")
        
        data = json.loads(response.data)
        self.assertTrue(data['success'], "Response should have success=true")
        self.assertIn('predicted_price', data, "Response should contain 'predicted_price'")
        self.assertIn('confidence', data, "Response should contain 'confidence'")
        self.assertGreater(data['predicted_price'], 0, "Predicted price should be positive")
        self.assertGreater(data['confidence'], 0, "Confidence should be positive")
    
    def test_predict_endpoint_missing_fields(self):
        """Test POST /api/predict with missing required fields"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'North'
            # Missing required fields
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [400, 422], "Should return error status code")
        data = json.loads(response.data)
        self.assertFalse(data.get('success', False), "Should have success=false on error")
    
    def test_predict_endpoint_invalid_crop_type(self):
        """Test POST /api/predict with invalid crop type"""
        payload = {
            'crop_type': 'InvalidCrop123',
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': 1000,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High'
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should handle gracefully - either accept or return error
        self.assertIn(response.status_code, [200, 400, 422])
    
    def test_predict_endpoint_negative_quantity(self):
        """Test POST /api/predict with negative quantity"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': -1000,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High'
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should either reject or handle gracefully
        self.assertIn(response.status_code, [400, 422, 200])
    
    def test_predict_endpoint_zero_quantity(self):
        """Test POST /api/predict with zero quantity"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': 0,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High'
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [400, 422])
    
    def test_predict_endpoint_response_format(self):
        """Test that prediction response has correct format"""
        payload = {
            'crop_type': 'Rice',
            'region': 'East',
            'quality': 'Grade_A',
            'quantity_kg': 1500
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        data = json.loads(response.data)
        
        if data.get('success'):
            # Check required fields
            required_fields = ['predicted_price', 'confidence', 'method', 'currency', 'total_value']
            for field in required_fields:
                self.assertIn(field, data, f"Missing required field: {field}")
    
    def test_predict_endpoint_multiple_crops(self):
        """Test predictions for multiple crop types"""
        crops = ['Wheat', 'Rice', 'Corn', 'Pulses', 'Vegetables']
        
        for crop in crops:
            payload = {
                'crop_type': crop,
                'region': 'North',
                'quality': 'Premium',
                'quantity_kg': 1000
            }
            
            response = self.client.post(
                '/api/predict',
                data=json.dumps(payload),
                content_type='application/json'
            )
            
            self.assertEqual(response.status_code, 200, f"Prediction for {crop} should succeed")
            data = json.loads(response.data)
            self.assertTrue(data.get('success'), f"Prediction for {crop} should have success=true")
    
    def test_predict_price_consistency(self):
        """Test that same input produces consistent output"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': 1000,
            'season': 'Winter',
            'weather': 'Cold',
            'market_demand': 'High'
        }
        
        # Make two predictions with same input
        response1 = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        response2 = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        data1 = json.loads(response1.data)
        data2 = json.loads(response2.data)
        
        if data1.get('success') and data2.get('success'):
            # Predictions should be identical for identical input
            self.assertEqual(
                data1['predicted_price'],
                data2['predicted_price'],
                "Same input should produce same prediction"
            )


class TestAPIErrorHandling(unittest.TestCase):
    """Test error handling in API"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client"""
        cls.app = app
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()
    
    def test_empty_payload(self):
        """Test POST with empty payload"""
        response = self.client.post(
            '/api/predict',
            data=json.dumps({}),
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400, "Empty payload should return 400")
    
    def test_invalid_json(self):
        """Test POST with invalid JSON"""
        response = self.client.post(
            '/api/predict',
            data='invalid json',
            content_type='application/json'
        )
        
        self.assertEqual(response.status_code, 400, "Invalid JSON should return 400")
    
    def test_nonexistent_endpoint(self):
        """Test request to nonexistent endpoint"""
        response = self.client.get('/api/nonexistent')
        
        self.assertEqual(response.status_code, 404, "Nonexistent endpoint should return 404")


class TestAPIDataValidation(unittest.TestCase):
    """Test data validation in API"""
    
    @classmethod
    def setUpClass(cls):
        """Set up test client"""
        cls.app = app
        cls.app.config['TESTING'] = True
        cls.client = cls.app.test_client()
    
    def test_invalid_region(self):
        """Test with invalid region"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'InvalidRegion',
            'quality': 'Premium',
            'quantity_kg': 1000
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should handle gracefully
        self.assertIn(response.status_code, [200, 400, 422])
    
    def test_invalid_quality(self):
        """Test with invalid quality"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'InvalidQuality',
            'quantity_kg': 1000
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        self.assertIn(response.status_code, [200, 400, 422])
    
    def test_very_large_quantity(self):
        """Test with very large quantity"""
        payload = {
            'crop_type': 'Wheat',
            'region': 'North',
            'quality': 'Premium',
            'quantity_kg': 999999999
        }
        
        response = self.client.post(
            '/api/predict',
            data=json.dumps(payload),
            content_type='application/json'
        )
        
        # Should handle large numbers
        self.assertIn(response.status_code, [200, 400, 422])


def run_api_tests():
    """Run all API tests"""
    print("\n" + "="*60)
    print("🔗 PHASE 3: API INTEGRATION TESTS")
    print("="*60)
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestAPIEndpoints))
    suite.addTests(loader.loadTestsFromTestCase(TestAPIErrorHandling))
    suite.addTests(loader.loadTestsFromTestCase(TestAPIDataValidation))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "="*60)
    print("📊 API TEST SUMMARY")
    print("="*60)
    print(f"Tests run: {result.testsRun}")
    print(f"Successes: {result.testsRun - len(result.failures) - len(result.errors)}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.wasSuccessful():
        print("\n✅ ALL API TESTS PASSED!")
        return True
    else:
        print("\n❌ SOME API TESTS FAILED")
        if result.failures:
            print("\nFailures:")
            for test, trace in result.failures:
                print(f"  - {test}: {trace.split(chr(10))[0]}")
        if result.errors:
            print("\nErrors:")
            for test, trace in result.errors:
                print(f"  - {test}: {trace.split(chr(10))[0]}")
        return False


if __name__ == '__main__':
    success = run_api_tests()
    sys.exit(0 if success else 1)
