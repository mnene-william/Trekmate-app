import React, {useState} from 'react';
import {auth} from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import {doc, setDoc} from 'firebase/firestore';
import { Link } from 'react-router-dom';

 function SignUp(){

    const [email, setEmail] = useState('');
    const [username, setUserName] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

const addEmail = (e) => {
    setEmail(e.target.value);
};

const addUserName = (e) => {
    setUserName(e.target.value);
};

const addPassword = (e) => {
    setPassword(e.target.value);
};

const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
        const userCredential = await createUserWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        console.log('User signed up successfully:', user);

        await setDoc(doc(db, 'users', user.uid), {
            uid: user.uid,
            email: user.email,
            username: username,
            createdAt: new Date()
        });
        console.log('User profile created', user.uid);

        setEmail('');
        setUserName('');
        setPassword('');
    } catch (error) {
        console.error('Error signing up:', error.message);
        if (error.code === 'auth/email-already-in-use') {
            setError('This email is already is use');
        } else if (error.code === 'auth/invalid-email') {
            setError('Email address is invalid');
        } else if (error.code === 'auth/weak-password') {
            setError('Password should be at least 6 characters long');
        } else {
            setError('Sign up failed.Kindly try again.');
        }
    } finally {
        setLoading(false);
    }
};








    return(
        <>
                <h2>
                    Create your account
                </h2>

                <form onSubmit={handleSubmit}>
                    <div>
                        <label>
                            <p>Email:</p>
                            <input type="email" placeholder='Enter your email' value={email} onChange={addEmail} required />
                        </label>
                    </div>
                    <div>
                        <label>
                            <p>Username:</p>
                            <input type="text" placeholder="Enter your username" value={username} onChange={addUserName} required />
                        </label>
                    </div>
                    <div>
                        <label>
                            <p>Password:</p>
                            <input type="password" placeholder="Create a password" value={password} onChange={addPassword} required />
                        </label>
                    </div>
                    <div>
                        <button type="submit">
                            <span>{loading ? 'Signing up...' : 'Sign Up'}</span>
                        </button>
                    </div>
                    <p>Already have an Account?<Link to="/login">Login</Link></p>
                </form>
        
        </>
    );


}
export default SignUp;