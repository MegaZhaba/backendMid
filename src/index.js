import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import mongoose from "mongoose";

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<React.StrictMode><App /></React.StrictMode>);


mongoose.connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB connected"))
  .catch(err => console.error(err));