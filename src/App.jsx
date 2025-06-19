import React from 'react';
import {Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import SignUp from './Components/SignUp'
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import CreateProfile from './Components/CreateProfile';
import Header from './Components/Header';
import PrivateRoute from './Components/PrivateRoute';
import HomePage from './Components/HomePage';
import CreateTrip from './Components/CreateTrip';
import Profile from './Components/Profile';




function App() {


  return (
    <>
    
      <Routes>
        <Route path="/header" element={<Header />} />
        <Route path="/homepage" element={<HomePage/>} />
      
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />
        <Route path="/create-profile" element={<PrivateRoute><CreateProfile /></PrivateRoute>} />
        <Route path="/dashboard" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
        <Route path="/" element={<Navigate to='homepage' replace />} />
        <Route path="/explore" element={<h1>Explore Page (Coming Soon!)</h1>} />
        <Route path="/my-trips" element={<h1>My Trips Page (Coming Soon!)</h1>} />
        <Route path="/inbox" element={<h1>Inbox Page (Coming Soon!)</h1>} />
        <Route path="/profile" element ={<PrivateRoute><Profile /></PrivateRoute>} />
        <Route path="/create-trip" element={<PrivateRoute><CreateTrip /></PrivateRoute>} />
                

      </Routes>

      
    </>
  )
}

export default App;
