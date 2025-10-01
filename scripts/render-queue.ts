import React from 'react';
import { renderToString } from 'react-dom/server';
import QueuePage from '../src/app/dashboard/queue/page';

const html = renderToString(React.createElement(QueuePage));
console.log('Rendered length:', html.length);
