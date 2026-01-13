
import React, { ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Star, CheckCircle } from 'lucide-react';
import { IMAGES, AMENITIES } from '../constants';

export const Home: React.FC = () => {
  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative h-[85vh] flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src={IMAGES.HERO} 
            alt="Chalé na Serra" 
            className="w-full h-full object-cover transform scale-105"
          />
          <div className="absolute inset-0 bg-chalet-green/60 mix-blend-multiply"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-4xl mx-auto">
          <h1 className="font-serif text-5xl md:text-7xl text-white mb-6 drop-shadow-lg leading-tight">
            Seu refúgio na <br/>
            <span className="text-chalet-gold italic">Chapada do Araripe</span>
          </h1>
          <p className="text-lg md:text-xl text-gray-200 mb-10 max-w-2xl mx-auto font-light">
            Um espaço aconchegante, ideal para quem busca tranquilidade, natureza e conforto em Crato – Ceará.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link 
              to="/book" 
              className="px-8 py-4 bg-chalet-gold text-chalet-green font-bold text-lg rounded-full hover:bg-white hover:text-chalet-green transition-all shadow-xl flex items-center justify-center gap-2"
            >
              Ver Disponibilidade <ArrowRight size={20} />
            </Link>
            <Link 
              to="/gallery" 
              className="px-8 py-4 bg-transparent border-2 border-white text-white font-bold text-lg rounded-full hover:bg-white hover:text-chalet-green transition-all shadow-xl"
            >
              Conhecer o Chalé
            </Link>
          </div>
        </div>
      </section>

      {/* About Section */}
      <section className="py-20 bg-chalet-beige/20">
        <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-2 gap-12 items-center">
          <div className="grid grid-cols-2 gap-4">
            <img src={IMAGES.EXTERIOR} alt="Exterior" className="rounded-lg shadow-lg w-full h-64 object-cover" />
            <img src={IMAGES.INTERIOR} alt="Interior" className="rounded-lg shadow-lg w-full h-64 object-cover mt-8" />
          </div>
          <div>
            <span className="text-chalet-gold font-bold tracking-widest uppercase text-sm mb-2 block">O Refúgio</span>
            <h2 className="font-serif text-4xl text-chalet-green mb-6">Conforto em meio à natureza</h2>
            <p className="text-gray-600 mb-6 leading-relaxed">
              O Chalé Serra Crato foi projetado para oferecer a experiência perfeita de desconexão. 
              Com capacidade para até 8 pessoas, oferecemos uma estrutura completa para sua família ou amigos.
            </p>
            <ul className="space-y-3 mb-8">
              {['3 Camas de Casal + 1 Solteiro', 'Cozinha Completa', 'Área Gourmet com Churrasqueira'].map((item, i) => (
                <li key={i} className="flex items-center gap-3 text-chalet-green font-medium">
                  <CheckCircle size={18} className="text-chalet-gold" /> {item}
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* Amenities Grid */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <h2 className="font-serif text-3xl text-chalet-green mb-12">Comodidades</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-8">
            {AMENITIES.map((item, idx) => (
              <div key={idx} className="flex flex-col items-center gap-4 p-6 rounded-xl hover:bg-chalet-beige/30 transition duration-300 group">
                <div className="w-12 h-12 bg-chalet-green text-chalet-gold rounded-full flex items-center justify-center group-hover:scale-110 transition">
                  <Star size={24} />
                </div>
                <span className="font-medium text-gray-700">{item.name}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 bg-chalet-green text-center px-4">
        <div className="max-w-3xl mx-auto">
          <h2 className="font-serif text-4xl text-chalet-beige mb-6">Pronto para relaxar?</h2>
          <p className="text-white/80 mb-10 text-lg">
            Garanta sua data agora. As reservas para finais de semana e feriados esgotam rapidamente.
          </p>
          <Link 
            to="/book" 
            className="inline-block px-10 py-5 bg-chalet-gold text-chalet-green font-bold text-xl rounded-lg hover:bg-white transition shadow-2xl"
          >
            Reservar Minha Estadia
          </Link>
        </div>
      </section>
    </div>
  );
};
