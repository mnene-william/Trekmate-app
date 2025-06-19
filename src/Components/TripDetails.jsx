import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import Header from './Header';

function TripDetails() {
    const { tripId } = useParams();
    const navigate = useNavigate();

    const [trip, setTrip] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

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
                    setTrip({ id: tripDocSnap.id, ...tripDocSnap.data() });
                    console.log("Trip Details:", tripDocSnap.data());
                } else {
                    setError("Trip not found.");
                }

            } catch (err) { // Changed 'error' to 'err' to avoid confusion with state variable
                console.error("Error fetching trip:", err);
                setError("Failed to load trip details.");
            } finally {
                setLoading(false);
            }
        };
        fetchTripDetails();
    }, [tripId]);


    if (loading) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <p style={styles.loadingText}>Loading trip details...</p>
                </div>
            </>
        );
    }

    if (error) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <p style={styles.errorMessage}>{error}</p>
                    <button onClick={() => navigate(-1)} style={styles.backButton}>Go Back</button>
                </div>
            </>
        );
    }

    if (!trip) {
        return (
            <>
                <Header />
                <div style={styles.container}>
                    <p style={styles.infoText}>Trip not available.</p>
                    <button onClick={() => navigate(-1)} style={styles.backButton}>Go Back</button>
                </div>
            </>
        );
    }

    return (
        <>
            <Header />
            <div style={styles.container}>
                <div style={styles.tripHeader}>
                    <h1 style={styles.tripTitle}>{trip.title}</h1>
                    <p style={styles.tripDestination}>{trip.destination}</p>
                    
                    <p style={styles.tripDates}>From {trip.startDate} to {trip.endDate}</p>
                </div>

                
                {trip.imageUrl && (
                    <div style={styles.imageContainer}>
                        <img src={trip.imageUrl} alt={trip.title} style={styles.mainImage} />
                    </div>
                )}

                
                <div style={styles.descriptionSection}>
                    <h2 style={styles.sectionHeading}>About This Trip</h2>
                    <p style={styles.tripDescription}>{trip.description}</p>
                </div>

                
                <div style={styles.creatorInfo}>
                    <p>Created by: **{trip.creatorName}**</p>
                    
                    <p>On: {trip.createdAt ? new Date(trip.createdAt.toDate()).toLocaleDateString() : 'N/A'}</p>
                </div>

                
                <button onClick={() => navigate('/profile')} style={styles.backToProfileButton}>Back to My Trips</button>


            </div>
        </>
    );
}

const styles = {
    container: {
        padding: '24px',
        maxWidth: '800px',
        margin: '32px auto',
        backgroundColor: 'white',
        borderRadius: '8px',
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        fontFamily: 'Arial, sans-serif',
        color: '#333',
    },
    loadingText: {
        textAlign: 'center',
        color: '#666',
        marginTop: '30px',
        fontSize: '16px',
    },
    infoText: {
        textAlign: 'center',
        color: '#666',
        marginTop: '20px',
        fontSize: '16px',
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
    backButton: {
        backgroundColor: '#6c757d',
        color: 'white',
        padding: '10px 15px',
        borderRadius: '5px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        display: 'block',
        margin: '20px auto 0 auto',
        transition: 'background-color 0.2s',
    },
    tripHeader: {
        textAlign: 'center',
        marginBottom: '25px',
        paddingBottom: '15px',
        borderBottom: '1px solid #eee',
    },
    tripTitle: {
        fontSize: '36px',
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: '10px',
    },
    tripDestination: {
        fontSize: '22px',
        color: '#4a5568',
        marginBottom: '5px',
    },
    tripDates: {
        fontSize: '18px',
        color: '#718096',
    },
    imageContainer: {
        textAlign: 'center',
        marginBottom: '25px',
    },
    mainImage: {
        maxWidth: '100%',
        height: 'auto',
        maxHeight: '400px',
        objectFit: 'contain',
        borderRadius: '10px',
        boxShadow: '0 4px 8px rgba(0,0,0,0.15)',
    },
    descriptionSection: { // CORRECTED TYPO HERE
        marginBottom: '25px',
    },
    sectionHeading: {
        fontSize: '24px',
        fontWeight: 'bold',
        color: '#1a202c',
        marginBottom: '15px',
        borderBottom: '2px solid #eee',
        paddingBottom: '10px',
    },
    tripDescription: {
        fontSize: '17px',
        lineHeight: '1.7',
        color: '#444',
    },
    creatorInfo: {
        fontSize: '15px',
        color: '#555',
        marginTop: '30px',
        paddingTop: '20px',
        borderTop: '1px solid #eee',
        textAlign: 'right',
    },
    backToProfileButton: { 
        backgroundColor: '#3182ce',
        color: 'white',
        padding: '12px 24px',
        borderRadius: '8px',
        border: 'none',
        cursor: 'pointer',
        fontSize: '16px',
        fontWeight: 'bold',
        marginTop: '30px',
        display: 'block',
        margin: '30px auto 0 auto',
        transition: 'background-color 0.2s',
    },
};

export default TripDetails;