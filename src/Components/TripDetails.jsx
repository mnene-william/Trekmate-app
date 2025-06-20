import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, collection, query, where, deleteDoc } from 'firebase/firestore';
import Header from './Header';
import { useAuth } from '../Context/AuthContext';

function TripDetails() {
    const { tripId } = useParams();
    const {currentUser} = useAuth();
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const [isJoining, setIsJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [participantUsernames, setParticipantUsernames] = useState({}); 

    useEffect(() => {
        const fetchTripDetails = async () => {
            if (!tripId) {
                setError("No trip ID provided.");
                setLoading(false);
                return;
            }

            try {
                const tripDocRef = doc(db, 'trips', tripId);
                const tripDocSnap = await getDoc(tripDocRef);

                if (tripDocSnap.exists()) {
                   const data = {id: tripDocSnap.id, ...tripDocSnap.data()};

                    setTrip(data);
                    console.log("Current Trip Data (from Firestore):", data); // This log is crucial



                const currentParticipants  = data.participants || [];

                console.log("Trip ID:", tripId);
                   console.log("Current Trip Data (from Firestore):", data);
                   console.log("Participants UIDs from trip data:", currentParticipants);

                if(currentUser){
                    setIsJoined(currentParticipants.includes(currentUser.uid));
                    setIsCreator(data.creatorId === currentUser.uid);

                }
                else{
                    setIsJoined(false);
                    setIsCreator(false);
                }

                if(currentParticipants.length > 0){
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('uid', 'in', currentParticipants));
                    const usersSnapshot = await getDocs(q);
                    // --- ADD THIS CONSOLE LOG ---
                       console.log("Firestore Query object (q):", q);
                       // --- END ADDITION ---
                       console.log("Users Snapshot from Firestore:", usersSnapshot.empty ? "EMPTY" : usersSnapshot.docs.map(d => ({id: d.id, data: d.data()})));
                    const usernames = {};
                    usersSnapshot.forEach((doc) => {
                        usernames[doc.id] = doc.data().username || doc.data().displayName || 'Unknown User'
                    });

                    // --- ADD THIS CONSOLE LOG ---
                       console.log("Constructed participantUsernames object:", usernames);
                       // --- END ADDITION ---
                    setParticipantUsernames(usernames);
                }
            } 
            else{
                setError('Trip not found.');
            }
            } catch(err){
                console.error("Error fetching trip details:", err);
                setError("Failed to load trip details.");
            }
            finally{
                setLoading(false);
            }
        };
        fetchTripDetails();
    }, [tripId, currentUser]);

    const handleManageTrip = () => {
        if(trip && trip.id){
            navigate(`/create-trip/${trip.id}`);
        }
    };

    const handleDeleteTrip = async () =>{
        if(!currentUser){
            setError("You must be logged in yo delete a trip");
            return;
        }
        if(!isCreator){
            setError("You are not authorized to delete this trip.");
            return;
        }
        if(window.confirm("Are you sure you want to delete this trip? This action canoot be undone.")){
            try{
                await deleteDoc(doc(db, 'trips', tripId));
                alert('Trip deleted successfullu!');
                navigate('/homepage');
            }
            catch(err){
                console.error("Error deleting trip:", err);
                setError('Failed to delete trip:' + err.message);
            }
        }
    }

    const handleJoinLeaveTrip = async () => {
        if(!currentUser){
            setError("You must me logged in to join or leave a trip.");
            return;
        }
        if(isCreator){
            return
        }
        setIsJoining(true);
        setError('');


        try{
            const tripDocRef = doc(db, 'trips', tripId);
            let updatedParticipants;

            if(isJoined){
                await updateDoc(tripDocRef, {participants: arrayRemove(currentUser.uid)});
                updatedParticipants = trip.participants.filter(uid => uid !== currentUser.uid)
                setIsJoined(false);
                console.log("User left the trip:", trip.title);
            }
            else{
                await updateDoc(tripDocRef, {participants: arrayUnion(currentUser.uid)});
                updatedParticipants = [...(trip.participants) || [], currentUser.uid];
                setIsJoined(true);
                console.log("User joined the trip", trip.title);
            }


            if(updatedParticipants.length > 0){
                const usersRef = collection(db, 'users');
                const q = query(usersRef, where('uid', 'in', updatedParticipants));
                // --- ADD THIS CONSOLE LOG (in handleJoinLeaveTrip) ---
                console.log("handleJoinLeaveTrip: Updated Participants UIDs:", updatedParticipants);
                console.log("handleJoinLeaveTrip: Firestore Query object (q):", q);
                // --- END ADDITION ---
                const usersSnapshot = await getDocs(q);
                                // --- ADD THIS CONSOLE LOG (in handleJoinLeaveTrip) ---
                console.log("handleJoinLeaveTrip: Users Snapshot from Firestore:", usersSnapshot.empty ? "EMPTY" : usersSnapshot.docs.map(d => ({id: d.id, data: d.data()})));
                // --- END ADDITION ---

                const usernames ={};
                usersSnapshot.forEach((doc) =>{
                    usernames[doc.id] = doc.data().username ||doc.data().displayName || "Unknown User"
                });
                // --- ADD THIS CONSOLE LOG (in handleJoinLeaveTrip) ---
                console.log("handleJoinLeaveTrip: Constructed participantUsernames object:", usernames);
                // --- END ADDITION ---
                setParticipantUsernames(usernames);
            }


            const updatedDocSnap = await getDoc(tripDocRef);
            if(updatedDocSnap.exists()){
                setTrip({id: updatedDocSnap.id, ...updatedDocSnap.data()});
            }

        }
        catch(err){
            console.error("Error joining/leaving trip:", err);
            setError("Filed to update trip status:", + err.message);
        }
        finally{
            setIsJoining(false);
        }

    }


    if (loading) {
        return (
            <>
                <Header />
                <div>
                    <p>Loading trip details...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div>
                    <p>{error}</p>
                    <button onClick={() => navigate(-1)}>Go Back</button>
                </div>
            </>
        );
    }

    if (!trip) {
        return (
            <>
                <Header />
                <div>
                    <p>Trip details not available.</p>
                    <button onClick={() => navigate('/homepage')}>Back Home</button>
                </div>
            </>
        );
    }

    let primaryButtonOnClick = handleJoinLeaveTrip; // Default for non-creators
    let primaryButtonText = "Join Trip";
    let primaryButtonClass = "bg-blue-600 hover:bg-blue-700";
    let primaryButtonDisabled = isJoining; // Disable during join/leave operation

    if (isCreator) {
        primaryButtonText = "Edit Trip"; // Changed "Manage Trip" to "Edit Trip" for clarity on this button's direct action
        primaryButtonClass = "bg-blue-600 hover:bg-blue-700"; // Keep blue for consistency
        primaryButtonOnClick = handleManageTrip; // Assign the manage function
        primaryButtonDisabled = false; // Creators can always click their edit button
    } else if (isJoined) {
        primaryButtonText = "Leave Trip";
        primaryButtonClass = "bg-red-500 hover:bg-red-600";
        primaryButtonDisabled = isJoining;
    }


    return (
        <>
            <Header />
            <div className="container mx-auto p-8" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        &larr; Back to Trips
                    </button>
                    {currentUser && (
                        <div className="flex space-x-4"> {/* Use flex and space-x for multiple buttons */}
                            {isCreator ? (
                                // Buttons for the Creator
                                <>
                                    <button
                                        onClick={handleManageTrip}
                                        className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75"
                                    >
                                        Edit Trip
                                    </button>
                                    <button
                                        onClick={handleDeleteTrip}
                                        className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75"
                                    >
                                        Delete Trip
                                    </button>
                                </>
                            ) : (
                                // Button for Participants (Join/Leave)
                                <button
                                    onClick={primaryButtonOnClick}
                                    disabled={primaryButtonDisabled}
                                    className={`px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 ${primaryButtonClass} ${primaryButtonDisabled ? 'opacity-75 cursor-not-allowed' : ''}`}
                                >
                                    {primaryButtonText}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <h1 className="text-4xl font-bold mb-4 text-[#111418]">{trip.title}</h1>

                {trip.imageUrl && (
                    <div className="relative w-full h-96 mb-6 rounded-lg overflow-hidden shadow-lg">
                        <img
                            src={trip.imageUrl}
                            alt={trip.title}
                            className="w-full h-full object-cover object-center"
                        />
                    </div>
                )}

                <p className="text-gray-700 text-lg mb-6 leading-relaxed">{trip.description}</p>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-6">
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <h2 className="text-2xl font-semibold mb-2 text-[#111418]">Destination</h2>
                        <p className="text-gray-700 text-lg">{trip.destination}</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg shadow-sm">
                        <h2 className="text-2xl font-semibold mb-2 text-[#111418]">Dates</h2>
                        <p className="text-gray-700 text-lg">
                            {trip.startDate} - {trip.endDate}
                        </p>
                    </div>
                </div>

                <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 text-[#111418]">Activities</h2>
                    {trip.activities && Array.isArray(trip.activities) && trip.activities.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-700 text-lg space-y-2">
                            {trip.activities.map((activity, index) => (
                                <li key={index}>{activity}</li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">No activities listed for this trip.</p>
                    )}
                </div>

                <div className="mb-6 bg-gray-50 p-4 rounded-lg shadow-sm">
                    <h2 className="text-2xl font-semibold mb-4 text-[#111418]">Participants ({trip.participants ? trip.participants.length : 0})</h2>
                    {trip.participants && trip.participants.length > 0 ? (
                        <ul className="list-disc list-inside text-gray-700 text-lg space-y-2">
                            {trip.participants.map((participantId, index) => (
                                <li key={index}>
                                    <span onClick={() => navigate(`/users/${participantId}`)} className="cursor-pointer text-blue-600 underline">
                                        {participantUsernames[participantId] || participantId}
                                    </span>
                                </li>
                            ))}
                        </ul>
                    ) : (
                        <p className="text-gray-600">Be the first to join this trip!</p>
                    )}
                </div>

                {trip.creatorName && (
                    <p className="text-gray-500 text-sm mt-8 text-right">Created by: {trip.creatorName}</p>
                )}
            </div>
        </>
    );
}




export default TripDetails;