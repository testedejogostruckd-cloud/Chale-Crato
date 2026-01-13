
import React, { useState, useEffect, useRef } from 'react';
import { db } from '../services/db';
import { GalleryItem, GalleryCategory } from '../types';
import { Validators } from '../utils/validators';
import { 
  Trash2, 
  Video, 
  Image as ImageIcon, 
  Pencil, 
  Save, 
  X,
  Loader2,
  GripVertical,
  CheckCircle2
} from 'lucide-react';

export const AdminGallery: React.FC = () => {
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | GalleryCategory>('all');
  const [isSaving, setIsSaving] = useState(false);
  
  // Actions State
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [editingItem, setEditingItem] = useState<GalleryItem | null>(null);

  // Drag State
  const [draggedItemIndex, setDraggedItemIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    fetchItemsAndNormalize();
  }, []);

  const fetchItemsAndNormalize = async () => {
    setLoading(true);
    try {
      const data = await db.getGalleryItems();
      
      // --- AUTO-CORREÇÃO NA INICIALIZAÇÃO ---
      const needsNormalization = data.length > 1 && data.every(i => i.displayOrder === 0);
      
      if (needsNormalization) {
        console.log("Detectada necessidade de normalização de ordem. Corrigindo...");
        const normalizedItems = data.map((item, index) => ({
            ...item,
            displayOrder: index
        }));
        setItems(normalizedItems);
        await db.updateGalleryOrders(normalizedItems.map(i => ({ id: i.id, displayOrder: i.displayOrder })));
      } else {
        setItems(data);
      }
    } catch (e) {
        console.error(e);
    } finally {
        setLoading(false);
    }
  };

  const getFilteredItems = () => {
    if (filter === 'all') return items;
    return items.filter(i => i.category === filter);
  };

  const displayedItems = getFilteredItems();

  const handleDelete = async (e: React.MouseEvent, id: string, url: string) => {
    e.stopPropagation();
    if (!confirm('Atenção: Esta ação não pode ser desfeita. Deseja excluir permanentemente?')) return;
    
    setDeletingId(id);
    try {
      await db.deleteGalleryItem(id, url);
      setItems(prev => prev.filter(i => i.id !== id));
    } catch (err: any) {
      alert(`Erro ao excluir: ${err.message}`);
    } finally {
      setDeletingId(null);
    }
  };

  const handleEditSave = async () => {
    if (!editingItem) return;

    if (editingItem.description && !Validators.description(editingItem.description)) {
        alert("A descrição é muito longa (máximo 200 caracteres).");
        return;
    }

    try {
        await db.updateGalleryItem(editingItem.id, {
            category: editingItem.category,
            description: editingItem.description
        });
        setItems(prev => prev.map(item => item.id === editingItem.id ? editingItem : item));
        setEditingItem(null);
    } catch (e: any) {
        alert('Erro ao atualizar: ' + e.message);
    }
  };

  const handleDragStart = (e: React.DragEvent, position: number) => {
    dragItem.current = position;
    setDraggedItemIndex(position);
    e.dataTransfer.effectAllowed = "move";
    const el = e.target as HTMLElement;
    el.classList.add('opacity-50');
  };

  const handleDragEnter = (e: React.DragEvent, position: number) => {
    dragOverItem.current = position;
    e.preventDefault();
  };
  
  const handleDragEnd = async (e: React.DragEvent) => {
    e.preventDefault();
    const el = e.target as HTMLElement;
    el.classList.remove('opacity-50');
    setDraggedItemIndex(null);

    const srcIdx = dragItem.current;
    const destIdx = dragOverItem.current;

    if (srcIdx === null || destIdx === null || srcIdx === destIdx) return;

    setIsSaving(true);
    let globalItemsNormalized = [...items];
    let currentList = filter === 'all' 
        ? [...globalItemsNormalized]
        : globalItemsNormalized.filter(i => i.category === filter);

    const itemToMove = currentList[srcIdx];
    currentList.splice(srcIdx, 1);
    currentList.splice(destIdx, 0, itemToMove);

    let updates: { id: string, displayOrder: number }[] = [];

    if (filter === 'all') {
         updates = currentList.map((item, index) => ({
            id: item.id,
            displayOrder: index
        }));
    } else {
        const originalFilteredList = globalItemsNormalized.filter(i => i.category === filter);
        const availableSlots = originalFilteredList.map(i => i.displayOrder).sort((a, b) => a - b);
        updates = currentList.map((item, index) => ({
            id: item.id,
            displayOrder: availableSlots[index]
        }));
    }

    const newGlobalItems = globalItemsNormalized.map(gItem => {
        const update = updates.find(u => u.id === gItem.id);
        return update ? { ...gItem, displayOrder: update.displayOrder } : gItem;
    });

    newGlobalItems.sort((a, b) => a.displayOrder - b.displayOrder);
    setItems(newGlobalItems);

    dragItem.current = null;
    dragOverItem.current = null;

    try {
        await db.updateGalleryOrders(updates);
    } catch (err) {
        console.error("Falha ao salvar ordem", err);
    } finally {
        setIsSaving(false);
    }
  };

  const FilterTab = ({ type, label }: { type: 'all' | GalleryCategory, label: string }) => (
    <button 
        onClick={() => setFilter(type)}
        className={`px-4 py-2 text-sm font-bold rounded-t-lg transition-colors ${
            filter === type 
            ? 'bg-white text-chalet-green border-t-2 border-chalet-gold shadow-sm' 
            : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
        }`}
    >
        {label}
    </button>
  );

  if (loading) return <div className="p-12 text-center text-chalet-green"><Loader2 className="animate-spin inline mr-2"/> Carregando galeria...</div>;

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 relative">
      {/* Edit Modal */}
      {editingItem && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 animate-fade-in">
                <div className="flex justify-between items-center mb-6">
                    <h3 className="text-xl font-bold text-chalet-green">Editar Mídia</h3>
                    <button onClick={() => setEditingItem(null)} className="text-gray-400 hover:text-red-500">
                        <X size={24} />
                    </button>
                </div>
                
                <div className="space-y-4">
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Categoria</label>
                        <select 
                            value={editingItem.category}
                            onChange={e => setEditingItem({...editingItem, category: e.target.value as GalleryCategory})}
                            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-chalet-gold outline-none"
                        >
                            <option value="exterior">Exterior</option>
                            <option value="interior">Interior</option>
                        </select>
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1">Descrição</label>
                        <input 
                            type="text" 
                            value={editingItem.description || ''}
                            onChange={e => setEditingItem({...editingItem, description: e.target.value})}
                            className="w-full p-3 border border-gray-300 rounded-md bg-white text-gray-900 focus:ring-2 focus:ring-chalet-gold outline-none"
                            placeholder="Descreva esta mídia..."
                        />
                        <p className="text-xs text-gray-400 mt-1 text-right">
                           {(editingItem.description || '').length} / 200 caracteres
                        </p>
                    </div>
                    
                    <button 
                        onClick={handleEditSave}
                        className="w-full bg-chalet-green text-white py-3 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-chalet-greenLight mt-4 transition-colors"
                    >
                        <Save size={18} /> Salvar Alterações
                    </button>
                </div>
            </div>
        </div>
      )}

      <div className="flex justify-between items-end mb-8">
        <div>
            <h1 className="text-3xl font-serif text-chalet-green">Gestão da Galeria</h1>
            <p className="text-gray-500 text-sm mt-1">
                Arraste os itens para reordenar. A nova ordem é salva automaticamente.
            </p>
        </div>
        {isSaving && (
            <div className="flex items-center gap-2 text-chalet-gold text-sm font-bold animate-pulse">
                <Loader2 size={16} className="animate-spin" /> Salvando ordem...
            </div>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-gray-200 mb-4">
        <FilterTab type="all" label="Todos" />
        <FilterTab type="exterior" label="Exterior" />
        <FilterTab type="interior" label="Interior" />
      </div>

      {/* Gallery List (Draggable) */}
      <div className="bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="px-6 py-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="font-bold text-gray-700">Mídias ({displayedItems.length})</h2>
        </div>
        
        {displayedItems.length === 0 ? (
            <div className="p-12 text-center text-gray-500">
                <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ImageIcon className="text-gray-300" size={32} />
                </div>
                <p>Nenhuma mídia encontrada nesta categoria.</p>
            </div>
        ) : (
            <div className="space-y-1 p-6">
                {displayedItems.map((item, index) => (
                    <div 
                        key={item.id} 
                        draggable
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                        className={`flex items-center gap-4 p-3 rounded-lg border transition-all group cursor-move select-none
                            ${draggedItemIndex === index ? 'bg-chalet-gold/10 border-chalet-gold border-dashed opacity-50' : 'bg-gray-50 border-gray-100 hover:shadow-md'}
                        `}
                    >
                        {/* Drag Handle */}
                        <div className="text-gray-400 cursor-move hover:text-chalet-green p-2">
                            <GripVertical size={20} />
                        </div>

                        {/* Thumbnail */}
                        <div className="h-16 w-24 flex-shrink-0 bg-black rounded overflow-hidden relative border border-gray-200">
                            {item.type === 'image' ? (
                                <img src={item.url} alt="" className="w-full h-full object-cover pointer-events-none" />
                            ) : (
                                <div className="w-full h-full flex items-center justify-center">
                                    <video src={item.url} className="w-full h-full object-cover opacity-60" muted />
                                    <Video size={20} className="absolute text-white" />
                                </div>
                            )}
                        </div>
                        
                        {/* Details */}
                        <div className="flex-grow">
                             <div className="flex items-center gap-2 mb-1">
                                <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${item.category === 'exterior' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'}`}>
                                    {item.category}
                                </span>
                                <span className="text-[10px] text-gray-300">Ord: {item.displayOrder}</span>
                             </div>
                             <p className="text-sm text-gray-700 font-medium truncate w-full max-w-xs md:max-w-md">
                                {item.description || <span className="text-gray-300 italic">Sem descrição</span>}
                             </p>
                        </div>

                        {/* Actions */}
                        <div className="flex gap-2">
                             <button 
                                onClick={() => setEditingItem(item)}
                                className="p-2 text-gray-400 hover:text-chalet-gold transition-colors"
                                title="Editar"
                            >
                                <Pencil size={18} />
                            </button>
                            <button 
                                onClick={(e) => handleDelete(e, item.id, item.url)}
                                className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                                title="Excluir"
                            >
                                {deletingId === item.id ? <Loader2 className="animate-spin" size={18}/> : <Trash2 size={18} />}
                            </button>
                        </div>
                    </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};
