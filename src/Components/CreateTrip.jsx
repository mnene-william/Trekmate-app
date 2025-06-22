import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { useNavigate, useParams } from 'react-router-dom';
import { collection, addDoc, Timestamp, doc, getDoc, updateDoc } from 'firebase/firestore';
import Header from './Header';

function CreateTrip() {
    const { currentUser, loading } = useAuth();
    const { tripId } = useParams();
    const navigate = useNavigate();

    const [tripData, setTripData] = useState({
        title: '',
        destination: '',
        description: '',
        startDate: '',
        activities: '',
        endDate: '',
        imageUrl: '', // ADDED: To store the Cloudinary image URL
    });

    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');
    const [pageLoading, setPageLoading] = useState(true);
    const [initialFetchError, setInitialFetchError] = useState('');

    // State and Ref for Cloudinary Image Upload
    const [imageUploadLoading, setImageUploadLoading] = useState(false);
    const [imageUploadError, setImageUploadError] = useState('');
    const cloudinaryWidgetRef = useRef(null); // Ref to store the widget instance

    // --- Cloudinary Widget Initialization ---
    // This useEffect hook initializes the Cloudinary widget when the component mounts.
    useEffect(() => {
        // Ensure that `window.cloudinary` exists and the widget hasn't been created yet
        if (window.cloudinary && !cloudinaryWidgetRef.current) {
            cloudinaryWidgetRef.current = window.cloudinary.createUploadWidget(
                {
                    cloudName: 'doa3fpijh', // <<< IMPORTANT: REPLACE WITH YOUR CLOUD NAME
                    uploadPreset: 'trekmate_unsigned', // <<< IMPORTANT: REPLACE WITH YOUR UNSIGNED UPLOAD PRESET NAME
                    // Optional configurations (uncomment and adjust as needed):
                    // sources: ['local', 'url', 'camera'], // Allow different upload sources
                    // cropping: true, // Enable basic cropping
                    // defaultSource: 'local',
                    // maxImageFileSize: 2000000, // 2MB max file size (in bytes)
                    // clientAllowedFormats: ["png", "gif", "jpeg", "jpg", "webp"], // Allowed file formats
                    // folder: "trip_images", // Specify a default folder for uploads in Cloudinary
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
                        setImageUploadLoading(true); // Indicate upload is starting
                        setImageUploadError('');
                    }
                    // You might want to handle 'close' event here as well to reset upload state if widget is closed without upload
                }
            );
        }
    }, []); // Empty dependency array ensures this runs only once on mount

    // Function to open the Cloudinary Upload Widget
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

                        // Ensure activities is an array before joining, or an empty string if not present
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
                        setInitialFetchError("Trip not found."); // Set error if trip ID exists but doc doesn't
                        setPageLoading(false);
                    }
                } catch (err) {
                    console.error("Error fetching trip for edit:", err);
                    setInitialFetchError("Failed to load trip data.");
                    setPageLoading(false);
                }
            } else {
                setPageLoading(false);
            }
        }
        fetchTrip();
    }, [tripId]);

    const handleChange = (e) => {
        const { id, value } = e.target;
        setTripData(prevData => ({ ...prevData, [id]: value }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSubmitLoading(true);

        if (!currentUser) {
            setError('You must log in to create/edit a trip.');
            setSubmitLoading(false);
            return;
        }

        if (!tripData.title || !tripData.destination || !tripData.description || !tripData.startDate || !tripData.endDate) {
            setError('Please fill in all required fields.');
            setSubmitLoading(false);
            return;
        }

        // Date validation: ensure end date is not before start date
        if (new Date(tripData.startDate) > new Date(tripData.endDate)) {
            setError('End Date cannot be before Start Date.');
            setSubmitLoading(false);
            return;
        }

        try {
            // Correctly split activities by newline and filter empty strings
            const activitiesArray = tripData.activities.split('\n').map(activity => activity.trim()).filter(activity => activity !== '');
            console.log("Activities Array to be saved:", activitiesArray);

           const combinedSearchText = `${tripData.title} ${tripData.destination} ${tripData.description} ${tripData.creatorName}`.toLowerCase();
            const allWords = combinedSearchText.split(/[\s,.\-!?"'#$@%^&*()_+={}\[\]:;<>\/]+/).filter(Boolean);

            const destinationKeywords = [...new Set(allWords)];
            console.log("Generateg destinationKeywords:", destinationKeywords);

            const tripFieldsToSave = {
                title: tripData.title,
                destination: tripData.destination,
                description: tripData.description,
                startDate: tripData.startDate,
                endDate: tripData.endDate,
                activities: activitiesArray,
                imageUrl: tripData.imageUrl,
                creatorId: currentUser.uid,
                creatorName: currentUser.displayName || currentUser.email.split("@")[0],
                destinationKeywords: destinationKeywords,
            };

            if (tripId) {
                // Update existing trip
                await updateDoc(doc(db, 'trips', tripId), tripFieldsToSave);
                alert("Trip updated successfully!");
            } else {
                // Create new trip
                await addDoc(collection(db, 'trips'), {
                    ...tripFieldsToSave,
                    createdAt: Timestamp.now(),
                    participants: [], // Only set participants for new trips
                });
                alert("Trip created successfully!");

                // Reset form fields and image URL only for new trip creation
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

            setSubmitLoading(false);
            navigate('/homepage'); // Redirect to homepage after successful operation

        } catch (error) {
            console.error("Error creating/updating trip:", error);
            setError('Failed to process trip: ' + error.message);
            setSubmitLoading(false);
        }
    };

    // Redirect unauthenticated users
    useEffect(() => {
        if (!loading && !currentUser) {
            navigate('/login');
        }
    }, [currentUser, loading, navigate]);

    // Render loading state if auth is still loading
    if (loading || pageLoading) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <p style={styles.loadingText}>Loading trip data...</p>
                </div>
            </>
        );
    }

    if (initialFetchError) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <p style={styles.errorMessage}>{initialFetchError}</p>
                    <button onClick={() => navigate('/homepage')} style={styles.submitButton}>Back to Home</button>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div style={styles.container}>
                {/* NEW: Dynamic Heading */}
                <h2 style={styles.heading}>{tripId ? 'Edit Trip' : 'Create a New Trip'}</h2>
                <form onSubmit={handleSubmit} style={styles.form}>
                    {error && <p style={styles.errorMessage}>{error}</p>}

                    <div style={styles.formGroup}>
                        <label htmlFor="title" style={styles.label}>Trip Title:</label>
                        <input
                            type="text"
                            id="title"
                            value={tripData.title}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="destination" style={styles.label}>Destination:</label>
                        <input
                            type="text"
                            id="destination"
                            value={tripData.destination}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="description" style={styles.label}>Description:</label>
                        <textarea
                            id="description"
                            rows="5"
                            value={tripData.description}
                            onChange={handleChange}
                            style={styles.textarea}
                        ></textarea>
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="startDate" style={styles.label}>Start Date:</label>
                        <input
                            type="date"
                            id="startDate"
                            value={tripData.startDate}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="endDate" style={styles.label}>End Date:</label>
                        <input
                            type="date"
                            id="endDate"
                            value={tripData.endDate}
                            onChange={handleChange}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label htmlFor="activities" style={styles.label}>Activities (each on a new line):</label> {/* UPDATED LABEL HINT */}
                        <textarea
                            id="activities"
                            rows="5"
                            value={tripData.activities}
                            onChange={handleChange}
                            style={styles.textarea}
                            placeholder="e.g.,&#10;Hiking&#10;Swimming&#10;Sightseeing" // Placeholder with newlines
                        />
                    </div>

                    <div style={styles.formGroup}>
                        <label style={styles.label}>Trip Image (Optional):</label>
                        <button
                            type="button"
                            onClick={openCloudinaryWidget}
                            style={{
                                ...styles.uploadButton,
                                ...(imageUploadLoading ? styles.uploadButtonDisabled : {}),
                            }}
                            disabled={imageUploadLoading}
                        >
                            {imageUploadLoading ? 'Uploading Image...' : 'Choose Image'}
                        </button>
                        {imageUploadError && <p style={styles.errorMessage}>{imageUploadError}</p>}
                        {tripData.imageUrl && (
                            <div style={{ marginTop: '15px', textAlign: 'center' }}>
                                <p style={{ marginBottom: '5px', color: '#4a5568', fontSize: '14px' }}>Image Preview:</p>
                                <img
                                    src={tripData.imageUrl}
                                    alt="Trip Preview"
                                    style={{
                                        maxWidth: '150px',
                                        maxHeight: '150px',
                                        borderRadius: '8px',
                                        objectFit: 'cover',
                                        border: '1px solid #e2e8f0',
                                    }}
                                />
                            </div>
                        )}
                    </div>

                    <button
                        type="submit"
                        disabled={submitLoading || imageUploadLoading}
                        style={{
                            ...styles.submitButton,
                            ...(submitLoading || imageUploadLoading ? styles.submitButtonDisabled : {}),
                        }}
                    >
                        {submitLoading ? (tripId ? 'Saving Changes...' : 'Creating Trip...') : (tripId ? 'Save Changes' : 'Create Trip')} {/* DYNAMIC BUTTON TEXT */}
                    </button>
                </form>
            </div>
        </>
    );
}

// Inline styles object
const styles = {
    container: {
        padding: '24px',
        maxWidth: '600px',
        margin: '32px auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    },
    heading: {
        fontSize: '28px',
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: '24px',
        textAlign: 'center',
    },
    form: {
        display: 'flex',
        flexDirection: 'column',
    },
    formGroup: {
        marginBottom: '16px',
    },
    label: {
        display: 'block',
        marginBottom: '8px',
        fontWeight: 'bold',
        color: '#4a5568',
        fontSize: '15px',
    },
    input: {
        width: 'calc(100% - 20px)',
        padding: '10px',
        border: '1px solid #cbd5e0',
        borderRadius: '5px',
        fontSize: '16px',
        boxSizing: 'border-box',
    },
    textarea: {
        width: 'calc(100% - 20px)',
        padding: '10px',
        border: '1px solid #cbd5e0',
        borderRadius: '5px',
        fontSize: '16px',
        minHeight: '100px',
        resize: 'vertical',
        boxSizing: 'border-box',
    },
    submitButton: {
        backgroundColor: '#3182ce',
        color: 'white',
        fontWeight: 'bold',
        padding: '12px 24px',
        borderRadius: '8px',
        fontSize: '18px',
        border: 'none',
        cursor: 'pointer',
        marginTop: '24px',
        transition: 'background-color 0.2s ease-in-out',
        width: '100%',
    },
    submitButtonDisabled: {
        backgroundColor: '#a0aec0',
        cursor: 'not-allowed',
    },
    errorMessage: {
        color: '#e53e3e',
        backgroundColor: '#fef2f2',
        border: '1px solid #feb2b2',
        padding: '12px',
        borderRadius: '8px',
        marginBottom: '20px',
        textAlign: 'center',
        fontWeight: '500',
    },
    loadingText: {
        textAlign: 'center',
        color: '#4a5568',
        marginTop: '32px',
    },
    uploadButton: {
        backgroundColor: '#4a90e2',
        color: 'white',
        fontWeight: 'bold',
        padding: '10px 15px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        transition: 'background-color 0.2s ease-in-out',
        width: '100%',
    },
    uploadButtonDisabled: {
        backgroundColor: '#a0aec0',
        cursor: 'not-allowed',
    }
};

export default CreateTrip;