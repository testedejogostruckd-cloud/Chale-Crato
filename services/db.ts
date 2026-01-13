
import { User, Reservation, UserRole, ReservationStatus, GalleryItem, UserProfile } from '../types';
import { supabase } from './supabaseClient';
import { Sanitizer } from '../utils/sanitizer';
import { Logger } from './logger';

class SupabaseDatabaseService {
  
  private handleError(error: any, contextMessage: string) {
    // Log seguro do erro (Interno)
    Logger.error(`DB Error: ${contextMessage}`, error);
    
    // Tratamento de recursão infinita (RLS)
    if (error?.code === '42P17') {
        throw new Error('Erro de Configuração do Banco. Contate o administrador.');
    }

    // Tratamento genérico para erros de coluna/schema sem expor SQL ao cliente
    if (error?.code === 'PGRST204' || (error?.message && error.message.includes('payment_method'))) {
        throw new Error('O sistema encontrou uma inconsistência nos dados de pagamento. Por favor, tente novamente mais tarde.');
    }

    let message = 'Erro no banco de dados';
    if (typeof error === 'string') message = error;
    else if (error?.message) message = error.message;

    throw new Error(message);
  }

  // --- Auth & User Management ---

  async login(email: string, password: string): Promise<User> {
    Logger.info(`Tentativa de login: ${email}`);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    
    if (error) {
        Logger.warn(`Falha no login: ${email}`, { reason: error.message });
        this.handleError(error, 'Login Failed');
    }
    
    if (!data.user) throw new Error('Usuário não encontrado');
    
    const user = this.mapSupabaseUser(data.user);
    Logger.info(`Login com sucesso: ${email}`, { userId: user.id, role: user.role });
    return user;
  }

  async createUser(user: Omit<User, 'id'>): Promise<User> {
    // XSS PROTECTION: Sanitize input before creation
    const cleanName = Sanitizer.cleanText(user.name);
    const cleanEmail = user.email.trim(); 

    Logger.info(`Tentativa de registro de usuário: ${cleanEmail}`);

    const { data, error } = await supabase.auth.signUp({
      email: cleanEmail,
      password: user.password,
      options: { data: { name: cleanName, role: user.role } }
    });

    if (error) this.handleError(error, 'User Creation Failed');
    if (!data.user) throw new Error('Erro ao criar usuário');
    
    await supabase.from('profiles').insert({
        id: data.user.id,
        name: cleanName,
        email: cleanEmail,
        role: user.role
    });

    Logger.info(`Usuário criado com sucesso`, { userId: data.user.id, email: cleanEmail });
    return this.mapSupabaseUser(data.user);
  }

  async logout(): Promise<void> {
    const user = await this.getCurrentUser();
    Logger.info(`Logout iniciado`, { userId: user?.id });
    await supabase.auth.signOut();
  }

