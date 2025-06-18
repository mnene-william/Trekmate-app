import React from 'react';
import {Routes, Route, Navigate } from 'react-router-dom';
import './index.css';
import SignUp from './Components/SignUp'
import Login from './Components/Login';
import Dashboard from './Components/Dashboard';
import CreateProfile from './Components/CreateProfile';
import Header from './Components/Header';
import PrivateRoute from './Components/PrivateRoute';




function App() {


  return (
    <>
    
      <Routes>
      
        <Route path="/signup" element={<SignUp />} />
        <Route path="/login" element={<Login />} />

        <Route path="/create-profile" element={<PrivateRoute><CreateProfile /></PrivateRoute>} />

        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/" element={<Navigate to="dashboard" replace />} />
      </Routes>

      
    </>
  )
}

export default App;
