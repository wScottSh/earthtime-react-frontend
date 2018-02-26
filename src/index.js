import React from 'react';
import ReactDOM from 'react-dom';
import './index.css';
import Face from './Face';
import registerServiceWorker from './registerServiceWorker';

ReactDOM.render(<Face />, document.getElementById('root'));
registerServiceWorker();
