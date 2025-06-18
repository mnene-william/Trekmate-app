import React from 'react';
import { useAuth } from '../Context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '../firebase';
import { signOut } from 'firebase/auth';
import Header from './Header';

function Dashboard() {
    const { currentUser, loading } = useAuth();
    const navigate = useNavigate();

   

    if (loading) {
        return (
            <div className="flex flex-1 justify-center items-center py-5">
                <p>Loading user status...</p>
            </div>
        );
    }

    return (
        <>
        <Header />
        <div className="flex flex-1 justify-center py-5">
            <div className="layout-content-container flex flex-col w-[512px] max-w-[512px] py-5 max-w-[960px] flex-1">
                {currentUser ? (
                    <>
                        <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                            Welcome, {currentUser.displayName || currentUser.email}!
                        </h2>
                        <p className="text-[#60758a] text-base font-normal leading-normal px-4 text-center pb-3">
                            You're all set to explore and connect with fellow travelers.
                        </p>
                        <div className="flex px-4 py-3 gap-4 justify-center">
                            <button className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#0c7ff2] text-white text-base font-bold leading-normal tracking-[0.015em]">
                                <span className="truncate">Start a New Trip</span>
                            </button>
                           
                        </div>
                    </>
                ) : (
                    <>
                        <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">
                            Welcome, Traveler!
                        </h2>
                        <p className="text-[#60758a] text-base font-normal leading-normal px-4 text-center pb-3">
                            Log in or sign up to discover amazing travel buddies and plan your next adventure!
                        </p>
                        <div className="flex px-4 py-3 gap-4 justify-center">
                            <Link to="/login" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#f0f2f5] text-[#111418] text-base font-bold leading-normal tracking-[0.015em]">
                                <span className="truncate">Log In</span>
                            </Link>
                            <Link to="/signup" className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 bg-[#0c7ff2] text-white text-base font-bold leading-normal tracking-[0.015em]">
                                <span className="truncate">Sign Up</span>
                            </Link>
                        </div>
                    </>
                )}
            </div>
        </div>
        </>
    );
}

export default Dashboard;              
