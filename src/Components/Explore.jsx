import React, { useState, useEffect } from 'react';
import { db } from '../firebase';
import { collection, query, onSnapshot, orderBy, where } from 'firebase/firestore';
import Header from './Header'; // Assuming Header is in the components folder
import { Link } from 'react-router-dom';

function ExplorePage() {
    const [trips, setTrips] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [searchQuery, setSearchQuery] = useState('');
    const [activeTab, setActiveTab] = useState('all'); // 'all', 'upcoming', 'past'

    useEffect(() => {
        setLoading(true);
        setError('');

        const tripsCollectionRef = collection(db, 'trips');
        let tripsQuery;

        const today = new Date();
        const year = today.getFullYear();
        const month = String(today.getMonth() + 1).padStart(2, '0');
        const day = String(today.getDate()).padStart(2, '0');
        const todayIsoDate = `${year}-${month}-${day}`;

        let baseQuery = tripsCollectionRef;

        // Apply search filter if query exists
        if (searchQuery.trim() !== '') {
            const searchLower = searchQuery.trim().toLowerCase();
            baseQuery = query(baseQuery, where('destinationKeywords', 'array-contains', searchLower));
        }

        // Apply tab-based filtering
        if (activeTab === 'upcoming') {
            tripsQuery = query(baseQuery, where('endDate', '>=', todayIsoDate), orderBy('endDate', 'asc'));
        } else if (activeTab === 'past') {
            tripsQuery = query(baseQuery, where('endDate', '<', todayIsoDate), orderBy('endDate', 'desc'));
        } else { // 'all' tab
            // For 'all' trips, we still need an orderBy for consistent results and potential indexing
            // Ordering by 'createdAt' desc is a common choice for showing latest first
            tripsQuery = query(baseQuery, orderBy('createdAt', 'desc'));
            // Note: If you also want to order by 'endDate' for 'all', and have a search filter,
            // this might require yet another composite index. Let's start simple.
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
            setLoading(false);
            setError('');
        }, (err) => {
            console.error("Error fetching trips for explore page:", err);
            setError("Failed to load trips.");
            setLoading(false);
        });

        return () => unsubscribe();
    }, [searchQuery, activeTab]); // Re-run effect when search query or active tab changes

    return (
        <>
            <Header />
            <div className="container mx-auto p-4 bg-gray-50">
                <div className="container mx-auto px-4 mt-6 mb-10">
                    <div className="relative max-w-2xl mx-auto">
                        <input
                            type="text"
                            placeholder="Search trips by destination..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="w-full pl-12 pr-4 py-3 rounded-full bg-white shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg text-gray-700 placeholder-gray-400"
                        />
                        <svg className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
                        </svg>
                    </div>
                </div>

                {/* Tab Navigation */}
                <div className="flex justify-center mb-8 space-x-4">
                    <button
                        onClick={() => setActiveTab('all')}
                        className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200 ${
                            activeTab === 'all' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        All Trips
                    </button>
                    <button
                        onClick={() => setActiveTab('upcoming')}
                        className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200 ${
                            activeTab === 'upcoming' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Upcoming
                    </button>
                    <button
                        onClick={() => setActiveTab('past')}
                        className={`px-6 py-2 rounded-full font-semibold transition-colors duration-200 ${
                            activeTab === 'past' ? 'bg-blue-600 text-white shadow-md' : 'bg-white text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        Past
                    </button>
                </div>


                <h2 className="text-3xl font-bold text-gray-800 mb-6 capitalize">{activeTab} Trips</h2>
                {loading && <p className="text-center text-gray-600">Loading trips...</p>}
                {error && <p className="text-center text-red-500">{error}</p>}
                {!loading && trips.length === 0 && !error && (
                    <p className="text-center text-gray-600">No {activeTab} trips found matching your criteria.</p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 pb-4">
                    {trips.map(trip => (
                        <Link to={`/trips/${trip.id}`} key={trip.id}
                            className="flex-shrink-0 trip-card-link
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
                </div>
            </div>
        </>
    );
}

export default ExplorePage;