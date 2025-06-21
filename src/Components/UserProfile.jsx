import React, {useState, useEffect} from 'react';
import { useAuth } from '../Context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, query, orderBy, where, getDocs, collection } from 'firebase/firestore';
import Header from './Header';



function UserProfile(){

    const {userId} = useParams();
    const {currentUser} = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);
    const [errorProfile, setErrorProfile] = useState('');

    const [userTrips, setUserTrips] = useState([]);
    const [loadingUserTrips, setLoadingUserTrips] = useState(true);
    const [errorTrips, setErrorTrips] = useState('');


    useEffect(() => {
        if(!userId){
            setErrorProfile("No user ID provided.");
            setLoadingProfile(false);
            return;
        }


        const fetchProfile = async () => {
            try{
                const docRef = doc(db, 'users', userId);
                const docSnap = await getDoc(docRef);

                if(docSnap.exists()){
                    setProfileData(docSnap.data());
                }
                else{
                    setErrorProfile("User not found")
                }
                setErrorProfile('');
            }
            catch(err){
                console.error("Error fetching user profile:", err);
                setErrorProfile("Failed to load user profile data");
            }
            finally{
                setLoadingProfile(false);
            }
        }
        fetchProfile();

    }, [userId]);


useEffect(() => {
    if(!userId){
        setLoadingUserTrips(false);
        return;
    }

    const fetchUserTrips = async () => {
        try{
            setLoadingUserTrips(true);
            const tripsCollectionRef = collection(db, 'trips');

            const q = query(tripsCollectionRef, where("creatorId", "==", userId), orderBy("createdAt", "desc"));

            const querySnapshot = await getDocs(q);

            const fetchedTrips = querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));

            setUserTrips(fetchedTrips);
            setErrorTrips('');
        }
        catch(err){
            console.error("Error fetching user's trips.");
            setErrorTrips("Failed to load user's trips.");
        }
        finally{
            setLoadingUserTrips(false);
        }


    }
    fetchUserTrips();
}, [userId]);


if(loadingProfile || loadingUserTrips){
    return(
        <>
        <Header />
        <div>
            <p>Loading user profile and trips...</p>
        </div>
        
        </>
    );
}
if(errorProfile || errorTrips){
    return(
        <>
        <div>
            <p>Error loading profile</p>
        </div>
        
        </>
    );
}

if(!profileData){
    <div>
        <p>User profile not found</p>
    </div>
}

const joinedYear = profileData?.createdAt?.toDate  ? new Date(profileData.createdAt.toDate()).getFullYear : "N/A";


return(<>
<div style={{ padding: '16px', margin: 'auto', maxWidth: '960px' }}>
                {/* Profile Header Section */}
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '32px', paddingBottom: '40px', paddingLeft: '16px', paddingRight: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                    <img
                        src={profileData?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${profileData?.displayName || profileData?.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                        alt={profileData?.username || profileData?.displayName || 'Traveler'}
                        style={{ width: '144px', height: '144px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '4px solid #bfdbfe', outline: '4px solid white' }}
                    />
                    <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px' }}>
                        {profileData?.displayName || profileData?.username || 'Traveler'}
                    </h1>
                    {/* Conditional rendering for Edit Profile vs. Follow button */}
                    {currentUser && currentUser.uid === userId ? (
                        // If viewing your own profile, show "Edit profile"
                        <button style={{ background: '#3182ce', color: 'white', fontWeight: 'bold', padding: '8px 24px', borderRadius: '9999px', transition: 'background-color 0.15s ease-in-out', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onClick={() => navigate('/create-profile')}>
                            Edit profile
                        </button>
                    ) : (
                        // If viewing another user's profile, show a placeholder for "Follow"
                        <button style={{ background: '#4CAF50', color: 'white', fontWeight: 'bold', padding: '8px 24px', borderRadius: '9999px', transition: 'background-color 0.15s ease-in-out', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}>
                            Follow (placeholder)
                        </button>
                    )}

                    <div style={{ display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '14px', marginBottom: '16px', gap: '8px' }}>
                        <span>Joined in {joinedYear}</span>
                        <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                        <span>{userTrips.length} trips created</span>
                        <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                        <span>0+ reviews</span> {/* Placeholder for reviews */}
                    </div>
                </div>

                {/* About Section */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '16px' }}>About</h2>
                    <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                        {profileData?.bio || "No bio yet."}
                    </p>
                </div>

                {/* Trips Created Section */}
                <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                    <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '16px' }}>Trips Created</h2>
                    {loadingUserTrips && <p style={{ textAlign: 'center', color: '#4a5568' }}>Loading user's trips...</p>}
                    {!loadingUserTrips && userTrips.length === 0 && (
                        <p style={{ textAlign: 'center', color: '#4a5568' }}>This user hasn't created any trips yet.</p>
                    )}
                    {userTrips.map(trip => (
                        <div key={trip.id}
                             style={{ border: '1px solid #e2e8f0', borderRadius: '8px', padding: '15px', display: 'flex', flexDirection: 'row', backgroundColor: '#f8f8f8', boxShadow: '0 2px 4px rgba(0, 0, 0, 0.05)', transition: 'transform 0.2s ease-in-out', marginBottom: '15px' }}
                             onClick={() => navigate(`/trips/${trip.id}`)}>
                            <img
                                src={trip.imageUrl} alt={trip.title}
                                style={{ width: '200px', height: '150px', objectFit: 'cover', borderRadius: '8px', marginRight: '15px' }}
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
            </div>



</>);


}
export default UserProfile;