import React, { useState, useEffect} from 'react';
import { useAuth } from '../Context/AuthContext';
import {db} from '../firebase';
import { useNavigate } from 'react-router-dom';
import {collection, addDoc, Timestamp} from 'firebase/firestore';


function CreateTrip(){

    const {currentUser, loading} = useAuth();
    const navigate = useNavigate();


    const [tripData, setTripData] = useState({
        title: '',
        destination: '',
        description: '',
        startDate: '',
        endDate: '',
    });

    const [submitLoading, setSubmitLoading] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e) => {
        const {id, value} = e.target;
        setTripData(prevData => ({...prevData, [id]: value}))
    }

    const handleSubmit =  async (e) => {
        e.preventDefault();
        setError('');
        setSubmitLoading(true);

        if(!currentUser){
            setError('You must log in to create a trip')
            setSubmitLoading(false);
            return;
        }

        if(!tripData.title || !tripData.destination || !tripData.description || !tripData.startDate || !tripData.endDate) {
            setError('Pleae fill in all required field.');
            setSubmitLoading(false);
            return;
        }
       try{
        await addDoc(collection(db, 'trips'), {
            ...tripData,
            creatorId: currentUser.uid,
            creatorName: currentUser.displayName || currentUser.email.split("@")[0],
            createdAt: Timestamp.now()
        });

        setSubmitLoading(false);
        alert("Trip created successfully!");

        setTripData({
            title: '',
            destination: '',
            description: '',
            startDate: '',
            endDate: ''
        });
        ;
        }
        catch(error){
            console.error("Error creating trip:",);
            setError('Failed to create trip');
            setSubmitLoading(false);
        }
    }

    useEffect(() => {
        if(!currentUser){
            navigate('/login');
        }
    }, [currentUser, navigate])


    return(
        <>
        <div>
            <form onSubmit={handleSubmit}>
                <div>
                    <label>Trip title:</label>
                    <input type="text" id="title" value={tripData.title} onChange={handleChange} required/>
                </div>

                <div>
                    <label>Destination:</label>
                    <input type="text" id="destination" value={tripData.destination} onChange={handleChange} required />
                </div>

                <div>
                    <label>Description:</label>
                    <textarea id="description" rows="5" value={tripData.description} onChange={handleChange}></textarea>
                </div>

                <div>
                    <label>Start Date:</label>
                    <input type="date" id="startDate" value={tripData.startDate} onChange={handleChange} required />
                </div>

                <div>
                    <label>End Date:</label>
                    <input type="date" id="endDate" value={tripData.endDate} onChange={handleChange} required />
                </div>

                <button type="submit" disabled={submitLoading}>{submitLoading ? 'Processing...' : 'Create Trip'}</button>






            </form>
        </div>
        
        
        </>
    );


}
export default CreateTrip;