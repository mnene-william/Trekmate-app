import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, query, orderBy, where, getDocs, collection, writeBatch, increment, updateDoc } from 'firebase/firestore';
import Header from './Header'; // Assuming Header component uses Tailwind for its styles

function UserProfile() {
    const { userId } = useParams();
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorProfile, setErrorProfile] = useState('');

    const [userTrips, setUserTrips] = useState([]);
    const [loadingUserTrips, setLoadingUserTrips] = useState(true);
    const [errorTrips, setErrorTrips] = useState('');

    const [isFollowing, setIsFollowing] = useState(false);
    const [checkingFollowStatus, setCheckingFollowStatus] = useState(true);

    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0); // This count is for the profile *being viewed* (i.e., how many people *they* follow)

    const isOwnProfile = currentUser && currentUser.uid === userId;

    // Fetch user profile data
    useEffect(() => {
        if (!userId) {
            setErrorProfile("No user ID provided.");
            setLoadingProfile(false);
            return;
        }

        const fetchProfile = async () => {
            setErrorProfile(''); // Clear previous errors
            try {
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const data = docSnap.data();
                    setProfileData(data);
                    // Initialize counts from fetched data
                    setFollowersCount(data.followersCount || 0);
                    setFollowingCount(data.followingCount || 0); // Correctly set for the viewed profile
                } else {
                    setErrorProfile("User not found.");
                }
            } catch (err) {
                console.error("Error fetching user profile:", err);
                setErrorProfile("Failed to load user profile data.");
            } finally {
                setLoadingProfile(false);
            }
        };
        fetchProfile();
    }, [userId]);

    // Fetch user's created trips
    useEffect(() => {
        if (!userId) {
            setLoadingUserTrips(false);
            return;
        }

        const fetchUserTrips = async () => {
            setLoadingUserTrips(true);
            setErrorTrips(''); // Clear previous errors
            try {
                const tripsCollectionRef = collection(db, 'trips');
                const q = query(tripsCollectionRef, where("creatorId", "==", userId), orderBy("createdAt", "desc"));
                const querySnapshot = await getDocs(q);

                const fetchedTrips = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));
                setUserTrips(fetchedTrips);
            } catch (err) {
                console.error("Error fetching user's trips:", err);
                setErrorTrips("Failed to load user's trips.");
            } finally {
                setLoadingUserTrips(false);
            }
        };
        fetchUserTrips();
    }, [userId]);

    // Check follow status (runs when currentUser or userId changes)
    useEffect(() => {
        const checkFollowStatus = async () => {
            // Skip check if not logged in, no target user, or viewing own profile
            if (!currentUser || !userId || currentUser.uid === userId) {
                setIsFollowing(false);
                setCheckingFollowStatus(false);
                return;
            }

            setCheckingFollowStatus(true);
            try {
                // Check if current user is following the profile user
                const followDocRef = doc(db, "users", currentUser.uid, "following", userId);
                const docSnap = await getDoc(followDocRef);
                setIsFollowing(docSnap.exists());
            } catch (error) {
                console.error("Error checking follow status:", error);
            } finally {
                setCheckingFollowStatus(false);
            }
        };

        checkFollowStatus();
    }, [currentUser, userId]);


    const handleFollow = async () => {
        if (!currentUser || !userId || currentUser.uid === userId) {
            console.warn("Cannot follow: Missing user data or attempting to follow self.");
            return;
        }

        setCheckingFollowStatus(true); // Disable button during operation
        const batch = writeBatch(db);

        // 1. Current user's following subcollection
        const currentUserFollowingDocRef = doc(db, "users", currentUser.uid, "following", userId);
        batch.set(currentUserFollowingDocRef, { followedAt: new Date() });

        // 2. Target user's followers subcollection
        const targetUserFollowersDocRef = doc(db, "users", userId, "followers", currentUser.uid);
        batch.set(targetUserFollowersDocRef, { followedAt: new Date() });

        // 3. Increment current user's followingCount
        const currentUserRef = doc(db, "users", currentUser.uid);
        batch.update(currentUserRef, { followingCount: increment(1) });

        // 4. Increment target user's followersCount
        const targetUserRef = doc(db, "users", userId);
        batch.update(targetUserRef, { followersCount: increment(1) });

        try {
            await batch.commit();
            setIsFollowing(true);
            setFollowersCount(prev => prev + 1); // Optimistically update the displayed count for the *viewed* profile
        } catch (error) {
            console.error("Error following user:", error);
            // Revert state if transaction fails (optional, but good for robust UI)
            setIsFollowing(false);
        } finally {
            setCheckingFollowStatus(false);
        }
    };

    const handleUnfollow = async () => {
        if (!currentUser || !userId || currentUser.uid === userId) {
            console.warn("Cannot unfollow: Missing user data or attempting to unfollow self.");
            return;
        }

        setCheckingFollowStatus(true); // Disable button during operation
        const batch = writeBatch(db);

        // 1. Delete from current user's following subcollection
        const currentUserFollowingDocRef = doc(db, "users", currentUser.uid, "following", userId);
        batch.delete(currentUserFollowingDocRef);

        // 2. Delete from target user's followers subcollection
        const targetUserFollowersDocRef = doc(db, "users", userId, "followers", currentUser.uid);
        batch.delete(targetUserFollowersDocRef);

        // 3. Decrement current user's followingCount
        const currentUserRef = doc(db, "users", currentUser.uid);
        batch.update(currentUserRef, { followingCount: increment(-1) });

        // 4. Decrement target user's followersCount
        const targetUserRef = doc(db, "users", userId);
        batch.update(targetUserRef, { followersCount: increment(-1) });

        try {
            await batch.commit();
            setIsFollowing(false);
            setFollowersCount(prev => prev - 1); // Optimistically update the displayed count for the *viewed* profile
        } catch (error) {
            console.error("Error unfollowing user:", error);
            // Revert state if transaction fails (optional)
            setIsFollowing(true);
        } finally {
            setCheckingFollowStatus(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/login');
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    const joinedYear = profileData?.createdAt?.toDate ? new Date(profileData.createdAt.toDate()).getFullYear() : "N/A";

    // --- Loading and Error States (with Tailwind) ---
    if (loadingProfile || loadingUserTrips) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-[calc(100vh-64px)]"> {/* Adjusted for header height */}
                    <p className="text-xl text-gray-700">Loading user profile and trips...</p>
                </div>
            </>
        );
    }

    if (errorProfile || errorTrips) {
        return (
            <>
                <Header />
                <div className="flex flex-col justify-center items-center min-h-[calc(100vh-64px)] p-4">
                    <p className="text-red-600 text-lg mb-4 text-center">
                        Error loading profile: {errorProfile || errorTrips || 'Unknown error'}
                    </p>
                    <button
                        onClick={() => navigate('/homepage')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded-lg transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </>
        );
    }

    if (!profileData) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
                    <p className="text-lg text-gray-600">User profile not found.</p>
                </div>
            </>
        );
    }

    // --- Main Profile Content (with Tailwind) ---
    return (
        <>
            <Header />
            <div className="container mx-auto p-4 max-w-4xl">
                {/* User Profile Header */}
                <div className="flex flex-col items-center justify-center py-8 px-4 bg-white rounded-lg shadow-lg mb-8">
                    <img
                        src={profileData?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${profileData?.displayName || profileData?.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                        alt={profileData?.username || profileData?.displayName || 'Traveler'}
                        className="w-36 h-36 rounded-full object-cover mb-4 border-4 border-blue-200 outline-4 outline-white"
                    />
                    <h1 className="text-3xl font-bold text-gray-800 mb-2">
                        {profileData?.displayName || profileData?.username || 'Traveler'}
                    </h1>

                    {isOwnProfile ? (
                        <div className="flex gap-3 mt-2">
                            <button
                                onClick={() => navigate('/create-profile')} // Assuming this is for editing profile
                                className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-6 rounded-full transition-colors shadow-md"
                            >
                                Edit profile
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={isFollowing ? handleUnfollow : handleFollow}
                            className={`py-2 px-6 rounded-full font-bold text-white transition-colors duration-150 shadow-md
                                ${checkingFollowStatus
                                    ? 'bg-gray-400 cursor-not-allowed'
                                    : isFollowing
                                        ? 'bg-red-500 hover:bg-red-600'
                                        : 'bg-green-500 hover:bg-green-600'
                                }
                            `}
                            disabled={checkingFollowStatus}
                        >
                            {checkingFollowStatus ? "Loading..." : (isFollowing ? "Unfollow" : "Follow")}
                        </button>
                    )}

                    <div className="flex items-center text-gray-600 text-sm mt-4 gap-4">
                        <span className="font-semibold">{followersCount} Followers</span>
                        <span className="font-semibold">{followingCount} Following</span>
                    </div>

                    <div className="flex items-center text-gray-600 text-sm mt-2 gap-2">
                        <span>Joined in {joinedYear}</span>
                        <span className="h-4 w-px bg-gray-300 mx-2"></span>
                        <span>{userTrips.length} trips created</span>
                        <span className="h-4 w-px bg-gray-300 mx-2"></span>
                        <span>0+ reviews</span> {/* Consider making this dynamic or removing */}
                    </div>
                </div>

                {/* About Section */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">About</h2>
                    <p className="text-gray-700 leading-relaxed">
                        {profileData?.bio || "No bio yet."}
                    </p>
                </div>

                {/* Trips Created Section */}
                <div className="bg-white p-6 rounded-lg shadow-lg mb-8">
                    <h2 className="text-2xl font-bold text-gray-800 mb-4">Trips Created</h2>
                    {loadingUserTrips && <p className="text-center text-gray-600">Loading user's trips...</p>}
                    {!loadingUserTrips && userTrips.length === 0 && (
                        <p className="text-center text-gray-600">This user hasn't created any trips yet.</p>
                    )}
                    <div className="space-y-4"> {/* Add space between trip cards */}
                        {userTrips.map(trip => (
                            <div
                                key={trip.id}
                                className="border border-gray-200 rounded-lg p-4 flex flex-col md:flex-row bg-gray-50 shadow-sm hover:shadow-md transition-all cursor-pointer"
                                onClick={() => navigate(`/trips/${trip.id}`)}
                            >
                                <img
                                    src={trip.imageUrl || 'https://via.placeholder.com/200x150?text=No+Image'} 
                                    alt={trip.title}
                                    className="w-full md:w-48 h-36 object-cover rounded-lg mr-0 md:mr-4 mb-4 md:mb-0 flex-shrink-0"
                                />
                                <div className="flex-grow">
                                    <h3 className="text-lg font-bold text-gray-800 mb-2">{trip.title}</h3>
                                    <p className="text-sm text-gray-600 mb-2">{trip.destination}</p>
                                    <p className="text-xs text-gray-500 mb-2">From {trip.startDate} to {trip.endDate}</p>
                                    {/* Truncate description or show full if short */}
                                    <p className="text-sm text-gray-700 line-clamp-3">{trip.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Logout Button (only for own profile) */}
                {isOwnProfile && (
                    <div className="text-center mt-10 mb-8">
                        <button
                            onClick={handleLogout}
                            className="bg-red-500 hover:bg-red-600 text-white font-bold py-3 px-8 rounded-full transition-colors shadow-lg"
                        >
                            Log Out
                        </button>
                    </div>
                )}
            </div>
        </>
    );
}

export default UserProfile;