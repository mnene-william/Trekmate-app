import React, { useState } from 'react'; // Import useState for managing mobile menu state
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';

function Header() {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false); // State to control mobile menu visibility

    // Function to toggle the mobile menu open/close state
    const toggleMobileMenu = () => {
        setIsMobileMenuOpen(!isMobileMenuOpen);
    };

    return (
        <header className="flex items-center justify-between whitespace-nowrap border-b border-solid border-b-[#f0f2f5] px-4 py-3 md:px-10">
            {/* Left Section: Logo (TrekMate) */}
            <div className="flex items-center gap-4 text-[#111418]">
                <div className="size-4">
                    <svg viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <path
                            d="M44 11.2727C44 14.0109 39.8386 16.3957 33.69 17.6364C39.8386 18.877 44 21.2618 44 24C44 26.7382 39.8386 29.123 33.69 30.3636C39.8386 31.6043 44 33.9891 44 36.7273C44 40.7439 35.0457 44 24 44C12.9543 44 4 40.7439 4 36.7273C4 33.9891 8.16144 31.6043 14.31 30.3636C8.16144 29.123 4 26.7382 4 24C4 21.2618 8.16144 18.877 14.31 17.6364C8.16144 16.3957 4 14.0109 4 11.2727C4 7.25611 12.9543 4 24 4C35.0457 4 44 7.25611 44 11.2727Z"
                            fill="currentColor"
                        ></path>
                    </svg>
                </div>
                <h2 className="text-[#111418] text-lg font-bold leading-tight tracking-[-0.015em]">TrekMate</h2>
            </div>

            {/* Main Navigation Links (hidden on mobile, visible and flex on medium screens and up) */}
            <div className="hidden md:flex items-center gap-9">
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/homepage">Home</Link>
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/create-trip">Create Trip</Link>
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/my-trips">My Trips</Link>
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/inbox">Inbox</Link>
            </div>

            {/* Right Section: Bell Icon, Search Bar (if any), Profile/Auth Buttons, and Mobile Hamburger Icon */}
            <div className="flex flex-1 justify-end items-center gap-4 md:gap-8"> {/* Adjusted gap for mobile */}
                {/* Search Bar (hidden on mobile, visible on medium screens and up) */}
                {/* Note: Your label is currently empty, it can be styled later */}
                <label className="hidden md:flex flex-col min-w-40 !h-10 max-w-64"></label>

                {/* Notification Bell */}
                <button
                    className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5"
                >
                    <div className="text-[#111418]" data-icon="Bell" data-size="20px" data-weight="regular">
                        <svg xmlns="http://www.w3.org/2000/svg" width="20px" height="20px" fill="currentColor" viewBox="0 0 256 256">
                            <path
                                d="M221.8,175.94C216.25,166.38,208,139.33,208,104a80,80,0,1,0-160,0c0,35.34-8.26,62.38-13.81,71.94A16,16,0,0,0,48,200H88.81a40,40,0,0,0,78.38,0H208a16,16,0,0,0,13.8-24.06ZM128,216a24,24,0,0,1-22.62-16h45.24A24,24,0,0,1,128,216ZM48,184c7.7-13.24,16-43.92,16-80a64,64,0,1,1,128,0c0,36.05,8.28,66.73,16,80Z"
                            ></path>
                        </svg>
                    </div>
                </button>

                {/* User Profile / Auth Buttons */}
                {currentUser ? (
                    <Link to="/profile" className="flex items-center justify-center rounded-full size-10 bg-[#0c7ff2] text-white text-base font-bold">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-user">
                            <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                        </svg>
                    </Link>
                ) : (
                    <div className="hidden md:flex gap-4"> {/* Auth buttons hidden on mobile, visible on medium screens and up */}
                        <Link to="/login" className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#f0f2f5] text-[#111418] text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-gray-200 transition-colors">
                            Log In
                        </Link>
                        <Link to="/signup" className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-[#0c7ff2] text-white text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-blue-700 transition-colors">
                            Sign Up
                        </Link>
                    </div>
                )}

                {/* Mobile Hamburger Menu Button (visible on mobile, hidden on medium screens and up) */}
                <button
                    className="md:hidden p-2 rounded-lg text-[#111418] hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-gray-200"
                    onClick={toggleMobileMenu}
                    aria-label="Open menu"
                >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16"></path>
                    </svg>
                </button>
            </div>

            {/* Mobile Menu Overlay/Dropdown (conditionally rendered based on isMobileMenuOpen) */}
            {isMobileMenuOpen && (
                <div className="md:hidden absolute top-[60px] left-0 w-full bg-white border-b border-solid border-b-[#f0f2f5] shadow-md z-50">
                    <div className="flex flex-col items-start p-4 gap-4">
                        <Link className="text-[#111418] text-lg font-medium leading-normal w-full py-2 hover:bg-gray-100" to="/homepage" onClick={toggleMobileMenu}>Home</Link>
                        <Link className="text-[#111418] text-lg font-medium leading-normal w-full py-2 hover:bg-gray-100" to="/create-trip" onClick={toggleMobileMenu}>Create Trip</Link>
                        <Link className="text-[#111418] text-lg font-medium leading-normal w-full py-2 hover:bg-gray-100" to="/my-trips" onClick={toggleMobileMenu}>My Trips</Link>
                        <Link className="text-[#111418] text-lg font-medium leading-normal w-full py-2 hover:bg-gray-100" to="/inbox" onClick={toggleMobileMenu}>Inbox</Link>
                        {/* Auth buttons in mobile menu if not logged in */}
                        {!currentUser && (
                            <>
                                <Link to="/login" className="flex items-center justify-center rounded-lg h-10 bg-[#f0f2f5] text-[#111418] text-base font-bold leading-normal w-full py-2 hover:bg-gray-200" onClick={toggleMobileMenu}>
                                    Log In
                                </Link>
                                <Link to="/signup" className="flex items-center justify-center rounded-lg h-10 bg-[#0c7ff2] text-white text-base font-bold leading-normal w-full py-2 hover:bg-blue-700" onClick={toggleMobileMenu}>
                                    Sign Up
                                </Link>
                            </>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
