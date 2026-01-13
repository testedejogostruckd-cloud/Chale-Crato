
import { createClient } from '@supabase/supabase-js';

// Helper seguro para acessar variáveis de ambiente em diferentes ambientes (Vite, CRA, Next, etc)
const getEnvVar = (key: string, viteKey: string): string => {
  if (typeof process !== 'undefined' && process.env && process.env[key]) {
    return process.env[key] as string;
  }
  // @ts-ignore - Suporte para Vite (import.meta) se configurado
  if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[viteKey]) {
    // @ts-ignore
    return import.meta.env[viteKey] as string;
  }
  return '';
};

// Tenta obter do ambiente
const envUrl = getEnvVar('REACT_APP_SUPABASE_URL', 'VITE_SUPABASE_URL');
const envKey = getEnvVar('REACT_APP_SUPABASE_ANON_KEY', 'VITE_SUPABASE_ANON_KEY');

// Fallback apenas para garantir que o app não quebre imediatamente, mas sem expor lógica interna
const SUPABASE_URL = envUrl || 'https://hqjeczmrkthqrduhlyjk.supabase.co';
const SUPABASE_ANON_KEY = envKey || ''; 

// A inicialização prossegue, erros de conexão serão tratados pelo serviço de banco de dados
export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
