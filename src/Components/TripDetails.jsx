import React, { useState, useEffect, useRef } from 'react';
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
    const [showDeleteConfirmModal, setShowDeleteConfirmModal] = useState(false);

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
    const [shareMessage, setShareMessage] = useState(''); // State for clipboard copy feedback

    const [showShareOptions, setShowShareOptions] = useState(false); // State for showing share options
    const shareButtonRef = useRef(null); // Ref for the share button to position the dropdown
    const shareOptionsRef = useRef(null); // Ref for the share options dropdown itself

    // Effect to close share options when clicking outside
    useEffect(() => {
        function handleClickOutside(event) {
            // Close if clicked outside the share button and outside the share options dropdown
            if (shareOptionsRef.current && !shareOptionsRef.current.contains(event.target) &&
                shareButtonRef.current && !shareButtonRef.current.contains(event.target)) {
                setShowShareOptions(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [shareOptionsRef, shareButtonRef]);


    // Fetch trip details, participants, and determine user's relationship to trip
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

                const currentParticipants = data.participants || [];

                if (currentUser) {
                    setIsJoined(currentParticipants.includes(currentUser.uid));
                    setIsCreator(data.creatorId === currentUser.uid);
                } else {
                    setIsJoined(false);
                    setIsCreator(false);
                }

                // Fetch participant usernames
                if (currentParticipants.length > 0) {
                    const usersRef = collection(db, 'users');
                    // Firestore 'in' query supports up to 10 values. Slice to prevent errors.
                    const q = query(usersRef, where('uid', 'in', currentParticipants.slice(0, 10)));
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

    // Fetch comments for the trip
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

    // Fetch likes for the trip
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

    // Handle navigation to edit trip page
    const handleManageTrip = () => {
        if (trip && trip.id) {
            navigate(`/create-trip/${trip.id}`);
        }
    };

    // Show delete confirmation modal
    const handleDeleteTripPrompt = () => {
        if (!currentUser) {
            setError("You must be logged in to delete a trip");
            return;
        }
        if (!isCreator) {
            setError("You are not authorized to delete this trip.");
            return;
        }
        setShowDeleteConfirmModal(true);
        setError('');
        setSuccessMessage('');
    };

    // Confirm and perform trip deletion
    const confirmDeleteTrip = async () => {
        setShowDeleteConfirmModal(false);
        try {
            await deleteDoc(doc(db, 'trips', tripId));
            setSuccessMessage('Trip deleted successfully!');
            setError('');
            setTimeout(() => {
                setSuccessMessage('');
                navigate('/homepage');
            }, 3000);
        } catch (err) {
            console.error("Error deleting trip:", err);
            setError('Failed to delete trip: ' + err.message);
            setSuccessMessage('');
        }
    };

    // Handle joining or leaving a trip
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
            } else {
                await updateDoc(tripDocRef, { participants: arrayUnion(currentUser.uid) });
                setSuccessMessage('You have successfully joined the trip!');
            }
            setTimeout(() => setSuccessMessage(''), 3000);

        } catch (err) {
            console.error("Error joining/leaving trip:", err);
            setError("Failed to update trip status: " + err.message);
        } finally {
            setIsJoining(false);
        }
    };

    // Handle posting a new comment
    const handlePostComment = async (e) => {
        e.preventDefault();

        if (!newCommentText.trim() || !currentUser) {
            setError("Please enter a comment and make sure you are logged in.");
            setTimeout(() => setError(''), 3000);
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

    // Handle liking/unliking a trip
    const handleLikeToggle = async () => {
        if (!currentUser) {
            setError("Please log in to like this trip.");
            setTimeout(() => setError(''), 3000);
            return;
        }
        setError('');
        setSuccessMessage('');

        const likeDocRef = doc(db, 'trips', tripId, 'likes', currentUser.uid);

        try {
            if (userLiked) {
                await deleteDoc(likeDocRef);
                setSuccessMessage('Trip unliked!');
            } else {
                await setDoc(likeDocRef, {
                    userId: currentUser.uid,
                    timestamp: serverTimestamp(),
                });
                setSuccessMessage('Trip liked!');
            }
            setTimeout(() => setSuccessMessage(''), 3000);
        } catch (err) {
            console.error("Error toggling like:", err);
            setError("Failed to update like status.");
        }
    };

    // Function to copy trip link to clipboard
    const copyTripLink = async () => {
        const tripUrl = `${window.location.origin}/trips/${tripId}`;
        try {
            if (navigator.clipboard && navigator.clipboard.writeText) {
                await navigator.clipboard.writeText(tripUrl);
                setShareMessage('Link copied to clipboard!');
            } else {
                const textArea = document.createElement('textarea');
                textArea.value = tripUrl;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.focus();
                textArea.select();
                document.execCommand('copy');
                document.body.removeChild(textArea);
                setShareMessage('Link copied to clipboard! (Fallback)');
            }
            setTimeout(() => setShareMessage(''), 3000);
            setShowShareOptions(false); // Close options after copying
        } catch (err) {
            console.error('Failed to copy trip link:', err);
            setShareMessage('Failed to copy link. Please copy manually: ' + tripUrl);
            setTimeout(() => setShareMessage(''), 5000);
        }
    };

    // Functions to share on specific platforms
    const shareOnTwitter = () => {
        const tripUrl = `${window.location.origin}/trips/${tripId}`;
        const text = encodeURIComponent(`Check out this amazing trip on TrekMate: ${trip.title}!`);
        window.open(`https://twitter.com/intent/tweet?url=${tripUrl}&text=${text}`, '_blank');
        setShowShareOptions(false);
    };

    const shareOnFacebook = () => {
        const tripUrl = `${window.location.origin}/trips/${tripId}`;
        // Facebook's share dialog prefers the URL directly
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${tripUrl}`, '_blank');
        setShowShareOptions(false);
    };

    const shareOnWhatsApp = () => {
        const tripUrl = `${window.location.origin}/trips/${tripId}`;
        const text = encodeURIComponent(`Check out this amazing trip on TrekMate: ${trip.title}! ${tripUrl}`);
        window.open(`https://wa.me/?text=${text}`, '_blank');
        setShowShareOptions(false);
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

    if (error && !successMessage) {
        return (
            <>
                <Header />
                <div className="container mx-auto p-4 text-center mt-8 bg-white text-gray-900 rounded-lg shadow-md">
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
                <div className="container mx-auto p-4 text-center mt-8 bg-white text-gray-900 rounded-lg shadow-md">
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
            <div className="container mx-auto p-4 sm:p-8 max-w-4xl lg:max-w-5xl bg-white text-gray-900 rounded-lg shadow-lg my-8">

                {/* Success Message Display */}
                {successMessage && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6 rounded shadow-md" role="alert">
                        <p className="font-bold">Success!</p>
                        <p>{successMessage}</p>
                    </div>
                )}
                {/* Error Message Display (local) */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6 rounded shadow-md" role="alert">
                        <p className="font-bold">Error!</p>
                        <p>{error}</p>
                    </div>
                )}
                {/* Share Message Display (for clipboard copy) */}
                {shareMessage && (
                    <div className="bg-blue-100 border-l-4 border-blue-500 text-blue-700 p-4 mb-6 rounded shadow-md" role="alert">
                        <p className="font-bold">Share Link:</p>
                        <p>{shareMessage}</p>
                    </div>
                )}

                {/* Delete Confirmation Modal */}
                {showDeleteConfirmModal && (
                    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center p-4 z-50">
                        <div className="bg-white p-6 rounded-lg shadow-xl max-w-sm mx-auto text-center">
                            <h3 className="text-lg font-semibold mb-4 text-gray-900">Confirm Deletion</h3>
                            <p className="mb-6 text-gray-700">Are you sure you want to delete this trip? This action cannot be undone.</p>
                            <div className="flex justify-center space-x-4">
                                <button
                                    onClick={confirmDeleteTrip}
                                    className="px-5 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors duration-200"
                                >
                                    Delete
                                </button>
                                <button
                                    onClick={() => setShowDeleteConfirmModal(false)}
                                    className="px-5 py-2 bg-gray-300 text-gray-800 rounded-lg hover:bg-gray-400 transition-colors duration-200"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="flex flex-col sm:flex-row justify-between items-center mb-4 gap-4 relative"> {/* Added relative for dropdown positioning */}
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
                                        onClick={handleDeleteTripPrompt}
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
                            {/* Share Trip Button - now toggles options */}
                            <button
                                ref={shareButtonRef} 
                                onClick={() => setShowShareOptions(!showShareOptions)}
                                className="px-6 py-3 text-white font-semibold rounded-lg shadow-md transition-colors duration-200
                                bg-gray-600 hover:bg-gray-700
                                focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-opacity-75 w-full sm:w-auto flex items-center justify-center"
                            >
                                Share Trip
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 ml-2" viewBox="0 0 20 20" fill="currentColor">
                                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                                </svg>
                            </button>

                            {/* Share Options Dropdown with Icons */}
                            {showShareOptions && (
                                <div
                                    ref={shareOptionsRef} // Attach ref to the dropdown
                                    className="absolute right-0 mt-2 top-full bg-white border border-gray-200 rounded-lg shadow-lg z-10 w-48 py-2 transform origin-top-right scale-y-100 transition-transform duration-200 ease-out"
                                >
                                    {/* Copy Link */}
                                    <button
                                        onClick={copyTripLink}
                                        className="flex items-center w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-gray-500" viewBox="0 0 20 20" fill="currentColor">
                                            <path d="M8 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" />
                                            <path d="M6 3a2 2 0 00-2 2v11a2 2 0 002 2h8a2 2 0 002-2V5a2 2 0 00-2-2 3 3 0 01-3 3H9a3 3 0 01-3-3z" />
                                        </svg>
                                        Copy Link
                                    </button>
                                    {/* Twitter */}
                                    <button
                                        onClick={shareOnTwitter}
                                        className="flex items-center w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-400" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M22.2 5.6c-.7.3-1.4.5-2.2.6.8-.5 1.4-1.2 1.7-2.1-.7.4-1.5.7-2.3.9-.7-.7-1.7-1.2-2.8-1.2-2.1 0-3.8 1.7-3.8 3.8 0 .3 0 .6.1.9-3.1-.2-5.9-1.6-7.8-3.9-.3.5-.5 1-.5 1.7 0 1.3.7 2.4 1.7 3.1-.6 0-1.2-.2-1.7-.5v.1c0 1.8 1.3 3.3 3 3.6-.3.1-.7.1-1 .1-.2 0-.4 0-.6-.1.5 1.5 1.8 2.6 3.4 2.9-1.3 1-2.9 1.6-4.7 1.6-.3 0-.6 0-.9-.1 1.7 1.1 3.7 1.8 5.9 1.8 7.1 0 11-5.9 11-11.7 0-.2 0-.4 0-.5.8-.6 1.5-1.3 2-2.1z"/>
                                        </svg>
                                        Share on Twitter
                                    </button>
                                    {/* Facebook */}
                                    <button
                                        onClick={shareOnFacebook}
                                        className="flex items-center w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878V14.25H7.5V12h2.938V9.75c0-2.906 1.77-4.508 4.375-4.508 1.246 0 2.327.092 2.646.134v2.875h-1.719c-1.355 0-1.618.644-1.618 1.585V12h3.235l-.52 2.25h-2.715v7.628C18.343 21.128 22 16.991 22 12c0-5.523-4.477-10-10-10z"/>
                                        </svg>
                                        Share on Facebook
                                    </button>
                                    {/* WhatsApp */}
                                    <button
                                        onClick={shareOnWhatsApp}
                                        className="flex items-center w-full text-left px-4 py-2 text-gray-800 hover:bg-gray-100 transition-colors duration-200"
                                    >
                                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-3 text-green-500" viewBox="0 0 24 24" fill="currentColor">
                                            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.475-2.39-.015-.297.049-.564.2-.718.15-.149.3-.223.447-.298.149-.074.2-.173.297-.372.099-.198.049-.372-.025-.521-.074-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.198-.015-.42-.015-.644-.015-.242 0-.66.099-.817.297-.15.198-.58.579-.58 1.416 0 .816.596 1.633.67 1.732.074.099 1.164 1.758 2.809 2.524.471.223.867.372 1.164.471.42.149.618.124.767.074.242-.074.75-.307 1.099-.456.349-.149.596-.223.793-.372.198-.148.3-.297.447-.495.148-.198.222-.372.222-.521 0-.149-.074-.298-.173-.396zm-5.188-9.176c-3.237 0-6.195 1.589-8.068 4.148L0 24l6.308-1.654a9.718 9.718 0 0 0 4.162 1.026h.005c5.384 0 9.764-4.38 9.769-9.762.002-5.385-4.379-9.763-9.764-9.763z"/>
                                        </svg>
                                        Share on WhatsApp
                                    </button>
                                </div>
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
                                    <span onClick={() => navigate(`/users/${participantId}`)} className="cursor-pointer text-blue-600 underline hover:no-underline">
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
                <div className="flex items-center space-x-4 mt-6 border-t border-gray-200 pt-6">
                    <button
                        onClick={handleLikeToggle}
                        className={`flex items-center px-4 py-2 rounded-full transition-colors duration-200 ease-in-out ${
                            userLiked
                                ? 'bg-red-500 text-white'
                                : 'bg-gray-200 text-gray-700 hover:bg-red-100 hover:text-red-600'
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
                <h2 className="text-3xl font-bold text-gray-800 mt-10 mb-6 border-t border-gray-200 pt-8">Comments</h2>
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
                                className="flex-grow border border-gray-300 rounded-lg p-3
                                text-gray-800 bg-white
                                focus:ring-blue-500 focus:border-blue-500 shadow-sm w-full"
                                disabled={!currentUser}
                            />
                            <button
                                type="submit"
                                className="bg-blue-600 text-white font-semibold px-6 py-3 rounded-lg hover:bg-blue-700
                                transition duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2
                                disabled:opacity-50 disabled:cursor-not-allowed w-full sm:w-auto"
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