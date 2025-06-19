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
            navigate('/HomePage');
        } catch (err) {
            console.error('Error logging in:', err);
            if (err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password' || err.code === 'auth/invalid-credential') {
                setError('Invalid email or password. Please try again.');
            } else if (err.code === 'auth/invalid-email') {
                setError('Please enter a valid email address.');
            } else {
                setError('Failed to log in: ' + err.message);
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-1 justify-center items-center">
            <div className="layout-content-container flex flex-col w-[512px] max-w-\[512px] py-5 max-w-[960px] flex-1">
                <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                    Welcome back
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
                <p className="text-[#60758a] text-sm font-normal leading-normal pb-3 pt-1 px-4 underline">
                    <Link to="/forgot-password">Forgot password?</Link>
                </p>
                <div className="flex px-4 py-3">
                    <button
                        onClick={handleLogin}
                        disabled={loading}
                        className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 px-4 flex-1 bg-[#0c7ff2] text-white text-sm font-bold leading-normal tracking-[0.015em] disabled:opacity-50"
                    >
                        <span className="truncate">{loading ? 'Logging in...' : 'Log in'}</span>
                    </button>
                </div>
                <p className="text-[#60758a] text-sm font-normal leading-normal pb-3 pt-1 px-4 text-center">
                    Don't have an account?{' '}
                    <Link to="/signup" className="underline">
                        Sign up
                    </Link>
                </p>
            </div>
        </div>
    );
}

export default Login;
