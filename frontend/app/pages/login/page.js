"use client";
import { useAuth } from '@/app/context/AuthContext';
import { useState } from 'react';
import Image from 'next/image';
import logo from '../../../public/logo.png';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { login, error } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await login(username, password);
    } catch (err) {
      // Error => hook
    }
  };

  return (
    <div className="min-h-screen bg-[#F9F9F9] flex items-center justify-between">
        <div className="bg-black h-screen w-1/2 flex items-center justify-center">
          <Image 
            src={logo} 
            alt="Logo" 
            width={300}
            height={300}
            className="" 
          />
        </div>
        <form onSubmit={handleSubmit} className='flex flex-col space-y-6 justify-center items-start mx-auto'>
        <h1 className='text-5xl text-start -ml-24 text-[#507DBC] font-semibold mb-24'>Login</h1>
          <div className='flex gap-20'>
          <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} placeholder="@Username" required className='p-2 text-lg bg-transparent border-b border-b-2 border-b-black' />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Senha" required className='p-2 text-lg  bg-transparent border-b border-b-2 border-b-black' />
          </div>
          <button type="submit" className='cursor-pointer bg-black hover:bg-black/80 transition-all text-white rounded-full py-12 px-3 text-3xl uppercase fixed bottom-0 right-0 m-12'>Entrar</button>
        </form>

        <a 
            href="/pages/register" 
            className="mt-4 text-center text-gray-600 fixed top-10 right-10"
          >
          Ainda não tem uma conta?
        </a>
    </div>
  );
}
