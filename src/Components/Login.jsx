import React from 'react'
import {auth} from '../firebase';
import {signInWithEmailAndPassword} from 'firebase/auth';
import { useNavigate } from 'react-router-dom';
import { Link } from 'react-router-dom';

function Login(){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();



    const inputEmail = (e) =>{
        setEmail(e.target.value);
    }

    const inputPassword = (e) =>{
        setPassword(e.target.value);
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setError(null);
        setLoading(true);

        try{
            const userCredential = await signInWithEmailAndPassword(auth, email, password);
            const user = userCredential.user;
            console.log('You have successfully logged in:', user);
            navigate('/dashboard');
        }
        catch(error){
            console.error('An error occurred when logging in;', error.message);
            if(error.message === 'auth/invalid-credential') {
                setError('Invalid credentials')
            }
            else{
                setError('Log in failed.Please try again')
            }
        }
        finally{
            setLoading(false);
        }
    };


    



    return(
        <>
         <div>
            <div>
                <h2>
                    Login
                </h2>
                <form onSubmit={handleSubmit}>
                    <div>
                        <label>
                            <p>Email</p>
                            <input type="email" placeholder='Enter your email' value={email} onChange={inputEmail} required/>
                        </label>
                    </div>
                    <div>
                        <label>
                            <p>Password</p>
                            <input type="password" placeholder='Enter your password' value={password} onChange={inputPassword} required/>
                        </label>
                    </div>
                    <div>
                        <button type="submit">
                            <span>{loading ? 'Logging in' : 'Log In'}</span>

                        </button>
                    </div>
                    <p>Don't have an Account? <Link to="/Signup">Sign Up</Link></p>
                </form>
            </div>


         </div>
        
        
        </>
    );



}
export default Login;