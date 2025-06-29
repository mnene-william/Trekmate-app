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
    const nameRef = useRef();

    const { signup } = useAuth();
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');

    const navigate = useNavigate(); // Initialize useNavigate hook

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setMessage('');

        if (passwordRef.current.value !== passwordConfirmRef.current.value) {
            return setError('Passwords do not match');
        }

        try {
            setLoading(true);

            const userCredential = await signup(emailRef.current.value, passwordRef.current.value);
            const newUser = userCredential.user;

            if (nameRef.current.value.trim()) {
                await updateProfile(newUser, {
                    displayName: nameRef.current.value.trim()
                });
            }

            await setDoc(doc(db, "users", newUser.uid), {
                uid: newUser.uid,
                displayName: nameRef.current.value.trim() || newUser.email.split('@')[0],
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
        <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
            <div className="layout-container flex h-full grow flex-col">
                <div className="px-4 sm:px-10 md:px-20 lg:px-40 flex flex-1 justify-center py-5">
                    <div className="layout-content-container flex flex-col w-full max-w-[512px] py-5 flex-1">

                        {/* NEW: Back Home Button */}
                        <div className="mb-4 self-start"> {/* Aligns button to the left */}
                            <button
                                onClick={() => navigate('/homepage')} // Navigate to /homepage
                                className="flex items-center text-gray-700 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                            >
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                                </svg>
                                Back Home
                            </button>
                        </div>

                        <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">Sign up to TrekMate</h2>

                        {message && (
                            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-md mx-auto max-w-[480px]" role="alert">
                                <p className="font-bold">Success!</p>
                                <p>{message}</p>
                            </div>
                        )}
                        {error && (
                            <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md mx-auto max-w-[480px]" role="alert">
                                <p className="font-bold">Error!</p>
                                <p>{error}</p>
                            </div>
                        )}

                        <form onSubmit={handleSignUp} className="flex flex-col w-full max-w-[480px] mx-auto gap-4 px-4 py-3">
                            <label className="flex flex-col flex-1 w-full">
                                <p className="text-[#111418] text-base font-medium leading-normal pb-2">Full Name</p>
                                <input
                                    type="text"
                                    placeholder="Enter your full name"
                                    className="form-input flex w-full flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                    ref={nameRef}
                                    required
                                />
                            </label>
                            <label className="flex flex-col flex-1 w-full">
                                <p className="text-[#111418] text-base font-medium leading-normal pb-2">Email address</p>
                                <input
                                    type="email"
                                    placeholder="name@example.com"
                                    className="form-input flex w-full flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                    ref={emailRef}
                                    required
                                />
                            </label>
                            <label className="flex flex-col flex-1 w-full">
                                <p className="text-[#111418] text-base font-medium leading-normal pb-2">Password</p>
                                <input
                                    type="password"
                                    placeholder="Min. 6 characters"
                                    className="form-input flex w-full flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                    ref={passwordRef}
                                    required
                                />
                            </label>
                            <label className="flex flex-col flex-1 w-full">
                                <p className="text-[#111418] text-base font-medium leading-normal pb-2">Confirm password</p>
                                <input
                                    type="password"
                                    placeholder="Min. 6 characters"
                                    className="form-input flex w-full flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                    ref={passwordConfirmRef}
                                    required
                                />
                            </label>
                            <div className="flex px-4 py-3 w-full">
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0c7ff2] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50 hover:bg-blue-600 transition-colors"
                                >
                                    <span className="truncate">{loading ? 'Signing Up...' : 'Sign up'}</span>
                                </button>
                            </div>
                        </form>
                        {/* Adjusted alignment for this paragraph */}
                        <p className="text-[#111418] text-sm font-normal leading-normal px-4 pt-4 text-center mx-auto max-w-[480px]">
                            Already have an account?{" "}
                            <Link to="/login" className="text-[#1b6bfe] font-medium hover:text-blue-700 transition-colors">
                                Log in
                            </Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default SignUp;
