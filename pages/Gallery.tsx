
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { db } from '../services/db';
import { GalleryItem, GalleryCategory } from '../types';
import { Image as ImageIcon, Video, X, PlayCircle, AlertTriangle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Sanitizer } from '../utils/sanitizer';

export const Gallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [filter, setFilter] = useState<'all' | GalleryCategory>('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedItem, setSelectedItem] = useState<GalleryItem | null>(null);

  useEffect(() => {
    loadGallery();
  }, []);

  const loadGallery = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await db.getGalleryItems();
      setItems(data);
    } catch (e: any) {
      console.error("Failed to load gallery", e);
      setError(e.message || "Não foi possível carregar as fotos.");
    } finally {
      setLoading(false);
    }
  };

  // Lógica de ordenação personalizada solicitada pelo usuário
  const filteredItems = useMemo(() => {
    if (filter === 'all') {
      // Separar por tipo e categoria
      const extVideos = items.filter(i => i.category === 'exterior' && i.type === 'video');
      const intVideos = items.filter(i => i.category === 'interior' && i.type === 'video');
      const extPhotos = items.filter(i => i.category === 'exterior' && i.type === 'image');
      const intPhotos = items.filter(i => i.category === 'interior' && i.type === 'image');

      const sorted: GalleryItem[] = [];

      // 1. Vídeos primeiro: Exterior depois Interior
      const maxVideos = Math.max(extVideos.length, intVideos.length);
      for (let i = 0; i < maxVideos; i++) {
        if (extVideos[i]) sorted.push(extVideos[i]);
        if (intVideos[i]) sorted.push(intVideos[i]);
      }

      // 2. Intercalar Fotos: Exterior, Interior, Exterior, Interior...
      const maxPhotos = Math.max(extPhotos.length, intPhotos.length);
      for (let i = 0; i < maxPhotos; i++) {
        if (extPhotos[i]) sorted.push(extPhotos[i]);
        if (intPhotos[i]) sorted.push(intPhotos[i]);
      }

      return sorted;
    } else {
      // Seção específica: Vídeos primeiro, depois Fotos
      const categoryItems = items.filter(item => item.category === filter);
      const videos = categoryItems.filter(i => i.type === 'video');
      const photos = categoryItems.filter(i => i.type === 'image');
      return [...videos, ...photos];
    }
  }, [items, filter]);

  // Navegação da Galeria
  const handleNavigate = useCallback((direction: 'prev' | 'next') => {
    if (!selectedItem) return;
    
    const currentIndex = filteredItems.findIndex(i => i.id === selectedItem.id);
    if (currentIndex === -1) return;

    let newIndex;
    if (direction === 'next') {
        newIndex = (currentIndex + 1) % filteredItems.length;
    } else {
        newIndex = (currentIndex - 1 + filteredItems.length) % filteredItems.length;
    }

    setSelectedItem(filteredItems[newIndex]);
  }, [selectedItem, filteredItems]);

  // Atalhos de Teclado
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (!selectedItem) return;
        
        if (e.key === 'ArrowRight') handleNavigate('next');
        if (e.key === 'ArrowLeft') handleNavigate('prev');
        if (e.key === 'Escape') setSelectedItem(null);
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedItem, handleNavigate]);

  const FilterButton = ({ type, label }: { type: 'all' | GalleryCategory, label: string }) => (
    <button
      onClick={() => setFilter(type)}
      className={`px-6 py-2 rounded-full text-sm font-bold transition-all ${
        filter === type
          ? 'bg-chalet-gold text-white shadow-md transform scale-105'
          : 'bg-white text-gray-600 border border-gray-200 hover:bg-chalet-beige'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="min-h-screen bg-chalet-beige/20 py-12 px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="font-serif text-4xl text-chalet-green mb-4">Nossa Galeria</h1>
          <p className="text-gray-600 max-w-2xl mx-auto italic">
            "Sinta a paz desse lugar através das lentes."
          </p>
        </div>

        {/* Filters */}
        <div className="flex justify-center gap-4 mb-10 overflow-x-auto pb-2">
          <FilterButton type="all" label="Todos" />
          <FilterButton type="exterior" label="Exterior" />
          <FilterButton type="interior" label="Interior" />
        </div>

        {error && (
            <div className="max-w-md mx-auto mb-10 bg-red-50 border border-red-100 p-6 rounded-xl text-center">
                <AlertTriangle className="text-red-500 mx-auto mb-3" size={32} />
                <h3 className="text-red-800 font-bold mb-1">Ops! Erro de conexão</h3>
                <p className="text-red-600 text-sm mb-4">{error}</p>
                <button 
                    onClick={loadGallery}
                    className="bg-red-600 text-white px-4 py-2 rounded-lg text-sm font-bold hover:bg-red-700"
                >
                    Tentar novamente
                </button>
            </div>
        )}

        {loading ? (
          <div className="text-center py-20">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-chalet-green mx-auto"></div>
            <p className="mt-4 text-chalet-green font-medium">Buscando momentos...</p>
          </div>
        ) : filteredItems.length === 0 && !error ? (
          <div className="text-center py-24 bg-white/50 backdrop-blur-sm rounded-3xl shadow-inner border border-white/40">
            <ImageIcon size={64} className="mx-auto mb-4 text-gray-300" />
            <h3 className="text-xl text-gray-500 font-serif">A galeria está sendo preparada</h3>
            <p className="text-gray-400 text-sm mt-2">Em breve, novas fotos deste paraíso.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredItems.map((item) => {
              // SECURITY CHECK: Ensure URL is safe before rendering in DOM
              const safeUrl = Sanitizer.safeUrl(item.url);
              if (!safeUrl) return null; // Skip invalid items

              const isYt = isYoutube(safeUrl);
              return (
                <div 
                  key={item.id}
                  onClick={() => setSelectedItem(item)}
                  className="group relative cursor-pointer overflow-hidden rounded-2xl shadow-lg bg-white aspect-[4/3] transform transition-all duration-300 hover:-translate-y-2 hover:shadow-2xl"
                >
                  {item.type === 'image' ? (
                    <img 
                      src={safeUrl} 
                      alt={item.description || 'Galeria Serra Crato'} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                      loading="lazy"
                    />
                  ) : (
                    <div className="w-full h-full bg-black flex items-center justify-center relative">
                      {isYt ? (
                        <img 
                          src={`https://img.youtube.com/vi/${getYouTubeId(safeUrl)}/hqdefault.jpg`}
                          className="absolute inset-0 w-full h-full object-cover opacity-60"
                          alt="Video Thumbnail"
                        />
                      ) : (
                        <video src={safeUrl} className="absolute inset-0 w-full h-full object-cover opacity-60" />
                      )}
                      <div className="z-10 bg-white/20 p-4 rounded-full backdrop-blur-md border border-white/30 group-hover:scale-125 transition-transform duration-500">
                         <PlayCircle className="text-white w-10 h-10" />
                      </div>
                    </div>
                  )}
                  
                  {/* Overlay */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-6 z-20">
                     <span className="text-chalet-gold text-[10px] font-bold uppercase tracking-[0.3em] mb-1">
                       {item.category}
                     </span>
                     {item.description && (
                       <p className="text-white font-serif text-lg leading-tight">{item.description}</p>
                     )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Lightbox Modal */}
      {selectedItem && (
        <div className="fixed inset-0 z-[100] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-fade-in" onClick={() => setSelectedItem(null)}>
          {/* Close Button */}
          <button className="absolute top-6 right-6 text-white hover:text-chalet-gold transition transform hover:scale-110 z-50" onClick={() => setSelectedItem(null)}>
            <X size={32} />
          </button>
          
          {/* Navigation Buttons (Desktop & Mobile) */}
          {filteredItems.length > 1 && (
            <>
                <button 
                    className="absolute left-2 md:left-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all z-50"
                    onClick={(e) => { e.stopPropagation(); handleNavigate('prev'); }}
                >
                    <ChevronLeft size={32} />
                </button>
                <button 
                    className="absolute right-2 md:right-8 top-1/2 -translate-y-1/2 bg-white/10 hover:bg-white/20 text-white p-3 rounded-full backdrop-blur-sm transition-all z-50"
                    onClick={(e) => { e.stopPropagation(); handleNavigate('next'); }}
                >
                    <ChevronRight size={32} />
                </button>
            </>
          )}

          <div className="max-w-6xl w-full flex flex-col items-center justify-center relative" onClick={e => e.stopPropagation()}>
             {selectedItem.type === 'image' ? (
               <img src={Sanitizer.safeUrl(selectedItem.url)} className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl border-4 border-white/10" alt="Full view" />
             ) : (
               <div className="w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl">
                  {isYoutube(selectedItem.url) ? (
                     <iframe width="100%" height="100%" src={convertUrlToEmbed(Sanitizer.safeUrl(selectedItem.url))} frameBorder="0" allowFullScreen></iframe>
                  ) : (
                     <video key={selectedItem.url} controls autoPlay className="w-full h-full"><source src={Sanitizer.safeUrl(selectedItem.url)} /></video>
                  )}
               </div>
             )}
             <div className="mt-8 text-center max-w-2xl px-4 animate-slide-up">
                <div className="flex items-center justify-center gap-2 mb-2">
                    <span className="inline-block px-4 py-1 border-2 border-chalet-gold/40 text-chalet-gold rounded-full text-[10px] uppercase tracking-widest">
                        {selectedItem.category}
                    </span>
                    <span className="text-gray-500 text-xs">
                        {filteredItems.findIndex(i => i.id === selectedItem.id) + 1} / {filteredItems.length}
                    </span>
                </div>
                {selectedItem.description && <p className="text-white font-serif text-2xl leading-relaxed italic">{selectedItem.description}</p>}
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

function getYouTubeId(url: string) {
  if (!url) return null;
  const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
  const match = url.match(regExp);
  return (match && match[2].length === 11) ? match[2] : null;
}

function isYoutube(url: string) { return !!getYouTubeId(url); }

function convertUrlToEmbed(url: string) {
    const id = getYouTubeId(url);
    if(id) return `https://www.youtube.com/embed/${id}?autoplay=1`;
    return url; 
}
