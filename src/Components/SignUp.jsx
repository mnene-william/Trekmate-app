import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { updateProfile } from 'firebase/auth';

function SignUp() {
    const emailRef = useRef();
    const passwordRef = useRef();
    const passwordConfirmRef = useRef();
    const nameRef = useRef(); // For full name input

    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState(''); 

    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError(''); 
        setMessage(''); 

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match');
        }

        if (passwordRef.current.value.length < 6) {
            return setError("Password must be at least 6 characters long.");
        }

        try {
            setLoading(true);

            const userCredential = await signup(emailRef.current.value, passwordRef.current.value);
            const newUser = userCredential.user;

            const displayNameToSet = nameRef.current.value.trim() || newUser.email.split('@')[0];

            // Update Firebase Auth profile with display name
            await updateProfile(newUser, {
                displayName: displayNameToSet
            });

            // Store user data in Firestore
            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                displayName: displayNameToSet,
                email: newUser.email,
                createdAt: serverTimestamp(),
                followersCount: 0,
                followingCount: 0,
                photoURL: newUser.photoURL || null 
            });

            setMessage('Account created successfully! Redirecting...');
            setTimeout(() => {
                setMessage('');
                navigate('/create-profile');
            }, 3000);

        } catch (err) {
            console.error("Error signing up:", err);
            // Firebase errors often have a 'code' and 'message'
            if (err.code === 'auth/email-already-in-use') {
                setError('This email address is already in use. Please log in or use a different email.');
            } else if (err.code === 'auth/invalid-email') {
                setError('The email address is not valid.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters (min. 6 characters).');
            } else {
                setError("Failed to create an account: " + err.message);
            }
            setTimeout(() => setError(''), 5000);
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
                <h2 className="text-3xl font-bold text-center text-gray-800 mb-6 animate-fade-in-down">Sign up to TrekMate</h2>

                {/* Message Display (Success/Error) with animation */}
                {message && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded-md animate-fade-in-up" role="alert">
                        <p className="font-bold">Success!</p>
                        <p>{message}</p>
                    </div>
                )}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded-md animate-fade-in-up" role="alert">
                        <p className="font-bold">Error!</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSignUp} className="space-y-6">
                    {/* Full Name Input with floating label */}
                    <div className="relative group">
                        <input
                            type="text"
                            id="fullName"
                            ref={nameRef}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 peer"
                            placeholder=" " // Important for floating label
                        />
                        <label
                            htmlFor="fullName"
                            className="absolute left-4 top-3 text-gray-500 text-base transition-all duration-300
                                       peer-placeholder-shown:text-base peer-placeholder-shown:top-3
                                       peer-focus:-top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1"
                        >
                            Full Name
                        </label>
                    </div>

                    {/* Email Input with floating label */}
                    <div className="relative group">
                        <input
                            type="email"
                            id="email"
                            ref={emailRef}
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
                            ref={passwordRef}
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

                    {/* Confirm Password Input with floating label */}
                    <div className="relative group">
                        <input
                            type="password"
                            id="confirmPassword"
                            ref={passwordConfirmRef}
                            required
                            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all duration-300 peer"
                            placeholder=" " // Important for floating label
                        />
                        <label
                            htmlFor="confirmPassword"
                            className="absolute left-4 top-3 text-gray-500 text-base transition-all duration-300
                                       peer-placeholder-shown:text-base peer-placeholder-shown:top-3
                                       peer-focus:-top-2 peer-focus:text-sm peer-focus:text-blue-600 peer-focus:bg-white peer-focus:px-1"
                        >
                            Confirm Password
                        </label>
                    </div>

                    {/* Submit Button with animation */}
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold text-lg
                                   hover:bg-blue-700 transition-all duration-300 transform hover:scale-105
                                   focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                   disabled:opacity-50 disabled:cursor-not-allowed animate-bounce-in"
                    >
                        {loading ? 'Signing Up...' : 'Sign Up'}
                    </button>
                </form>

                {/* Login link */}
                <p className="text-center text-gray-600 mt-6">
                    Already have an account?{' '}
                    <Link to="/login" className="text-blue-600 font-semibold hover:underline">
                        Log In
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default SignUp;

