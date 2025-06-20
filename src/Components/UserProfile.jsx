import React, {useState, useEffect} from 'react';
import { useAuth } from '../Context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc, query, orderBy, where, getDocs, collection } from 'firebase/firestore';



function UserProfile(){

    const {userId} = useParams();
    const {currentUser} = useAuth();
    const navigate = useNavigate();

    const [profileData, setProfileData] = useState(null);
    const [loadingProfile, setLoadingProfile] = useState(true);







    return(<>
    
    
    </>);


}
export default UserProfile;