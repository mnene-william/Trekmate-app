import React, {useState, useEffect} from 'react';
import { useAuth } from '../Context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, query, orderBy, where, getDocs, collection, setDoc, deleteDoc, writeBatch, increment, updateDoc } from 'firebase/firestore';
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

    const [isFollowing, setIsFollowing] = useState(false);
    const [checkingFollowStatus, setCheckingFollowStatus] = useState(true);

    const [followersCount, setFollowersCount] = useState(0);
    const [followingCount, setFollowingCount] = useState(0);


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
                    const data = docSnap.data();
                    setProfileData(data);

                    setFollowersCount(data.followersCount || 0);
                    setFollowingCount(data.followingCount || 0);
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

useEffect(() => {
    const checkFollowStatus = async () => {
        // Log the UIDs to ensure they are correct
        console.log("Checking follow status...");
        console.log("Current User UID:", currentUser?.uid);
        console.log("Profile User ID (from URL):", userId);

        if (!currentUser || !userId || currentUser.uid === userId) {
            console.log("Skipping follow check: Not logged in, no target user, or viewing own profile.");
            setIsFollowing(false);
            setCheckingFollowStatus(false);
            return;
        }

        setCheckingFollowStatus(true);
        try {
            // Check if currentUser is following the userId of the current profile
            const followDocRef = doc(db, "users", currentUser.uid, "following", userId);
            console.log("Firestore Path to check:", followDocRef.path); // Log the full path

            const docSnap = await getDoc(followDocRef);
            console.log("Follow document exists:", docSnap.exists()); // Log true/false
            setIsFollowing(docSnap.exists());
        } catch (error) {
            console.error("Error checking follow status:", error);
            // Optionally handle error, e.g., show a message to the user
        } finally {
            setCheckingFollowStatus(false);
        }
    };

    checkFollowStatus();
}, [currentUser, userId]);

const handleFollow = async () => {
    console.log("handleFollow function entered!"); // <-- Keep this for initial check
    console.log("currentUser:", currentUser); // <-- Keep for initial check
    console.log("userId (from URL params):", userId); // <-- Keep for initial check

    // This is the guard clause. If any of these conditions are true, the function exits.
    if (!currentUser || !userId || currentUser.uid === userId) {
        console.warn("Cannot follow: Missing user data or attempting to follow self. Current user:", currentUser, "Target ID:", userId);
        return; // <--- IMPORTANT: The 'return' must be the only thing executed in this block
    }

    // --- ALL THE CODE BELOW THIS LINE SHOULD BE OUTSIDE THE 'if' BLOCK ---
    setCheckingFollowStatus(true); // Disable the button while the operation is in progress
    console.log(`Attempting to FOLLOW user: ${userId} by ${currentUser.uid}`);

    // Create a batch for atomic operations
    const batch = writeBatch(db);

    // 1. Add an entry to the current user's 'following' subcollection
    const currentUserFollowingDocRef = doc(db, "users", currentUser.uid, "following", userId);
    batch.set(currentUserFollowingDocRef, {
        followedAt: new Date(),
    });
    console.log(`Added to batch: ${currentUserFollowingDocRef.path}`);


    // 2. Add an entry to the target user's 'followers' subcollection
    const targetUserFollowersDocRef = doc(db, "users", userId, "followers", currentUser.uid);
    batch.set(targetUserFollowersDocRef, {
        followedAt: new Date(),
    });
    console.log(`Added to batch: ${targetUserFollowersDocRef.path}`);

    const currentUserRef = doc(db, "users", currentUser.uid);
    batch.update(currentUserRef,{followingCount : increment(1)} )
    console.log(`Added to batch: ${currentUserRef.path} to increment followingCount`);

    const targetUserRef = doc(db, "users", userId);
    batch.update(targetUserRef, {followersCount: increment(1)});
    console.log(`Added to batch:${targetUserRef.path} to increment followersCount`)


    try {
        console.log("Committing follow batch...");
        await batch.commit(); // Execute both set operations atomically
        console.log("Follow batch commit successful!");

        setIsFollowing(true); // Update React state to reflect the successful follow
        console.log("isFollowing state set to TRUE.");

       if (currentUser.uid === userId) {
            // User is viewing THEIR OWN profile (e.g., /profile/myUid)
            // Their 'following' count increases because THEY followed someone.
            setFollowingCount(prev => prev + 1);
        } else {
            // User is viewing SOMEONE ELSE'S profile (e.g., /profile/otherUid)
            // The 'followers' count of the profile they are viewing increases.
            setFollowersCount(prev => prev + 1);
        }

    } catch (error) {
        console.error("Error following user (batch commit failed):", error);
        setIsFollowing(false); // If the commit fails, revert the UI state
    } finally {
        setCheckingFollowStatus(false); // Re-enable the button
        console.log("Finished handleFollow operation.");
    }
};



