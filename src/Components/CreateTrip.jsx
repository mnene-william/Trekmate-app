import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import Header from './Header'; // Assuming Header component uses Tailwind for its styles

function CreateTrip() {
    const { currentUser, loading: authLoading } = useAuth(); // Renamed loading to authLoading to avoid conflict
    const { tripId } = useParams();
    const navigate = useNavigate();

    const [tripData, setTripData] = useState({
        title: '',
        destination: '',
        description: '',
        startDate: '',
        activities: '',
        endDate: '',
        imageUrl: '',
    });

    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [successMessage, setSuccessMessage] = useState(''); // New state for success messages
    const [pageLoading, setPageLoading] = useState(true);
    const [initialFetchError, setInitialFetchError] = useState('');

    const [imageUploadLoading, setImageUploadLoading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState('');
    const cloudinaryWidgetRef = useRef(null);

    // --- Cloudinary Widget Initialization ---
    useEffect(() => {
        if (window.cloudinary && !cloudinaryWidgetRef.current) {
            cloudinaryWidgetRef.current = window.cloudinary.createUploadWidget(
                {
                    cloudName: 'doa3fpijh', // Replace with your Cloudinary Cloud Name
                    uploadPreset: 'trekmate_unsigned', // Replace with your Cloudinary Unsigned Upload Preset
                    // Other configurations...
                },
                (error, result) => {
                    if (!error && result && result.event === "success") {
                        console.log('Done uploading!!! Here is the image info: ', result.info);
                        setTripData(prevData => ({ ...prevData, imageUrl: result.info.secure_url }));
                        setImageUploadLoading(false);
                        setImageUploadError('');
                    } else if (error) {
                        console.error("Cloudinary Widget Error:", error);
                        setImageUploadError("Image upload failed.");
                        setImageUploadLoading(false);
                    } else if (result && result.event === "queues-start") {
                        setImageUploadLoading(true);
                        setImageUploadError('');
                    } else if (result && result.event === "close") {
                        // Handle widget close event: e.g., if user closes without selecting an image
                        setImageUploadLoading(false); // Ensure loading is reset if widget is closed
                    }
                }
            );
        }
    }, []);

    const openCloudinaryWidget = () => {
        if (cloudinaryWidgetRef.current) {
            cloudinaryWidgetRef.current.open();
        }
    };

    useEffect(() => {
        const fetchTrip = async () => {
            if (tripId) {
                try {
                    const tripRef = doc(db, 'trips', tripId);
                    const tripSnap = await getDoc(tripRef);

                    if (tripSnap.exists()) {
                        const data = tripSnap.data();

                        const activitiesString = Array.isArray(data.activities) ? data.activities.join('\n') : data.activities || '';

                        setTripData({
                            title: data.title || '',
                            destination: data.destination || '',
                            description: data.description || '',
                            startDate: data.startDate || '',
                            endDate: data.endDate || '',
                            activities: activitiesString,
                            imageUrl: data.imageUrl || '',
                        });
                        setPageLoading(false);
                    } else {
                        setInitialFetchError("Trip not found. It might have been deleted or never existed.");
                        setPageLoading(false);
                    }
                } catch (err) {
                    console.error("Error fetching trip for edit:", err);
                    setInitialFetchError("Failed to load trip data. Please try again.");
                    setPageLoading(false);
                }
            } else {
                setPageLoading(false);
            }
        };
        fetchTrip();
    }, [tripId]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setTripData(prevData => ({ ...prevData, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccessMessage(''); // Clear previous success message
        setSubmitLoading(true);

        if (!currentUser) {
            setError('You must log in to create/edit a trip.');
            setSubmitLoading(false);
            return;
        }

        if (!tripData.title || !tripData.destination || !tripData.description || !tripData.startDate || !tripData.endDate) {
            setError('Please fill in all required fields: Title, Destination, Description, Start Date, and End Date.');
            setSubmitLoading(false);
            return;
        }

        if (new Date(tripData.startDate) > new Date(tripData.endDate)) {
            setError('End Date cannot be before Start Date.');
            setSubmitLoading(false);
            return;
        }

        try {
            const activitiesArray = tripData.activities.split('\n').map(activity => activity.trim()).filter(activity => activity !== '');

            // Ensure creatorName is available for search keywords
            const creatorNameForSearch = currentUser.displayName || currentUser.email.split("@")[0];

            const combinedSearchText = `${tripData.title} ${tripData.destination} ${tripData.description} ${creatorNameForSearch} ${activitiesArray.join(' ')}`.toLowerCase();
            const allWords = combinedSearchText.split(/[\s,.\-!?"'#$@%^&*()_+={}\[\]:;<>\/]+/).filter(Boolean);
            const destinationKeywords = [...new Set(allWords)]; // Unique words

            const tripFieldsToSave = {
                title: tripData.title,
                destination: tripData.destination,
                description: tripData.description,
                startDate: tripData.startDate,
                endDate: tripData.endDate,
                activities: activitiesArray,
                imageUrl: tripData.imageUrl,
                creatorId: currentUser.uid,
                creatorName: creatorNameForSearch, // Use the correct creator name
                destinationKeywords: destinationKeywords,
            };

            if (tripId) {
                await updateDoc(doc(db, 'trips', tripId), tripFieldsToSave);
                setSuccessMessage("Trip updated successfully!");
            } else {
                await addDoc(collection(db, 'trips'), {
                    ...tripFieldsToSave,
                    createdAt: Timestamp.now(),
                    participants: [],
                });
                setSuccessMessage("Trip created successfully!");

                // Reset form for new trip creation
                setTripData({
                    title: '',
                    destination: '',
                    description: '',
                    startDate: '',
                    endDate: '',
                    activities: '',
                    imageUrl: ''
                });
            }

            // Clear success message and navigate after a delay
            setTimeout(() => {
                setSuccessMessage('');
                navigate('/homepage');
            }, 2000); // Navigate after 2 seconds

        } catch (error) {
            console.error("Error creating/updating trip:", error);
            setError('Failed to process trip: ' + error.message);
            // Clear error message after a delay
            setTimeout(() => setError(''), 5000);
        } finally {
            setSubmitLoading(false);
        }
    };

    // Redirect unauthenticated users
    useEffect(() => {
        if (!authLoading && !currentUser) {
            navigate('/login');
        }
    }, [currentUser, authLoading, navigate]);

    // Apply consistent styling from previous components using Tailwind classes
    const formInputClasses = "form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal";
    const textareaClasses = "form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-auto min-h-[120px] placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"; // Adjusted min-h for textarea

    if (authLoading || pageLoading) {
        return (
            <>
                <Header />
                <div className="flex justify-center items-center h-screen"> {/* Tailwind for centering loading */}
                    <p className="text-xl text-gray-700">Loading trip data...</p>
                </div>
            </>
        );
    }

    if (initialFetchError) {
        return (
            <>
                <Header />
                <div className="flex flex-col justify-center items-center h-screen p-4">
                    <p className="text-red-600 text-lg mb-4 text-center">{initialFetchError}</p>
                    <button
                        onClick={() => navigate('/homepage')}
                        className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-2 px-4 rounded transition-colors"
                    >
                        Back to Home
                    </button>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div className="container mx-auto p-6 md:p-8 lg:p-10 max-w-2xl bg-white rounded-lg shadow-lg my-8">
                {/* NEW: Back Button */}
                <div className="mb-6">
                    <button
                        onClick={() => navigate(-1)} // Navigates back one step in history
                        className="flex items-center text-gray-600 hover:text-blue-600 transition-colors duration-200 focus:outline-none"
                    >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                            <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                        </svg>
                        Back
                    </button>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
                    {tripId ? 'Edit Trip' : 'Create a New Trip'}
                </h2>

                {/* Success Message Display */}
                {successMessage && (
                    <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-4 rounded shadow-md" role="alert">
                        <p className="font-bold">Success!</p>
                        <p>{successMessage}</p>
                    </div>
                )}
                {/* Error Message Display */}
                {error && (
                    <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-4 rounded shadow-md" role="alert">
                        <p className="font-bold">Error!</p>
                        <p>{error}</p>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6"> {/* Use space-y for consistent vertical spacing */}
                    <div>
                        <label htmlFor="title" className="block text-gray-700 text-sm font-bold mb-2">Trip Title:</label>
                        <input
                            type="text"
                            id="title"
                            value={tripData.title}
                            onChange={handleChange}
                            required
                            className={formInputClasses}
                            placeholder="e.g., Summer Adventure in the Alps"
                        />
                    </div>

                    <div>
                        <label htmlFor="destination" className="block text-gray-700 text-sm font-bold mb-2">Destination:</label>
                        <input
                            type="text"
                            id="destination"
                            value={tripData.destination}
                            onChange={handleChange}
                            required
                            className={formInputClasses}
                            placeholder="e.g., Swiss Alps, Switzerland"
                        />
                    </div>

                    <div>
                        <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Description:</label>
                        <textarea
                            id="description"
                            rows="5"
                            value={tripData.description}
                            onChange={handleChange}
                            className={textareaClasses}
                            placeholder="Describe your amazing trip..."
                        ></textarea>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4"> {/* Grid for dates */}
                        <div>
                            <label htmlFor="startDate" className="block text-gray-700 text-sm font-bold mb-2">Start Date:</label>
                            <input
                                type="date"
                                id="startDate"
                                value={tripData.startDate}
                                onChange={handleChange}
                                required
                                className={formInputClasses}
                            />
                        </div>

                        <div>
                            <label htmlFor="endDate" className="block text-gray-700 text-sm font-bold mb-2">End Date:</label>
                            <input
                                type="date"
                                id="endDate"
                                value={tripData.endDate}
                                onChange={handleChange}
                                required
                                className={formInputClasses}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="activities" className="block text-gray-700 text-sm font-bold mb-2">Activities (each on a new line):</label>
                        <textarea
                            id="activities"
                            rows="5"
                            value={tripData.activities}
                            onChange={handleChange}
                            className={textareaClasses}
                            placeholder="e.g.,&#10;Hiking Trails&#10;Lake Swimming&#10;City Tour&#10;Local Cuisine Tasting"
                        />
                    </div>

                    <div>
                        <label className="block text-gray-700 text-sm font-bold mb-2">Trip Image (Optional):</label>
                        <button
                            type="button"
                            onClick={openCloudinaryWidget}
                            disabled={imageUploadLoading}
                            className={`w-full py-3 px-4 rounded-lg font-bold text-white transition-colors duration-200
                                ${imageUploadLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-500 hover:bg-blue-600'}
                            `}
                        >
                            {imageUploadLoading ? 'Uploading Image...' : (tripData.imageUrl ? 'Change Image' : 'Choose Image')}
                        </button>
                        {imageUploadError && <p className="text-red-500 text-xs mt-2">{imageUploadError}</p>}
                        {tripData.imageUrl && (
                            <div className="mt-4 text-center">
                                <p className="text-gray-600 text-sm mb-2">Image Preview:</p>
                                <img
                                    src={tripData.imageUrl}
                                    alt="Trip Preview"
                                    className="max-w-[150px] max-h-[150px] object-cover rounded-lg border border-gray-200 mx-auto"
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading || imageUploadLoading}
                        className={`w-full py-3 px-4 rounded-lg font-bold text-white text-lg transition-colors duration-200
                            ${(submitLoading || imageUploadLoading) ? 'bg-gray-400 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700'}
                        `}
                    >
                        {submitLoading ? (tripId ? 'Saving Changes...' : 'Creating Trip...') : (tripId ? 'Save Changes' : 'Create Trip')}
                    </button>
                </form>
            </div>
        </>
    );
}

export default CreateTrip;