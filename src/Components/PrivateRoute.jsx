import React from 'react';
import { useAuth } from '../Context/AuthContext';
import { Navigate } from 'react-router-dom';

function PrivateRoute({children}){
    const {currentUser} = useAuth();


    if(!currentUser){
        return <Navigate to="/login" replace />
    }

    return children;


}
export default PrivateRoute;