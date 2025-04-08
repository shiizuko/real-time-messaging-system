'use client';

export const TypingIndicator = ({ typingUsers, selectedContact }) => {
  if (!selectedContact || !typingUsers[selectedContact.id]) return null;

  return (
    <div className="px-4 py-2">
      <p className="text-sm text-white typing-indicator">
        {selectedContact.username} está digitando...
      </p>
    </div>
  );
};