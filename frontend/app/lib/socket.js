let socket = null;

export const connectSocket = (token, retries = 0) => {
  const nextRetry = Math.min(30, Math.pow(2, retries));
  
  if (socket?.connected) return socket;

  socket = io(process.env.NEXT_PUBLIC_WS_URL, {
    auth: { token },
    reconnectionAttempts: 5,
    timeout: 5000,
  });

  socket.on('connect_error', (err) => {
    setTimeout(() => connectSocket(token, retries + 1), nextRetry * 1000);
  });

  return socket;
};