import { useState, useEffect, useRef } from 'react';

export const useTyping = (socket, selectedContact) => {
  const [isTyping, setIsTyping] = useState(false);
  const [typingUsers, setTypingUsers] = useState({});
  const typingTimeout = useRef();

  useEffect(() => {
    if (!socket) return;

    const handleTyping = ({ userId, isTyping }) => {
      setTypingUsers(prev => ({
        ...prev,
        [userId]: isTyping
      }));
    };

    socket.on('user_typing', handleTyping);
    
    return () => {
      socket.off('user_typing', handleTyping);
    };
  }, [socket]);

  const handleTypingEvent = () => {
    if (!socket || !selectedContact) return;
  
    if (!isTyping) {
      socket.emit('typing', {
        receiverId: selectedContact.id,
        isTyping: true
      });
      setIsTyping(true);
    }
  
    if (typingTimeout.current) {
      clearTimeout(typingTimeout.current);
    }
  
    typingTimeout.current = setTimeout(() => {
      socket.emit('typing', {
        receiverId: selectedContact.id,
        isTyping: false
      });
      setIsTyping(false);
    }, 2000);
  };

  return {
    isTyping,
    typingUsers,
    handleTypingEvent
  };
};