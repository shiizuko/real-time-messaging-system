// Funções de formatação de data e tempo

/**
 * Formata uma data para exibição amigável
 * @param {string|Date} date - Data a ser formatada
 * @returns {string} Data formatada (ex: "Hoje 11:54" ou "Ontem 11:54" ou "15 abr 11:54")
 */
export const formatDate = (date) => {
  const now = new Date();
  const messageDate = new Date(date);
  
  // Se for o mesmo dia
  if (now.getDate() === messageDate.getDate() &&
      now.getMonth() === messageDate.getMonth() &&
      now.getFullYear() === messageDate.getFullYear()) {
    return `Hoje ${messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Se for o dia anterior
  const yesterday = new Date(now);
  yesterday.setDate(yesterday.getDate() - 1);
  if (yesterday.getDate() === messageDate.getDate() &&
      yesterday.getMonth() === messageDate.getMonth() &&
      yesterday.getFullYear() === messageDate.getFullYear()) {
    return `Ontem ${messageDate.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`;
  }
  
  // Para outras datas
  return messageDate.toLocaleDateString('pt-BR', { 
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
};

/**
 * Formata um número para exibição com separador de milhar
 * @param {number} number - Número a ser formatado
 * @returns {string} Número formatado (ex: "1.000" ou "1.234.567")
 */
export const formatNumber = (number) => {
  return number.toLocaleString('pt-BR');
};

/**
 * Formata um texto longo para exibição curta
 * @param {string} text - Texto a ser formatado
 * @param {number} maxLength - Tamanho máximo do texto
 * @returns {string} Texto formatado com reticências se necessário
 */
export const formatText = (text, maxLength = 50) => {
  if (text.length <= maxLength) return text;
  return `${text.substring(0, maxLength)}...`;
};

// Função para gerar avatar com seed consistente
export function getAvatarUrl(username) {
  const hash = username.split('').reduce((acc, char) => {
    return acc + char.charCodeAt(0);
  }, 0);

  const gender = hash % 2 === 0 ? 'men' : 'women';

  const imageNum = (hash % 99) + 1;
  
  return `https://randomuser.me/api/portraits/med/${gender}/${imageNum}.jpg`;
}
