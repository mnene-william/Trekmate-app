// src/Components/MyTripsPage.jsx

import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { collection, query, where, getDocs, or } from 'firebase/firestore'; // Import 'or' for multiple conditions if needed
import { useNavigate, Link } from 'react-router-dom';

function MyTripsPage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [myTrips, setMyTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    useEffect(() => {
        const fetchMyTrips = async () => {
            if (!currentUser) {
                setError("You must be logged in to view your trips.");
                setLoading(false);
                return;
            }

            try {
                // Query for trips where the current user is either the creator OR a participant
                const tripsRef = collection(db, 'trips');
                const q = query(
                    tripsRef,
                    // Use 'or' if you want to show both created and joined trips
                    or(
                        where("creatorId", "==", currentUser.uid),
                        where("participants", "array-contains", currentUser.uid)
                    )
                );

                const querySnapshot = await getDocs(q);
                const fetchedTrips = [];
                querySnapshot.forEach((doc) => {
                    fetchedTrips.push({ id: doc.id, ...doc.data() });
                });
                setMyTrips(fetchedTrips);
                setError('');
            } catch (err) {
                console.error("Error fetching my trips:", err);
                setError("Failed to load your trips.");
            } finally {
                setLoading(false);
            }
        };

        fetchMyTrips();
    }, [currentUser]);

    if (loading) {
        return <div className="flex justify-center items-center h-screen">Loading your trips...</div>;
    }

    if (error) {
        return <div className="flex justify-center items-center h-screen text-red-500">{error}</div>;
    }

    return (
        <div className="container mx-auto p-8" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
            <h1 className="text-4xl font-bold mb-6 text-[#111418]">My Trips</h1>
            <button onClick={() => navigate(-1)} className="mb-4 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                &larr; Back
            </button>

            {myTrips.length === 0 ? (
                <p className="text-gray-600 text-lg">You haven't created or joined any trips yet.</p>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {myTrips.map(trip => (
                        <Link to={`/trips/${trip.id}`} key={trip.id} className="block border rounded-lg shadow-md hover:shadow-lg transition-shadow duration-200 overflow-hidden">
                            {trip.imageUrl && <img src={trip.imageUrl} alt={trip.title} className="w-full h-48 object-cover" />}
                            <div className="p-4">
                                <h3 className="text-xl font-semibold mb-2">{trip.title}</h3>
                                <p className="text-gray-600 text-sm mb-2">{trip.destination}</p>
                                <p className="text-gray-500 text-xs">
                                    {trip.startDate} - {trip.endDate}
                                </p>
                                <p className="text-gray-700 mt-2 line-clamp-2">{trip.description}</p>
                                <p className="text-blue-600 mt-3 text-right text-sm">View Details</p>
                            </div>
                        </Link>
                    ))}
                </div>
            )}
        </div>
    );
}

export default MyTripsPage;