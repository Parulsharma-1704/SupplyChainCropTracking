import { useNavigate } from 'react-router-dom';

export default function HowItWorks() {
    const navigate = useNavigate();

    const handleGetStarted = () => {
        const token = localStorage.getItem('token');
        if (token) {
            navigate('/dashboard');
        } else {
            // Check if user exists but not logged in
            const user = localStorage.getItem('user');
            if (user) {
                navigate('/login');
            } else {
                navigate('/register');
            }
        }
    };

    const steps = [
        {
            number: '01',
            title: 'Sign Up & Register',
            description: 'Create your account and set up your farm or organization profile with basic information',
        },
        {
            number: '02',
            title: 'Add Your Inventory',
            description: 'Input your crops, equipment, and shipment details into the system',
        },
        {
            number: '03',
            title: 'Start Tracking',
            description: 'Begin real-time tracking of your crops and shipments across the supply chain',
        },
        {
            number: '04',
            title: 'Analyze & Optimize',
            description: 'Use analytics and insights to optimize routes, pricing, and operations',
        },
        {
            number: '05',
            title: 'Scale Your Business',
            description: 'Grow your operations with confidence using data-driven decisions',
        },
    ];

    return (
        <section id="how-it-works" className="py-16 bg-gray-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">How It Works</h2>
                    <p className="text-xl text-gray-600">
                        Get started with AgriChain AI in five simple steps
                    </p>
                </div>

                <div className="marquee-container">
                    <div className="marquee">
                        {/* Duplicate steps for continuous marquee effect */}
                        {[...steps, ...steps].map((step, index) => (
                            <div key={index} className="flex flex-col items-center text-center shrink-0 w-60">
                                <div className="mb-4 text-3xl font-bold text-green-600">
                                    {step.number}
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-gray-900 mb-2">{step.title}</h3>
                                    <p className="text-gray-600 text-sm">{step.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={handleGetStarted}
                        className="px-8 py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition-colors duration-200"
                    >
                        Get Started Today
                    </button>
                </div>
            </div>
        </section>
    );
}