  async resetPassword(email: string): Promise<void> {
    const cleanEmail = email.trim();
    Logger.info(`Solicitação de redefinição de senha: ${cleanEmail}`);
    
    // O redirecionamento aponta para a home, onde o supabase lida com o token na URL
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
        redirectTo: window.location.origin,
    });

    if (error) {
        Logger.warn('Erro ao solicitar redefinição de senha', error);
        this.handleError(error, 'Password Reset Failed');
    }
  }

  async getCurrentUser(): Promise<User | null> {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user) return null;
    return this.mapSupabaseUser(session.user);
  }

  // SECURITY: Ensure only Admins can list all profiles
  async getAllProfiles(): Promise<UserProfile[]> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) {
        Logger.warn('Acesso negado: getAllProfiles tentado por não-admin', { userId: currentUser?.id });
        throw new Error("Acesso Negado: Apenas administradores podem ver a lista de usuários.");
    }

    const { data, error } = await supabase.from('profiles').select('*').order('name');
    if (error) return [];
    return (data || []).map((p: any) => ({
        id: p.id,
        name: p.name, 
        email: p.email,
        role: p.role,
        created_at: p.created_at
    }));
  }

  private mapSupabaseUser(u: any): User {
    return {
      id: u.id,
      email: u.email,
      name: u.user_metadata?.name || 'Usuário',
      role: u.user_metadata?.role || UserRole.GUEST
    };
  }

  // --- Site Config ---

  async getSiteConfig(key: string): Promise<string | null> {
    const { data, error } = await supabase.from('site_config').select('value').eq('key', key).maybeSingle();
    if (error) return null;
    return data?.value || null;
  }

  async updateSiteConfig(key: string, value: string): Promise<void> {
    // SECURITY CHECK
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) {
        throw new Error("Permissão negada para alterar configurações.");
    }

    // XSS PROTECTION
    const cleanValue = key.includes('url') ? Sanitizer.safeUrl(value) : Sanitizer.cleanText(value);

    Logger.info('Atualizando configuração do site', { key, updatedBy: currentUser.id });
    const { error } = await supabase.from('site_config').upsert({ key, value: cleanValue, updated_at: new Date().toISOString() });
    if (error) this.handleError(error, 'Update Config Failed');
  }

  // --- Gallery ---

  async getGalleryItems(): Promise<GalleryItem[]> {
    const { data, error } = await supabase.from('gallery').select('*').order('display_order', { ascending: true });
    if (error) {
        Logger.error('Erro ao buscar galeria', error);
        return [];
    }
    return (data || []).map((item: any) => ({
        id: item.id,
        type: item.type,
        url: item.url, 
        category: item.category,
        createdAt: item.created_at,
        description: item.description,
        displayOrder: item.display_order || 0
    }));
  }

  async updateGalleryItem(id: string, updates: Partial<GalleryItem>): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) {
        throw new Error("Apenas administradores podem gerenciar a galeria.");
    }

    const dbUpdates: any = {};
    if (updates.category) dbUpdates.category = updates.category;
    if (updates.description !== undefined) dbUpdates.description = Sanitizer.cleanText(updates.description);
    if (updates.displayOrder !== undefined) dbUpdates.display_order = updates.displayOrder;
    
    Logger.info('Atualizando item da galeria', { id, updates, updatedBy: currentUser.id });

    const { error } = await supabase.from('gallery').update(dbUpdates).eq('id', id);
    if (error) this.handleError(error, 'Gallery Update Failed');
  }

  async updateGalleryOrders(items: { id: string, displayOrder: number }[]): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) throw new Error("Acesso negado.");

    Logger.info('Reordenando galeria', { count: items.length, updatedBy: currentUser.id });
    const updates = items.map(item => supabase.from('gallery').update({ display_order: item.displayOrder }).eq('id', item.id));
    await Promise.all(updates);
  }

  async deleteGalleryItem(id: string, url: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) throw new Error("Acesso negado.");

    Logger.info('Excluindo item da galeria', { id, url, deletedBy: currentUser.id });
    const { error } = await supabase.from('gallery').delete().eq('id', id);
    if (error) this.handleError(error, 'Gallery Delete Failed');
  }

  // --- Reservations ---

  async getReservations(): Promise<Reservation[]> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) {
        throw new Error("Acesso Negado: Apenas administradores podem ver todas as reservas.");
    }

    const { data, error } = await supabase.from('reservations').select('*');
    if (error) this.handleError(error, 'Get Reservations Failed');
    return (data || []).map(this.mapReservationFromDB);
  }

  async getUserReservations(userId: string): Promise<Reservation[]> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Usuário não autenticado.");
    
    if (currentUser.role !== UserRole.ADMIN && currentUser.id !== userId) {
        Logger.warn('Tentativa de acesso não autorizado a reservas de outro usuário', { requester: currentUser.id, target: userId });
        throw new Error("Você não tem permissão para ver as reservas de outro usuário.");
    }

    const { data, error } = await supabase.from('reservations').select('*').eq('user_id', userId);
    if (error) this.handleError(error, 'Get User Reservations Failed');
    return (data || []).map(this.mapReservationFromDB);
  }

  async checkAvailability(start: Date, end: Date, excludeId?: string): Promise<boolean> {
    if (!(start instanceof Date) || isNaN(start.getTime()) || !(end instanceof Date) || isNaN(end.getTime())) {
        throw new Error("Datas inválidas fornecidas para verificação.");
    }

    const startStr = start.toISOString();
    const endStr = end.toISOString();

    let query = supabase.from('reservations').select('id').neq('status', ReservationStatus.CANCELLED).or(`and(check_in.lt.${endStr},check_out.gt.${startStr})`);
    
    if (excludeId) query = query.neq('id', excludeId);
    
    const { data, error } = await query;
    if (error) this.handleError(error, 'Check Availability Failed');
    return data ? data.length === 0 : true;
  }

  async createReservation(res: Omit<Reservation, 'id' | 'createdAt' | 'status'> & { status?: ReservationStatus }): Promise<Reservation> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Você precisa estar logado para reservar.");

    const safeUserId = currentUser.id;
    const safeUserName = currentUser.name; 

    Logger.info('Iniciando criação de reserva', { userId: safeUserId, checkIn: res.checkIn, checkOut: res.checkOut });

    const isAvailable = await this.checkAvailability(new Date(res.checkIn), new Date(res.checkOut));
    if (!isAvailable) {
        Logger.warn('Tentativa de reserva em data ocupada', { userId: safeUserId, dates: { in: res.checkIn, out: res.checkOut } });
        throw new Error("Desculpe, estas datas já estão ocupadas.");
    }

    const { data, error } = await supabase.from('reservations').insert({
        user_id: safeUserId,
        user_name: safeUserName,
        check_in: res.checkIn,
        check_out: res.checkOut,
        guests: res.guests,
        pets: res.pets,
        total_price: res.totalPrice,
        status: res.status || ReservationStatus.PENDING,
        payment_method: res.paymentMethod
    }).select().single();

    if (error) this.handleError(error, 'Create Reservation Failed');
    
    Logger.info('Reserva criada com sucesso', { reservationId: data.id, userId: safeUserId });
    return this.mapReservationFromDB(data);
  }

  async updateReservation(id: string, updates: Partial<Reservation>): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (!currentUser) throw new Error("Não autenticado.");

    const isAdmin = currentUser.role === UserRole.ADMIN;

    Logger.info('Atualizando reserva', { reservationId: id, updatedBy: currentUser.id, updates });

    if (updates.checkIn && updates.checkOut) {
        const isAvailable = await this.checkAvailability(new Date(updates.checkIn), new Date(updates.checkOut), id);
        if (!isAvailable) throw new Error("Datas ocupadas.");
    }
    
    const dbUpdates: any = {};
    if (updates.checkIn) dbUpdates.check_in = updates.checkIn;
    if (updates.checkOut) dbUpdates.check_out = updates.checkOut;
    if (updates.guests !== undefined) dbUpdates.guests = updates.guests;
    if (updates.pets !== undefined) dbUpdates.pets = updates.pets;
    if (updates.totalPrice !== undefined) dbUpdates.total_price = updates.totalPrice;
    if (updates.paymentMethod) dbUpdates.payment_method = updates.paymentMethod;

    if (updates.status) {
        if (isAdmin) {
            dbUpdates.status = updates.status;
        } else if (updates.status === ReservationStatus.CANCELLED) {
            dbUpdates.status = updates.status;
        } else {
            Logger.warn('Tentativa ilegal de alteração de status', { userId: currentUser.id, reservationId: id });
        }
    }

    let query = supabase.from('reservations').update(dbUpdates).eq('id', id);

    if (!isAdmin) {
        query = query.eq('user_id', currentUser.id);
    }

    const { error } = await query.select(); 
    
    if (error) this.handleError(error, 'Update Reservation Failed');
  }

  async deleteReservation(id: string): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) {
        throw new Error("Apenas administradores podem excluir reservas. Usuários devem Cancelar.");
    }

    // BACKUP/SAFETY CHECK:
    // Antes de excluir, verificamos se é uma reserva "Passada" que foi concluída.
    // Reservas históricas não devem ser apagadas (Hard Delete) para manter integridade financeira.
    const { data: resToDelete } = await supabase.from('reservations').select('*').eq('id', id).single();
    if (resToDelete) {
        const checkOutDate = new Date(resToDelete.check_out);
        const today = new Date();
        if (checkOutDate < today && resToDelete.status !== ReservationStatus.CANCELLED) {
            Logger.warn('Tentativa de excluir reserva histórica bloqueada', { id, userId: currentUser.id });
            throw new Error("SEGURANÇA: Não é permitido excluir permanentemente reservas históricas concluídas. Altere o status para Cancelada se necessário.");
        }
    }

    Logger.info('Excluindo reserva (Hard Delete)', { reservationId: id, deletedBy: currentUser.id });

    const { error, count } = await supabase
        .from('reservations')
        .delete({ count: 'exact' })
        .eq('id', id);
        
    if (error) this.handleError(error, 'Delete Reservation Failed');
    if (count === 0) {
        throw new Error("Registro não encontrado.");
    }
  }

  async updateReservationStatus(id: string, status: ReservationStatus): Promise<void> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) {
        throw new Error("Permissão negada.");
    }
    Logger.info('Atualizando status da reserva', { reservationId: id, newStatus: status, updatedBy: currentUser.id });
    const { error } = await supabase.from('reservations').update({ status }).eq('id', id);
    if (error) this.handleError(error, 'Update Status Failed');
  }

  // --- BACKUP & EXPORT ---
  
  async getFullBackupData(): Promise<{ reservations: Reservation[], profiles: UserProfile[], gallery: GalleryItem[] }> {
    const currentUser = await this.getCurrentUser();
    if (currentUser?.role !== UserRole.ADMIN) {
        throw new Error("Permissão negada. Apenas administradores podem gerar backups.");
    }

    Logger.info('Gerando backup completo dos dados', { requestedBy: currentUser.id });

    const [resData, profData, galleryData] = await Promise.all([
        supabase.from('reservations').select('*'),
        supabase.from('profiles').select('*'),
        supabase.from('gallery').select('*')
    ]);

    return {
        reservations: (resData.data || []).map(this.mapReservationFromDB),
        profiles: (profData.data || []).map((p: any) => ({
            id: p.id,
            name: p.name,
            email: p.email,
            role: p.role,
            created_at: p.created_at
        })),
        gallery: (galleryData.data || []).map((item: any) => ({
            id: item.id,
            type: item.type,
            url: item.url,
            category: item.category,
            createdAt: item.created_at,
            description: item.description,
            displayOrder: item.display_order
        }))
    };
  }

  private mapReservationFromDB(r: any): Reservation {
    return {
      id: r.id,
      userId: r.user_id,
      userName: r.user_name || 'Hóspede',
      checkIn: r.check_in,
      checkOut: r.check_out,
      guests: r.guests,
      pets: r.pets || 0,
      totalPrice: r.total_price,
      status: r.status,
      paymentMethod: r.payment_method,
      createdAt: r.created_at
    };
  }
}

export const db = new SupabaseDatabaseService();
