import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import { X, Check, AlertCircle } from 'lucide-react';

interface Props {
  imageSrc: string;
  onCancel: () => void;
  onCropComplete: (croppedBlob: Blob) => void;
  aspect?: number;
  circular?: boolean;
}

const createImage = (url: string): Promise<HTMLImageElement> =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    // CRITICAL FIX: Only set crossOrigin for remote URLs. 
    // Setting it for data: URIs (local files) breaks Safari/iOS and some Android webviews.
    if (!url.startsWith('data:')) {
        image.setAttribute('crossOrigin', 'anonymous');
    }
    image.src = url;
  });

export const ImageCropper: React.FC<Props> = ({ 
  imageSrc, 
  onCancel, 
  onCropComplete, 
  aspect = 4/3, 
  circular = false 
}) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const onCropChange = (crop: { x: number; y: number }) => {
    setCrop(crop);
  };

  const onZoomChange = (zoom: number) => {
    setZoom(zoom);
  };

  const onCropCompleteHandler = useCallback((_croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const showCroppedImage = useCallback(async () => {
    try {
      setError(null);
      if (!croppedAreaPixels) return;
      setIsProcessing(true);
      
      const image = await createImage(imageSrc);
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Não foi possível criar o contexto de imagem.');
      }

      // Optimization: Resize image to prevent memory crash on mobile
      // 1024px is the sweet spot for mobile uploads (fast & good quality)
      const MAX_DIMENSION = 1024; 
      let width = croppedAreaPixels.width;
      let height = croppedAreaPixels.height;

      // Calculate new dimensions keeping aspect ratio
      if (width > MAX_DIMENSION || height > MAX_DIMENSION) {
        const ratio = width / height;
        if (width > height) {
            width = MAX_DIMENSION;
            height = width / ratio;
        } else {
            height = MAX_DIMENSION;
            width = height * ratio;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw image scaled
      ctx.drawImage(
        image,
        croppedAreaPixels.x, // source x
        croppedAreaPixels.y, // source y
        croppedAreaPixels.width, // source width
        croppedAreaPixels.height, // source height
        0, // dest x
        0, // dest y
        width, // dest width
        height // dest height
      );

      // Se for circular, podemos aplicar uma máscara aqui ou confiar no upload como PNG transparente
      // Mas o react-easy-crop apenas visualiza o círculo, o corte final é quadrado.
      // Se quisermos forçar o círculo no arquivo final:
      if (circular) {
         ctx.globalCompositeOperation = 'destination-in';
         ctx.beginPath();
         ctx.arc(width/2, height/2, Math.min(width, height)/2, 0, 2 * Math.PI);
         ctx.fill();
      }

      // Compress and export
      canvas.toBlob(
        (blob) => {
          setIsProcessing(false);
          if (blob) {
            onCropComplete(blob);
          } else {
            setError('Erro ao processar imagem. Tente uma foto menor.');
          }
        },
        'image/png', // Always PNG for circular/transparency
        0.8 
      );
    } catch (e: any) {
      console.error(e);
      setIsProcessing(false);
      setError('Erro técnico: ' + (e.message || 'Falha ao recortar'));
    }
  }, [croppedAreaPixels, imageSrc, onCropComplete, circular]);

  return (
    <div className="fixed inset-0 z-[60] bg-black bg-opacity-95 flex flex-col">
      <div className="relative flex-grow w-full bg-black">
        <Cropper
          image={imageSrc}
          crop={crop}
          zoom={zoom}
          aspect={aspect}
          cropShape={circular ? 'round' : 'rect'}
          showGrid={!circular}
          onCropChange={onCropChange}
          onCropComplete={onCropCompleteHandler}
          onZoomChange={onZoomChange}
        />
      </div>
      
      <div className="bg-white p-4 flex flex-col gap-4 rounded-t-xl">
        {error && (
            <div className="bg-red-50 text-red-600 p-3 rounded text-sm flex items-center gap-2">
                <AlertCircle size={16} /> {error}
            </div>
        )}

        <div className="flex items-center gap-4">
            <span className="text-sm font-bold text-gray-500">Zoom</span>
            <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
        </div>
        
        <div className="flex justify-between gap-4">
            <button
            onClick={onCancel}
            disabled={isProcessing}
            className="flex-1 py-3 border border-red-200 text-red-600 rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-red-50 disabled:opacity-50"
            >
            <X size={18} /> Cancelar
            </button>
            <button
            onClick={showCroppedImage}
            disabled={isProcessing}
            className="flex-1 py-3 bg-chalet-gold text-white rounded-lg font-bold flex items-center justify-center gap-2 hover:bg-chalet-goldHover disabled:opacity-50 shadow-lg"
            >
              {isProcessing ? (
                <span className="animate-pulse">Processando...</span>
              ) : (
                <>
                  <Check size={18} /> Confirmar
                </>
              )}
            </button>
        </div>
      </div>
    </div>
  );
};