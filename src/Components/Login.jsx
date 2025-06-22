import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';

function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            await signInWithEmailAndPassword(auth, email, password);
            console.log('User logged in successfully!');
            // You could add a success message state here if you want to show it briefly before navigating
            // setMessage('Login successful! Redirecting...');
            navigate('/HomePage');
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
        <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
            <div className="layout-container flex h-full grow flex-col">
                <div className="flex flex-1 justify-center items-center px-4 sm:px-10 md:px-20 lg:px-40 py-5"> {/* Responsive padding */}
                    <div className="layout-content-container flex flex-col w-full max-w-[512px] py-5 flex-1"> {/* w-full for responsiveness */}
                        <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                            Welcome back
                        </h2>

                        {/* Error Message Display (styled like in SignUp/TripDetails) */}
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md mx-auto max-w-[480px]" role="alert">
                                <p className="font-bold">Error!</p>
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleLogin} className="flex flex-col w-full max-w-[480px] mx-auto gap-4 px-4 py-3"> {/* Centered form */}
                            <label className="flex flex-col flex-1 w-full">
                                <p className="text-[#111418] text-base font-medium leading-normal pb-2">Email</p>
                                <input
                                    placeholder="Email"
                                    className="form-input flex w-full flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                    type="email"
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    required // Added required attribute
                                />
                            </label>

                            <label className="flex flex-col flex-1 w-full">
                                <p className="text-[#111418] text-base font-medium leading-normal pb-2">Password</p>
                                <input
                                    placeholder="Password"
                                    className="form-input flex w-full flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                    type="password"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required // Added required attribute
                                />
                            </label>

                            {/* Forgot password link - centered and styled to match form width */}
                            <p className="text-[#60758a] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-right w-full max-w-[480px] mx-auto">
                                <Link to="/forgot-password" className="underline hover:text-blue-700 transition-colors">Forgot password?</Link>
                            </p>

                            <div className="flex px-4 py-3 w-full">
                                <button
                                    type="submit" // Change to type="submit" for forms
                                    disabled={loading}
                                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-14 px-5 flex-1 bg-[#0c7ff2] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50 hover:bg-blue-600 transition-colors" // Adjusted height and px for consistency
                                >
                                    <span className="truncate">{loading ? 'Logging in...' : 'Log in'}</span>
                                </button>
                            </div>
                        </form>

                        {/* Don't have an account link - centered and styled to match form width */}
                        <p className="text-[#60758a] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center mx-auto max-w-[480px]">
                            Don't have an account?{' '}
                            <Link to="/signup" className="underline text-[#1b6bfe] font-medium hover:text-blue-700 transition-colors">
                                Sign up
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Login;
