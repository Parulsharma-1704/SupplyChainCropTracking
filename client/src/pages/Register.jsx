import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { FiUser, FiMail, FiLock, FiPhone, FiEye, FiEyeOff, FiMapPin } from 'react-icons/fi';

export default function Register() {
    const [role, setRole] = useState('farmer');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        password: '',
        phone: '',
        address: {
            street: '',
            city: '',
            state: '',
            pincode: '',
        },
        farmDetails: {
            farmName: '',
            farmSize: '',
            farmType: 'organic',
            registrationNumber: '',
        },
        businessDetails: {
            businessName: '',
            licenseNumber: '',
            gstNumber: '',
            businessType: 'wholesaler',
        },
    });
    const navigate = useNavigate();

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value,
        }));
        setError('');
    };

    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            address: {
                ...prev.address,
                [name]: value,
            },
        }));
    };

    const handleFarmDetailsChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            farmDetails: {
                ...prev.farmDetails,
                [name]: value,
            },
        }));
    };

    const handleBusinessDetailsChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            businessDetails: {
                ...prev.businessDetails,
                [name]: value,
            },
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        const submitData = {
            name: formData.name,
            email: formData.email,
            password: formData.password,
            phone: formData.phone,
            role,
            address: formData.address,
        };

        if (role === 'farmer') {
            submitData.farmDetails = formData.farmDetails;
        } else if (role === 'distributor') {
            submitData.businessDetails = formData.businessDetails;
        }

        try {
            const response = await fetch('http://localhost:5000/api/auth/register', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(submitData),
            });

            const data = await response.json();

            if (!response.ok) {
                setError(data.message || 'Registration failed');
                setLoading(false);
                return;
            }

            // Store token in localStorage
            localStorage.setItem('token', data.data.token);
            localStorage.setItem('user', JSON.stringify(data.data.user));

            // Redirect to dashboard
            navigate('/dashboard');
        } catch (err) {
            setError(err.message || 'An error occurred during registration');
            setLoading(false);
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center bg-linear-to-br from-green-50 to-blue-50 py-12 px-4">
            <div className="w-full max-w-2xl bg-white rounded-lg shadow-lg p-8">
                <div className="text-center mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Join AgriChain AI</h1>
                    <p className="text-gray-600">Create your account to get started</p>
                </div>

                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-lg">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* Role Selection */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-3">
                            Account Type
                        </label>
                        <div className="grid grid-cols-2 gap-4">
                            {['farmer', 'distributor'].map((userRole) => (
                                <label
                                    key={userRole}
                                    className={`p-4 border-2 rounded-lg cursor-pointer transition-all ${role === userRole
                                            ? 'border-green-600 bg-green-50'
                                            : 'border-gray-300 hover:border-gray-400'
                                        }`}
                                >
                                    <input
                                        type="radio"
                                        name="role"
                                        value={userRole}
                                        checked={role === userRole}
                                        onChange={(e) => setRole(e.target.value)}
                                        className="mr-2"
                                    />
                                    <span className="font-medium capitalize">{userRole}</span>
                                </label>
                            ))}
                        </div>
                    </div>

                    {/* Basic Information */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {/* Name */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Full Name
                            </label>
                            <div className="relative">
                                <FiUser className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="text"
                                    name="name"
                                    value={formData.name}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="Your name"
                                />
                            </div>
                        </div>

                        {/* Phone */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Phone Number
                            </label>
                            <div className="relative">
                                <FiPhone className="absolute left-3 top-3 text-gray-400" size={20} />
                                <input
                                    type="tel"
                                    name="phone"
                                    value={formData.phone}
                                    onChange={handleChange}
                                    required
                                    pattern="[0-9]{10}"
                                    className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                    placeholder="10-digit phone number"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Email */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <FiMail className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type="email"
                                name="email"
                                value={formData.email}
                                onChange={handleChange}
                                required
                                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="your@email.com"
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <FiLock className="absolute left-3 top-3 text-gray-400" size={20} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                name="password"
                                value={formData.password}
                                onChange={handleChange}
                                required
                                minLength="6"
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                placeholder="Minimum 6 characters"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-3 text-gray-400 hover:text-gray-600"
                            >
                                {showPassword ? <FiEyeOff size={20} /> : <FiEye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Address Section */}
                    <div className="border-t pt-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                            <FiMapPin size={20} /> Address
                        </h3>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <input
                                type="text"
                                name="street"
                                value={formData.address.street}
                                onChange={handleAddressChange}
                                placeholder="Street Address"
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                name="city"
                                value={formData.address.city}
                                onChange={handleAddressChange}
                                placeholder="City"
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                name="state"
                                value={formData.address.state}
                                onChange={handleAddressChange}
                                placeholder="State"
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                            <input
                                type="text"
                                name="pincode"
                                value={formData.address.pincode}
                                onChange={handleAddressChange}
                                placeholder="Pincode"
                                className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                            />
                        </div>
                    </div>

                    {/* Farmer Details */}
                    {role === 'farmer' && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Farm Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="farmName"
                                    value={formData.farmDetails.farmName}
                                    onChange={handleFarmDetailsChange}
                                    placeholder="Farm Name"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="number"
                                    name="farmSize"
                                    value={formData.farmDetails.farmSize}
                                    onChange={handleFarmDetailsChange}
                                    placeholder="Farm Size (acres)"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <select
                                    name="farmType"
                                    value={formData.farmDetails.farmType}
                                    onChange={handleFarmDetailsChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="organic">Organic</option>
                                    <option value="conventional">Conventional</option>
                                    <option value="mixed">Mixed</option>
                                </select>
                                <input
                                    type="text"
                                    name="registrationNumber"
                                    value={formData.farmDetails.registrationNumber}
                                    onChange={handleFarmDetailsChange}
                                    placeholder="Registration Number"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                            </div>
                        </div>
                    )}

                    {/* Distributor Details */}
                    {role === 'distributor' && (
                        <div className="border-t pt-6">
                            <h3 className="text-lg font-semibold text-gray-900 mb-4">Business Details</h3>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <input
                                    type="text"
                                    name="businessName"
                                    value={formData.businessDetails.businessName}
                                    onChange={handleBusinessDetailsChange}
                                    placeholder="Business Name"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="text"
                                    name="licenseNumber"
                                    value={formData.businessDetails.licenseNumber}
                                    onChange={handleBusinessDetailsChange}
                                    placeholder="License Number"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <input
                                    type="text"
                                    name="gstNumber"
                                    value={formData.businessDetails.gstNumber}
                                    onChange={handleBusinessDetailsChange}
                                    placeholder="GST Number"
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                />
                                <select
                                    name="businessType"
                                    value={formData.businessDetails.businessType}
                                    onChange={handleBusinessDetailsChange}
                                    className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                                >
                                    <option value="wholesaler">Wholesaler</option>
                                    <option value="retailer">Retailer</option>
                                    <option value="exporter">Exporter</option>
                                </select>
                            </div>
                        </div>
                    )}

                    {/* Submit Button */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-green-600 text-white font-semibold py-3 rounded-lg hover:bg-green-700 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        {loading ? 'Creating account...' : 'Create Account'}
                    </button>
                </form>

                {/* Login Link */}
                <p className="text-center text-gray-600 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-green-600 font-semibold hover:text-green-700">
                        Login here
                    </Link>
                </p>
            </div>
        </section>
    );
}
