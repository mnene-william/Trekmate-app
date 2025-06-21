
import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../Context/AuthContext';
import { db, auth } from '../firebase'; 
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';

function SignUp() {
   const emailRef = useRef();
   const passwordRef = useRef();
   const passwordConfirmRef = useRef();
   const nameRef = useRef();

   const { signup } = useAuth();
   const [error, setError] = useState('');
   const [loading, setLoading] = useState(false);
   const [message, setMessage] = useState('');

   const navigate = useNavigate();

   const handleSignUp = async (e) => {
       e.preventDefault();
       setError(''); 
       setMessage(''); 

       if (passwordRef.current.value !== passwordConfirmRef.current.value) {
           return setError('Passwords do not match');
       }

       try {
           setLoading(true);

           
           await signup(emailRef.current.value, passwordRef.current.value);

          
           const newUser = auth.currentUser; 

          
           if (newUser && newUser.uid) {
               await setDoc(doc(db, "users", newUser.uid), {
                   uid: newUser.uid,
                   displayName: nameRef.current.value || newUser.email.split('@')[0], 
                   email: newUser.email,
                   createdAt: serverTimestamp(),
                   followersCount: 0, // Initialize followers count to 0
                   followingCount: 0
               });
           }

           setMessage('Account created successfully! Redirecting...');
           navigate('/create-profile'); 
       } catch (err) {
           console.error("Error signing up:", err); 
           if (err.code === 'auth/email-already-in-use') {
               setError('This email address is already in use. Please log in or use a different email.');
           } else if (err.code === 'auth/invalid-email') {
               setError('The email address is not valid.');
           } else if (err.code === 'auth/weak-password') {
               setError('Password should be at least 6 characters.');
           } else {
               setError("Failed to create an account: " + err.message);
           }
       } finally {
           setLoading(false);
       }
   };

   return (
       <div className="relative flex size-full min-h-screen flex-col bg-white group/design-root overflow-x-hidden" style={{ fontFamily: 'Inter, "Noto Sans", sans-serif' }}>
           <div className="layout-container flex h-full grow flex-col">
               <div className="px-40 flex flex-1 justify-center py-5">
                   <div className="layout-content-container flex flex-col w-[512px] py-5 max-w-[960px] flex-1">
                       <h2 className="text-[#111418] tracking-light text-[28px] font-bold leading-tight px-4 text-center pb-3 pt-5">Sign up to TrekMate</h2>
                       {error && <p className="text-red-500 text-center mb-4">{error}</p>}
                       {message && <p className="text-green-500 text-center mb-4">{message}</p>} 

                       <form onSubmit={handleSignUp} className="flex flex-col max-w-[480px] gap-4 px-4 py-3"> 
                           <label className="flex flex-col min-w-40 flex-1 w-full">
                               <p className="text-[#111418] text-base font-medium leading-normal pb-2">Full Name</p> 
                               <input
                                   type="text"
                                   placeholder="Enter your full name"
                                   className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                   ref={nameRef}
                                   required
                               />
                           </label>
                           <label className="flex flex-col min-w-40 flex-1 w-full">
                               <p className="text-[#111418] text-base font-medium leading-normal pb-2">Email address</p>
                               <input
                                   type="email"
                                   placeholder="name@example.com"
                                   className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                   ref={emailRef}
                                   required
                               />
                           </label>
                           <label className="flex flex-col min-w-40 flex-1 w-full">
                               <p className="text-[#111418] text-base font-medium leading-normal pb-2">Password</p>
                               <input
                                   type="password"
                                   placeholder="Min. 6 characters"
                                   className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                   ref={passwordRef}
                                   required
                               />
                           </label>
                           <label className="flex flex-col min-w-40 flex-1 w-full">
                               <p className="text-[#111418] text-base font-medium leading-normal pb-2">Confirm password</p>
                               <input
                                   type="password"
                                   placeholder="Min. 6 characters"
                                   className="form-input flex w-full min-w-0 flex-1 resize-none overflow-hidden rounded-lg text-[#111418] focus:outline-0 focus:ring-0 border-none bg-[#f0f2f5] focus:border-none h-14 placeholder:text-[#60758a] p-4 text-base font-normal leading-normal"
                                   ref={passwordConfirmRef}
                                   required
                               />
                           </label>
                           <div className="flex px-4 py-3 w-full">
                               <button
                                   type="submit"
                                   disabled={loading}
                                   className="flex min-w-[84px] max-w-[480px] cursor-pointer items-center justify-center overflow-hidden rounded-lg h-12 px-5 flex-1 bg-[#0c7ff2] text-white text-base font-bold leading-normal tracking-[0.015em] disabled:opacity-50 hover:bg-blue-600 transition-colors"
                               >
                                   <span className="truncate">{loading ? 'Signing Up...' : 'Sign up'}</span>
                               </button>
                           </div>
                       </form>
                       <p className="text-[#111418] text-sm font-normal leading-normal px-4 pt-4 text-center">
                           Already have an account?{" "}
                           <Link to="/login" className="text-[#1b6bfe] font-medium hover:text-blue-700 transition-colors">
                               Log in
                           </Link>
                       </p>
                   </div>
               </div>
           </div>
       </div>
   );
}

export default SignUp;
