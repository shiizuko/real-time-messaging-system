"use client";
import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import io from 'socket.io-client';
import axios from 'axios';
import { jwtDecode } from 'jwt-decode';
import { useTyping } from './useTyping';

export function useChat() {

    const router = useRouter();
    const [isLoading, setIsLoading] = useState(true);
    const [currentUser, setCurrentUser] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const [isConnected, setIsConnected] = useState(false);
    const socketRef = useRef(null);
    const messagesEndRef = useRef(null);
    const [selectedContact, setSelectedContact] = useState(null);
    const selectedContactRef = useRef(selectedContact);

    useEffect(() => {
        selectedContactRef.current = selectedContact;
    }, [selectedContact]);

    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [messages]);

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) {
            router.push('/pages/login');
            return;
        }

        try {
            const decoded = jwtDecode(token);
            const userId = decoded.id;

            setCurrentUser({
                id: parseInt(userId),
                username: decoded.username,
            });
            setIsLoading(false);

            socketRef.current = io(process.env.NEXT_PUBLIC_WS_URL, {
                auth: {
                    token,
                    userId: userId
                },
                transports: ['websocket']
            });

            socketRef.current.on('connect', () => {
                console.log('Conectado com ID:', userId);
                setIsConnected(true);
            });

            socketRef.current.on('new_message', (message) => {
                if (
                    selectedContactRef.current &&
                    (message.sender_id === selectedContactRef.current.id ||
                        message.receiver_id === selectedContactRef.current.id)
                ) {
                    setMessages((prev) => [...prev, message]);
                }
            });
            socketRef.current.on('disconnect', () => {
                setIsConnected(false);
            });
        } catch (error) {
            console.error('Erro de autenticação:', error);
            router.push('/pages/login');
        }
        return () => {
            if (socketRef.current) {
                socketRef.current.disconnect();
            }
        };
    }, []);

    const {
        isTyping,
        typingUsers,
        handleTypingEvent
    } = useTyping(socketRef, selectedContact);


    useEffect(() => {
        if (selectedContact) {
            loadMessageHistory();
            console.log('load message history')
        } else {
            setMessages([]);
            console.log('no load')
        }
    }, [selectedContact]);

    const loadMessageHistory = async () => {
        if (!selectedContact) return;

        try {
            const response = await axios.get(
                `http://localhost:8000/api/messages/conversation/${selectedContact.id}`,
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setMessages(response.data.reverse());
        } catch (error) {
            console.error('Erro ao carregar histórico:', error);
            if (error.response?.status === 401) {
                router.push('/pages/login');
            }
        }
    };

    const sendMessage = async (e) => {
        e.preventDefault();
        if (!newMessage.trim() || !selectedContact) return;

        try {
            await axios.post(
                'http://localhost:8000/api/messages',
                {
                    content: newMessage,
                    receiverId: selectedContact.id
                },
                {
                    headers: {
                        Authorization: `Bearer ${localStorage.getItem('token')}`
                    }
                }
            );
            setNewMessage('');
        } catch (error) {
            console.error('Erro ao enviar mensagem:', error);
            if (error.response?.status === 401) {
                router.push('/pages/login');
            }
        }
    };

    return {
        isLoading,
        currentUser,
        messages,
        newMessage,
        setNewMessage,
        isConnected,
        messagesEndRef,
        selectedContact,
        setSelectedContact,
        sendMessage,
        isTyping,
        typingUsers,
        handleTypingEvent,
    };
}