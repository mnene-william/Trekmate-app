import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';

function SignUp() {
    const [email, setEmail] = useState('');
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSignUp = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const userCredential = await createUserWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;

            await updateProfile(user, {
                displayName: username,
            });

            await setDoc(doc(db, 'users', user.uid), {
                uid: user.uid,
                email: user.email,
                username: username,
                createdAt: new Date(),
            });

            console.log('User signed up successfully:', user);
            navigate('/dashboard');
        } catch (err) {
            console.error('Error signing up:', err);
            if (err.code === 'auth/email-already-in-use') {
                setError('This email is already in use. Please try logging in or use a different email.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else if (err.code === 'auth/weak-password') {
                setError('Password should be at least 6 characters.');
            } else {
                setError('Failed to create an account: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="px-40 flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-[960px] flex-1">
                <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                    Create your account
                </h2>
                {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-[#111418] text-base font-medium leading-normal pb-2">Email</p>
                        <input
                            placeholder="Email"
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                        />
                    </label>
                </div>
                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-[#111418] text-base font-medium leading-normal pb-2">Username</p>
                        <input
                            placeholder="Username"
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                        />
                    </label>
                </div>
                <div className="flex max-w-[480px] flex-wrap items-end gap-4 px-4 py-3">
                    <label className="flex flex-col min-w-40 flex-1">
                        <p className="text-[#111418] text-base font-medium leading-normal pb-2">Password</p>
                        <input
                            placeholder="Password"
                            className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                        />
                    </label>
                </div>
                <div className="flex px-4 py-3">
                    <button
                        onClick={handleSignUp}
                        disabled={loading}
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0c7ff2] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50"
                    >
                        <span className="truncate">{loading ? 'Signing up...' : 'Sign up'}</span>
                    </button>
                </div>
                <p className="text-[#60758a] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
                    Already have an account?{' '}
                    <Link to="/login" className="underline">
                        Log in
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default SignUp;
