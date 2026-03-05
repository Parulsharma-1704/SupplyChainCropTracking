import Hero from './Hero';
import About from './About';
import Features from './Features';
import HowItWorks from './HowItWorks';

export default function Home() {
    return (
        <>
            <section id="home">
                <Hero />
            </section>
            <About />
            <Features />
            <HowItWorks />
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="text-center">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">
                        Why Choose AgriChain AI?
                    </h1>
                    <p className="text-xl text-gray-600 mb-8">
                        Join thousands of agricultural professionals who trust SupplyChain
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        <div className="bg-green-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Increased Efficiency
                            </h2>
                            <p className="text-gray-600">
                                Reduce operational costs and improve efficiency by up to 40%
                            </p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Better Decision Making
                            </h2>
                            <p className="text-gray-600">
                                Access real-time data and analytics for informed decisions
                            </p>
                        </div>
                        <div className="bg-green-50 p-6 rounded-lg shadow-md hover:shadow-lg transition-shadow">
                            <h2 className="text-xl font-semibold text-gray-900 mb-2">
                                Complete Control
                            </h2>
                            <p className="text-gray-600">
                                Monitor every step of your supply chain from farm to market
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
}
