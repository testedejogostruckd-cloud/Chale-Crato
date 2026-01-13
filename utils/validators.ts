
import { PRICING_RULES } from '../constants';

export const Validators = {
  email: (email: string): boolean => {
    // Regex robusto para e-mail (RFC 5322 compliant simplificado)
    const re = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return re.test(email);
  },

  /**
   * Valida força da senha.
   * Requisitos: Mínimo 8 caracteres, 1 maiúscula, 1 minúscula, 1 número.
   */
  password: (password: string): boolean => {
    if (password.length < 8) return false;
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    return hasUpperCase && hasLowerCase && hasNumber;
  },

  name: (name: string): boolean => {
    // Mínimo 2 caracteres, sem espaços vazios apenas
    return name.trim().length >= 2 && name.length <= 100;
  },

  guests: (count: number): boolean => {
    return Number.isInteger(count) && count >= 1 && count <= PRICING_RULES.maxGuests;
  },

  pets: (count: number): boolean => {
    // Limite arbitrário de segurança (ex: max 5 pets)
    return Number.isInteger(count) && count >= 0 && count <= 5;
  },

  description: (text: string): boolean => {
    return text.length <= 200; // Limite para descrições de galeria
  }
};
