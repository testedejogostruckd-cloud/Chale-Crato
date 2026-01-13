
import React, { useEffect, useState } from 'react';
import { useAuth } from '../services/auth';
import { db } from '../services/db';
import { Reservation, ReservationStatus, DateRange } from '../types';
import { PRICING_RULES } from '../constants';
import { Validators } from '../utils/validators';
import { Calendar, Users, Dog, Pencil, MessageCircle, X, Save, Calendar as CalendarIcon, Loader2, CreditCard, ChevronRight, User as UserIcon } from 'lucide-react';
import { DateRangePicker } from '../components/DateRangePicker';

export const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const [reservations, setReservations] = useState<Reservation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // UI State
  const [selectedRes, setSelectedRes] = useState<Reservation | null>(null);
  const [editingRes, setEditingRes] = useState<Reservation | null>(null);
  const [editDateRange, setEditDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [calculatedPrice, setCalculatedPrice] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    loadReservations();
  }, [user]);

  const loadReservations = () => {
    if (user) {
      setIsLoading(true);
      db.getUserReservations(user.id)
        .then(data => {
          setReservations(data);
          setIsLoading(false);
        })
        .catch(err => {
          console.error("Failed to fetch reservations", err);
          setIsLoading(false);
        });
    }
  };

  // --- Actions ---

  const handleWhatsApp = (res: Reservation) => {
    const startDateFormatted = new Date(res.checkIn).toLocaleDateString('pt-BR');
    const endDateFormatted = new Date(res.checkOut).toLocaleDateString('pt-BR');
    
    const message = `🌿 Olá! Estou confirmando os detalhes da minha reserva no Chalé Serra Crato.

🧑‍💼 Hóspede: ${res.userName}
📅 Check-in: ${startDateFormatted} às 18:00
📅 Check-out: ${endDateFormatted} até 15:00
👥 Hóspedes: ${res.guests}
🐾 Pets: ${res.pets}
💰 Forma de Pagamento: ${res.paymentMethod || 'Não selecionada'}
📊 Status: ${res.status}

☑️ Li e aceito todas as regras do Chalé Serra Crato.
Muito obrigado!`;

    const whatsappUrl = `https://wa.me/5585999611900?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  // --- Edit Logic ---

  const startEdit = (res: Reservation) => {
    setEditingRes({ ...res });
    setEditDateRange({
        startDate: new Date(res.checkIn),
        endDate: new Date(res.checkOut)
    });
    setCalculatedPrice(res.totalPrice);
    setIsDatePickerOpen(false);
    setSelectedRes(null); // Fecha o painel de detalhes para editar
  };

  const cancelEdit = () => {
    setEditingRes(null);
    setEditDateRange({ startDate: null, endDate: null });
  };

  useEffect(() => {
    if (editingRes && editDateRange.startDate && editDateRange.endDate) {
        const start = new Date(editDateRange.startDate);
        const end = new Date(editDateRange.endDate);
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        if (nights > 0) {
            const baseTotal = nights * PRICING_RULES.basePrice;
            let extraGuests = 0;
            if (editingRes.guests > PRICING_RULES.baseGuests) {
                extraGuests = editingRes.guests - PRICING_RULES.baseGuests;
            }
            const extraTotal = extraGuests * PRICING_RULES.extraPersonFee * nights;
            setCalculatedPrice(baseTotal + extraTotal);
        }
    }
  }, [editingRes?.guests, editDateRange]);

  const handleSaveEdit = async () => {
    if (!editingRes || !editDateRange.startDate || !editDateRange.endDate) return;
    
    // Validation
    if (!Validators.guests(editingRes.guests)) {
        alert("Número de hóspedes inválido.");
        return;
    }
    if (!Validators.pets(editingRes.pets)) {
        alert("Número de pets inválido.");
        return;
    }

    setIsSaving(true);
    try {
        await db.updateReservation(editingRes.id, {
            checkIn: editDateRange.startDate.toISOString(),
            checkOut: editDateRange.endDate.toISOString(),
            guests: editingRes.guests,
            pets: editingRes.pets,
            totalPrice: calculatedPrice,
            paymentMethod: editingRes.paymentMethod
        });
        
        setReservations(prev => prev.map(r => r.id === editingRes.id ? {
            ...editingRes,
            checkIn: editDateRange.startDate!.toISOString(),
            checkOut: editDateRange.endDate!.toISOString(),
            totalPrice: calculatedPrice
        } : r));

        setEditingRes(null);
        alert("Alterações salvas no banco de dados com sucesso!");
    } catch (err: any) {
        alert("Erro ao salvar: " + (err.message || "Tente novamente."));
    } finally {
        setIsSaving(false);
    }
  };
  
  if (!user || isLoading) return <div className="p-12 text-center text-chalet-green"><Loader2 className="animate-spin inline mr-2"/> Carregando seu dashboard...</div>;

  const sortedReservations = [...reservations].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

  const getStatusColor = (status: ReservationStatus) => {
    switch(status) {
      case ReservationStatus.CONFIRMED: return 'bg-green-500';
      case ReservationStatus.PENDING: return 'bg-yellow-400';
      case ReservationStatus.CANCELLED: return 'bg-red-400';
      case ReservationStatus.COMPLETED: return 'bg-blue-500';
      default: return 'bg-gray-400';
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-12 relative">
      <div className="mb-8">
          <h1 className="font-serif text-3xl text-chalet-green">Minhas Reservas</h1>
          <p className="text-gray-500 text-sm">Gerencie suas estadias clicando na reserva desejada.</p>
      </div>

      {reservations.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl shadow-sm border border-gray-100">
          <Calendar className="text-gray-200 mx-auto mb-4" size={64} />
          <h2 className="text-xl text-gray-700 font-serif">Você ainda não possui reservas registradas.</h2>
          <p className="text-gray-400 mt-2">Suas futuras viagens aparecerão aqui.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedReservations.map(res => (
            <div 
              key={res.id} 
              onClick={() => setSelectedRes(res)}
              className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden flex items-center group cursor-pointer hover:shadow-md transition-all active:scale-[0.99] border-l-4"
              style={{ borderLeftColor: getStatusColor(res.status).replace('bg-', '') }}
            >
                <div className="p-5 flex-grow grid grid-cols-2 md:grid-cols-4 gap-4 items-center">
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Período</span>
                        <p className="font-serif text-chalet-green text-sm md:text-base">
                            {new Date(res.checkIn).toLocaleDateString()} - {new Date(res.checkOut).toLocaleDateString()}
                        </p>
                    </div>
                    <div className="hidden md:block">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Hóspedes</span>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                            <Users size={14} /> {res.guests} {res.guests === 1 ? 'Pessoa' : 'Pessoas'}
                        </div>
                    </div>
                    <div>
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Status</span>
                        <div className="flex items-center gap-1.5 mt-0.5">
                            <span className={`w-2 h-2 rounded-full ${getStatusColor(res.status)}`}></span>
                            <span className="text-xs font-bold text-gray-700">{res.status}</span>
                        </div>
                    </div>
                    <div className="flex justify-end items-center gap-2">
                        <span className="text-chalet-green font-bold text-xs uppercase tracking-widest hidden sm:inline">Detalhes</span>
                        <ChevronRight className="text-gray-300 group-hover:text-chalet-gold group-hover:translate-x-1 transition-all" size={20} />
                    </div>
                </div>
            </div>
          ))}
        </div>
      )}

      {/* --- PANEL DE DETALHES --- */}
      {selectedRes && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center bg-chalet-green/90 backdrop-blur-md p-4 animate-fade-in" onClick={() => setSelectedRes(null)}>
            <div className="bg-white w-full max-w-lg rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-slide-up" onClick={e => e.stopPropagation()}>
                
                {/* Header do Painel */}
                <div className={`p-8 text-white flex justify-between items-start ${getStatusColor(selectedRes.status)}`}>
                    <div>
                        <h2 className="font-serif text-3xl">Detalhes da Reserva</h2>
                        <p className="text-white/80 text-sm mt-1 uppercase tracking-widest font-bold">Reserva #{selectedRes.id.slice(0,8).toUpperCase()}</p>
                    </div>
                    <button onClick={() => setSelectedRes(null)} className="bg-white/20 p-2 rounded-full hover:bg-white/30 transition shadow-inner">
                        <X size={24} />
                    </button>
                </div>

                {/* Conteúdo das Informações */}
                <div className="p-8 overflow-y-auto space-y-8">
                    {/* Nome do Hóspede */}
                    <div className="flex items-center gap-4 p-4 bg-gray-50 rounded-2xl border border-gray-100">
                        <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm text-chalet-green">
                            <UserIcon size={24} />
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block">Hóspede Principal</span>
                            <p className="text-lg font-bold text-gray-800">{selectedRes.userName}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-8">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Check-in</span>
                            <div className="flex items-start gap-3">
                                <CalendarIcon className="text-chalet-green mt-1" size={20} />
                                <div>
                                    <p className="font-bold text-gray-800">{new Date(selectedRes.checkIn).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-xs text-chalet-green font-bold uppercase">18:00 hrs</p>
                                </div>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Check-out</span>
                            <div className="flex items-start gap-3">
                                <CalendarIcon className="text-chalet-green mt-1" size={20} />
                                <div>
                                    <p className="font-bold text-gray-800">{new Date(selectedRes.checkOut).toLocaleDateString('pt-BR')}</p>
                                    <p className="text-xs text-chalet-green font-bold uppercase">15:00 hrs</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8 grid grid-cols-2 gap-8">
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Hóspedes</span>
                            <div className="flex items-center gap-3 text-gray-700">
                                <Users size={20} className="text-chalet-green" />
                                <span className="font-bold">{selectedRes.guests} Pessoas</span>
                            </div>
                        </div>
                        <div>
                            <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Animais</span>
                            <div className="flex items-center gap-3 text-gray-700">
                                <Dog size={20} className="text-chalet-gold" />
                                <span className="font-bold">{selectedRes.pets} Pets</span>
                            </div>
                        </div>
                    </div>

                    <div className="border-t border-gray-100 pt-8">
                        <span className="text-[10px] text-gray-400 uppercase font-bold tracking-widest block mb-2">Forma de Pagamento</span>
                        <div className="flex items-center gap-3 text-gray-700">
                            <CreditCard size={20} className="text-chalet-green" />
                            <span className="font-bold">{selectedRes.paymentMethod || 'Informação Indisponível'}</span>
                        </div>
                    </div>

                    <div className="bg-chalet-beige/20 p-6 rounded-2xl flex justify-between items-center border border-chalet-beige">
                        <span className="font-bold text-gray-600">Investimento Total</span>
                        <span className="font-serif text-2xl text-chalet-green font-bold">R$ {selectedRes.totalPrice.toFixed(2)}</span>
                    </div>
                </div>

                {/* Botões de Ação - Apenas WhatsApp e Editar conforme solicitado */}
                <div className="p-8 bg-gray-50 grid grid-cols-2 gap-4 border-t border-gray-100">
                    <button 
                        onClick={() => handleWhatsApp(selectedRes)}
                        className="flex items-center justify-center gap-2 bg-green-500 text-white font-bold py-4 rounded-xl hover:bg-green-600 transition shadow-lg active:scale-95"
                    >
                        <MessageCircle size={20} /> WhatsApp
                    </button>
                    <button 
                        onClick={() => startEdit(selectedRes)}
                        className="flex items-center justify-center gap-2 bg-blue-500 text-white font-bold py-4 rounded-xl hover:bg-blue-600 transition shadow-lg active:scale-95"
                    >
                        <Pencil size={20} /> Editar
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* --- MODAL DE EDIÇÃO --- */}
      {editingRes && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="bg-white rounded-3xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col">
                <div className="bg-chalet-green p-6 flex justify-between items-center text-white">
                    <h3 className="font-serif text-2xl">Editar Informações</h3>
                    <button onClick={cancelEdit} className="p-2 hover:bg-white/10 rounded-full transition"><X size={24}/></button>
                </div>
                
                <div className="p-8 space-y-6 overflow-y-auto">
                    <p className="text-gray-500 text-sm">Altere os dados abaixo. O novo valor será calculado automaticamente e salvo no banco de dados.</p>
                    
                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-3">Selecione Novas Datas</label>
                        <div 
                            onClick={() => setIsDatePickerOpen(true)}
                            className="flex items-center justify-between p-4 border border-gray-200 rounded-xl cursor-pointer hover:border-chalet-gold bg-gray-50 transition-all ring-1 ring-transparent hover:ring-chalet-gold/20"
                        >
                            <div className="flex items-center gap-3 text-chalet-green font-bold">
                                <CalendarIcon size={20} className="text-chalet-gold" />
                                {editDateRange.startDate?.toLocaleDateString()} - {editDateRange.endDate?.toLocaleDateString()}
                            </div>
                            <span className="text-[10px] text-chalet-gold font-bold uppercase tracking-widest border border-chalet-gold/20 px-2 py-1 rounded">Mudar</span>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 gap-6">
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Hóspedes (Max {PRICING_RULES.maxGuests})</label>
                            <div className="relative">
                                <Users className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="number" 
                                    min="1" 
                                    max={PRICING_RULES.maxGuests}
                                    value={editingRes.guests}
                                    onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        setEditingRes({...editingRes, guests: val});
                                    }}
                                    className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-chalet-gold outline-none bg-gray-50 font-bold"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Pets (Max 5)</label>
                            <div className="relative">
                                <Dog className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                                <input 
                                    type="number" 
                                    min="0" 
                                    max="5"
                                    value={editingRes.pets}
                                    onChange={e => {
                                        const val = parseInt(e.target.value) || 0;
                                        setEditingRes({...editingRes, pets: val});
                                    }}
                                    className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-chalet-gold outline-none bg-gray-50 font-bold"
                                />
                            </div>
                        </div>
                    </div>

                    <div>
                        <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-widest mb-2">Forma de Pagamento</label>
                        <div className="relative">
                            <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
                            <select 
                                value={editingRes.paymentMethod || 'PIX'}
                                onChange={e => setEditingRes({...editingRes, paymentMethod: e.target.value})}
                                className="w-full pl-10 pr-4 py-4 border border-gray-200 rounded-xl focus:ring-2 focus:ring-chalet-gold outline-none bg-gray-50 font-bold appearance-none"
                            >
                                <option value="PIX">PIX</option>
                                <option value="Cartão de Crédito">Cartão de Crédito</option>
                            </select>
                        </div>
                    </div>

                    <div className="bg-chalet-green/5 p-6 rounded-2xl flex justify-between items-center border border-chalet-green/10">
                        <span className="text-sm font-bold text-gray-600">Novo Total Estimado:</span>
                        <span className="text-2xl font-serif text-chalet-green font-bold">R$ {calculatedPrice.toFixed(2)}</span>
                    </div>

                    <button 
                        onClick={handleSaveEdit}
                        disabled={isSaving}
                        className="w-full py-4 bg-chalet-gold text-white font-bold rounded-xl shadow-lg hover:bg-chalet-goldHover flex justify-center items-center gap-2 disabled:opacity-50 transform hover:-translate-y-1 transition-all active:scale-95 shadow-chalet-gold/20"
                    >
                        {isSaving ? <Loader2 className="animate-spin" /> : <Save size={20} />}
                        Salvar Alterações no Banco
                    </button>
                </div>
            </div>
        </div>
      )}

      {/* Seletor de Datas para Edição */}
      <DateRangePicker 
        isOpen={isDatePickerOpen}
        onClose={() => setIsDatePickerOpen(false)}
        selectedRange={editDateRange}
        onChange={setEditDateRange}
      />
    </div>
  );
};
