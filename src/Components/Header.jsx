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

    // --- Start of Re-added DiceBear Avatar Function ---
    const getDiceBearAvatarUrl = (user) => {
        let seed = user.uid; // Default fallback to UID for uniqueness

        if (user.displayName) {
            seed = user.displayName; // Use the display name for initials
        } else if (user.email) {
            // Use the part before '@' as a seed if no display name
            seed = user.email.split('@')[0];
        }
        
        // Corrected URL with '&' before colorful=true and more background colors
        return `https://api.dicebear.com/7.x/initials/svg?seed=${seed}&backgroundColor=c0aede,d1d4f9,b6e3f4,ffd5dc,a9d9d9,ffe7ba&backgroundType=solid,gradientLinear&scale=110&colorful=true`;
    };
    // --- End of Re-added DiceBear Avatar Function ---

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login'); // Redirect to login page after logout
        } catch (error) {
            console.error("Failed to log out:", error);
            // Optionally set an error message to display to the user
        }
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
            <div className="hidden md:flex items-center gap-9 ml-8">
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/homepage">Home</Link>
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/create-trip">Create Trip</Link>
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/my-trips">My Trips</Link>
                <Link className="text-[#111418] text-sm font-medium leading-normal" to="/explore">Explore</Link> {/* Updated to /explore */}
            </div>

            {/* Right Section: Bell Icon, Search Bar (if any), Profile/Auth Buttons, and Mobile Hamburger Icon */}
            <div className="flex flex-1 justify-end items-center gap-4 md:gap-8">
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
                    <Link to="/profile" className="flex items-center justify-center rounded-full size-10 bg-[#0c7ff2] text-white text-base font-bold overflow-hidden">
                        {/* Corrected logic: Prioritize photoURL, otherwise use DiceBear */}
                        <img
                            src={currentUser.photoURL || getDiceBearAvatarUrl(currentUser)}
                            alt="User Profile or Avatar"
                            className="w-full h-full object-cover"
                        />
                    </Link>
                ) : (
                    <div className="hidden md:flex gap-4">
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
                        <Link className="text-[#111418] text-lg font-medium leading-normal w-full py-2 hover:bg-gray-100" to="/explore" onClick={toggleMobileMenu}>Explore</Link> {/* Updated to /explore */}
                        {/* Example Inbox link, assuming you have one */}
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
                        {currentUser && (
                            <button
                                onClick={() => { handleLogout(); toggleMobileMenu(); }} // Call handleLogout and close menu
                                className="flex items-center justify-center rounded-lg h-10 bg-red-500 text-white text-base font-bold leading-normal w-full py-2 hover:bg-red-600"
                            >
                                Log Out
                            </button>
                        )}
                    </div>
                </div>
            )}
        </header>
    );
}

export default Header;
