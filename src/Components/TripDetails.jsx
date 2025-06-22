import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, collection, query, where, deleteDoc, onSnapshot, setDoc, orderBy, addDoc, serverTimestamp} from 'firebase/firestore';
import Header from './Header';
import { useAuth } from '../Context/AuthContext';

function TripDetails() {
    const { tripId } = useParams();
    const { currentUser } = useAuth(); // Destructure currentUser
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true); // Initial loading for the main trip data
    const [error, setError] = useState('');

    const [isJoining, setIsJoining] = useState(false);
    const [isJoined, setIsJoined] = useState(false);
    const [isCreator, setIsCreator] = useState(false);
    const [participantUsernames, setParticipantUsernames] = useState({});

    const [comments, setComments] = useState([]);
    const [newCommentText, setNewCommentText] = useState('');
    const [likesCount, setLikesCount] = useState(0);
    const [userLiked, setUserLiked] = useState(false);
    const [loadingComments, setLoadingComments] = useState(true);
    const [loadingLikes, setLoadingLikes] = useState(true);


    // Effect for fetching and subscribing to main trip details
    useEffect(() => {
        if (!tripId) {
            setError("No trip ID provided.");
            setLoading(false);
            return;
        }

        setLoading(true); // Start loading when tripId changes or component mounts
        const tripDocRef = doc(db, 'trips', tripId);

        const unsubscribeTrip = onSnapshot(tripDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setTrip(data);
                setError(''); // Clear any previous errors

                console.log("Current Trip Data (from Firestore - onSnapshot):", data);

                const currentParticipants = data.participants || [];

                // Update isJoined and isCreator based on real-time data
                if (currentUser) {
                    setIsJoined(currentParticipants.includes(currentUser.uid));
                    setIsCreator(data.creatorId === currentUser.uid);
                } else {
                    setIsJoined(false);
                    setIsCreator(false);
                }

                // Fetch participant usernames if there are participants
                if (currentParticipants.length > 0) {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('uid', 'in', currentParticipants));
                    const usersSnapshot = await getDocs(q); // Use getDocs for one-time fetch of usernames

                    const usernames = {};
                    usersSnapshot.forEach((userDoc) => {
                        usernames[userDoc.id] = userDoc.data().username || userDoc.data().displayName || 'Unknown User';
                    });
                    setParticipantUsernames(usernames);
                } else {
                    setParticipantUsernames({}); // Clear if no participants
                }
            } else {
                console.log("No such trip document!");
                setTrip(null); // Set trip to null if it doesn't exist
                setError('Trip not found.');
            }
            setLoading(false); // End loading after snapshot is received
        }, (err) => {
            console.error("Error fetching real-time trip details:", err);
            setError("Failed to load trip details: " + err.message);
            setLoading(false);
        });

        // Cleanup function for trip listener
        return () => unsubscribeTrip();
    }, [tripId, currentUser]); // Re-run if tripId or currentUser changes


    // Effect for comments (already mostly correct, just minor improvements)
    useEffect(() => {
        if (!tripId) {
            setLoadingComments(false);
            return;
        }
        setLoadingComments(true);

        const commentsRef = collection(db, 'trips', tripId, 'comments');
        const q = query(commentsRef, orderBy('timestamp', 'asc'));

        const unsubscribeComments = onSnapshot(q, (snapshot) => {
            const fetchedComments = snapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data()
            }));
            setComments(fetchedComments);
            setLoadingComments(false);
            setError(''); // Clear error if comments load successfully
        }, (err) => {
            console.error("Error fetching comments:", err);
            setError("Failed to load comments.");
            setLoadingComments(false);
        });
        return () => unsubscribeComments();
    }, [tripId]); // currentUser isn't strictly needed here unless you filter comments by user,
                  // but it's fine to keep if you want to re-fetch comments if user changes.
                  // However, comments are usually static to the trip.

    // Effect for likes (already mostly correct, just minor improvements)
    useEffect(() => {
        if (!tripId) {
            setLoadingLikes(false);
            return;
        }

        setLoadingLikes(true);
        const likesRef = collection(db, 'trips', tripId, 'likes');

        const unsubscribeLikes = onSnapshot(likesRef, async (snapshot) => {
            setLikesCount(snapshot.size);
            // Check if current user has liked
            if (currentUser) {
                const userLikeDoc = await getDoc(doc(likesRef, currentUser.uid));
                setUserLiked(userLikeDoc.exists());
            } else {
                setUserLiked(false);
            }
            setLoadingLikes(false);
        }, (err) => {
            console.error("Error fetching likes:", err);
            setLoadingLikes(false);
        });
        return () => unsubscribeLikes();
    }, [tripId, currentUser]); // currentUser is important here to update `userLiked` status

    // --- Other functions (handleManageTrip, handleDeleteTrip, handleJoinLeaveTrip, handlePostComment, handleLikeToggle) remain largely the same ---

    const handleManageTrip = () => {
        if (trip && trip.id) {
            navigate(`/create-trip/${trip.id}`);
        }
    };

    const handleDeleteTrip = async () => {
        if (!currentUser) {
            setError("You must be logged in to delete a trip");
            return;
        }
        if (!isCreator) {
            setError("You are not authorized to delete this trip.");
            return;
        }
        if (window.confirm("Are you sure you want to delete this trip? This action cannot be undone.")) {
            try {
                await deleteDoc(doc(db, 'trips', tripId));
                alert('Trip deleted successfully!');
                navigate('/homepage');
            } catch (err) {
                console.error("Error deleting trip:", err);
                setError('Failed to delete trip:' + err.message);
            }
        }
    };

    const handleJoinLeaveTrip = async () => {
        if (!currentUser) {
            setError("You must be logged in to join or leave a trip.");
            return;
        }
        if (isCreator) {
            // Creators cannot join/leave their own trip, they manage it.
            setError("As the trip creator, you cannot join/leave your own trip. Use 'Edit Trip' instead.");
            return;
        }
        setIsJoining(true);
        setError('');

        try {
            const tripDocRef = doc(db, 'trips', tripId);
            // The onSnapshot listener for the main trip will automatically update `trip` state,
            // so we don't need to manually re-fetch the trip document here after update.

            if (isJoined) {
                await updateDoc(tripDocRef, { participants: arrayRemove(currentUser.uid) });
                console.log("User left the trip:", trip.title);
            } else {
                await updateDoc(tripDocRef, { participants: arrayUnion(currentUser.uid) });
                console.log("User joined the trip", trip.title);
            }

            // The onSnapshot for the main trip data will handle updating `setTrip` and `setParticipantUsernames`
            // Removing the manual fetch of updated participants and usernames here
            // because the main useEffect's onSnapshot handles it.

        } catch (err) {
            console.error("Error joining/leaving trip:", err);
            setError("Failed to update trip status: " + err.message);
        } finally {
            setIsJoining(false);
        }
    };

    const handlePostComment = async (e) => {
        e.preventDefault();

        if (!newCommentText.trim() || !currentUser) {
            alert("Please enter a comment and make sure you are logged in.");
            return;
        }
        try {
            // Ensure currentUser.displayName or username is prioritized.
            // Adjust based on your AuthContext's currentUser structure.
            const userName = currentUser.displayName || currentUser.username || currentUser.email.split('@')[0];

            // Use currentUser.photoURL directly if available
            const userPhotoUrl = currentUser.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${userName}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`;

            const commentsCollectionRef = collection(db, 'trips', tripId, 'comments');

            await addDoc(commentsCollectionRef, {
                userId: currentUser.uid,
                userName: userName,
                userPhotoUrl: userPhotoUrl,
                text: newCommentText.trim(),
                timestamp: serverTimestamp(),
            });
            setNewCommentText('');
            setError('');
        } catch (err) {
            console.error("Error posting comment:", err);
            setError("Failed to post comment.");
        }
    };

    const handleLikeToggle = async () => {
        if (!currentUser) {
            alert("Please log in to like this trip.");
            return;
        }

        const likeDocRef = doc(db, 'trips', tripId, 'likes', currentUser.uid);

        try {
            if (userLiked) {
                await deleteDoc(likeDocRef);
                console.log("Trip unliked!");
            } else {
                await setDoc(likeDocRef, {
                    userId: currentUser.uid, // Store the userId who liked it
                    timestamp: serverTimestamp(),
                });
                console.log("Trip liked!");
            }
            setError(''); // Clear error on successful like/unlike
        } catch (err) {
            console.error("Error toggling like:", err);
            setError("Failed to update like status.");
        }
    };


    // --- Render Logic (remains largely the same) ---
    if (loading || loadingComments || loadingLikes) {
        return (
            <>
                <Header />
                <div className="container mx-auto p-4 text-center mt-8">
                    <p className="text-gray-600">Loading trip details and interactions...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div className="container mx-auto p-4 text-center mt-8">
                    <p className="text-red-500 font-semibold">{error}</p>
                    <button onClick={() => navigate(-1)} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Go Back</button>
                </div>
            </>
        );
    }

    if (!trip) {
        return (
            <>
                <Header />
                <div className="container mx-auto p-4 text-center mt-8">
                    <p className="text-gray-600">Trip details not available.</p>
                    <button onClick={() => navigate('/homepage')} className="mt-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">Back Home</button>
                </div>
            </>
        );
    }

    let primaryButtonOnClick = handleJoinLeaveTrip; // Default for non-creators
    let primaryButtonText = "Join Trip";
    let primaryButtonClass = "bg-blue-600 hover:bg-blue-700";
    let primaryButtonDisabled = isJoining; // Disable during join/leave operation

    if (isCreator) {
        primaryButtonText = "Edit Trip";
        primaryButtonClass = "bg-blue-600 hover:bg-blue-700";
        primaryButtonOnClick = handleManageTrip;
        primaryButtonDisabled = false; // Creators can always click their edit button
    } else if (isJoined) {
        primaryButtonText = "Leave Trip";
        primaryButtonClass = "bg-red-500 hover:bg-red-600";
        primaryButtonDisabled = isJoining;
    }


    return (
        <>
            <Header />
            <div className="container mx-auto p-8 max-w-4xl lg:max-w-5xl" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
                <div className="flex justify-between items-center mb-4">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                        &larr; Back to Trips
                    </button>
                    {currentUser && (
                        <div className="flex space-x-4">
                            {isCreator ? (
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

                {/* Like Button & Count */}
                <div className="flex items-center space-x-4 mt-6 border-t pt-6">
                    <button
                        onClick={handleLikeToggle}
                        className={`flex items-center px-4 py-2 rounded-full transition-colors duration-200 ease-in-out ${
                            userLiked ? 'bg-red-500 text-white' : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
                        }`}
                        disabled={!currentUser} // Disable if not logged in
                    >
                        <svg
                            xmlns="http://www.w3.org/2000/svg"
                            className={`h-6 w-6 ${userLiked ? 'text-white' : 'text-gray-500'}`}
                            fill={userLiked ? 'currentColor' : 'none'}
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth="2"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                            />
                        </svg>
                        <span className="ml-2 font-semibold">{userLiked ? 'Liked' : 'Like'}</span>
                    </button>
                    <span className="text-lg font-bold text-gray-800">
                        {likesCount} {likesCount === 1 ? 'Like' : 'Likes'}
                    </span>
                    {!currentUser && (
                        <span className="text-sm text-gray-600 ml-auto">
                            <Link to="/login" className="text-blue-600 hover:underline">Log in</Link> to like.
                        </span>
                    )}
                </div>

                {/* Comments Section */}
                <h2 className="text-3xl font-bold text-gray-800 mt-10 mb-6 border-t pt-8">Comments</h2>
                <div className="comments-section bg-gray-100 p-5 rounded-lg shadow-inner">
                    {loadingComments && <p className="text-center text-gray-600">Loading comments...</p>}
                    {!loadingComments && comments.length === 0 && <p className="text-center text-gray-600">No comments yet. Be the first to share your thoughts!</p>}
                    <div className="space-y-6">
                        {comments.map(comment => (
                            <div key={comment.id} className="bg-white p-4 rounded-lg shadow-sm flex items-start space-x-3">
                                <img
                                    src={comment.userPhotoUrl}
                                    alt={comment.userName}
                                    className="w-10 h-10 rounded-full object-cover ring-2 ring-blue-300 flex-shrink-0"
                                />
                                <div className="flex-grow">
                                    <div className="flex justify-between items-center mb-1">
                                        <p className="font-bold text-gray-900">{comment.userName}</p>
                                        <span className="text-gray-500 text-xs">
                                            {comment.timestamp ? new Date(comment.timestamp.toDate()).toLocaleString() : 'Just now'}
                                        </span>
                                    </div>
                                    <p className="text-gray-700">{comment.text}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Comment Input Form */}
                    {currentUser ? (
                        <form onSubmit={handlePostComment} className="mt-6 flex items-center space-x-3">
                            <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-grow border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-blue-500 focus:border-blue-500 shadow-sm"
                                disabled={!currentUser}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed"
                                disabled={!currentUser || !newCommentText.trim()}
                            >
                                Post Comment
                            </button>
                        </form>
                    ) : (
                        <p className="text-center text-gray-600 mt-6 p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                            Please <Link to="/login" className="text-blue-600 font-semibold hover:underline">log in</Link> to post comments.
                        </p>
                    )}
                </div>

            </div>
        </>
    );
}

export default TripDetails;