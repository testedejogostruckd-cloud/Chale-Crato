
import React, { useState, useEffect } from 'react';
import { PRICING_RULES } from '../constants';
import { DateRange } from '../types';
import { Dog } from 'lucide-react';

interface Props {
  dateRange: DateRange;
  guests: number;
  pets: number;
  onPriceCalculate: (price: number | null) => void;
  onGuestsChange: (guests: number) => void;
  onPetsChange: (pets: number) => void;
}

export const BookingCalculator: React.FC<Props> = ({ 
  dateRange, 
  guests, 
  pets,
  onPriceCalculate, 
  onGuestsChange,
  onPetsChange 
}) => {
  const [validationError, setValidationError] = useState<string | null>(null);
  const [details, setDetails] = useState<{nights: number, baseTotal: number, extraTotal: number} | null>(null);

  useEffect(() => {
    calculate();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dateRange, guests]);

  const calculate = () => {
    setValidationError(null);
    setDetails(null);
    onPriceCalculate(null);

    if (!dateRange.startDate || !dateRange.endDate) return;

    const start = new Date(dateRange.startDate);
    const end = new Date(dateRange.endDate);
    
    const diffTime = Math.abs(end.getTime() - start.getTime());
    const nights = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (nights < 1) {
      setValidationError("Selecione pelo menos uma noite.");
      return;
    }

    let hasWeekend = false;
    const current = new Date(start);
    while (current < end) {
      const day = current.getDay();
      if (day === 0 || day === 6) hasWeekend = true;
      current.setDate(current.getDate() + 1);
    }

    if (hasWeekend && nights < 2) {
      setValidationError("Reservas aos finais de semana exigem no mínimo 2 diárias.");
      return;
    }

    const baseTotal = nights * PRICING_RULES.basePrice;
    
    let extraGuests = 0;
    if (guests > PRICING_RULES.baseGuests) {
        extraGuests = guests - PRICING_RULES.baseGuests;
    }
    const extraTotal = extraGuests * PRICING_RULES.extraPersonFee * nights;

    const total = baseTotal + extraTotal;

    setDetails({ nights, baseTotal, extraTotal });
    onPriceCalculate(total);
  };

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg border border-chalet-beige">
      <h3 className="font-serif text-xl text-chalet-green mb-4">Resumo da Estadia</h3>
      
      {/* Hóspedes */}
      <div className="mb-4">
        <label className="block text-sm font-bold text-gray-700 mb-2">Hóspedes</label>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onGuestsChange(Math.max(1, guests - 1))}
            className="w-10 h-10 rounded-full bg-chalet-beige text-chalet-green flex items-center justify-center hover:bg-chalet-gold hover:text-white transition"
          >
            -
          </button>
          <span className="text-xl font-bold w-8 text-center">{guests}</span>
          <button 
            onClick={() => onGuestsChange(Math.min(PRICING_RULES.maxGuests, guests + 1))}
            className="w-10 h-10 rounded-full bg-chalet-beige text-chalet-green flex items-center justify-center hover:bg-chalet-gold hover:text-white transition"
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Máximo de {PRICING_RULES.maxGuests} pessoas.</p>
      </div>

      {/* Pets */}
      <div className="mb-6 pt-4 border-t border-gray-100">
        <div className="flex items-center gap-2 mb-2">
            <Dog size={16} className="text-chalet-gold" />
            <label className="block text-sm font-bold text-gray-700">Vai levar pets?</label>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => onPetsChange(Math.max(0, pets - 1))}
            className="w-10 h-10 rounded-full bg-chalet-beige text-chalet-green flex items-center justify-center hover:bg-chalet-gold hover:text-white transition"
          >
            -
          </button>
          <span className="text-xl font-bold w-8 text-center">{pets}</span>
          <button 
            onClick={() => onPetsChange(Math.min(5, pets + 1))}
            className="w-10 h-10 rounded-full bg-chalet-beige text-chalet-green flex items-center justify-center hover:bg-chalet-gold hover:text-white transition"
          >
            +
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-1">Nós somos pet-friendly!</p>
      </div>

      {validationError && (
        <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm mb-4 border border-red-200">
          {validationError}
        </div>
      )}

      {details && (
        <div className="space-y-2 border-t pt-4 border-dashed border-gray-300">
          <div className="flex justify-between text-sm">
            <span>{details.nights} diárias x R$ {PRICING_RULES.basePrice}</span>
            <span>R$ {details.baseTotal}</span>
          </div>
          {details.extraTotal > 0 && (
            <div className="flex justify-between text-sm text-gray-600">
              <span>Taxa hóspedes extras</span>
              <span>R$ {details.extraTotal}</span>
            </div>
          )}
          <div className="flex justify-between font-bold text-lg text-chalet-green pt-2 border-t mt-2">
            <span>Total</span>
            <span>R$ {details.baseTotal + details.extraTotal}</span>
          </div>
        </div>
      )}
    </div>
  );
};
