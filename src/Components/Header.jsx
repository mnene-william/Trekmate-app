import React from 'react';
import {useAuth} from '../Context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';


function Header(){

    const {currentUser, logout} = useAuth();
    const navigate = useNavigate();

    const handleLogout = async () => {
        try{
            await logout();
            navigate('/login');
        }
        catch(error){
            console.error("Log out has failed");
            alert('Log out has failed.Please try again');
        }
    }

    return(
        <>
         <header>
            <div>
                <div>
                    <div>

                    </div>
                    <h2>TrekMate</h2>

                </div>
                <div>
                    <Link to="/explore">Explore</Link>
                    <Link to="/my-trips">My Trips</Link>
                    <Link to="inbox">Inbox</Link>
                </div>
            </div>
            <div>
                <label>
                    <div>
                        <div>

                        </div>
                        <input type="text"  placeholder='Search' value="" />
                    </div>

                </label>
            </div>
            {currentUser ? (
                <>
                 <Link to="/profile">Profile</Link>
                 <button onClick={handleLogout}>Log out</button>
                
                </>
            ) : (
                <>
                <div>
                    <Link to ="/login">Log In</Link>
                    <Link to ="/signup">Sign Up</Link>
                </div>
                
                </>
            )}

         </header>
        
        </>
    );


}
export default Header;