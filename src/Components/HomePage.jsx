import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy } from 'firebase/firestore';
import Header from './Header';

function Dashboard() {
    const { currentUser } = useAuth();
    const [trips, setTrips] = useState([]);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [error, setError] = useState('');


    const [buddies, setBuddies] = useState([]);
    const [loadingBuddies, setLoadingBuddies] = useState(true);
    const [errorBuddies, setErrorBuddies] = useState('');

    useEffect(() => {
        const fetchTrips = async () => {
            try {
                setLoadingTrips(true);
                const tripsCollectionRef = collection(db, 'trips');
                const q = query(tripsCollectionRef, orderBy('createdAt', 'desc'));
                const querySnapshot = await getDocs(q);

                const fetchedTrips = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

                setTrips(fetchedTrips);
                setError('');
            } catch (err) {
                console.error("Error fetching trips:", err);
                setError("Failed to load trips.");
            } finally {
                setLoadingTrips(false);
            }
        };

        fetchTrips();
    }, []);


    useEffect(() => {
        const fetchBuddies = async () => {
            try{
                setLoadingBuddies(true);
                const usersCollectionRef = collection(db, 'users');

                const q = query(usersCollectionRef, limit(7));
                const querySnapshot = await getDocs(q);

                const fetchedBuddies = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));


                const filteredBuddies = currentUser ? fetchedBuddies.filter(buddy => buddy.id !== currentUser.uid) : fetchedBuddies;

                setBuddies(filteredBuddies);
                setErrorBuddies('');
            }
            catch(error){
                console.error('Error fetching buddies');
                setError("Filed to load travel buddies")
            }
            finally{
                setLoadingBuddies(false);
            }
        };
        fetchBuddies();
    }, [currentUser]);

    return (
        <>
            <Header />
            <div className="container mx-auto p-4">
                <h2 className="text-3xl font-bold text-gray-800 mb-6">Upcoming trips</h2>
                {loadingTrips && <p className="text-center text-gray-600">Loading trips...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {!loadingTrips && trips.length === 0 && !error && (
                    <p className="text-center text-gray-600">No trips created yet. <span className="font-semibold text-blue-600">Be the first!</span></p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map(trip => (
                        <div key={trip.id} className="bg-white rounded-lg shadow-md overflow-hidden">
                            <img
                                src={trip.imageUrl || "https://via.placeholder.com/400x250?text=No+Image"}
                                alt={trip.title}
                                className="w-full h-48 object-cover"
                            />
                            <div className="p-4">
                                <h3 className="text-xl font-semibold text-gray-900 mb-2">{trip.title}</h3>
                                <p className="text-gray-700 text-sm mb-2">{trip.destination}</p>
                                <p className="text-gray-600 text-sm">{trip.description.substring(0, 100)}...</p>
                                <p className="text-gray-500 text-xs mt-2">
                                    {trip.startDate} to {trip.endDate} by {trip.creatorName}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mt-10 mb-6">Find a travel buddy</h2>
                <p className="text-gray-600">Travel buddy section coming soon...</p>
                
            </div>
        </>
    );
}

export default Dashboard;
