"use client"
import { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';

const AuthContext = createContext();

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

  const validateToken = async (token) => {
    try {
      const res = await axios.get(
        `${API_URL}/api/auth/validate`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (res.data.valid && res.data.user) {
        setUser(res.data.user);
      } else {
        localStorage.removeItem('token');
        setUser(null);
      }
    } catch (err) {
      localStorage.removeItem('token');
      setUser(null);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      validateToken(token);
    }
  }, []);

  const register = async (username, password) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/register`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setUser({ username });
        router.push('/pages/chat');
      }
    } catch (err) {
      setError(err.response?.data?.error || 'Erro no registro');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const login = async (username, password) => {
    setLoading(true);
    try {
      const res = await axios.post(
        `${API_URL}/api/auth/login`,
        { username, password },
        { headers: { 'Content-Type': 'application/json' } }
      );

      if (res.data.token) {
        localStorage.setItem('token', res.data.token);
        setUser({ username });
        router.push('/pages/chat');
      }
    } catch (err) {
      setError(err.response?.status === 401 
        ? 'Usuário ou senha incorretos!' 
        : 'Erro inesperado. Tente novamente.');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
    router.push('/pages/login');
  };

  return (
    <AuthContext.Provider 
      value={{ 
        user, 
        error, 
        loading, 
        register, 
        login, 
        logout 
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);