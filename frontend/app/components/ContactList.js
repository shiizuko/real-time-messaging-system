"use client";
import { useContacts } from '@/app/hooks/useContacts';
import { getAvatarUrl } from '@/app/utils';

export default function ContactList({ onSelectContact, selectedContact }) {
  const { contacts, loading } = useContacts();

  return (
    <div className="h-full">
      <div className="overflow-y-auto h-[calc(100vh-120px)] overflow-x-hidden p-1">
        <img 
          src="/logo.png" 
          alt="Logo" 
          className="object-contain mb-12 mx-6 mt-2 w-15 h-15" 
        />
        {loading ? (
          <div className="p-4 text-center text-[#507DBC]">Carregando...</div>
        ) : (
          contacts.map(contact => (
            <div
              key={contact.id}
              onClick={() => onSelectContact(contact)}
              className={`p-4 cursor-pointer text-white hover:bg-[#507DBC]/10 transition-colors mb-4 rounded-md ml-2
                ${selectedContact?.id === contact.id ? 'bg-[#507DBC]/20' : ''}`}
            >
              <div className="flex items-center gap-4">
                <div className="flex-shrink-0 relative">
                  <img
                    src={getAvatarUrl(contact.username)}
                    height={48} 
                    width={48}
                    alt={contact.username}
                    className="w-12 h-12 rounded-full object-cover"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48';
                    }}
                    loading="lazy"
                  />
                  <div className="absolute inset-0 bg-black/20 rounded-full" aria-hidden="true"></div>
                </div>
                <div className="flex-1">
                  <div className="font-semibold">{contact.username}</div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}