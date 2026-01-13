
export enum UserRole {
  GUEST = 'guest',
  ADMIN = 'admin'
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  password?: string; // In a real app, this would be hashed and not returned to frontend
}

export interface UserProfile {
  id: string; // Links to auth.users.id
  name: string;
  email: string;
  role: UserRole;
  created_at: string;
}

export enum ReservationStatus {
  PENDING = 'Pendente',
  CONFIRMED = 'Confirmada',
  CANCELLED = 'Cancelada',
  COMPLETED = 'Concluída'
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  checkIn: string; // ISO Date String
  checkOut: string; // ISO Date String
  guests: number;
  pets: number; // Quantidade de animais de estimação
  totalPrice: number;
  status: ReservationStatus;
  paymentMethod?: string; // Forma de pagamento selecionada
  createdAt: string;
}

export interface DateRange {
  startDate: Date | null;
  endDate: Date | null;
}

export interface PricingConfig {
  basePrice: number; // R$ 400
  baseGuests: number; // Covers up to this many people (e.g., 2)
  extraPersonFee: number; // R$ 50
  maxGuests: number; // 8
}

export type GalleryCategory = 'exterior' | 'interior';
export type MediaType = 'image' | 'video';

export interface GalleryItem {
  id: string;
  type: MediaType;
  url: string; // Storage URL or External Video Link
  category: GalleryCategory;
  createdAt: string;
  description?: string;
  displayOrder: number;
}
