import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import Header from './Header';
import {useNavigate} from 'react-router-dom';

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
                    setProfileData({
                        uid: currentUser.uid,
                        displayName: currentUser.displayName || currentUser.email.split('@')[0],
                        email: currentUser.email,
                        photoURL: currentUser.photoURL || '',
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
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '32px', paddingBottom: '40px', paddingLeft: '16px', paddingRight: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                    <img
                        src={profileData?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${profileData?.displayName || profileData?.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                        alt={profileData?.username || profileData?.email || "User"}
                        style={{ width: '144px', height: '144px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '4px solid #bfdbfe', outline: '4px solid white' }}
                    />
                    <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px' }}>
                        {profileData?.username || profileData?.dispalyName || 'Traveler'}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '14px', marginBottom: '16px', gap: '8px' }}>
                        <span>Joined in {joinedYear}</span>
                        <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                        <span>{userTrips.length} trips</span>
                        <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                    </div>
                    <button style={{ background: '#3182ce', color: 'white', fontWeight: 'bold', padding: '8px 24px', borderRadius: '9999px', transition: 'background-color 0.15s ease-in-out', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onClick={() => navigate('/create-profile')}>
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
                        <div key={trip.id} style={{ border: '1px solid #e2e8f0', borderRadius: '8px',padding: '15px', display: 'flex', flexDirection: 'row', backgroundColor: '#f8f8f8' , boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s ease-in-out' }} onClick={() => navigate(`/trips/${trip.id}`)}>
                            <img 
                            src={trip.imageUrl} alt={trip.title} style={{width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px'}} />
                            <div style={{flexGrow: 1}}>
                                <h3 style={{fontSize: '18px',fontWeight: 'bold', marginBottom: '10px'}}>{trip.title}</h3> 
                                <p style={{fontSize: '14px', color: '#718096', marginBottom: '10px'}}>{trip.destination}</p>
                                <p style={{fontSize: '13px', color: '#555'}}> From {trip.startDate} to {trip.endDate}</p>
                                <p style={{fontSize: '14px', color: '#555', lineHeight: '1.5'}}>{trip.description}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div style={{ textAlign: 'center', marginTop: '40px', marginBottom: '32px' }}>
                    <button
                        onClick={handleLogout}
                        className="flex max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-10 bg-red-500 text-white gap-2 text-sm font-bold leading-normal tracking-[0.015em] min-w-0 px-2.5 hover:bg-red-600 transition-colors"
                        style={{
                            padding: '10px 30px', // Slightly larger padding for a standalone button
                            borderRadius: '9999px',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            display: 'inline-flex', // Ensure flex properties apply if className uses them
                        }}
                    >
                        Log Out
                    </button>
                </div>
            </div>
        </>
    );
}

export default Profile;
