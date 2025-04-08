"use client";
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import Image from 'next/image';
import sentIcon from '../../../public/sent.png';
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import ContactList from '../../components/ContactList';
import { useChat } from '../../hooks/useChat';
import { TypingIndicator } from '@/app/components/TypingIndicator';
import { useAuth } from '@/app/context/AuthContext';
import { formatDate, getAvatarUrl } from '@/app/utils';

export default function Chat() {
  const router = useRouter();
  const {
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
    typingUsers,
    handleTypingEvent
  } = useChat();
  const { logout } = useAuth();

  const [showWelcome, setShowWelcome] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true);
    }, 500);
    const hideTimer = setTimeout(() => {
      setShowWelcome(false);
    }, 800);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(hideTimer);
    };
  }, []);

  if (isLoading) return <div>Carregando...</div>;

  return (
    <>
      {showWelcome && (
        <div className="welcome">
          <h1 className={`${fadeOut ? 'fade' : ''} text-5xl text-[#507DBC] font-semibold mb-32`}>
            Oi, {currentUser?.username || 'Visitante'}!
          </h1>
        </div>
      )}
      <ResizablePanelGroup
        direction="horizontal"
        className="h-screen w-screen bg-[#F9F9F9]"
      >
        <ResizablePanel defaultSize={25} className="bg-black h-screen">
          <ContactList
            onSelectContact={setSelectedContact}
            selectedContact={selectedContact}
          />
        </ResizablePanel>

        <ResizableHandle />

        <ResizablePanel defaultSize={75} className="flex flex-col bg-black h-screen">
          <header className="p-4 border-b border-gray-700">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-4">
                {selectedContact && (
                  <>
                    <img
                      src={getAvatarUrl(selectedContact.username)}
                      alt={selectedContact.username}
                      className="w-10 h-10 rounded-full object-cover"
                      onError={(e) => {
                        e.currentTarget.src = 'https://via.placeholder.com/40';
                      }}
                    />
                    <h1 className="text-xl font-semibold text-white">
                      {selectedContact.username}
                    </h1>
                  </>
                )}
              </div>
              <div className="flex items-center gap-4">
                <div className={`w-3 h-3 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <div className="flex items-center gap-2 cursor-pointer">
                      <img
                        src={getAvatarUrl(currentUser.username)}
                        alt="Perfil"
                        className="w-6 h-6 rounded-full object-cover"
                        onError={(e) => {
                          e.currentTarget.src = 'https://via.placeholder.com/24';
                        }}
                      />
                      <span className="text-white">Perfil</span>
                    </div>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56">
                    <DropdownMenuItem
                    className='cursor-pointer'
                     onClick={() => {
                      localStorage.removeItem('token');
                      logout();
                      router.push('/pages/login');
                    }}>
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>

          {selectedContact ? (
            <>
              <div className="flex-1 overflow-y-auto p-4 space-y-4">
                {messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.sender_id === currentUser.id 
                        ? 'justify-end' 
                        : 'justify-start'
                    }`}
                  >
                   <div className={`max-w-[70%] rounded-lg p-3 shadow-md ${
                      msg.sender_id === currentUser.id 
                        ? 'bg-[#507DBC]/20 text-white border border-[#507DBC]/50' 
                        : 'bg-gray-800/20 text-white border border-gray-800/50'
                    } animate-fadeIn`}
                    >
                      <p className="text-sm">{msg.content}</p>
                      <div className="mt-1 text-xs opacity-70">
                        {formatDate(msg.created_at)}
                      </div>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>
              {selectedContact && (
                <TypingIndicator
                  typingUsers={typingUsers}
                  selectedContact={selectedContact}
                />
              )}
              <form onSubmit={sendMessage} className="p-2 bg-[#DAE3E5]/50 mx-12 mb-6 rounded-md">

                <div className="flex items-center gap-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => {
                      setNewMessage(e.target.value);
                      handleTypingEvent();
                    }}
                    placeholder="Digite sua mensagem..."
                    className="flex-1 p-1 bg-transparent outline-none"
                  />
                  <button
                    type="submit"
                    disabled={!newMessage.trim()}
                    className="cursor-pointer p-2 hover:opacity-80"
                  >
                    <Image
                      src={sentIcon}
                      alt="Enviar"
                      width={24}
                      height={24}
                    />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-gray-500">
              Selecione um contato para iniciar uma conversa.
            </div>
          )}
        </ResizablePanel>
      </ResizablePanelGroup>
    </>
  );
}
