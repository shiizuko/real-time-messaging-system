import { useState, useEffect, useRef, useCallback } from 'react';

const areContactsEqual = (a, b) => 
  a?.id === b?.id && 
  a?.username === b?.username;

export const useTyping = (socketRef, selectedContact) => {
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeout = useRef();

  const handleTyping = useCallback(({ userId, isTyping }) => {
    setTypingUsers(prev => ({
      ...prev,
      [userId]: isTyping
    }));
  }, []);

  useEffect(() => {
    if (!socketRef?.current) return;

    const socket = socketRef.current;
    socket.on('user_typing', handleTyping);
    
    return () => {
      socket.off('user_typing', handleTyping);
    };
  }, [socketRef, handleTyping]);

  const handleTypingEvent = useCallback(() => {
    if (!socketRef?.current || !selectedContact) return;
    
    const socket = socketRef.current;
    socket.emit('typing', {
      receiverId: selectedContact.id,
      isTyping: true
    });
    
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
    
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', {
        receiverId: selectedContact.id,
        isTyping: false
      });
    }, 2000);
  }, [socketRef, selectedContact]);

  return {
    typingUsers,
    handleTypingEvent
  };
};