
export const Sanitizer = {
  /**
   * Remove tags HTML e caracteres perigosos de strings.
   * Previne Stored XSS antes de salvar no banco.
   */
  cleanText: (text: string): string => {
    if (!text) return '';
    return text
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#x27;")
      .replace(/\//g, "&#x2F;")
      .trim();
  },

  /**
   * Valida se uma URL usa protocolos seguros.
   * EM PRODUÇÃO: Exige HTTPS.
   * EM DEV: Permite localhost com HTTP.
   */
  validateUrl: (url: string): boolean => {
    if (!url) return false;
    try {
      const parsed = new URL(url);
      
      // Permitir HTTP apenas para localhost/127.0.0.1 (Desenvolvimento)
      if (parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
        return ['http:', 'https:'].includes(parsed.protocol);
      }

      // Para qualquer outro domínio, exigir HTTPS
      return parsed.protocol === 'https:';
    } catch (e) {
      return false;
    }
  },

  /**
   * Retorna a URL se for segura, ou uma string vazia/placeholder se não for.
   */
  safeUrl: (url: string): string => {
    return Sanitizer.validateUrl(url) ? url : '';
  }
};
