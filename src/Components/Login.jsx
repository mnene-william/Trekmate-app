import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase'; // Assuming 'auth' is exported from your firebase config

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError(''); // Clear previous errors
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('User logged in successfully!');
            // You could add a success message state here if you want to show it briefly before navigating
            // setMessage('Login successful! Redirecting...');
            navigate('/homepage'); // Navigate to HomePage after successful login
        } catch (err) {
            console.error('Error logging in:', err);
            let errorMessage = 'Failed to log in. Please try again.'; // Default generic message
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                errorMessage = 'Invalid email or password. Please try again.';
            } else if (err.code === 'auth/invalid-email') {
                errorMessage = 'Please enter a valid email address.';
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = 'Access to this account has been temporarily disabled due to many failed login attempts. Please try again later.';
            } else {
                errorMessage = 'Failed to log in: ' + err.message;
            }
            setError(errorMessage);
            // Clear the error message after 5 seconds for better UX
            setTimeout(() => {
                setError('');
            }, 5000);
        } finally {
            setLoading(false);
        }
    };

    return (
        // Main container with gradient background and centered content
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-100 to-purple-100 p-4">
            {/* Card container with animations */}
            <div className="bg-white p-8 rounded-xl shadow-2xl w-full max-w-md transform transition-all duration-300 hover:scale-105">
                {/* Back Home Button */}
                <div className="mb-4 self-start">
                    <button
                        onClick={() => navigate('/homepage')}
                        className="flex items-center text-gray-700 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back Home
                    </button>
                </div>

                {/* Title with animation */}
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 animate-fade-in-down">Welcome back</h2>

                {/* Error Message Display with animation */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md animate-fade-in-up" role="alert">
                        <p className="font-bold">Error!</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleLogin} className="space-y-6">
                    {/* Email Input with floating label */}
                    <div className="relative group">
                        <input
                            type="email"
                            id="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 peer"
                            placeholder=" " // Important for floating label
                        />
                        <label
                            htmlFor="email"
                            className="absolute left-4 top-3 text-gray-500 text-base transition-all duration-300
                                       peer-placeholder-shown:text-base peer-placeholder-shown:top-3
                                       peer-focus:-top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1"
                        >
                            Email
                        </label>
                    </div>

                    {/* Password Input with floating label */}
                    <div className="relative group">
                        <input
                            type="password"
                            id="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 peer"
                            placeholder=" " // Important for floating label
                        />
                        <label
                            htmlFor="password"
                            className="absolute left-4 top-3 text-gray-500 text-base transition-all duration-300
                                       peer-placeholder-shown:text-base peer-placeholder-shown:top-3
                                       peer-focus:-top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1"
                        >
                            Password
                        </label>
                    </div>

                    {/* Forgot password link */}
                    <p className="text-gray-600 text-sm text-right mt-2">
                        <Link to="/forgot-password" className="text-blue-600 font-semibold hover:underline">
                            Forgot password?
                        </Link>
                    </p>

                    {/* Submit Button with animation */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg
                                   hover:bg-blue-700 transition-all duration-300 transform hover:scale-105
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                   disabled:opacity-50 disabled:cursor-not-allowed animate-bounce-in"
                    >
                        {loading ? 'Logging in...' : 'Log in'}
                    </button>
                </form>

                {/* Don't have an account link */}
                <p className="text-center text-gray-600 mt-6">
                    Don't have an account?{' '}
                    <Link to="/signup" className="text-blue-600 font-semibold hover:underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;