const handleUnfollow = async () => {
    if(!currentUser || !userId || currentUser.uid === userId){
        console.warn("Cannot unfollow: Missing user data or attempting to unfollow self.");
        return;
    }
    setCheckingFollowStatus(true);
    console.log(`Attempting to unfollow user: ${userId} by ${currentUser.uid}`);

    const batch = writeBatch(db);

    const currentUserFollowingDocRef = doc(db, "users", currentUser.uid, "following", userId);
    batch.delete(currentUserFollowingDocRef);
    console.log(`Added delete to batch for: ${currentUserFollowingDocRef.path}`);

    const targetUserFollowersDocRef = doc(db, "users", userId, "followers", currentUser.uid);
    batch.delete(targetUserFollowersDocRef);
    console.log(`Added delete to batch for: ${targetUserFollowersDocRef.path}`);

    const currentUserRef = doc(db, "users", currentUser.uid);
    batch.update(currentUserRef, {followingCount: increment(-1)});
    console.log(`Added to batch: ${currentUserRef.path} to decrement followingCount`);

    const targetUserRef = doc(db, "users", userId);
    batch.update(targetUserRef, { followersCount: increment(-1) });
    console.log(`Added to batch: ${targetUserRef.path} to decrement followersCount`);


    try{
        console.log("Committing unfollow batch...");
        await batch.commit();
        console.log("Unfollow batch commit successful! Documents should be deleted");

        setIsFollowing(false);
        console.log("isFollowing state set to false");

        if (currentUser.uid === userId) {
            // User is viewing THEIR OWN profile
            setFollowingCount(prev => prev - 1);
        } else {
            // User is viewing SOMEONE ELSE'S profile
            setFollowersCount(prev => prev - 1);
        }
    }
    catch(error){
        console.error("Error unfollowing user (batch commit failed):", error)
        setIsFollowing(true);
    }
    finally{
        setCheckingFollowStatus(false);
        console.log("Finished handleUnfollow operation.")
    }
};


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

const joinedYear = profileData?.createdAt?.toDate  ? new Date(profileData.createdAt.toDate()).getFullYear() : "N/A";


return(
    <>
        <div style={{ padding: '16px', margin: 'auto', maxWidth: '960px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', paddingTop: '32px', paddingBottom: '40px', paddingLeft: '16px', paddingRight: '16px', background: 'white', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                <img
                    src={profileData?.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${profileData?.displayName || profileData?.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                    alt={profileData?.username || profileData?.displayName || 'Traveler'}
                    style={{ width: '144px', height: '144px', borderRadius: '50%', objectFit: 'cover', marginBottom: '16px', border: '4px solid #bfdbfe', outline: '4px solid white' }}
                />
                <h1 style={{ fontSize: '30px', fontWeight: 'bold', color: '#1a202c', marginBottom: '8px' }}>
                    {profileData?.displayName || profileData?.username || 'Traveler'}
                </h1>
                {currentUser && currentUser.uid === userId ? (
                    <button style={{ background: '#3182ce', color: 'white', fontWeight: 'bold', padding: '8px 24px', borderRadius: '9999px', transition: 'background-color 0.15s ease-in-out', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} onClick={() => navigate('/create-profile')}>
                        Edit profile
                    </button>
                ) : (
                    checkingFollowStatus ? (
                        <button style={{ background: '#a0aec0', color: 'white', fontWeight: 'bold', padding: '8px 24px', borderRadius: '9999px', cursor: 'not-allowed', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }} disabled>
                            Checking status...
                        </button>
                    ) : (
                        <button onClick={isFollowing ? handleUnfollow : handleFollow} style={{
                            background: isFollowing ? '#ef4444' : '#22c55e',
                            color: 'white',
                            fontWeight: 'bold',
                            padding: '8px 24px',
                            borderRadius: '9999px',
                            transition: 'background-color 0.15s ease-in-out',
                            boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                            cursor: 'pointer'
                        }}>{isFollowing ? "Unfollow" : "Follow"}</button>
                    )
                )}


                <div style={{ display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '14px', marginTop: '10px', marginBottom: '16px', gap: '16px' }}>
                    <span style={{ fontWeight: 'bold' }}>{followersCount} Followers</span>
                    <span style={{ fontWeight: 'bold' }}>{followingCount} Following</span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', color: '#4a5568', fontSize: '14px', marginBottom: '16px', gap: '8px' }}>
                    <span>Joined in {joinedYear}</span>
                    <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                    <span>{userTrips.length} trips created</span>
                    <span style={{ height: '16px', width: '1px', background: '#cbd5e0', margin: '0 8px' }}></span>
                    <span>0+ reviews</span>
                </div>
            </div>
            <div style={{ background: 'white', padding: '24px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', margin: 'auto', marginBottom: '32px' }}>
                <h2 style={{ fontSize: '24px', fontWeight: 'bold', color: '#1a202c', marginBottom: '16px' }}>About</h2>
                <p style={{ color: '#4a5568', lineHeight: '1.6' }}>
                    {profileData?.bio || "No bio yet."}
                </p>
            </div>
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
    </>
);
            }



export default UserProfile;