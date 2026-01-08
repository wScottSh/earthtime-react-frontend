import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Clock from './components/Clock/Clock.jsx';

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        <Clock />
    </React.StrictMode>
);
