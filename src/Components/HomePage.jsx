import React, { useState, useEffect } from 'react';
import { useAuth } from '../Context/AuthContext';
import { db } from '../firebase';
import { collection, query, getDocs, orderBy, limit, onSnapshot } from 'firebase/firestore';
import Header from './Header';
import { Link, useNavigate } from 'react-router-dom';

function HomePage() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();

    const [trips, setTrips] = useState([]);
    const [loadingTrips, setLoadingTrips] = useState(true);
    const [error, setError] = useState('');


    const [buddies, setBuddies] = useState([]);
    const [loadingBuddies, setLoadingBuddies] = useState(true);
    const [errorBuddies, setErrorBuddies] = useState('');

   useEffect(() => {
    setLoadingTrips(true);
    setError('');


    const tripsCollectionRef = collection(db, 'trips');
    const q =query(tripsCollectionRef, orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
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
            <div className="container mx-auto p-4 bg-gray-50">
                <div className="container mx-auto px-4 mt-6 mb-10">
                    <div className="relative max-w-2xl mx-auto">
                   <input
                      type="text"
                      placeholder="Where to?"
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
                    <p className="text-center text-gray-600">No trips created yet. <span className="font-semibold text-blue-600">Be the first!</span></p>
                )}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {trips.map(trip => (
                        <Link to={`/trips/${trip.id}`} key={trip.id} className="trip-card-link">
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
                        </Link>
                    ))}
                </div>
                <h2 className="text-3xl font-bold text-gray-800 mt-10 mb-6">Find a travel buddy</h2>
                <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
                    {buddies.map(buddy => (
                        <div key={buddy.id} onClick={() => navigate(`/users/${buddy.id}`)} className="flex flex-col items-center text-center p-4 bg-white rounded-lg shadow-sm cursor-pointer hover:shadow-md transition-shadow duration-200">
                            <img
                                src={buddy.photoURL || `https://api.dicebear.com/8.x/initials/svg?seed=${buddy.displayName ||  buddy.uid}&radius=50&backgroundColor=b6e3f4,c0aede,d1d4f9,ffdfbf,ffd5dc`}
                                alt={buddy.displayName || 'Travel Buddy'}
                                className="w-24 h-24 rounded-full object-cover mb-3 ring-2 ring-blue-500 ring-offset-2"
                            />
                            <h3 className="text-lg font-semibold text-gray-900">{buddy.displayName || buddy.email.split('@')[0]}</h3>
                            <button onClick={() => navigate(`/users/${buddy.id}`)} className='mt-2                /* margin-top: 8px */
                bg-blue-500         
                text-white          
                font-bold          
                px-3 py-1.5         
                rounded-full       
                text-sm             
                shadow-sm           
                cursor-pointer    
                transition-colors  
                duration-150        
                ease-in-out        
                hover:bg-blue-600   
                focus:outline-none '>View Profile</button>
                        </div>
                    ))}
                </div>
            </div>
        </>
    );
}

export default HomePage;
