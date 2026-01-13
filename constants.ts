
import { PricingConfig } from './types';

export const APP_NAME = "Chalé Serra Crato";

// Regras de precificação
export const PRICING_RULES: PricingConfig = {
  basePrice: 400,
  baseGuests: 2, 
  extraPersonFee: 50,
  maxGuests: 8 // Aumentado para 8 conforme solicitado
};

export const IMAGES = {
  // Logo oficial fornecida pelo usuário
  LOGO: "https://hqjeczmrkthqrduhlyjk.supabase.co/storage/v1/object/public/Logo/screen.png", 
  
  // Imagens Reais do Chalé
  HERO: "https://hqjeczmrkthqrduhlyjk.supabase.co/storage/v1/object/public/Exterior/IMG-20260103-WA0001.jpg", 
  EXTERIOR: "https://hqjeczmrkthqrduhlyjk.supabase.co/storage/v1/object/public/Exterior/IMG-20260103-WA0010.jpg",
  
  // Áreas internas (Atualizadas com fotos reais fornecidas)
  INTERIOR: "https://hqjeczmrkthqrduhlyjk.supabase.co/storage/v1/object/public/Logo/SnapInsta.to_504431932_17935496751029367_5032260042723914933_n.jpg.jpg",
  KITCHEN: "https://hqjeczmrkthqrduhlyjk.supabase.co/storage/v1/object/public/Interior/IMG-20260103-WA0009.jpg",
  BEDROOM: "https://hqjeczmrkthqrduhlyjk.supabase.co/storage/v1/object/public/Interior/IMG-20260103-WA0011.jpg"
};

export const AMENITIES = [
  { name: "Wi-Fi Gratuito", icon: "Wifi" },
  { name: "Estacionamento", icon: "Car" },
  { name: "Cozinha Completa", icon: "Utensils" },
  { name: "Churrasqueira", icon: "Flame" },
  { name: "Aceita Pets", icon: "Dog" },
  { name: "Vista para Serra", icon: "Mountain" }
];
