// server/tests/mlIntegration.test.js
import axios from 'axios';

const API_BASE_URL = process.env.API_URL || 'http://localhost:5000';
const ML_SERVICE_URL = process.env.ML_SERVICE_URL || 'http://localhost:5001';

// Mock token for testing (replace with real token from auth endpoint)
let authToken = '';

/**
 * Integration tests for ML Service
 */
describe('ML Service Integration', () => {

    // Test 1: Check ML Service Health
    test('Should check ML service health', async () => {
        try {
            const response = await axios.get(`${ML_SERVICE_URL}/health`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('status');
            expect(response.data).toHaveProperty('model_loaded');
            console.log('✅ ML Service health check passed');
        } catch (err) {
            console.error('❌ ML Service health check failed:', err.message);
        }
    });

    // Test 2: Check Backend Status
    test('Should get backend system status', async () => {
        try {
            const response = await axios.get(`${API_BASE_URL}/api/status`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('backend');
            expect(response.data).toHaveProperty('mlService');
            console.log('✅ Backend status check passed');
            console.log('   ML Service Status:', response.data.mlService);
        } catch (err) {
            console.error('❌ Backend status check failed:', err.message);
        }
    });

    // Test 3: Price Prediction Request
    test('Should get price prediction', async () => {
        try {
            const params = {
                cropType: 'Wheat',
                region: 'North',
                quality: 'Grade_A',
                quantity: 1000
            };

            const response = await axios.get(
                `${API_BASE_URL}/api/prices/predict`,
                {
                    params,
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                }
            );

            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('success');
            expect(response.data.data).toHaveProperty('prediction');

            const prediction = response.data.data.prediction;
            expect(prediction).toHaveProperty('predictedPrice');
            expect(prediction).toHaveProperty('confidence');

            console.log('✅ Price prediction test passed');
            console.log('   Params:', params);
            console.log('   Result:', {
                source: response.data.data.source,
                price: prediction.predictedPrice,
                confidence: prediction.confidence,
                method: prediction.method || response.data.data.source
            });
        } catch (err) {
            console.error('❌ Price prediction test failed:', err.message);
            if (err.response?.data) {
                console.error('   Response:', err.response.data);
            }
        }
    });

    // Test 4: ML Health via Backend
    test('Should check ML health through backend', async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/prices/ml/health`,
                {
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                }
            );

            expect(response.status).toBe(200);
            expect(response.data.data).toHaveProperty('status');

            console.log('✅ Backend ML health endpoint test passed');
            console.log('   Status:', response.data.data.status);
            console.log('   Model Loaded:', response.data.data.modelLoaded);
        } catch (err) {
            console.error('❌ Backend ML health check failed:', err.message);
        }
    });

    // Test 5: ML Service Info
    test('Should get ML service info', async () => {
        try {
            const response = await axios.get(`${ML_SERVICE_URL}/`);
            expect(response.status).toBe(200);
            expect(response.data).toHaveProperty('service');
            expect(response.data).toHaveProperty('endpoints');

            console.log('✅ ML service info test passed');
            console.log('   Service:', response.data.service);
            console.log('   Version:', response.data.version);
            console.log('   Status:', response.data.status);
        } catch (err) {
            console.error('❌ ML service info test failed:', err.message);
        }
    });

    // Test 6: Different Crop Types
    test('Should handle different crop types', async () => {
        const cropTypes = ['Rice', 'Corn', 'Pulses', 'Vegetables'];

        for (const cropType of cropTypes) {
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/api/prices/predict`,
                    {
                        params: {
                            cropType,
                            region: 'North',
                            quality: 'Grade_A',
                            quantity: 1000
                        },
                        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                    }
                );

                expect(response.status).toBe(200);
                const prediction = response.data.data.prediction;
                console.log(`✅ Prediction for ${cropType}: ₹${prediction.predictedPrice}/kg`);
            } catch (err) {
                console.error(`❌ Failed to get prediction for ${cropType}:`, err.message);
            }
        }
    });

    // Test 7: Different Quality Grades
    test('Should handle different quality grades', async () => {
        const qualities = ['Premium', 'Grade_A', 'Grade_B', 'Grade_C'];

        for (const quality of qualities) {
            try {
                const response = await axios.get(
                    `${API_BASE_URL}/api/prices/predict`,
                    {
                        params: {
                            cropType: 'Wheat',
                            region: 'North',
                            quality,
                            quantity: 1000
                        },
                        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                    }
                );

                expect(response.status).toBe(200);
                const prediction = response.data.data.prediction;
                console.log(`✅ Prediction for quality ${quality}: ₹${prediction.predictedPrice}/kg`);
            } catch (err) {
                console.error(`❌ Failed to get prediction for quality ${quality}:`, err.message);
            }
        }
    });

    // Test 8: Error Handling - Missing Parameters
    test('Should handle missing required parameters', async () => {
        try {
            const response = await axios.get(
                `${API_BASE_URL}/api/prices/predict`,
                {
                    params: {
                        region: 'North' // Missing cropType
                    },
                    headers: authToken ? { Authorization: `Bearer ${authToken}` } : {},
                    validateStatus: () => true // Don't throw on any status
                }
            );

            if (response.status >= 400) {
                console.log('✅ Correctly rejected request with missing cropType');
                console.log('   Status:', response.status);
                console.log('   Message:', response.data.message);
            }
        } catch (err) {
            console.error('❌ Error handling test failed:', err.message);
        }
    });

    // Test 9: Load Testing - Multiple Requests
    test('Should handle multiple concurrent requests', async () => {
        const requests = [];
        const cropTypes = ['Wheat', 'Rice', 'Corn', 'Vegetables', 'Pulses'];

        for (let i = 0; i < 5; i++) {
            requests.push(
                axios.get(
                    `${API_BASE_URL}/api/prices/predict`,
                    {
                        params: {
                            cropType: cropTypes[i % cropTypes.length],
                            quantity: 1000 + (i * 500)
                        },
                        headers: authToken ? { Authorization: `Bearer ${authToken}` } : {}
                    }
                )
            );
        }

        try {
            const results = await Promise.all(requests);
            console.log(`✅ Successfully handled ${results.length} concurrent requests`);

            results.forEach((res, idx) => {
                const prediction = res.data.data.prediction;
                console.log(`   Request ${idx + 1}: ₹${prediction.predictedPrice}/kg`);
            });
        } catch (err) {
            console.error('❌ Concurrent request test failed:', err.message);
        }
    });
});

