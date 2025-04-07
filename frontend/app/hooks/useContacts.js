"use client";
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

export function useContacts() {
  const [contacts, setContacts] = useState([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  const loadContacts = async () => {
    try {
      setLoading(true);
      const response = await axios.get('http://localhost:8000/api/users/contacts', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      // Garantir que os dados estão no formato correto
      const formattedContacts = response.data.map(contact => ({
        ...contact,
        lastMessage: contact.last_message || '',
        lastMessageTime: contact.last_message_time || null
      }));
      
      setContacts(formattedContacts);
    } catch (error) {
      console.error('Erro ao carregar contatos:', error);
      if (error.response?.status === 401) {
        router.push('/pages/login');
      } else {
        alert('Erro ao carregar contatos. Tente novamente mais tarde.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadContacts();
  }, []);

  return {
    contacts,
    loading,
    loadContacts
  };
}
