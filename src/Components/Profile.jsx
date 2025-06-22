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

    if (loading) {
        return (
            <>
                <Header />
                <div style={{ padding: '16px', textAlign: 'center', marginTop: '32px' }}>
                    <p>Authenticating user...</p>
                </div>
            </>
        );
    }

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


    const handleLogout = async () => {
        try {
            await logout(); // Call the logout function from AuthContext
            navigate('/homepage'); // Redirect to login page after successful logout
            console.log("User logged out successfully.");
        } catch (error) {
            console.error("Failed to log out:", error);
        }
    };

    if (loadingProfile || loadingUserTrips) {
        return (
            <>
                <Header />
                <div style={{ padding: '16px', textAlign: 'center', marginTop: '32px' }}>
                    <p>Loading your profile and trips...</p>
                </div>
            </>
        );
    }

    if (errorProfile || errorUserTrips) {
        return (
            <>
                <Header />
                <div style={{ padding: '16px', textAlign: 'center', marginTop: '32px', color: 'red' }}>
                    <p>Error loading profile data. Please try again later. {(errorProfile || errorUserTrips)}</p>
                    <button
                        onClick={() => navigate('/homepage')}
                        style={{
                            background: '#3182ce', color: 'white', fontWeight: 'bold',
                            padding: '8px 16px', borderRadius: '8px', marginTop: '16px',
                            transition: 'background-color 0.15s ease-in-out',
                            cursor: 'pointer'
                        }}
                    >
                        Back to Home
                    </button>
                </div>
            </>
        );
    }

    if (!currentUser) {
        return (
            <>
                <Header />
                <div style={{ padding: '16px', textAlign: 'center', marginTop: '32px', color: 'red' }}>
                    <p>Please log in to view your profile.</p>
                    <button
                        onClick={() => navigate('/login')}
                        style={{
                            background: '#3182ce', color: 'white', fontWeight: 'bold',
                            padding: '8px 16px', borderRadius: '8px', marginTop: '16px',
                            transition: 'background-color 0.15s ease-in-out',
                            cursor: 'pointer'
                        }}
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
            <div style={{ padding: '16px', margin: 'auto', maxWidth: '960px' }}>
                {/* NEW: Back Button */}
                <div style={{ marginBottom: '16px' }}>
                    <button
                        onClick={() => navigate(-1)} // Navigates back one step in history
                        style={{
                            display: 'flex', alignItems: 'center', color: '#4a5568',
                            transition: 'color 0.2s ease-in-out', cursor: 'pointer',
                            background: 'none', border: 'none', padding: '0', fontSize: '16px'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.color = '#3182ce'} // Tailwind's hover:text-blue-600
                        onMouseOut={(e) => e.currentTarget.style.color = '#4a5568'} // Restore original color
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" style={{ height: '20px', width: '20px', marginRight: '8px' }} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '32px', paddingBottom: '40px', paddingLeft: '16px', paddingRight: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                    <img
                        src={profileData?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${profileData?.displayName || profileData?.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                        alt={profileData?.username || profileData?.email || "User"}
                        style={{ width: '144px', height: '144px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '4px solid #bfdbfe', outline: '4px solid white' }}
                    />
                    <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px' }}>
                        {profileData?.displayName || profileData?.email?.split('@')[0] || 'Traveler'} {/* Changed to displayName or email part */}
                    </h1>

                    {/* NEW: Display Followers and Following Counts */}
                    <div style={{ display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '14px', marginBottom: '16px', gap: '16px' }}>
                        <span style={{ fontWeight: '600' }}>{profileData?.followersCount || 0} Followers</span>
                        <span style={{ fontWeight: '600' }}>{profileData?.followingCount || 0} Following</span>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '14px', marginBottom: '16px', gap: '8px' }}>
                        <span>Joined in {joinedYear}</span>
                        <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                        <span>{userTrips.length} trips</span>
                        <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                    </div>
                    <button
                        style={{
                            background: '#3182ce', color: 'white', fontWeight: 'bold',
                            padding: '8px 24px', borderRadius: '9999px', transition: 'background-color 0.15s ease-in-out',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)', cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#2c5282'} // Hover effect
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#3182ce'} // Restore original
                        onClick={() => navigate('/create-profile')}
                    >
                        Edit profile
                    </button>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '16px' }}>About</h2>
                    <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                        {profileData?.bio || "No bio yet. Click 'Edit profile' to add one"}
                    </p>
                </div>
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '16px' }}>My Trips</h2>
                    {loadingUserTrips && <p style={{ textAlign: 'center', color: '#4a5568' }}>Loading your trips...</p>}
                    {!loadingUserTrips && userTrips.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#4a5568' }}>You haven't created any trips yet.</p>
                    )}
                    {userTrips.map(trip => (
                        <div
                            key={trip.id}
                            style={{
                                border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px',
                                display: 'flex', flexDirection: 'row', backgroundColor: '#f8f8f8',
                                boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)',
                                transition: 'transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out',
                                cursor: 'pointer',
                                marginBottom: '15px' // Added margin to separate cards
                            }}
                            onMouseOver={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 4px 8px rgba(0, 0, 0, 0.1)'; }}
                            onMouseOut={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 2px 4px rgba(0, 0, 0, 0.05)'; }}
                            onClick={() => navigate(`/trips/${trip.id}`)}
                        >
                            <img
                                src={trip.imageUrl || 'https://via.placeholder.com/200x150?text=No+Image'} // Fallback image for trips
                                alt={trip.title}
                                style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px', flexShrink: 0 }}
                            />
                            <div style={{ flexGrow: 1 }}>
                                <h3 style={{ fontSize: '18px', fontWeight: 'bold', marginBottom: '10px' }}>{trip.title}</h3>
                                <p style={{ fontSize: '14px', color: '#718096', marginBottom: '10px' }}>{trip.destination}</p>
                                <p style={{ fontSize: '13px', color: '#555' }}> From {trip.startDate} to {trip.endDate}</p>
                                <p style={{ fontSize: '14px', color: '#555', lineHeight: '1.5' }}>{trip.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '32px' }}>
                    <button
                        onClick={handleLogout}
                        style={{
                            padding: '10px 30px', // Slightly larger padding for a standalone button
                            borderRadius: '9999px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            background: '#ef4444', // red-500
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '1rem', // base font size
                            transition: 'background-color 0.15s ease-in-out',
                            cursor: 'pointer'
                        }}
                        onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#dc2626'} // red-600
                        onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#ef4444'} // Restore original
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
}

export default Profile;
