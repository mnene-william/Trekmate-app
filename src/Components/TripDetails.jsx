import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, getDocs, updateDoc, arrayUnion, arrayRemove, collection, query, where, deleteDoc, onSnapshot, setDoc, orderBy, addDoc, serverTimestamp} from 'firebase/firestore';
import Header from './Header';
import { useAuth } from '../Context/AuthContext';

function TripDetails() {
    const { tripId } = useParams();
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState('');
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false); // New state for confirmation modal

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

        setLoading(true);
        const tripDocRef = doc(db, 'trips', tripId);

        const unsubscribeTrip = onSnapshot(tripDocRef, async (docSnap) => {
            if (docSnap.exists()) {
                const data = { id: docSnap.id, ...docSnap.data() };
                setTrip(data);
                setError('');

                console.log("Current Trip Data (from Firestore - onSnapshot):", data);

                const currentParticipants = data.participants || [];

                if (currentUser) {
                    setIsJoined(currentParticipants.includes(currentUser.uid));
                    setIsCreator(data.creatorId === currentUser.uid);
                } else {
                    setIsJoined(false);
                    setIsCreator(false);
                }

                if (currentParticipants.length > 0) {
                    const usersRef = collection(db, 'users');
                    const q = query(usersRef, where('uid', 'in', currentParticipants));
                    const usersSnapshot = await getDocs(q);

                    const usernames = {};
                    usersSnapshot.forEach((userDoc) => {
                        usernames[userDoc.id] = userDoc.data().username || userDoc.data().displayName || 'Unknown User';
                    });
                    setParticipantUsernames(usernames);
                } else {
                    setParticipantUsernames({});
                }
            } else {
                console.log("No such trip document!");
                setTrip(null);
                setError('Trip not found.');
            }
            setLoading(false);
        }, (err) => {
            console.error("Error fetching real-time trip details:", err);
            setError("Failed to load trip details: " + err.message);
            setLoading(false);
        });

        return () => unsubscribeTrip();
    }, [tripId, currentUser]);


    // Effect for comments
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
            setError('');
        }, (err) => {
            console.error("Error fetching comments:", err);
            setError("Failed to load comments.");
            setLoadingComments(false);
        });
        return () => unsubscribeComments();
    }, [tripId]);


    // Effect for likes
    useEffect(() => {
        if (!tripId) {
            setLoadingLikes(false);
            return;
        }

        setLoadingLikes(true);
        const likesRef = collection(db, 'trips', tripId, 'likes');

        const unsubscribeLikes = onSnapshot(likesRef, async (snapshot) => {
            setLikesCount(snapshot.size);
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
    }, [tripId, currentUser]);

    const handleManageTrip = () => {
        if (trip && trip.id) {
            navigate(`/create-trip/${trip.id}`);
        }
    };

    // This function now just *triggers* the modal
    const handleDeleteTripPrompt = () => {
        if (!currentUser) {
            setError("You must be logged in to delete a trip");
            return;
        }
        if (!isCreator) {
            setError("You are not authorized to delete this trip.");
            return;
        }
        setShowDeleteConfirmModal(true); // Show the confirmation modal
        setError(''); // Clear any previous errors when opening modal
        setSuccessMessage(''); // Clear any previous success messages
    };

    // This function performs the actual deletion
    const confirmDeleteTrip = async () => {
        setShowDeleteConfirmModal(false); // Close the modal immediately
        try {
            await deleteDoc(doc(db, 'trips', tripId));
            setSuccessMessage('Trip deleted successfully!'); // Set success message
            setError(''); // Clear any errors
            setTimeout(() => { // Clear message after 3 seconds and navigate
                setSuccessMessage('');
                navigate('/homepage');
            }, 3000);
        } catch (err) {
            console.error("Error deleting trip:", err);
            setError('Failed to delete trip: ' + err.message);
            setSuccessMessage(''); // Ensure success message is clear on error
        }
    };

    const handleJoinLeaveTrip = async () => {
        if (!currentUser) {
            setError("You must be logged in to join or leave a trip.");
            return;
        }
        if (isCreator) {
            setError("As the trip creator, you cannot join/leave your own trip. Use 'Edit Trip' instead.");
            return;
        }
        setIsJoining(true);
        setError('');
        setSuccessMessage('');

        try {
            const tripDocRef = doc(db, 'trips', tripId);
            if (isJoined) {
                await updateDoc(tripDocRef, { participants: arrayRemove(currentUser.uid) });
                setSuccessMessage('You have successfully left the trip!');
                console.log("User left the trip:", trip.title);
            } else {
                await updateDoc(tripDocRef, { participants: arrayUnion(currentUser.uid) });
                setSuccessMessage('You have successfully joined the trip!');
                console.log("User joined the trip", trip.title);
            }
            setTimeout(() => setSuccessMessage(''), 3000);

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
            setError("Please enter a comment and make sure you are logged in."); // Changed from alert
            setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
            return;
        }
        setError('');
        setSuccessMessage('');

        try {
            const userName = currentUser.displayName || currentUser.username || currentUser.email.split('@')[0];
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
            setSuccessMessage('Comment posted successfully!');
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error posting comment:", err);
            setError("Failed to post comment.");
        }
    };

    const handleLikeToggle = async () => {
        if (!currentUser) {
            setError("Please log in to like this trip."); // Changed from alert
            setTimeout(() => setError(''), 3000); // Clear error after 3 seconds
            return;
        }
        setError('');
        setSuccessMessage('');

        const likeDocRef = doc(db, 'trips', tripId, 'likes', currentUser.uid);

        try {
            if (userLiked) {
                await deleteDoc(likeDocRef);
                setSuccessMessage('Trip unliked!');
                console.log("Trip unliked!");
            } else {
                await setDoc(likeDocRef, {
                    userId: currentUser.uid,
                    timestamp: serverTimestamp(),
                });
                setSuccessMessage('Trip liked!');
                console.log("Trip liked!");
            }
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error toggling like:", err);
            setError("Failed to update like status.");
        }
    };

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

    if (error && !successMessage) { // Only show global error if no success message is active
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

    let primaryButtonOnClick = handleJoinLeaveTrip;
    let primaryButtonText = "Join Trip";
    let primaryButtonClass = "bg-blue-600 hover:bg-blue-700";
    let primaryButtonDisabled = isJoining;

    if (isCreator) {
        primaryButtonText = "Edit Trip";
        primaryButtonClass = "bg-blue-600 hover:bg-blue-700";
        primaryButtonOnClick = handleManageTrip;
        primaryButtonDisabled = false;
    } else if (isJoined) {
        primaryButtonText = "Leave Trip";
        primaryButtonClass = "bg-red-500 hover:bg-red-600";
        primaryButtonDisabled = isJoining;
    }

    return (
        <>
            <Header />
            <div className="container mx-auto p-4 sm:p-8 max-w-4xl lg:max-w-5xl" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>

                {/* Success Message Display */}
                {successMessage && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md" role="alert">
                        <p className="font-bold">Success!</p>
                        <p>{successMessage}</p>
                    </div>
                )}
                {/* Error Message Display (local) */}
                {error && ( // Keep error display here for local errors that don't block entire page
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md" role="alert">
                        <p className="font-bold">Error!</p>
                        <p>{error}</p>
                    </div>
                )}


                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4">
                    <button onClick={() => navigate(-1)} className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 w-full sm:w-auto">
                        &larr; Back to Trips
                    </button>
                    {currentUser && (
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-4 w-full sm:w-auto">
                            {isCreator ? (
                                <>
                                    <button
                                        onClick={handleManageTrip}
                                        className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-75 w-full sm:w-auto"
                                    >
                                        Edit Trip
                                    </button>
                                    <button
                                        onClick={handleDeleteTripPrompt} // Now calls the prompt function
                                        className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-75 w-full sm:w-auto"
                                    >
                                        Delete Trip
                                    </button>
                                </>
                            ) : (
                                <button
                                    onClick={primaryButtonOnClick}
                                    disabled={primaryButtonDisabled}
                                    className={`px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-200 ${primaryButtonClass} ${primaryButtonDisabled ? 'opacity-75 cursor-not-allowed' : ''} w-full sm:w-auto`}
                                >
                                    {primaryButtonText}
                                </button>
                            )}
                        </div>
                    )}
                </div>

                <h1 className="text-3xl sm:text-4xl font-bold mb-4 text-[#111418]">{trip.title}</h1>

                {trip.imageUrl && (
                    <div className="relative w-full h-64 md:h-80 lg:h-96 mb-6 rounded-lg overflow-hidden shadow-lg">
                        <img
                            src={trip.imageUrl || "https://via.placeholder.com/800x400?text=Trip+Image"}
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
                        disabled={!currentUser}
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
                                    <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-1">
                                        <p className="font-bold text-gray-900">{comment.userName}</p>
                                        <span className="text-gray-500 text-xs mt-1 sm:mt-0">
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
                        <form onSubmit={handlePostComment} className="mt-6 flex flex-col sm:flex-row items-center space-y-3 sm:space-y-0 sm:space-x-3">
                            <input
                                type="text"
                                value={newCommentText}
                                onChange={(e) => setNewCommentText(e.target.value)}
                                placeholder="Add a comment..."
                                className="flex-grow border border-gray-300 rounded-lg p-3 text-gray-800 focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full"
                                disabled={!currentUser}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700 transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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

            {/* Custom Delete Confirmation Modal */}
            {showDeleteConfirmModal && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center p-4 z-50">
                    <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8 w-full max-w-sm">
                        <h3 className="text-xl font-bold text-gray-900 mb-4">Confirm Deletion</h3>
                        <p className="text-gray-700 mb-6">
                            Are you sure you want to delete this trip?
                            <br/><strong className="text-red-600">This action cannot be undone.</strong>
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowDeleteConfirmModal(false)}
                                className="px-5 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-100 transition-colors duration-200"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={confirmDeleteTrip}
                                className="px-5 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors duration-200"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
}

export default TripDetails;