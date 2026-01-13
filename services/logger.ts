
/**
 * Serviço de Logging Centralizado
 * Responsável por padronizar logs e remover dados sensíveis antes da saída.
 */

// Lista de chaves que devem ser ofuscadas nos logs
const SENSITIVE_KEYS = [
  'password',
  'confirmPassword',
  'token',
  'access_token',
  'refresh_token',
  'authorization',
  'creditCard',
  'cvv',
  'card_number'
];

type LogLevel = 'INFO' | 'WARN' | 'ERROR';

class LoggerService {
  
  /**
   * Remove recursivamente dados sensíveis de objetos.
   */
  private sanitize(data: any): any {
    if (!data) return data;
    if (typeof data === 'string') return data;
    if (Array.isArray(data)) return data.map(item => this.sanitize(item));
    if (typeof data === 'object') {
      const cleaned: any = {};
      for (const key in data) {
        if (Object.prototype.hasOwnProperty.call(data, key)) {
          if (SENSITIVE_KEYS.some(sensitive => key.toLowerCase().includes(sensitive.toLowerCase()))) {
            cleaned[key] = '[REDACTED]';
          } else {
            cleaned[key] = this.sanitize(data[key]);
          }
        }
      }
      return cleaned;
    }
    return data;
  }

  private print(level: LogLevel, message: string, context?: any) {
    const timestamp = new Date().toISOString();
    const safeContext = context ? this.sanitize(context) : undefined;
    
    const logPayload = {
      timestamp,
      level,
      message,
      context: safeContext
    };

    // Estilização para o Console do Navegador
    const styles = {
      INFO: 'color: #007bff; font-weight: bold;',
      WARN: 'color: #ffc107; font-weight: bold;',
      ERROR: 'color: #dc3545; font-weight: bold;'
    };

    console.groupCollapsed(`%c[${level}] ${message}`, styles[level]);
    console.log('Timestamp:', timestamp);
    if (safeContext) console.log('Context:', safeContext);
    console.groupEnd();

    // TODO: Aqui seria o ponto de integração com Sentry/Datadog/LogRocket
    // if (level === 'ERROR') Sentry.captureException(message, { extra: safeContext });
  }

  info(message: string, context?: any) {
    this.print('INFO', message, context);
  }

  warn(message: string, context?: any) {
    this.print('WARN', message, context);
  }

  error(message: string, error?: any, context?: any) {
    this.print('ERROR', message, { ...context, errorDetail: error });
  }
}

export const Logger = new LoggerService();
