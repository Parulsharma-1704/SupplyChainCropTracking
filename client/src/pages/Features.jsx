import { FiMapPin, FiBarChart2, FiPackage, FiDollarSign, FiLock } from 'react-icons/fi';
import { IoLeaf } from 'react-icons/io5';

export default function Features() {
    const features = [
        {
            icon: FiMapPin,
            title: 'Real-time Tracking',
            description: 'Track your crops and shipments in real-time with GPS-enabled logistics management',
        },
        {
            icon: FiBarChart2,
            title: 'Market Analytics',
            description: 'Access comprehensive market data and price predictions to make informed decisions',
        },
        {
            icon: IoLeaf,
            title: 'Crop Management',
            description: 'Manage crop cycles, inventory, and quality control all in one place',
        },
        {
            icon: FiPackage,
            title: 'Shipment Monitoring',
            description: 'Monitor shipments end-to-end with automated alerts and updates',
        },
        {
            icon: FiDollarSign,
            title: 'Financial Tracking',
            description: 'Track transactions, payments, and generate detailed financial reports',
        },
        {
            icon: FiLock,
            title: 'Data Security',
            description: 'Enterprise-grade security to protect your sensitive agricultural data',
        },
    ];

    return (
        <section id="features" className="py-16 bg-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Powerful Features</h2>
                    <p className="text-xl text-gray-600">
                        Everything you need to manage your supply chain effectively
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {features.map((feature, index) => {
                        const IconComponent = feature.icon;
                        return (
                            <div
                                key={index}
                                className="bg-gray-50 p-8 rounded-lg shadow-md hover:shadow-lg transition-shadow"
                            >
                                <IconComponent className="text-4xl text-green-600 mb-4" />
                                <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                                <p className="text-gray-600 text-lg">{feature.description}</p>
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}
