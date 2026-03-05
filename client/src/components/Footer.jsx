import { Link } from 'react-router-dom';
import { FiFacebook, FiTwitter, FiLinkedin, FiInstagram } from 'react-icons/fi';

export default function Footer() {
    const currentYear = new Date().getFullYear();

    const footerLinks = [
        {
            title: 'Products',
            links: [
                { name: 'Dashboard', path: '/dashboard' },
                { name: 'Crops', path: '/crops' },
                { name: 'Market', path: '/market' },
            ],
        },
        {
            title: 'Company',
            links: [
                { name: 'About Us', path: '#' },
                { name: 'Blog', path: '#' },
                { name: 'Careers', path: '#' },
            ],
        },
        {
            title: 'Support',
            links: [
                { name: 'Help Center', path: '#' },
                { name: 'Contact Us', path: '#' },
                { name: 'FAQ', path: '#' },
            ],
        },
    ];

    return (
        <footer className="bg-gray-900 text-gray-300 mt-12">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
                    {/* Brand Section */}
                    <div className="md:col-span-1">
                        <Link to="/" className="flex items-center mb-4">
                            <span className="text-2xl font-bold text-green-400">AgriChain AI</span>
                        </Link>
                        <p className="text-sm text-gray-400 mb-4">
                            Optimizing agricultural supply chains for better efficiency and transparency.
                        </p>
                        {/* Social Links */}
                        <div className="flex space-x-4">
                            <a
                                href="#"
                                className="hover:text-green-400 transition-colors duration-200"
                                aria-label="Facebook"
                            >
                                <FiFacebook size={20} />
                            </a>
                            <a
                                href="#"
                                className="hover:text-green-400 transition-colors duration-200"
                                aria-label="Twitter"
                            >
                                <FiTwitter size={20} />
                            </a>
                            <a
                                href="#"
                                className="hover:text-green-400 transition-colors duration-200"
                                aria-label="LinkedIn"
                            >
                                <FiLinkedin size={20} />
                            </a>
                            <a
                                href="#"
                                className="hover:text-green-400 transition-colors duration-200"
                                aria-label="Instagram"
                            >
                                <FiInstagram size={20} />
                            </a>
                        </div>
                    </div>

                    {/* Footer Links */}
                    {footerLinks.map((section) => (
                        <div key={section.title}>
                            <h3 className="text-white font-semibold mb-4">{section.title}</h3>
                            <ul className="space-y-2">
                                {section.links.map((link) => (
                                    <li key={link.name}>
                                        <Link
                                            to={link.path}
                                            className="text-sm text-gray-400 hover:text-green-400 transition-colors duration-200"
                                        >
                                            {link.name}
                                        </Link>
                                    </li>
                                ))}
                            </ul>
                        </div>
                    ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-800 pt-8">
                    {/* Bottom Links */}
                    <div className="flex flex-col md:flex-row justify-between items-center text-sm text-gray-400 mb-4">
                        <div className="flex space-x-6 mb-4 md:mb-0">
                            <Link to="#" className="hover:text-green-400 transition-colors duration-200">
                                Privacy Policy
                            </Link>
                            <Link to="#" className="hover:text-green-400 transition-colors duration-200">
                                Terms of Service
                            </Link>
                            <Link to="#" className="hover:text-green-400 transition-colors duration-200">
                                Cookie Policy
                            </Link>
                        </div>
                        <p className="text-center md:text-right">
                            &copy; {currentYear} AgriChain AI. All rights reserved.
                        </p>
                    </div>
                </div>
            </div>
        </footer>
    );
}
