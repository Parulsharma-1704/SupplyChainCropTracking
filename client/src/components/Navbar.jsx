import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { FiMenu, FiX } from 'react-icons/fi';
import { IoLeaf } from 'react-icons/io5';

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const [activeSection, setActiveSection] = useState('home');

    const toggleMenu = () => setIsOpen(!isOpen);

    const navLinks = [
        { name: 'Home', path: '#home', id: 'home' },
        { name: 'About', path: '#about', id: 'about' },
        { name: 'Features', path: '#features', id: 'features' },
        { name: 'How It Works', path: '#how-it-works', id: 'how-it-works' },
    ];

    useEffect(() => {
        const observerOptions = {
            root: null,
            rootMargin: '-50% 0px -50% 0px',
            threshold: 0,
        };

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (entry.isIntersecting) {
                    setActiveSection(entry.target.id);
                }
            });
        }, observerOptions);

        // Observe all sections
        navLinks.forEach((link) => {
            const element = document.getElementById(link.id);
            if (element) {
                observer.observe(element);
            }
        });

        return () => {
            navLinks.forEach((link) => {
                const element = document.getElementById(link.id);
                if (element) {
                    observer.unobserve(element);
                }
            });
        };
    }, []);

    return (
        <nav className="bg-white shadow-md sticky top-0 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <div className="shrink-0">
                        <Link to="/" className="flex items-center gap-2">
                            <IoLeaf className="text-2xl text-green-600" />
                            <span className="text-2xl font-bold text-green-600">AgriChain AI</span>
                        </Link>
                    </div>

                    {/* Desktop Navigation */}
                    <div className="hidden md:flex items-center space-x-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.path}
                                href={link.path}
                                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${activeSection === link.id
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'
                                    }`}
                            >
                                {link.name}
                            </a>
                        ))}
                    </div>

                    {/* Auth Buttons (Desktop) */}
                    <div className="hidden md:flex items-center space-x-3">
                        <Link
                            to="/login"
                            className="px-4 py-2 text-sm font-medium text-gray-700 hover:text-green-600 transition-colors duration-200"
                        >
                            Login
                        </Link>
                        <Link
                            to="/register"
                            className="px-4 py-2 bg-green-600 text-white text-sm font-medium rounded-md hover:bg-green-700 transition-colors duration-200"
                        >
                            Register
                        </Link>
                    </div>

                    {/* Mobile Menu Button */}
                    <button
                        onClick={toggleMenu}
                        className="md:hidden inline-flex items-center justify-center p-2 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                    >
                        {isOpen ? <FiX size={24} /> : <FiMenu size={24} />}
                    </button>
                </div>
            </div>

            {/* Mobile Navigation */}
            {isOpen && (
                <div className="md:hidden bg-white border-t border-gray-200">
                    <div className="px-2 pt-2 pb-3 space-y-1">
                        {navLinks.map((link) => (
                            <a
                                key={link.path}
                                href={link.path}
                                className={`block px-3 py-2 rounded-md text-base font-medium transition-colors duration-200 ${activeSection === link.id
                                    ? 'text-green-600 bg-green-50'
                                    : 'text-gray-700 hover:text-green-600 hover:bg-gray-100'
                                    }`}
                                onClick={() => setIsOpen(false)}
                            >
                                {link.name}
                            </a>
                        ))}
                        <div className="border-t border-gray-200 pt-2 mt-2 space-y-2">
                            <Link
                                to="/login"
                                className="block px-3 py-2 rounded-md text-base font-medium text-gray-700 hover:text-green-600 hover:bg-gray-100 transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Login
                            </Link>
                            <Link
                                to="/register"
                                className="block px-3 py-2 bg-green-600 text-white rounded-md text-base font-medium hover:bg-green-700 transition-colors duration-200"
                                onClick={() => setIsOpen(false)}
                            >
                                Register
                            </Link>
                        </div>
                    </div>
                </div>
            )}
        </nav>
    );
}
