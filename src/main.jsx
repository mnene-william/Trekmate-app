
import React from 'react'; 
import ReactDOM from 'react-dom/client'; 
import './index.css';
import App from './App.jsx';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './Context/AuthContext'; 
import { ThemeProvider } from './Context/ThemeContext.jsx';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode> 
    <ThemeProvider>
    <BrowserRouter>
      <AuthProvider>
        <App />
      </AuthProvider>
    </BrowserRouter>
    </ThemeProvider>
  </React.StrictMode>
);
