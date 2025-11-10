import { useState, useEffect } from 'react';

// Define o breakpoint para "mobile" (Tailwind 'md' = 768px)
const MOBILE_BREAKPOINT = 768; 

export function useMobile() {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < MOBILE_BREAKPOINT);
    };

    // Verifica no carregamento inicial
    checkScreenSize();

    // Adiciona um 'listener' para redimensionamento da tela
    window.addEventListener('resize', checkScreenSize);

    // Limpa o 'listener' ao desmontar o componente
    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []); // Array de dependências vazio, executa apenas uma vez

  return isMobile;
}