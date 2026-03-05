export default function About() {
    return (
        <section id="about" className="py-16 gradient-about">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="text-center mb-12">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">About</h2>
                    <p className="text-xl text-gray-600">
                        Digitizing Agriculture. Empowering Farmers. Driving Intelligent Trade.
                    </p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
                    <div>
                        <h3 className="text-2xl font-bold text-gray-900 mb-4">Our Mission</h3>
                        <p className="text-gray-600 mb-4 text-lg">
                            We are committed to transforming agricultural trade by building a transparent, technology-driven ecosystem that connects farmers and distributors seamlessly.
                        </p>
                        <p className="text-gray-600 text-lg">
                            AgriChain AI empowers agricultural professionals with intelligent crop management tools, predictive price analytics, and real-time shipment tracking — enabling smarter decisions, reduced inefficiencies, and increased profitability across the supply chain.
                        </p>
                    </div>
                    <div className="bg-white p-8 rounded-lg shadow-md">
                        <h3 className="text-2xl font-bold text-gray-900 mb-6">Our Values</h3>
                        <ul className="space-y-4">
                            <li className="flex items-start">
                                <span className="text-green-600 font-bold mr-3">✓</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Transparency</h4>
                                    <p className="text-gray-600 text-sm">Complete visibility into your supply chain</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 font-bold mr-3">✓</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Reliability</h4>
                                    <p className="text-gray-600 text-sm">Dependable systems you can trust</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 font-bold mr-3">✓</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Innovation</h4>
                                    <p className="text-gray-600 text-sm">Cutting-edge technology for modern farming</p>
                                </div>
                            </li>
                            <li className="flex items-start">
                                <span className="text-green-600 font-bold mr-3">✓</span>
                                <div>
                                    <h4 className="font-semibold text-gray-900">Sustainability</h4>
                                    <p className="text-gray-600 text-sm">Supporting better practices for the planet</p>
                                </div>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}
