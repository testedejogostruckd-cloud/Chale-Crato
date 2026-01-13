
import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Menu, X, Instagram, Facebook, Mail, Phone, LogOut, User as UserIcon, MapPin, ShieldCheck } from 'lucide-react';
import { useAuth } from '../services/auth';
import { useConfig } from '../services/configContext';
import { UserRole } from '../types';

export const Layout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const { logoUrl } = useConfig();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      setIsMenuOpen(false);
      navigate('/');
    } catch (error) {
      console.error("Erro ao sair", error);
      navigate('/');
    }
  };

  const NavLink = ({ to, label, primary = false }: { to: string; label: string; primary?: boolean }) => (
    <Link
      to={to}
      className={`block px-4 py-2 rounded-md transition-all duration-300 ${
        primary
          ? 'bg-chalet-gold text-white hover:bg-chalet-goldHover font-bold shadow-md'
          : 'text-chalet-beige hover:text-chalet-gold'
      }`}
      onClick={() => setIsMenuOpen(false)}
    >
      {label}
    </Link>
  );

  return (
    <div className="min-h-screen flex flex-col font-sans text-gray-800">
      {/* Navigation */}
      <nav className="fixed w-full z-50 bg-chalet-green shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20">
            {/* Logo Section */}
            <Link to="/" className="flex-shrink-0 flex items-center gap-3 group">
              <div className="relative">
                <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center p-0.5 overflow-hidden ring-2 ring-chalet-gold/30">
                  <img 
                    src={logoUrl} 
                    alt="Logo Serra Crato" 
                    className="h-full w-full object-cover rounded-full"
                    loading="eager"
                  />
                </div>
              </div>
              
              <div className="flex flex-col">
                <span className="font-serif text-xl text-white leading-tight tracking-wider group-hover:text-chalet-gold transition-colors uppercase">
                  Serra Crato
                </span>
                <span className="text-[10px] text-chalet-gold uppercase tracking-[0.2em] opacity-80">Chalé Privativo</span>
              </div>
            </Link>

            {/* Desktop Menu */}
            <div className="hidden md:flex items-center space-x-6">
              <NavLink to="/" label="Início" />
              <NavLink to="/gallery" label="Galeria" />
              
              {user ? (
                <div className="relative group ml-4">
                  <button className="flex items-center gap-2 text-chalet-beige hover:text-chalet-gold focus:outline-none py-2">
                    <UserIcon size={18} />
                    <span className="font-medium flex items-center gap-1">
                        {user.name.split(' ')[0]}
                    </span>
                  </button>
                  <div className="absolute right-0 mt-0 w-56 bg-white rounded-md shadow-xl py-1 hidden group-hover:block border border-gray-100 animate-fade-in">
                    {user.role === 'admin' && (
                      <div className="bg-gray-50 border-b border-gray-100 mb-1 pb-1">
                        <div className="px-4 py-2 text-xs font-bold text-chalet-gold uppercase tracking-wider flex items-center gap-1">
                            <ShieldCheck size={12} /> Área Admin
                        </div>
                        <Link to="/admin" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-chalet-green">Painel Reservas</Link>
                        <Link to="/admin/gallery" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 hover:text-chalet-green">Gerenciar Galeria</Link>
                      </div>
                    )}
                    <Link to="/dashboard" className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100">Minhas Viagens</Link>
                    <button onClick={handleLogout} className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-gray-100 flex items-center gap-2">
                      <LogOut size={14} /> Sair
                    </button>
                  </div>
                </div>
              ) : (
                <>
                  <NavLink to="/login" label="Entrar" />
                  <NavLink to="/book" label="Reservar" primary />
                </>
              )}
            </div>

            <div className="md:hidden">
              <button onClick={() => setIsMenuOpen(!isMenuOpen)} className="text-chalet-beige hover:text-white p-2">
                {isMenuOpen ? <X size={28} /> : <Menu size={28} />}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMenuOpen && (
          <div className="md:hidden bg-chalet-greenLight pb-4 px-2 shadow-inner">
            <div className="px-2 pt-2 space-y-2">
              <NavLink to="/" label="Início" />
              <NavLink to="/gallery" label="Galeria" />
              {user ? (
                <>
                  <div className="border-t border-white/10 my-2 pt-2">
                      <div className="px-4 text-chalet-gold text-xs uppercase font-bold mb-2 flex items-center gap-2">
                         <UserIcon size={14} /> Olá, {user.name} 
                      </div>
                      <NavLink to="/dashboard" label="Minhas Reservas" />
                      {user.role === 'admin' && (
                          <>
                            <NavLink to="/admin" label="Admin: Reservas" />
                            <NavLink to="/admin/gallery" label="Admin: Galeria" />
                          </>
                      )}
                  </div>
                  <button onClick={handleLogout} className="block w-full text-left px-4 py-3 text-red-300 hover:text-red-200 font-bold bg-black/10 rounded">Sair</button>
                </>
              ) : (
                <>
                  <NavLink to="/login" label="Login" />
                  <NavLink to="/book" label="Reservar Agora" primary />
                </>
              )}
            </div>
          </div>
        )}
      </nav>

      <main className="flex-grow pt-20">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-chalet-green text-chalet-beige pt-16 pb-8 border-t border-white/5">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid md:grid-cols-3 gap-12">
          <div className="space-y-6">
            <div className="flex items-center gap-4">
              <div className="h-16 w-16 rounded-full bg-white/10 flex items-center justify-center ring-2 ring-chalet-gold/40 shadow-lg overflow-hidden">
                <img 
                  src={logoUrl} 
                  className="h-full w-full object-cover" 
                  alt="Logo Footer" 
                />
              </div>
              <h3 className="font-serif text-2xl text-chalet-gold uppercase tracking-tighter">Serra Crato</h3>
            </div>
            <p className="text-sm opacity-70 leading-relaxed italic">
              "Sinta a paz desse lugar" — Um refúgio pensado para quem valoriza o silêncio e o contato genuíno com a natureza.
            </p>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-chalet-gold/20 pb-2 inline-block">Contato & Localização</h4>
            <div className="space-y-4 text-sm opacity-80">
              <a 
                href="https://wa.me/5585999611900" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-3 hover:text-chalet-gold transition-colors"
              >
                <Phone size={16} className="text-chalet-gold" /> 
                (85) 99961-1900
              </a>
              
              <a 
                href="https://maps.app.goo.gl/PMrJ78X1aQZ6weQC7" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-start gap-3 hover:text-chalet-gold transition-colors"
              >
                <MapPin size={16} className="text-chalet-gold mt-1 flex-shrink-0" />
                <span className="leading-snug">
                  <strong>Chalé Serra Crato</strong><br/>
                  Loteamento Sítio Bebida Nova,<br/>
                  Crato - CE (Pé da Serra)
                </span>
              </a>
            </div>
          </div>
          <div>
            <h4 className="font-bold text-white mb-6 uppercase tracking-widest text-xs border-b border-chalet-gold/20 pb-2 inline-block">Siga-nos</h4>
            <div className="flex space-x-6">
              <a 
                href="https://www.instagram.com/chaleserracrato?igsh=bGNueXd5bW95aXlr" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="hover:text-chalet-gold transition-all transform hover:scale-110"
              >
                <Instagram size={24} />
              </a>
            </div>
          </div>
        </div>
        <div className="mt-16 pt-8 border-t border-white/5 text-center text-[10px] opacity-40 uppercase tracking-[0.2em]">
          © {new Date().getFullYear()} Chalé Serra Crato • Desenvolvido para o seu descanso
        </div>
      </footer>
    </div>
  );
};
