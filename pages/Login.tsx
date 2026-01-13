
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { db } from '../services/db';
import { useAuth } from '../services/auth';
import { useConfig } from '../services/configContext';
import { UserRole } from '../types';
import { Validators } from '../utils/validators';
import { Logger } from '../services/logger';
import { 
  Mail, 
  Lock, 
  User as UserIcon, 
  Wifi, 
  Mountain, 
  Sprout, 
  Check, 
  Eye,
  EyeOff,
  Loader2,
  ArrowLeft,
  Info
} from 'lucide-react';

// Reusable Input Component with Icon and Password Toggle
const InputField = ({ 
  type, 
  placeholder, 
  value, 
  onChange, 
  icon: Icon 
}: { 
  type: string, 
  placeholder: string, 
  value: string, 
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, 
  icon: React.ElementType 
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPasswordType = type === 'password';

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="relative mb-4">
      {/* Left Icon */}
      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400">
        <Icon size={18} />
      </div>

      <input
        type={isPasswordType ? (showPassword ? 'text' : 'password') : type}
        required={type !== 'text'} 
        placeholder={placeholder}
        className={`block w-full pl-10 ${isPasswordType ? 'pr-10' : 'pr-3'} py-3 border border-gray-200 rounded-lg text-gray-700 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-chalet-green/20 focus:border-chalet-green transition-all bg-gray-50/50`}
        value={value}
        onChange={onChange}
      />

      {/* Right Toggle Button (Only for password types) */}
      {isPasswordType && (
        <button
          type="button"
          onClick={togglePasswordVisibility}
          className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-chalet-gold cursor-pointer focus:outline-none"
        >
          {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
        </button>
      )}
    </div>
  );
};

export const Login: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [isForgotPassword, setIsForgotPassword] = useState(false);
  const [formData, setFormData] = useState({ 
    name: '', 
    email: '', 
    password: '', 
    confirmPassword: '', 
    agreeTerms: false 
  });
  const [error, setError] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const { login } = useAuth();
  const { logoUrl } = useConfig();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (location.pathname.includes('register')) setIsRegister(true);
    else setIsRegister(false);
  }, [location]);

  const toggleMode = () => {
    const newMode = !isRegister;
    setIsRegister(newMode);
    setIsForgotPassword(false);
    setError('');
    setSuccessMsg('');
    navigate(newMode ? '/register' : '/login', { replace: true });
  };

  const toggleForgotPassword = () => {
    setIsForgotPassword(!isForgotPassword);
    setError('');
    setSuccessMsg('');
  };

  const validateForm = () => {
    if (!Validators.email(formData.email)) {
      throw new Error('Por favor, insira um e-mail válido.');
    }

    if (!isForgotPassword) {
        if (!Validators.password(formData.password)) {
          if (isRegister) {
            throw new Error('A senha deve ter: min. 8 caracteres, 1 maiúscula, 1 minúscula e 1 número.');
          } else {
            // No login não damos dica da política de senha por segurança, mas validamos se está vazia
            if (formData.password.length === 0) throw new Error('A senha é obrigatória.');
          }
        }
    }

    if (isRegister) {
      if (!Validators.name(formData.name)) {
        throw new Error('O nome deve ter pelo menos 2 caracteres.');
      }
      if (formData.password !== formData.confirmPassword) {
        throw new Error('As senhas não coincidem.');
      }
      if (!formData.agreeTerms) {
        throw new Error('Você deve concordar com os Termos de Serviço.');
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMsg('');
    setIsLoading(true);

    try {
      validateForm();

      if (isForgotPassword) {
        // Fluxo de Recuperação
        Logger.info('Solicitação de reset de senha', { email: formData.email });
        await db.resetPassword(formData.email.trim());
        setSuccessMsg('Se este e-mail estiver cadastrado, você receberá um link para redefinir sua senha.');
      } 
      else if (isRegister) {
        // Fluxo de Cadastro
        Logger.info('Iniciando registro', { email: formData.email });
        await db.createUser({
            name: formData.name.trim(),
            email: formData.email.trim(),
            password: formData.password,
            role: UserRole.GUEST
        });
        setSuccessMsg('Conta criada com sucesso! Verifique seu e-mail para confirmar o cadastro antes de entrar.');
      } 
      else {
        // Fluxo de Login
        Logger.info('Iniciando login', { email: formData.email });
        const user: any = await db.login(formData.email.trim(), formData.password);
        login(user);
        const params = new URLSearchParams(location.search);
        const redirect = params.get('redirect') || '/dashboard';
        navigate(redirect);
      }
      
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro.');
      Logger.warn('Erro no formulário de autenticação', { error: err.message, isRegister, isForgotPassword });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-80px)] flex items-center justify-center p-4 bg-[#e8e9e3]">
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex min-h-[600px]">
        
        {/* Left Panel - Visual (Green Side) */}
        <div className="hidden lg:flex w-1/2 bg-chalet-green relative flex-col items-center justify-center text-center p-12 text-chalet-beige">
            <div 
              className="absolute inset-0 opacity-10 pointer-events-none"
              style={{
                backgroundImage: 'repeating-linear-gradient(90deg, transparent, transparent 20px, #000 20px, #000 22px)'
              }}
            ></div>
            
            <div className="relative z-10 flex flex-col items-center h-full justify-center">
                <div className="w-44 h-44 mb-8 p-1 bg-white/20 rounded-full ring-4 ring-chalet-gold/40 shadow-2xl flex items-center justify-center overflow-hidden">
                    <img 
                      src={logoUrl} 
                      alt="Logo Serra Crato" 
                      className="w-full h-full object-cover rounded-full" 
                      loading="eager"
                    />
                </div>

                <h2 className="font-serif text-4xl font-bold mb-4 text-chalet-gold">
                    {isForgotPassword ? 'Recuperação' : (isRegister ? 'Bem-vindo' : 'Bem-vindo de volta')}
                </h2>
                
                <p className="font-serif italic text-lg opacity-80 mb-12">
                   "Sinta a paz desse lugar"
                </p>

                {isRegister ? (
                    <div className="space-y-6 text-left w-full max-w-xs mx-auto">
                        <div className="flex items-center gap-4 text-sm font-light tracking-wide">
                            <Wifi size={18} className="text-chalet-gold" />
                            <span>Wi-Fi Gratuito</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-light tracking-wide">
                            <Mountain size={18} className="text-chalet-gold" />
                            <span>Vista para a Serra</span>
                        </div>
                        <div className="flex items-center gap-4 text-sm font-light tracking-wide">
                            <Sprout size={18} className="text-chalet-gold" />
                            <span>Contato com a Natureza</span>
                        </div>
                    </div>
                ) : (
                   <div className="max-w-xs">
                       <div className="w-12 h-1 bg-chalet-gold mx-auto mb-6 rounded-full"></div>
                       <p className="text-sm leading-relaxed opacity-90">
                           {isForgotPassword 
                             ? 'Não se preocupe, vamos te ajudar a recuperar o acesso.'
                             : 'Acesse sua conta para gerenciar suas reservas e preparar sua próxima escapada para a natureza.'}
                       </p>
                   </div>
                )}
            </div>
        </div>

        {/* Right Panel - Form (White Side) */}
        <div className="w-full lg:w-1/2 p-8 md:p-12 flex flex-col justify-center relative">
            
            <div className="max-w-md mx-auto w-full">
                <div className="mb-8">
                    {isForgotPassword && (
                        <button 
                            onClick={toggleForgotPassword} 
                            className="flex items-center gap-2 text-gray-500 hover:text-chalet-green mb-4 text-sm font-bold"
                        >
                            <ArrowLeft size={16} /> Voltar ao login
                        </button>
                    )}
                    <h1 className="font-serif text-3xl md:text-4xl text-chalet-green mb-2">
                        {isForgotPassword ? 'Redefinir Senha' : (isRegister ? 'Criar Conta' : 'Login do Usuário')}
                    </h1>
                    <p className="text-gray-500">
                        {isForgotPassword 
                            ? 'Digite seu e-mail para receber um link de redefinição.'
                            : (isRegister 
                                ? 'Preencha os dados abaixo para se juntar à nossa comunidade.' 
                                : 'Digite seus dados para entrar.')}
                    </p>
                </div>

                {error && (
                    <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-6 border border-red-100 flex items-center gap-2">
                        <span className="block w-1.5 h-1.5 bg-red-500 rounded-full flex-shrink-0"></span>
                        {error}
                    </div>
                )}

                {successMsg && (
                    <div className="bg-green-50 text-green-700 p-3 rounded-lg text-sm mb-6 border border-green-100 flex items-center gap-2">
                         <Check size={16} className="flex-shrink-0" />
                        {successMsg}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-4">
                    {isRegister && !isForgotPassword && (
                        <div>
                            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Nome Completo</label>
                            <InputField 
                                type="text" 
                                placeholder="Seu nome completo" 
                                icon={UserIcon}
                                value={formData.name}
                                onChange={e => setFormData({...formData, name: e.target.value})}
                            />
                        </div>
                    )}
                    
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">E-mail</label>
                        <InputField 
                            type="email" 
                            placeholder="seu@email.com" 
                            icon={Mail}
                            value={formData.email}
                            onChange={e => setFormData({...formData, email: e.target.value})}
                        />
                    </div>

                    {!isForgotPassword && (
                        <>
                            <div>
                                <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Senha</label>
                                <InputField 
                                    type="password" 
                                    placeholder="••••••••" 
                                    icon={Lock}
                                    value={formData.password}
                                    onChange={e => setFormData({...formData, password: e.target.value})}
                                />
                                {isRegister && (
                                    <div className="text-[10px] text-gray-500 flex gap-1 items-start mt-1 bg-gray-50 p-2 rounded">
                                        <Info size={12} className="mt-0.5 flex-shrink-0 text-chalet-gold"/>
                                        Mínimo 8 caracteres, com maiúscula, minúscula e número.
                                    </div>
                                )}
                            </div>

                            {isRegister && (
                                <>
                                    <div>
                                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Confirmar Senha</label>
                                        <InputField 
                                            type="password" 
                                            placeholder="••••••••" 
                                            icon={Lock}
                                            value={formData.confirmPassword}
                                            onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                                        />
                                    </div>

                                    <div className="flex items-center gap-2 mt-2">
                                        <input 
                                            type="checkbox" 
                                            id="terms"
                                            checked={formData.agreeTerms}
                                            onChange={e => setFormData({...formData, agreeTerms: e.target.checked})}
                                            className="rounded border-gray-300 text-chalet-green focus:ring-chalet-gold"
                                        />
                                        <label htmlFor="terms" className="text-sm text-gray-600">
                                            Concordo com os <span className="text-chalet-gold hover:underline cursor-pointer">Termos de Serviço</span> e <span className="text-chalet-gold hover:underline cursor-pointer">Política de Privacidade</span>
                                        </label>
                                    </div>
                                </>
                            )}
                        </>
                    )}

                    {!isRegister && !isForgotPassword && (
                        <div className="flex items-center justify-between text-sm mt-2">
                            <label className="flex items-center gap-2 text-gray-600 cursor-pointer">
                                <input type="checkbox" className="rounded border-gray-300 text-chalet-green focus:ring-chalet-gold" />
                                Lembrar de mim
                            </label>
                            <button 
                                type="button" 
                                onClick={toggleForgotPassword}
                                className="text-gray-900 hover:text-chalet-gold transition-colors font-medium"
                            >
                                Esqueceu sua senha?
                            </button>
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isLoading}
                        className={`w-full py-3.5 rounded-lg font-bold text-white shadow-lg transition-all transform hover:-translate-y-0.5 mt-6 flex items-center justify-center gap-2 ${
                            isRegister || isForgotPassword
                                ? 'bg-chalet-green hover:bg-chalet-greenLight' 
                                : 'bg-chalet-gold hover:bg-chalet-goldHover'
                        } ${isLoading ? 'opacity-70 cursor-wait' : ''}`}
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                Aguarde...
                            </>
                        ) : (
                            isForgotPassword ? 'ENVIAR LINK DE RECUPERAÇÃO' : (isRegister ? 'CRIAR CONTA' : 'ENTRAR')
                        )}
                    </button>
                </form>

                <div className="mt-8 text-center">
                    {!isForgotPassword && (
                        <p className="text-sm text-gray-600">
                            {isRegister ? 'Já tem uma conta?' : 'Ainda não tem uma conta?'}
                            <button 
                                onClick={toggleMode}
                                className={`font-bold ml-1 hover:underline ${
                                    isRegister ? 'text-chalet-gold' : 'text-chalet-green'
                                }`}
                            >
                                {isRegister ? 'Faça Login aqui' : 'Criar conta'}
                            </button>
                        </p>
                    )}
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};
