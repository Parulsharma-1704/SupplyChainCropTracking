import { FiArrowRight } from 'react-icons/fi';
import { Link, useNavigate } from 'react-router-dom';
import { useEffect, useRef } from 'react';

export default function Hero() {
    const videoRef = useRef(null);
    const navigate = useNavigate();

    useEffect(() => {
        if (videoRef.current) {
            videoRef.current.playbackRate = 0.5; // Slow down to 50% speed
        }
    }, []);

    const handleGetStarted = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        } else {
            navigate('/login');
        }
    };

    const handleViewInsights = () => {
        navigate('/market-insights');
    };

    return (
        <section className="relative w-full h-screen flex items-center justify-center overflow-hidden">
            {/* Blurry Background Video */}
            <div className="absolute inset-0 w-full h-full overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    muted
                    loop
                    playsInline
                    width="100%"
                    height="100%"
                    className="absolute inset-0 w-full h-full object-cover"
                >
                    <source
                        src="/supply_bg.mp4"
                        type="video/mp4"
                    />
                    Your browser does not support the video tag.
                </video>
                {/* Dark Overlay */}
                <div className="absolute inset-0 bg-linear-to-b from-black/25 to-black/35"></div>
            </div>

            {/* Hero Content */}
            <div className="relative z-10 max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">
                    Empowering Agriculture with AI-Driven Supply Chain Intelligence
                </h1>
                <p className="text-lg text-gray-200 mb-12 max-w-2xl mx-auto">
                    Connecting farmers and distributors through transparent crop tracking, real-time logistics, and smart price prediction.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                    <button
                        onClick={handleGetStarted}
                        className="inline-flex items-center justify-center px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                        Get Started
                        <FiArrowRight className="ml-2" size={20} />
                    </button>
                    <button
                        onClick={handleViewInsights}
                        className="inline-flex items-center justify-center px-8 py-3 bg-transparent border-2 border-white text-white font-semibold rounded-lg hover:bg-white hover:text-gray-900 transition-colors duration-200"
                    >
                        View Market Insights
                    </button>
                </div>
            </div>
        </section>
    );
}
