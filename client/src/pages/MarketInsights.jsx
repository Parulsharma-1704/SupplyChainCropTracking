import { useState, useEffect, useMemo } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { FiSearch, FiFilter, FiTrendingUp, FiLoader, FiLock } from 'react-icons/fi';
import { usePriceData } from '../hooks/usePriceData';
import { usePredictionLimit } from '../hooks/usePredictionLimit';
import { getPrediction } from '../services/predictionService';
import { setSelectedRegion, setSearchTerm } from '../features/market/marketSlice';
import toast from 'react-hot-toast';

// Sample data for demo/fallback
const SAMPLE_CROPS = [
    {
        crop: 'Wheat',
        currentPrice: 2500,
        change: 5.2,
        region: 'Punjab',
        priceHistory: [2200, 2300, 2350, 2400, 2450, 2500],
        prediction: 2600,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    {
        crop: 'Rice',
        currentPrice: 3200,
        change: -2.1,
        region: 'Bihar',
        priceHistory: [3400, 3350, 3300, 3280, 3250, 3200],
        prediction: 3100,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    {
        crop: 'Corn',
        currentPrice: 1800,
        change: 8.5,
        region: 'Haryana',
        priceHistory: [1600, 1650, 1700, 1750, 1800, 1800],
        prediction: 1900,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    {
        crop: 'Soybeans',
        currentPrice: 4100,
        change: 3.2,
        region: 'Madhya Pradesh',
        priceHistory: [3800, 3900, 4000, 4050, 4100, 4100],
        prediction: 4200,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    {
        crop: 'Cotton',
        currentPrice: 5500,
        change: -1.5,
        region: 'Gujarat',
        priceHistory: [5800, 5700, 5600, 5550, 5500, 5500],
        prediction: 5400,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
    {
        crop: 'Sugarcane',
        currentPrice: 3800,
        change: 2.8,
        region: 'Uttar Pradesh',
        priceHistory: [3500, 3600, 3650, 3750, 3800, 3800],
        prediction: 3900,
        months: ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun'],
    },
];

const REGIONS = ['all', 'Punjab', 'Bihar', 'Haryana', 'Madhya Pradesh', 'Gujarat', 'Uttar Pradesh'];

export default function MarketInsights() {
    const dispatch = useDispatch();
    const { prices, loading, error, loadPrices } = usePriceData();
    const { selectedRegion, searchTerm } = useSelector((state) => state.market);
    const { isAuthenticated } = useSelector((state) => state.auth);
    const { canMakePrediction, remainingPredictions, usePrediction, isPredictionLimitReached } = usePredictionLimit();

    const [cropData, setCropData] = useState(SAMPLE_CROPS);
    const [predictions, setPredictions] = useState({});
    const [loadingPredictions, setLoadingPredictions] = useState({});
    const [usingDemo, setUsingDemo] = useState(true);

    // Load prices on mount
    useEffect(() => {
        loadPrices();
    }, []);

    // Process real prices if available
    useEffect(() => {
        if (prices && prices.length > 0) {
            setUsingDemo(false);
            const processed = processRealPrices(prices);
            setCropData(processed);
        }
    }, [prices]);

    // Process real price data
    const processRealPrices = (priceList) => {
        const grouped = {};
        
        priceList.forEach((item) => {
            const crop = item.cropType || item.crop;
            if (!grouped[crop]) {
                grouped[crop] = [];
            }
            grouped[crop].push(item);
        });

        return Object.entries(grouped).map(([cropName, items]) => {
            const sorted = items.sort((a, b) => new Date(a.date) - new Date(b.date));
            const current = sorted[sorted.length - 1]?.price || 0;
            const prev = sorted[sorted.length - 2]?.price || current;
            const change = ((current - prev) / prev) * 100;

            return {
                crop: cropName,
                currentPrice: current,
                change: parseFloat(change.toFixed(2)),
                region: sorted[0]?.region || 'Unknown',
                priceHistory: sorted.slice(-6).map((p) => p.price),
                months: getLastSixMonths(),
            };
        });
    };

    // Get last 6 months
    const getLastSixMonths = () => {
        const months = [];
        for (let i = 5; i >= 0; i--) {
            const date = new Date();
            date.setMonth(date.getMonth() - i);
            months.push(date.toLocaleString('default', { month: 'short' }));
        }
        return months;
    };

    // Filter crops based on search and region
    const filteredCrops = useMemo(() => {
        return cropData.filter((crop) => {
            const matchesSearch = crop.crop.toLowerCase().includes(searchTerm.toLowerCase());
            const matchesRegion = selectedRegion === 'all' || crop.region === selectedRegion;
            return matchesSearch && matchesRegion;
        });
    }, [searchTerm, selectedRegion, cropData]);

    // Handle search
    const handleSearch = (value) => {
        dispatch(setSearchTerm(value));
    };

    // Handle region filter
    const handleRegionChange = (region) => {
        dispatch(setSelectedRegion(region));
    };

    // Handle AI prediction
    const handlePrediction = async (crop) => {
        if (!canMakePrediction) {
            toast.error('You have reached the 3 free predictions limit. Please login for unlimited predictions!');
            return;
        }

        setLoadingPredictions((prev) => ({ ...prev, [crop.crop]: true }));
        try {
            const result = await getPrediction({
                cropType: crop.crop,
                region: crop.region,
                quality: 'Grade_A',
                quantity: 1000,
            });
            
            setPredictions((prev) => ({
                ...prev,
                [crop.crop]: result.predicted_price || result.predictedPrice || crop.prediction,
            }));
            
            usePrediction();
            toast.success(`Prediction: ₹${Math.round(result.predicted_price || result.predictedPrice || crop.prediction)}/quintal`);
        } catch (err) {
            toast.error('Failed to get prediction. Using based estimate.');
            setPredictions((prev) => ({
                ...prev,
                [crop.crop]: crop.prediction,
            }));
        } finally {
            setLoadingPredictions((prev) => ({ ...prev, [crop.crop]: false }));
        }
    };

    // Price chart component
    const PriceChart = ({ data, months }) => {
        const max = Math.max(...data);
        return (
            <div className="flex items-end justify-around h-40 gap-2">
                {data.map((price, idx) => (
                    <div key={idx} className="flex flex-col items-center gap-1">
                        <div
                            className="bg-gradient-to-t from-green-500 to-green-400 rounded-t"
                            style={{
                                height: `${(price / max) * 120}px`,
                                width: '25px',
                            }}
                        />
                        <span className="text-xs text-gray-600">{months[idx]}</span>
                    </div>
                ))}
            </div>
        );
    };

    return (
        <section className="min-h-screen bg-gray-50 py-12 px-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Market Insights</h1>
                    <p className="text-lg text-gray-600">
                        Real-time crop prices, trends, and AI predictions
                    </p>
                </div>

                {/* Demo Mode Notice */}
                {usingDemo && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <p className="text-blue-800 text-sm">
                            📊 <strong>Demo Mode:</strong> Showing sample data. Connect backend for real-time prices.
                        </p>
                    </div>
                )}

                {/* Prediction Limit Notice (Not Logged In) */}
                {!isAuthenticated && (
                    <div className="mb-6 bg-orange-50 border border-orange-200 rounded-lg p-4">
                        <p className="text-orange-800 text-sm">
                            🔓 <strong>Free User:</strong> {remainingPredictions} predictions remaining. <a href="/login" className="underline font-semibold">Login</a> for unlimited!
                        </p>
                    </div>
                )}

                {/* Error Notice */}
                {error && !usingDemo && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <p className="text-red-800 text-sm">⚠️ {error}</p>
                    </div>
                )}

                {/* Loading Indicator */}
                {loading && (
                    <div className="mb-6 bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-center gap-2 text-blue-800">
                            <FiLoader className="animate-spin" />
                            <span>Loading market data...</span>
                        </div>
                    </div>
                )}

                {/* Search & Filter */}
                <div className="bg-white rounded-lg shadow-md p-6 mb-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiSearch className="inline mr-2" />
                                Search by Crop
                            </label>
                            <input
                                type="text"
                                value={searchTerm}
                                onChange={(e) => handleSearch(e.target.value)}
                                placeholder="Search crops..."
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                <FiFilter className="inline mr-2" />
                                Filter by Region
                            </label>
                            <select
                                value={selectedRegion}
                                onChange={(e) => handleRegionChange(e.target.value)}
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            >
                                {REGIONS.map((region) => (
                                    <option key={region} value={region}>
                                        {region === 'all' ? 'All Regions' : region}
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>
                </div>

                {/* Crops Grid */}
                {filteredCrops.length > 0 ? (
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                        {filteredCrops.map((crop) => {
                            const predictedPrice = predictions[crop.crop] || crop.prediction;
                            const isPredLoading = loadingPredictions[crop.crop];

                            return (
                                <div key={crop.crop} className="bg-white rounded-lg shadow-lg p-6">
                                    {/* Header */}
                                    <div className="mb-6">
                                        <div className="flex justify-between items-start mb-2">
                                            <h2 className="text-2xl font-bold text-gray-900">{crop.crop}</h2>
                                            <span className="text-xs font-medium text-gray-600 bg-gray-100 px-3 py-1 rounded">
                                                {crop.region}
                                            </span>
                                        </div>
                                        <div className="flex items-baseline gap-2">
                                            <span className="text-3xl font-bold text-green-600">₹{crop.currentPrice}</span>
                                            <span
                                                className={`flex items-center gap-1 ${
                                                    crop.change >= 0 ? 'text-green-500' : 'text-red-500'
                                                }`}
                                            >
                                                <FiTrendingUp style={{ transform: crop.change < 0 ? 'rotate(180deg)' : '' }} />
                                                {crop.change}%
                                            </span>
                                        </div>
                                    </div>

                                    {/* Price Chart */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Price Trend (6 months)</h3>
                                        <PriceChart data={crop.priceHistory} months={crop.months} />
                                    </div>

                                    {/* Historical Data */}
                                    <div className="mb-6">
                                        <h3 className="text-sm font-semibold text-gray-700 mb-3">Historical Data</h3>
                                        <div className="grid grid-cols-6 gap-2 text-center text-xs">
                                            {crop.months.map((month, idx) => (
                                                <div key={month}>
                                                    <div className="font-medium text-gray-700">{month}</div>
                                                    <div className="text-gray-600">₹{crop.priceHistory[idx]}</div>
                                                </div>
                                            ))}
                                        </div>
                                    </div>

                                    {/* AI Prediction */}
                                    <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded">
                                        <div className="flex justify-between items-start mb-3">
                                            <p className="text-sm font-medium text-gray-700">AI Price Prediction</p>
                                            {!isAuthenticated && (
                                                <span className="text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded flex items-center gap-1">
                                                    <FiLock size={12} />
                                                    {remainingPredictions} left
                                                </span>
                                            )}
                                        </div>

                                        <div className="flex justify-between items-center mb-3">
                                            <span className="text-2xl font-bold text-green-600">₹{Math.round(predictedPrice)}</span>
                                            <span className="text-sm text-gray-600">
                                                {predictedPrice > crop.currentPrice ? '▲' : '▼'}{' '}
                                                {Math.abs(
                                                    (((predictedPrice - crop.currentPrice) / crop.currentPrice) * 100).toFixed(1)
                                                )}
                                                %
                                            </span>
                                        </div>

                                        <button
                                            onClick={() => handlePrediction(crop)}
                                            disabled={isPredLoading || (isPredictionLimitReached && !isAuthenticated)}
                                            className={`w-full py-2 rounded font-medium text-sm transition ${
                                                isPredictionLimitReached && !isAuthenticated
                                                    ? 'bg-gray-200 text-gray-600 cursor-not-allowed'
                                                    : 'bg-green-500 text-white hover:bg-green-600'
                                            }`}
                                        >
                                            {isPredLoading ? (
                                                <span className="flex items-center justify-center gap-2">
                                                    <FiLoader className="animate-spin" /> Predicting...
                                                </span>
                                            ) : isPredictionLimitReached && !isAuthenticated ? (
                                                'Login for more predictions'
                                            ) : (
                                                'Get Live Prediction'
                                            )}
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ) : (
                    <div className="bg-white rounded-lg shadow-md p-12 text-center">
                        <p className="text-gray-600">
                            {cropData.length === 0
                                ? 'Loading crops...'
                                : 'No crops match your search. Try different criteria.'}
                        </p>
                    </div>
                )}

                {/* Footer Note */}
                <div className="mt-12 bg-blue-50 border border-blue-200 rounded-lg p-4">
                    <p className="text-sm text-gray-700">
                        <strong>How it works:</strong> View unlimited real-time charts, filters & historical data. Get 3 free AI predictions without login. <a href="/login" className="text-blue-600 underline">Login</a> for unlimited predictions.
                    </p>
                </div>
            </div>
        </section>
    );
}
