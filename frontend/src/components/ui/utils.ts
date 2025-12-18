import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// === NOVA FUNÇÃO: NORMALIZAR TEXTO ===
// Remove acentos, coloca em minúsculo e trata valores nulos
export const normalizeString = (str?: string | null): string => {
  if (!str) return "ZZ_INDEFINIDO"; // Joga para o final se vazio
  return str
    .toLowerCase()
    .normalize("NFD") // Separa acentos das letras
    .replace(/[\u0300-\u036f]/g, "") // Remove os acentos
    .trim();
};