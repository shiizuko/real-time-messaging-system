'use client';

export const TypingIndicator = ({ isTyping, username }) => {
  if (!isTyping) return null;

  return (
    <div className="px-4 py-2">
      <p className="text-sm text-white typing-indicator">
        {username} está digitando...
      </p>
    </div>
  );
};