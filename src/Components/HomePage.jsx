import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, limit, onSnapshot, where } from 'firebase/firestore';
import Header from './Header';
import { Link, useNavigate } from 'react-router-dom';

function HomePage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');

    const [buddies, setBuddies] = useState([]);
    const [loadingBuddies, setLoadingBuddies] = useState(true);
    const [errorBuddies, setErrorBuddies] = useState('');

    useEffect(() => {
        setLoadingTrips(true);
        setError('');

        const tripsCollectionRef = collection(db, 'trips');
        let tripsQuery;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayIsoDate = `${year}-${month}-${day}`;

        if (searchQuery.trim() !== '') {
            const searchLower = searchQuery.trim().toLowerCase();
            tripsQuery = query(
                tripsCollectionRef,
                where('destinationKeywords', 'array-contains', searchLower),
                where('endDate', '>=', todayIsoDate),
                orderBy('endDate', 'asc')
            );
        } else {
            tripsQuery = query(
                tripsCollectionRef,
                where('endDate', '>=', todayIsoDate),
                orderBy('endDate', 'asc')
            );
        }

        const unsubscribe = onSnapshot(tripsQuery, (querySnapshot) => {
            const fetchedTrips = [];
            querySnapshot.forEach(doc => {
                fetchedTrips.push({
                    id: doc.id,
                    ...doc.data()
                });
            });
            setTrips(fetchedTrips);
            setLoadingTrips(false);
            setError('');
        }, (err) => {
            console.error("Error fetching real-time trips:", err);
            setError("Failed to load trips in real-time.");
            setLoadingTrips(false);
        });

        return () => unsubscribe();
    }, [searchQuery]);

    useEffect(() => {
        const fetchBuddies = async () => {
            try {
                setLoadingBuddies(true);
                const usersCollectionRef = collection(db, 'users');
                const q = query(usersCollectionRef);
                const querySnapshot = await getDocs(q);

                const fetchedBuddies = querySnapshot.docs.map(doc => ({
                    id: doc.id,
                    ...doc.data()
                }));

         
                const filteredBuddies = currentUser ? fetchedBuddies.filter(buddy => buddy.id !== currentUser.uid) : fetchedBuddies;

                setBuddies(filteredBuddies);
                setErrorBuddies('');
            }
            catch (error) {
                console.error('Error fetching buddies:', error);
                setErrorBuddies("Failed to load travel buddies");
            }
            finally {
                setLoadingBuddies(false);
            }
        };
        fetchBuddies();
    }, [currentUser]);

    return (
        <>
            <Header />
            <div className="container mx-auto p-4 bg-gray-50">
                <div className="container mx-auto px-4 mt-6 mb-10">
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="Where to?"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-700 placeholder-gray-400"
                        />
                        <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mb-6">Upcoming trips</h2>
                {loadingTrips && <p className="text-center text-gray-600">Loading trips...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {!loadingTrips && trips.length === 0 && !error && (
                    <p className="text-center text-gray-600">No upcoming trips found matching your search. Try a different destination or create a new trip!</p>
                )}
                <div className="flex overflow-x-auto gap-6 pb-4 md:pb-6 custom-scroll-bar">
                    {trips.map(trip => (
                        <Link to={`/trips/${trip.id}`} key={trip.id}
                            className="flex-shrink-0 w-64 md:w-80 trip-card-link
                                       transform transition duration-300 ease-in-out
                                       hover:scale-105 hover:shadow-lg"
                        >
                            <div className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col h-full">
                                <img
                                    src={trip.imageUrl || "https://via.placeholder.com/400x250?text=No+Image"}
                                    alt={trip.title}
                                    className="w-full h-48 object-cover"
                                />
                                <div className="p-4 flex flex-col justify-between flex-grow">
                                    <div>
                                        <h3 className="text-xl font-semibold text-gray-900 mb-2">{trip.title}</h3>
                                        <p className="text-gray-700 text-sm mb-2">{trip.destination}</p>
                                        <p className="text-gray-600 text-sm line-clamp-3">{trip.description}</p>
                                    </div>
                                    <p className="text-gray-500 text-xs mt-2">
                                        {trip.startDate} to {trip.endDate} by {trip.creatorName}
                                    </p>
                                </div>
                            </div>
                        </Link>
                    ))}

                    
                    <div className="flex-shrink-0 w-64 md:w-80 bg-gray-100 rounded-lg shadow-md flex flex-col items-center justify-center p-4">
                        <button
                            onClick={() => navigate('/explore')} // Navigate to /explore page
                            className="bg-blue-500 hover:bg-blue-600 text-white font-bold py-3 px-6 rounded-lg transition-colors text-center text-lg flex items-center justify-center"
                        >
                            View All Trips
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 inline-block ml-3" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10.293 15.707a1 1 0 010-1.414L14.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                                <path fillRule="evenodd" d="M4.293 15.707a1 1 0 010-1.414L8.586 10l-4.293-4.293a1 1 0 111.414-1.414l5 5a1 1 0 010 1.414l-5 5a1 1 0 01-1.414 0z" clipRule="evenodd" />
                            </svg>
                        </button>
                    </div>
                </div>

                <h2 className="text-3xl font-bold text-gray-800 mt-10 mb-6">Find a travel buddy</h2>
                {loadingBuddies && <p className="text-center text-gray-600">Loading buddies...</p>}
                {errorBuddies && <p className="text-center text-red-500">{errorBuddies}</p>}
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {buddies.map(buddy => (
                        <div key={buddy.id} onClick={() => navigate(`/users/${buddy.id}`)} className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200">
                            <img
                                src={buddy.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${buddy.displayName || buddy.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                                alt={buddy.displayName || 'Travel Buddy'}
                                className="w-24 h-24 rounded-full object-cover mb-3 ring-2 ring-blue-500 ring-offset-2"
                            />
                            <h3 className="text-lg font-semibold text-gray-900">{buddy.displayName || buddy.email.split('@')[0]}</h3>
                            <button onClick={() => navigate(`/users/${buddy.id}`)} className='mt-2 bg-blue-500 text-white font-bold px-3 py-1.5 rounded-full text-sm shadow-sm cursor-pointer transition-colors duration-150 ease-in-out hover:bg-blue-600 focus:outline-none'>View Profile</button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default HomePage;
