import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Header from './Header';
import { useNavigate } from 'react-router-dom';

function Profile() {
    const { currentUser, loading, logout } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorProfile, setErrorProfile] = useState('');

    const [userTrips, setUserTrips] = useState([]);
    const [loadingUserTrips, setLoadingUserTrips] = useState(true);
    const [errorUserTrips, setErrorUserTrips] = useState('');

    // Authentication loading state
    if (loading) {
        return (
            <>
                <Header />
                <div className="p-4 text-center mt-8">
                    <p>Authenticating user...</p>
                </div>
            </>
        );
    }

    // Fetch profile data
    useEffect(() => {
        if (!currentUser) {
            setLoadingProfile(false);
            return;
        }

        const fetchProfile = async () => {
            try {
                const docRef = doc(db, "users", currentUser.uid);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    setProfileData(docSnap.data());
                } else {
                    // Fallback or initialization if user document doesn't exist yet
                    setProfileData({
                        uid: currentUser.uid,
                        displayName: currentUser.displayName || currentUser.email.split('@')[0],
                        email: currentUser.email,
                        photoURL: currentUser.photoURL || '',
                        bio: '', // Initialize bio
                        followersCount: 0, // Initialize counts
                        followingCount: 0, // Initialize counts
                    });
                }
                setErrorProfile('');
            } catch (err) {
                setErrorProfile("Failed to load your profile data.");
            } finally {
                setLoadingProfile(false);
            }
        };

        fetchProfile();
    }, [currentUser]);

    // Fetch user trips
    useEffect(() => {
        if (!currentUser) {
            setLoadingUserTrips(false);
            return;
        }

        const fetchUserTrips = async () => {
            try {
                setLoadingUserTrips(true);
                const tripsCollectionRef = collection(db, 'trips');
                const q = query(
                    tripsCollectionRef,
                    where("creatorId", "==", currentUser.uid),
                    orderBy("createdAt", "desc")
                );
                const querySnapshot = await getDocs(q);

                const fetchedTrips = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setUserTrips(fetchedTrips);
                setErrorUserTrips('');
            } catch (err) {
                setErrorUserTrips("Failed to load your trips.");
            } finally {
                setLoadingUserTrips(false);
            }
        };

        fetchUserTrips();
    }, [currentUser]);

    // Logout handler
    const handleLogout = async () => {
        try {
            await logout();
            navigate('/homepage');
            console.log("User logged out successfully.");
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    // Loading profile/trips state
    if (loadingProfile || loadingUserTrips) {
        return (
            <>
                <Header />
                <div className="p-4 text-center mt-8">
                    <p>Loading your profile and trips...</p>
                </div>
            </>
        );
    }

    // Error state
    if (errorProfile || errorUserTrips) {
        return (
            <>
                <Header />
                <div className="p-4 text-center mt-8 text-red-500">
                    <p>Error loading profile data. Please try again later. {(errorProfile || errorUserTrips)}</p>
                    <button
                        onClick={() => navigate('/homepage')}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mt-4 transition-colors duration-150 hover:bg-blue-700 cursor-pointer"
                    >
                        Back to Home
                    </button>
                </div>
            </>
        );
    }

    // Not logged in state
    if (!currentUser) {
        return (
            <>
                <Header />
                <div className="p-4 text-center mt-8 text-red-500">
                    <p>Please log in to view your profile.</p>
                    <button
                        onClick={() => navigate('/login')}
                        className="bg-blue-600 text-white font-bold py-2 px-4 rounded-lg mt-4 transition-colors duration-150 hover:bg-blue-700 cursor-pointer"
                    >
                        Go to Login
                    </button>
                </div>
            </>
        );
    }

    const joinedYear = currentUser?.metadata?.creationTime
        ? new Date(currentUser.metadata.creationTime).getFullYear()
        : 'N/A';

    return (
        <>
            <Header />
            <div className="p-4 mx-auto max-w-4xl"> {/* mx-auto for horizontal centering, max-w-4xl for max width */}
                {/* Back Button */}
                <div className="mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-600 transition-colors duration-200 cursor-pointer hover:text-blue-600 focus:outline-none"
                    >
                        <svg className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>

                {/* Profile Info Card */}
                <div className="flex flex-col items-center justify-center pt-8 pb-10 px-4 bg-white rounded-lg shadow-md mx-auto mb-8">
                    <img
                        src={profileData?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${profileData?.displayName || profileData?.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                        alt={profileData?.username || profileData?.email || "User"}
                        className="w-36 h-36 rounded-full object-cover mb-4 border-4 border-blue-200 outline-4 outline-white"
                    />
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">
                        {profileData?.displayName || profileData?.email?.split('@')[0] || 'Traveler'}
                    </h1>

                    {/* Followers and Following Counts */}
                    <div className="flex items-center text-sm text-gray-600 mb-4 gap-4">
                        <span className="font-semibold">{profileData?.followersCount || 0} Followers</span>
                        <span className="font-semibold">{profileData?.followingCount || 0} Following</span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-4 gap-2">
                        <span>Joined in {joinedYear}</span>
                        <span className="h-4 w-px bg-gray-300 mx-2"></span> {/* Vertical separator */}
                        <span>{userTrips.length} trips</span>
                        <span className="h-4 w-px bg-gray-300 mx-2"></span> {/* Vertical separator */}
                    </div>
                    <button
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors duration-150 shadow-md cursor-pointer hover:bg-blue-700"
                        onClick={() => navigate('/create-profile')}
                    >
                        Edit profile
                    </button>
                </div>

                {/* About Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mx-auto mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">About</h2>
                    <p className="text-gray-700 leading-relaxed">
                        {profileData?.bio || "No bio yet. Click 'Edit profile' to add one"}
                    </p>
                </div>

                {/* My Trips Section */}
                <div className="bg-white p-6 rounded-lg shadow-md mx-auto mb-8">
                    <h2 className="text-2xl font-bold text-gray-900 mb-4">My Trips</h2>
                    {loadingUserTrips && <p className="text-center text-gray-600">Loading your trips...</p>}
                    {!loadingUserTrips && userTrips.length === 0 && (
                        <p className="text-center text-gray-600">You haven't created any trips yet.</p>
                    )}
                    <div className="grid gap-4"> {/* Use grid for trip cards for better layout */}
                        {userTrips.map(trip => (
                            <div
                                key={trip.id}
                                className="border border-gray-200 rounded-lg p-4 flex flex-col sm:flex-row bg-gray-50 shadow-sm transition-transform duration-200 ease-in-out cursor-pointer hover:-translate-y-0.5 hover:shadow-md"
                                onClick={() => navigate(`/trips/${trip.id}`)}
                            >
                                <img
                                    src={trip.imageUrl || 'https://via.placeholder.com/200x150?text=No+Image'}
                                    alt={trip.title}
                                    // Responsive image sizing: full width on mobile, fixed width on sm+ screens
                                    className="w-full h-40 object-cover rounded-lg mb-4 sm:w-48 sm:h-36 sm:mr-4 sm:mb-0 flex-shrink-0"
                                />
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold mb-2">{trip.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{trip.destination}</p>
                                    <p className="text-xs text-gray-700 mb-2"> From {trip.startDate} to {trip.endDate}</p>
                                    {/* line-clamp-3 requires @tailwindcss/line-clamp plugin installed in tailwind.config.js */}
                                    <p className="text-sm text-gray-700 leading-relaxed line-clamp-3">{trip.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logout Button */}
                <div className="text-center mt-10 mb-8">
                    <button
                        onClick={handleLogout}
                        className="py-2.5 px-7 rounded-full shadow-md inline-flex items-center justify-center bg-red-500 text-white font-bold text-base transition-colors duration-150 cursor-pointer hover:bg-red-600"
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
}

export default Profile;
