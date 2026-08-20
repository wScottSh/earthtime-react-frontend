import React from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import Clock from './components/Clock/Clock.jsx';
// PROTOTYPE — throwaway. Reachable only via ?variant= (see src/prototype/).
import ClockPrototype from './prototype/ClockPrototype.jsx';

const usePrototype = new URLSearchParams(window.location.search).has('variant');

const container = document.getElementById('root');
const root = createRoot(container);
root.render(
    <React.StrictMode>
        {usePrototype ? <ClockPrototype /> : <Clock />}
    </React.StrictMode>
);
