import React from 'react';
import Header from './Header';
import {Link, useNavigate} from 'react';
import {useAuth} from '../Context/AuthContext';

function HomePage(){

    const {currentUser, loading} = useAuth();

      if (loading) {
    return (
      <div>
        <p>Loading user data...</p>
      </div>
    );
  }



    return(
        <>
        <Header />

        <div>
            <input type='text' value=''  />

        </div>

        
        
        </>
    );


}
export default HomePage