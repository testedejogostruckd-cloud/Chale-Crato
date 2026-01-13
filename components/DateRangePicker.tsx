import React, { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, X, Calendar as CalendarIcon, Check } from 'lucide-react';
import { DateRange } from '../types';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  selectedRange: DateRange;
  onChange: (range: DateRange) => void;
}

const DAYS_OF_WEEK = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
const MONTHS = ['Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho', 'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'];

export const DateRangePicker: React.FC<Props> = ({ isOpen, onClose, selectedRange, onChange }) => {
  const [viewDate, setViewDate] = useState(new Date());
  const [tempRange, setTempRange] = useState<DateRange>(selectedRange);

  useEffect(() => {
    if (isOpen) {
      setTempRange(selectedRange);
      if (selectedRange.startDate) {
        setViewDate(new Date(selectedRange.startDate));
      } else {
        setViewDate(new Date());
      }
    }
  }, [isOpen, selectedRange]);

  const getDaysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();
  const getFirstDayOfMonth = (year: number, month: number) => new Date(year, month, 1).getDay();

  const handlePrevMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  const isSameDay = (d1: Date | null, d2: Date) => {
    if (!d1) return false;
    return d1.getDate() === d2.getDate() && 
           d1.getMonth() === d2.getMonth() && 
           d1.getFullYear() === d2.getFullYear();
  };

  const isDateBetween = (date: Date, start: Date | null, end: Date | null) => {
    if (!start || !end) return false;
    return date > start && date < end;
  };

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (clickedDate < today) return;

    let newRange = { ...tempRange };

    if (!newRange.startDate || (newRange.startDate && newRange.endDate)) {
      newRange = { startDate: clickedDate, endDate: null };
    } else if (newRange.startDate && !newRange.endDate) {
      if (clickedDate < newRange.startDate) {
        newRange = { startDate: clickedDate, endDate: null };
      } else {
        newRange = { ...newRange, endDate: clickedDate };
      }
    }

    setTempRange(newRange);
  };

  const confirmSelection = () => {
    onChange(tempRange);
    onClose();
  };

  if (!isOpen) return null;

  const daysInMonth = getDaysInMonth(viewDate.getFullYear(), viewDate.getMonth());
  const firstDay = getFirstDayOfMonth(viewDate.getFullYear(), viewDate.getMonth());
  const blanks = Array.from({ length: firstDay }, (_, i) => i);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-chalet-green/60 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-chalet-green p-4 md:p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="font-serif text-xl md:text-2xl">Selecionar Datas</h2>
            <p className="text-chalet-gold text-xs md:text-sm uppercase tracking-widest mt-1">
              {tempRange.startDate ? tempRange.startDate.toLocaleDateString('pt-BR') : '__/__/__'} 
              {' até '} 
              {tempRange.endDate ? tempRange.endDate.toLocaleDateString('pt-BR') : '__/__/__'}
            </p>
          </div>
          <button onClick={onClose} className="bg-white/10 p-2 rounded-full hover:bg-white/20 transition">
            <X size={20} />
          </button>
        </div>

        {/* Controls */}
        <div className="flex items-center justify-between px-4 md:px-6 py-4 border-b border-gray-100">
          <button onClick={handlePrevMonth} className="p-1 md:p-2 hover:bg-gray-100 rounded-full text-chalet-green">
            <ChevronLeft size={24} />
          </button>
          <span className="font-bold text-base md:text-lg text-gray-700 capitalize">
            {MONTHS[viewDate.getMonth()]} {viewDate.getFullYear()}
          </span>
          <button onClick={handleNextMonth} className="p-1 md:p-2 hover:bg-gray-100 rounded-full text-chalet-green">
            <ChevronRight size={24} />
          </button>
        </div>

        {/* Calendar Grid */}
        <div className="p-4 md:p-6 overflow-y-auto">
          <div className="grid grid-cols-7 mb-4">
            {DAYS_OF_WEEK.map(day => (
              <div key={day} className="text-center text-[10px] md:text-xs font-bold text-gray-400 uppercase tracking-wider">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-y-2 gap-x-1">
            {blanks.map(i => <div key={`blank-${i}`} />)}
            {days.map(day => {
              const current = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
              const today = new Date();
              today.setHours(0,0,0,0);
              const isPast = current < today;
              const isSelectedStart = isSameDay(tempRange.startDate, current);
              const isSelectedEnd = isSameDay(tempRange.endDate, current);
              const isInRange = isDateBetween(current, tempRange.startDate, tempRange.endDate);

              let classes = "h-9 w-9 md:h-10 md:w-10 flex items-center justify-center rounded-full text-sm transition-all duration-200 relative mx-auto ";
              
              if (isPast) {
                classes += "text-gray-300 cursor-not-allowed";
              } else if (isSelectedStart || isSelectedEnd) {
                classes += "bg-chalet-green text-chalet-gold font-bold shadow-md scale-110 z-10";
              } else if (isInRange) {
                classes += "bg-chalet-green/10 text-chalet-green font-medium rounded-none";
                if (isSameDay(new Date(current.getTime() - 86400000), tempRange.startDate!)) classes += " rounded-l-none";
                if (isSameDay(new Date(current.getTime() + 86400000), tempRange.endDate!)) classes += " rounded-r-none";
              } else {
                classes += "text-gray-700 hover:bg-gray-100 cursor-pointer hover:text-chalet-green font-medium";
              }

              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(day)}
                  disabled={isPast}
                  className={classes}
                >
                  {day}
                </button>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 md:p-6 border-t border-gray-100 bg-gray-50 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xs text-gray-500 text-center md:text-left">
             *Mínimo de 1 diária<br/>
             *Check-in 18:00
          </div>
          <button 
            onClick={confirmSelection}
            disabled={!tempRange.startDate || !tempRange.endDate}
            className={`w-full md:w-auto px-8 py-3 rounded-lg font-bold flex items-center justify-center gap-2 shadow-lg transition-all ${
              tempRange.startDate && tempRange.endDate 
                ? 'bg-chalet-gold text-white hover:bg-chalet-goldHover transform hover:-translate-y-0.5' 
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
          >
            <Check size={18} /> <span className="md:hidden">Confirmar</span> <span className="hidden md:inline">Confirmar Datas</span>
          </button>
        </div>
      </div>
    </div>
  );
};