
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../services/auth';
import { db } from '../services/db';
import { BookingCalculator } from '../components/BookingCalculator';
import { DateRangePicker } from '../components/DateRangePicker';
import { DateRange, UserRole, ReservationStatus } from '../types';
import { Validators } from '../utils/validators';
import { Calendar as CalendarIcon, ArrowRight, ShieldAlert, CreditCard, X, AlertTriangle, CheckSquare, Square, Loader2 } from 'lucide-react';

export const Book: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  
  // Form State
  const [guests, setGuests] = useState(2);
  const [pets, setPets] = useState(0);
  const [dateRange, setDateRange] = useState<DateRange>({ startDate: null, endDate: null });
  const [totalPrice, setTotalPrice] = useState<number | null>(null);
  const [paymentMethod, setPaymentMethod] = useState('PIX');
  
  // UI State
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  
  // Review Modal State
  const [isReviewOpen, setIsReviewOpen] = useState(false);
  const [rulesAccepted, setRulesAccepted] = useState(false);

  // Passo 1: Apenas abre o modal de revisão (Local)
  const handleOpenReview = () => {
    if (!user) {
      navigate('/login?redirect=/book');
      return;
    }

    if (user.role === UserRole.ADMIN) {
      setError('Administradores não podem realizar reservas pelo sistema.');
      return;
    }

    if (!dateRange.startDate || !dateRange.endDate || !totalPrice) {
      setError('Por favor, selecione datas válidas.');
      return;
    }

    if (!Validators.guests(guests)) {
        setError(`Número de hóspedes inválido. Mínimo 1, Máximo 8.`);
        return;
    }

    if (!Validators.pets(pets)) {
        setError('Número de pets inválido.');
        return;
    }

    setError('');
    setIsReviewOpen(true); // Abre o modal sem salvar nada no banco ainda
  };

  // Passo 2: Confirmação Final (Cria a reserva no banco e vai pro WhatsApp)
  const handleFinalConfirmation = async () => {
    if (!dateRange.startDate || !dateRange.endDate || !user || !totalPrice) return;
    if (!rulesAccepted) return;

    // Redundant Validation for security
    if (!Validators.guests(guests) || !Validators.pets(pets)) {
        setError("Dados inválidos detectados. Atualize a página e tente novamente.");
        return;
    }

    setLoading(true);
    setError('');

    try {
      // Cria a reserva FINAL no banco de dados
      await db.createReservation({
        userId: user.id,
        userName: user.name,
        checkIn: dateRange.startDate.toISOString(),
        checkOut: dateRange.endDate.toISOString(),
        guests,
        pets,
        totalPrice,
        status: ReservationStatus.CONFIRMED, // Já nasce confirmada
        paymentMethod
      });

      // Preparar mensagem do WhatsApp
      const startDateFormatted = dateRange.startDate.toLocaleDateString('pt-BR');
      const endDateFormatted = dateRange.endDate.toLocaleDateString('pt-BR');

      const message = `🌿 Olá! Acabei de confirmar minha reserva pelo sistema no Chalé Serra Crato.

🧑‍💼 Nome: ${user.name}
📅 Check-in: ${startDateFormatted} às 18:00
📅 Check-out: ${endDateFormatted} até 15:00
👥 Número de hóspedes: ${guests}
🐾 Pets: ${pets}
💰 Pagamento: ${paymentMethod}
💵 Total: R$ ${totalPrice.toFixed(2)}

☑️ Li e aceito todas as regras do Chalé Serra Crato.
Estou aguardando as orientações de pagamento!`;

      const whatsappUrl = `https://wa.me/5585999611900?text=${encodeURIComponent(message)}`;
      
      // Abrir WhatsApp e redirecionar para dashboard
      window.open(whatsappUrl, '_blank');
      navigate('/dashboard');

    } catch (err: any) {
      console.error(err);
      setError(err.message || 'Erro ao processar reserva no banco. Tente novamente.');
      setLoading(false);
    }
  };

  const formatDate = (date: Date | null) => {
    if (!date) return 'Selecionar data';
    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const isAdmin = user?.role === UserRole.ADMIN;

  return (
    <div className="max-w-4xl mx-auto px-4 py-12 relative">
      <DateRangePicker 
        isOpen={isCalendarOpen} 
        onClose={() => setIsCalendarOpen(false)} 
        selectedRange={dateRange}
        onChange={setDateRange}
      />

      <h1 className="font-serif text-4xl text-chalet-green mb-8 text-center">Reserve sua Estadia</h1>
      
      {isAdmin && (
        <div className="mb-8 p-4 bg-amber-50 border-l-4 border-amber-500 text-amber-800 rounded flex items-center gap-3">
          <ShieldAlert className="flex-shrink-0" />
          <p className="text-sm font-medium">
            Você está logado como <strong>Admin</strong>. Utilize uma conta de hóspede para testar.
          </p>
        </div>
      )}

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
               <span className="w-6 h-6 rounded-full bg-chalet-gold text-white flex items-center justify-center text-xs">1</span>
               Selecione as Datas
            </h2>
            
            <div 
              onClick={() => !isAdmin && setIsCalendarOpen(true)}
              className={`border border-gray-300 rounded-xl p-4 transition-all group bg-gray-50 ${isAdmin ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer hover:border-chalet-gold hover:ring-1 hover:ring-chalet-gold hover:bg-white'}`}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                        <div className={`bg-chalet-green/10 p-2 rounded-full text-chalet-green ${!isAdmin && 'group-hover:bg-chalet-gold group-hover:text-white'} transition-colors`}>
                            <CalendarIcon size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Check-in</span>
                            <span className={`text-lg font-serif ${dateRange.startDate ? 'text-chalet-green' : 'text-gray-400'}`}>
                                {formatDate(dateRange.startDate)}
                            </span>
                        </div>
                    </div>
                    <ArrowRight className="text-gray-300" />
                    <div className="flex items-center gap-3 text-right">
                        <div className="flex flex-col">
                            <span className="text-xs text-gray-500 uppercase tracking-wider font-bold">Check-out</span>
                            <span className={`text-lg font-serif ${dateRange.endDate ? 'text-chalet-green' : 'text-gray-400'}`}>
                                {formatDate(dateRange.endDate)}
                            </span>
                        </div>
                    </div>
                </div>
            </div>
          </div>

          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-chalet-gold text-white flex items-center justify-center text-xs">2</span>
                Regras da Casa
            </h2>
            <ul className="list-disc list-inside space-y-3 text-gray-600 text-sm bg-chalet-beige/20 p-4 rounded-lg">
              <li>Check-in 18h | Check-out 15h.</li>
              <li>Proibido som automotivo.</li>
              <li>Pets são bem-vindos sob responsabilidade dos donos.</li>
              <li>Máximo de 8 hóspedes por estadia.</li>
            </ul>
          </div>
          
          <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-100">
            <h2 className="font-bold text-lg mb-4 text-gray-700 flex items-center gap-2">
                <span className="w-6 h-6 rounded-full bg-chalet-gold text-white flex items-center justify-center text-xs">3</span>
                Forma de Pagamento Preferencial
            </h2>
            <div className="relative">
                <CreditCard className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={20} />
                <select 
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value)}
                    disabled={isAdmin}
                    className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg bg-gray-50 text-gray-700 focus:ring-2 focus:ring-chalet-gold outline-none appearance-none disabled:opacity-50"
                >
                    <option value="PIX">PIX</option>
                    <option value="Cartão de Crédito">Cartão de Crédito</option>
                </select>
            </div>
          </div>
        </div>

        <div className="md:col-span-1">
          <div className="sticky top-24">
            <BookingCalculator 
              dateRange={dateRange} 
              guests={guests}
              pets={pets}
              onGuestsChange={setGuests}
              onPetsChange={setPets}
              onPriceCalculate={setTotalPrice}
            />
            
            {error && <div className="mt-4 p-3 bg-red-100 text-red-700 text-sm rounded border-l-4 border-red-500">{error}</div>}

            <button
              onClick={handleOpenReview}
              disabled={!totalPrice || loading || isAdmin}
              className={`w-full mt-6 py-4 rounded-lg font-bold text-lg transition shadow-lg ${
                totalPrice && !loading && !isAdmin
                  ? 'bg-chalet-green text-white hover:bg-chalet-greenLight transform hover:-translate-y-1' 
                  : 'bg-gray-200 text-gray-400 cursor-not-allowed'
              }`}
            >
              {loading ? 'Processando...' : (isAdmin ? 'Admin Não Reserva' : (user ? 'Reservar' : 'Faça Login para Reservar'))}
            </button>
          </div>
        </div>
      </div>

      {/* MODAL DE REVISÃO E CONFIRMAÇÃO REAL */}
      {isReviewOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-chalet-green/80 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white w-full max-w-lg rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            <div className="bg-chalet-green p-6 text-white flex justify-between items-center">
               <h3 className="font-serif text-2xl">Revisar Reserva</h3>
               <button onClick={() => setIsReviewOpen(false)} className="bg-white/10 p-2 rounded-full hover:bg-white/20"><X size={20} /></button>
            </div>
            
            <div className="p-6 overflow-y-auto space-y-6">
               <div className="bg-gray-50 p-4 rounded-lg space-y-3 text-sm">
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                     <span className="text-gray-500">Hóspede principal</span>
                     <span className="font-bold text-gray-800">{user?.name}</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                     <span className="text-gray-500">Check-in</span>
                     <span className="font-bold text-gray-800 text-right">{dateRange.startDate?.toLocaleDateString()} às 18:00</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                     <span className="text-gray-500">Check-out</span>
                     <span className="font-bold text-gray-800 text-right">{dateRange.endDate?.toLocaleDateString()} até 15:00</span>
                  </div>
                  <div className="flex justify-between border-b border-gray-200 pb-2">
                     <span className="text-gray-500">Pessoas / Pets</span>
                     <span className="font-bold text-gray-800">{guests} Pessoas / {pets} Pets</span>
                  </div>
                  <div className="flex justify-between items-center pt-1">
                     <span className="text-gray-500">Valor Total</span>
                     <span className="font-serif text-xl text-chalet-green font-bold">R$ {totalPrice?.toFixed(2)}</span>
                  </div>
               </div>

               <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 flex gap-3">
                  <AlertTriangle className="text-yellow-600 flex-shrink-0" size={24} />
                  <div><p className="text-yellow-800 font-bold text-sm leading-snug">⚠️ Ao confirmar, sua reserva será salva e você será redirecionado para o WhatsApp para receber os dados de pagamento.</p></div>
               </div>

               {error && <div className="bg-red-50 text-red-600 p-3 rounded text-sm font-bold border border-red-100">{error}</div>}

               <label className="flex items-start gap-3 cursor-pointer group p-2 rounded hover:bg-gray-50 transition-colors">
                  <div className="relative flex items-center pt-0.5">
                    <input type="checkbox" className="sr-only" checked={rulesAccepted} onChange={(e) => setRulesAccepted(e.target.checked)} />
                    {rulesAccepted ? <CheckSquare className="text-chalet-green" size={20} /> : <Square className="text-gray-300 group-hover:text-chalet-gold" size={20} />}
                  </div>
                  <span className="text-sm text-gray-600 leading-tight select-none">Aceito as regras da casa e confirmo que as informações fornecidas estão corretas.</span>
               </label>
            </div>

            <div className="p-6 border-t bg-gray-50">
               <button 
                onClick={handleFinalConfirmation} 
                disabled={!rulesAccepted || loading} 
                className={`w-full py-4 rounded-xl font-bold text-lg shadow-lg flex items-center justify-center gap-2 transition-all ${rulesAccepted ? 'bg-chalet-gold text-chalet-green hover:bg-chalet-goldHover transform hover:-translate-y-1' : 'bg-gray-300 text-gray-500 cursor-not-allowed'}`}
               >
                 {loading ? <Loader2 className="animate-spin" /> : 'Confirmar e Abrir WhatsApp'}
               </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
