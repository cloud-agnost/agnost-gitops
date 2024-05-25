import { io } from 'socket.io-client';

const url = `${window.location.origin.replace(':4000', '')}`;

export const socket = io(url, {
	reconnection: true,
	reconnectionDelay: 500,
	transports: ['websocket', 'polling'],
	path: '/sync/sync/',
});

socket.on('connect', () => {
	console.log('Connected to socket.io server');
});

socket.on('connect_error', (error) => {
	console.error('Not Connected to socket.io server', error);
});
