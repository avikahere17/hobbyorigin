import React from 'react';
import ReactDOM from 'react-dom/client';
import './i18n'; // initialise i18n before rendering
import App from './App';

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);
