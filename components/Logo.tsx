
import React from 'react';

interface LogoProps {
  className?: string;
}

export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <svg 
      viewBox="0 0 200 200" 
      className={className} 
      xmlns="http://www.w3.org/2000/svg"
      aria-label="Logo Chalé Serra Crato"
    >
      <defs>
        {/* Caminho para o texto superior (Arco para cima) */}
        <path id="textArcTop" d="M 30,105 A 70,70 0 0,1 170,105" />
        
        {/* Caminho para o texto inferior (Arco para baixo) */}
        <path id="textArcBottom" d="M 165,100 A 65,65 0 0,1 35,100" />
      </defs>
      
      {/* Fundo Circular Verde Escuro */}
      <circle cx="100" cy="100" r="98" fill="#1a3c34" />
      
      {/* Borda Ouro Fina Externa */}
      <circle cx="100" cy="100" r="96" fill="none" stroke="#d4af37" strokeWidth="1" opacity="0.3" />

      {/* Texto Superior: CHALÉ SERRA CRATO */}
      <text fill="white" fontSize="17" fontFamily="sans-serif" fontWeight="900" letterSpacing="4.5">
        <textPath href="#textArcTop" startOffset="50%" textAnchor="middle">
          CHALÉ SERRA CRATO
        </textPath>
      </text>

      {/* Texto Inferior: SINTA A PAZ DESSE LUGAR */}
      <text fill="#d4af37" fontSize="8.5" fontFamily="sans-serif" letterSpacing="5" fontWeight="bold">
        {/* Fix: Bypass TypeScript error for 'side' property on textPath as it is not yet in React's SVG types but supported by browsers */}
        <textPath href="#textArcBottom" startOffset="50%" textAnchor="middle" {...({ side: 'right' } as any)}>
          SINTA A PAZ DESSE LUGAR
        </textPath>
      </text>

      {/* Ilustração da Casa (Traços Brancos) */}
      <g transform="translate(48, 45) scale(1.05)">
        {/* Telhado Triangular Principal */}
        <path d="M 50,0 L 98,48" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        <path d="M 50,0 L 2,48" stroke="white" strokeWidth="1.8" fill="none" strokeLinecap="round" />
        
        {/* Linha interna do telhado (detalhe) */}
        <path d="M 50,12 L 85,48" stroke="white" strokeWidth="1" fill="none" />
        <path d="M 50,12 L 15,48" stroke="white" strokeWidth="1" fill="none" />
        
        {/* Estrutura da Casa */}
        <rect x="18" y="48" width="64" height="60" stroke="white" strokeWidth="1.8" fill="none" />
        
        {/* Base da Casa */}
        <line x1="14" y1="108" x2="86" y2="108" stroke="white" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="112" x2="84" y2="112" stroke="white" strokeWidth="1.5" strokeLinecap="round" />

        {/* Luminária Pendente */}
        <line x1="50" y1="0" x2="50" y2="25" stroke="white" strokeWidth="1" />
        <path d="M 42,32 Q 50,25 58,32" stroke="white" strokeWidth="1.2" fill="none" />
        <path d="M 42,32 L 58,32" stroke="white" strokeWidth="1.2" fill="none" />
        
        {/* Janela Central com Venezianas */}
        <rect x="32" y="58" width="36" height="36" stroke="white" strokeWidth="1.5" fill="none" />
        <line x1="50" y1="58" x2="50" y2="94" stroke="white" strokeWidth="1" /> {/* Divisória Vertical */}
        <line x1="32" y1="76" x2="68" y2="76" stroke="white" strokeWidth="1" /> {/* Divisória Horizontal */}
        
        {/* Linhas das venezianas - Lado Esquerdo */}
        <g stroke="white" strokeWidth="0.8">
          <line x1="35" y1="80" x2="47" y2="80" />
          <line x1="35" y1="83" x2="47" y2="83" />
          <line x1="35" y1="86" x2="47" y2="86" />
          <line x1="35" y1="89" x2="47" y2="89" />
        </g>
        
        {/* Linhas das venezianas - Lado Direito */}
        <g stroke="white" strokeWidth="0.8">
          <line x1="53" y1="80" x2="65" y2="80" />
          <line x1="53" y1="83" x2="65" y2="83" />
          <line x1="53" y1="86" x2="65" y2="86" />
          <line x1="53" y1="89" x2="65" y2="89" />
        </g>
      </g>
      
      {/* Ícone de Trigo/Folha Esquerda */}
      <g transform="translate(10, 100)" fill="#d4af37">
         <path d="M12,12 Q18,6 24,12 Q18,18 12,12 M6,24 Q12,18 18,24 Q12,30 6,24 M0,36 Q6,30 12,36 Q6,42 0,36" transform="rotate(-10)" />
      </g>

      {/* Ícone de Trigo/Folha Direita */}
      <g transform="translate(165, 100)" fill="#d4af37">
         <path d="M12,12 Q6,6 0,12 Q6,18 12,12 M18,24 Q12,18 6,24 Q12,30 18,24 M24,36 Q18,30 12,36 Q18,42 24,36" transform="rotate(10)" />
      </g>
    </svg>
  );
};
