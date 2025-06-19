import React, { createContext, useState, useEffect, useContext } from 'react';
import { auth } from '../firebase'; // Assuming your firebase config is exported from here
import { onAuthStateChanged, createUserWithEmailAndPassword, signOut}  from 'firebase/auth';
  

const AuthContext = createContext();

export function useAuth() {
  return useContext(AuthContext);
}

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  
  function signup(email, password) {
    return createUserWithEmailAndPassword(auth, email, password);
  }

  function login(email, password){
    return signInWithEmailAndPassword(auth, email, password);
  }

  function logout(){
    return signOut(auth);
  }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); 
    });

    return unsubscribe; 
  }, []);

 
  const value = {
    currentUser,
    signup,
     login,
     logout, 
    
    loading 
  };

  return (
    <AuthContext.Provider value={value}>
     
      {!loading && children}
    </AuthContext.Provider>
  );
}