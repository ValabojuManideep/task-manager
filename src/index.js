import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import axios from 'axios';
import { BACKEND_URL } from './config';
import { Toaster } from 'react-hot-toast';
import App from './App';
import reportWebVitals from './reportWebVitals';

const root = ReactDOM.createRoot(document.getElementById('root'));
axios.defaults.baseURL = BACKEND_URL;
root.render(
  <React.StrictMode>
    
    <App />
    <Toaster position="top-center" />
   
  </React.StrictMode>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();
