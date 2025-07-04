import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, query, orderBy, where, getDocs, collection, writeBatch, increment, updateDoc } from 'firebase/firestore';
import Header from './Header'; 

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
    const [followingCount, setFollowingCount] = useState(0); 

    const isOwnProfile = currentUser && currentUser.uid === userId;

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
                    setFollowersCount(data.followersCount || 0);
                    setFollowingCount(data.followingCount || 0); 
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

   
    useEffect(() => {
        if (!userId) {
            setLoadingUserTrips(false);
            return;
        }

        const fetchUserTrips = async () => {
            setLoadingUserTrips(true);
            setErrorTrips(''); 
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

   
    useEffect(() => {
        const checkFollowStatus = async () => {
            
            if (!currentUser || !userId || currentUser.uid === userId) {
                setIsFollowing(false);
                setCheckingFollowStatus(false);
                return;
            }

            setCheckingFollowStatus(true);
            try {
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

        setCheckingFollowStatus(true);
        const batch = writeBatch(db);

    
        const currentUserFollowingDocRef = doc(db, "users", currentUser.uid, "following", userId);
        batch.set(currentUserFollowingDocRef, { followedAt: new Date() });


        const targetUserFollowersDocRef = doc(db, "users", userId, "followers", currentUser.uid);
        batch.set(targetUserFollowersDocRef, { followedAt: new Date() });

    
        const currentUserRef = doc(db, "users", currentUser.uid);
        batch.update(currentUserRef, { followingCount: increment(1) });

        const targetUserRef = doc(db, "users", userId);
        batch.update(targetUserRef, { followersCount: increment(1) });

        try {
            await batch.commit();
            setIsFollowing(true);
            setFollowersCount(prev => prev + 1); 
        } catch (error) {
            console.error("Error following user:", error);
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

        setCheckingFollowStatus(true);
        const batch = writeBatch(db);

       
        const currentUserFollowingDocRef = doc(db, "users", currentUser.uid, "following", userId);
        batch.delete(currentUserFollowingDocRef);

        
        const targetUserFollowersDocRef = doc(db, "users", userId, "followers", currentUser.uid);
        batch.delete(targetUserFollowersDocRef);

     
        const currentUserRef = doc(db, "users", currentUser.uid);
        batch.update(currentUserRef, { followingCount: increment(-1) });

       
        const targetUserRef = doc(db, "users", userId);
        batch.update(targetUserRef, { followersCount: increment(-1) });

        try {
            await batch.commit();
            setIsFollowing(false);
            setFollowersCount(prev => prev - 1);
        } catch (error) {
            console.error("Error unfollowing user:", error);
            setIsFollowing(true);
        } finally {
            setCheckingFollowStatus(false);
        }
    };

    const handleLogout = async () => {
        try {
            await logout();
            navigate('/homepage');
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    const joinedYear = profileData?.createdAt?.toDate ? new Date(profileData.createdAt.toDate()).getFullYear() : "N/A";

    if (loadingProfile || loadingUserTrips) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center min-h-[calc(100vh-64px)]">
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


    return (
        <>
            <Header />
            <div className="container mx-auto p-4 max-w-4xl">
              
                <div className="mb-4">
                    <button
                        onClick={() => navigate(-1)}
                        className="flex items-center text-gray-700 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>

                
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
                                onClick={() => navigate('/create-profile')}
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
                        <span>{userTrips.length} trips</span>
                        <span className="h-4 w-px bg-gray-300 mx-2"></span>
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
                    <div className="space-y-4">
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
                                    <p className="text-sm text-gray-700 line-clamp-3">{trip.description}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

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