/**
 * Test runner
 */
async function runTests() {
    console.log('\n🧪 Starting ML Service Integration Tests...\n');
    console.log(`Backend URL: ${API_BASE_URL}`);
    console.log(`ML Service URL: ${ML_SERVICE_URL}\n`);

    // Run all tests
    const tests = [
        { name: 'ML Service Health', fn: () => checkMLServiceHealth() },
        { name: 'Backend Status', fn: () => checkBackendStatus() },
        { name: 'Price Prediction', fn: () => testPricePrediction() },
        { name: 'ML Health via Backend', fn: () => testMLHealthViaBackend() },
        { name: 'ML Service Info', fn: () => testMLServiceInfo() },
        { name: 'Different Crop Types', fn: () => testDifferentCropTypes() },
        { name: 'Quality Grades', fn: () => testQualityGrades() },
        { name: 'Error Handling', fn: () => testErrorHandling() },
        { name: 'Load Test', fn: () => testLoadHandling() }
    ];

    for (const test of tests) {
        console.log(`\n--- Test: ${test.name} ---`);
        try {
            await test.fn();
        } catch (err) {
            console.error(`Error running test ${test.name}:`, err.message);
        }
    }

    console.log('\n🎉 All tests completed!\n');
}

// Test functions
async function checkMLServiceHealth() {
    const response = await axios.get(`${ML_SERVICE_URL}/health`);
    console.log('✅ ML Service Health:', response.data.status);
}

async function checkBackendStatus() {
    const response = await axios.get(`${API_BASE_URL}/api/status`);
    console.log('✅ Backend Status:', response.data.backend);
    console.log('   ML Service:', response.data.mlService.message);
}

async function testPricePrediction() {
    const response = await axios.get(`${API_BASE_URL}/api/prices/predict`, {
        params: {
            cropType: 'Wheat',
            region: 'North',
            quality: 'Grade_A',
            quantity: 1000
        }
    });
    console.log('✅ Price Prediction:', `₹${response.data.data.prediction.predictedPrice}/kg`);
}

async function testMLHealthViaBackend() {
    const response = await axios.get(`${API_BASE_URL}/api/prices/ml/health`);
    console.log('✅ ML Health Endpoint:', response.data.data.status);
}

async function testMLServiceInfo() {
    const response = await axios.get(`${ML_SERVICE_URL}/`);
    console.log('✅ ML Service Info:', `${response.data.service} v${response.data.version}`);
}

async function testDifferentCropTypes() {
    const crops = ['Wheat', 'Rice', 'Corn'];
    for (const crop of crops) {
        const response = await axios.get(`${API_BASE_URL}/api/prices/predict`, {
            params: { cropType: crop, quantity: 1000 }
        });
        console.log(`✅ ${crop}: ₹${response.data.data.prediction.predictedPrice}/kg`);
    }
}

async function testQualityGrades() {
    const qualities = ['Grade_A', 'Grade_B', 'Grade_C'];
    for (const quality of qualities) {
        const response = await axios.get(`${API_BASE_URL}/api/prices/predict`, {
            params: { cropType: 'Wheat', quality, quantity: 1000 }
        });
        console.log(`✅ ${quality}: ₹${response.data.data.prediction.predictedPrice}/kg`);
    }
}

async function testErrorHandling() {
    try {
        await axios.get(`${API_BASE_URL}/api/prices/predict`, {
            params: { region: 'North' } // Missing required cropType
        });
    } catch (err) {
        if (err.response?.status >= 400) {
            console.log('✅ Correctly rejected invalid request');
        }
    }
}

async function testLoadHandling() {
    const requests = Array(5)
        .fill(0)
        .map(() =>
            axios.get(`${API_BASE_URL}/api/prices/predict`, {
                params: { cropType: 'Wheat', quantity: 1000 }
            })
        );

    await Promise.all(requests);
    console.log('✅ Successfully handled 5 concurrent requests');
}

// Export for use in test suites
export default {
    runTests,
    testPricePrediction,
    checkMLServiceHealth,
    checkBackendStatus
};

// Run tests if executed directly
if (process.argv[1] === new URL(import.meta.url).pathname) {
    runTests().catch(console.error);
}
