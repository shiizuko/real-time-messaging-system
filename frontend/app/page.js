"use client"
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function Home() {
  const [showWelcome, setShowWelcome] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => {
        setShowWelcome(false);
      }, 300); 
    }, 3000);

    return () => clearTimeout(timer);
  }, []);


  return (
    <>
    {showWelcome && (
      <div className={`fixed inset-0 z-50 flex items-center justify-center transition-opacity duration-300 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}>
        <video
          autoPlay
          muted
          loop
          className="absolute inset-0 w-full h-full object-cover"
        >
          <source src="/words.mp4" type="video/mp4" />
        </video>
        <div className="absolute inset-0 bg-black/50 backdrop-blur-sm"></div>
        <h1 className="text-white text-6xl font-bold z-10 tracking-wider">CHAT</h1>
      </div>
    )}
    <div className="min-h-screen bg-black flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md p-8 space-y-12">
        <h1 className="text-3xl font-bold text-center text-white mb-2">Sistema de Mensagens</h1>
        <p className="text-gray-600 text-center mb-8">Case Ager</p>
        
        <div className="space-y-4 flex">
          <Link 
            href="/pages/login" 
            className="block w-full  hover:underline text-white font-medium py-3 px-4 rounded-lg text-center transition duration-200"
          >
            Entrar
          </Link>
          <Link 
            href="/pages/register" 
            className="block w-full  hover:underline text-white font-medium py-3 px-4 rounded-lg text-center transition duration-200"
          >
            Criar conta
          </Link>
        </div>
      </div>
    </div>
    </>
  );
}
