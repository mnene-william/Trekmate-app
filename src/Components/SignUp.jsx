import React, {useState} from 'react';
import {auth} from '../firebase';
import { createUserWithEmailAndPassword } from 'firebase/auth';

function SignUp(){

    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState(null);
    const [loading, setLoading] = useState(false);

    





    return(
        <>
        
        </>
    );


}
export default SignUp;