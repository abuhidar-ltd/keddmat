import { useState } from 'react';
import { ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface ImageGalleryProps { images: string[]; mainImage?: string | null; alt?: string; }

const ImageGallery = ({ images, mainImage, alt = 'صورة' }: ImageGalleryProps) => {
  const allImages = mainImage ? [mainImage, ...images] : images;
  const [currentIndex, setCurrentIndex] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (allImages.length === 0) return null;

  const goNext = () => { setCurrentIndex((prev) => (prev + 1) % allImages.length); };
  const goPrev = () => { setCurrentIndex((prev) => (prev - 1 + allImages.length) % allImages.length); };

  return (
    <>
      <div className="relative">
        <div className="aspect-square bg-muted relative overflow-hidden cursor-pointer" onClick={() => setLightboxOpen(true)}>
          <img src={allImages[currentIndex]} alt={alt} className="w-full h-full object-cover" />
          {allImages.length > 1 && (
            <>
              <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"><ChevronLeft className="h-4 w-4" /></Button>
              <Button size="icon" variant="secondary" onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full opacity-80 hover:opacity-100"><ChevronRight className="h-4 w-4" /></Button>
            </>
          )}
          {allImages.length > 1 && ( <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-black/60 text-white text-xs px-2 py-1 rounded-full">{currentIndex + 1} / {allImages.length}</div> )}
        </div>
        {allImages.length > 1 && (
          <div className="flex gap-1 mt-2 overflow-x-auto pb-1">
            {allImages.map((img, idx) => (
              <button key={idx} onClick={() => setCurrentIndex(idx)} className={`flex-shrink-0 w-12 h-12 rounded-md overflow-hidden border-2 transition-all ${idx === currentIndex ? 'border-primary' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                <img src={img} alt="" className="w-full h-full object-cover" />
              </button>
            ))}
          </div>
        )}
      </div>
      {lightboxOpen && (
        <div className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center p-4" onClick={() => setLightboxOpen(false)}>
          <Button size="icon" variant="ghost" onClick={() => setLightboxOpen(false)} className="absolute top-4 right-4 text-white hover:bg-white/20"><X className="h-6 w-6" /></Button>
          {allImages.length > 1 && (
            <>
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); goPrev(); }} className="absolute left-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"><ChevronLeft className="h-8 w-8" /></Button>
              <Button size="icon" variant="ghost" onClick={(e) => { e.stopPropagation(); goNext(); }} className="absolute right-4 top-1/2 -translate-y-1/2 text-white hover:bg-white/20 h-12 w-12"><ChevronRight className="h-8 w-8" /></Button>
            </>
          )}
          <img src={allImages[currentIndex]} alt={alt} className="max-w-full max-h-[85vh] object-contain" onClick={(e) => e.stopPropagation()} />
          {allImages.length > 1 && ( <div className="absolute bottom-4 left-1/2 -translate-x-1/2 text-white text-sm">{currentIndex + 1} / {allImages.length}</div> )}
        </div>
      )}
    </>
  );
};

export default ImageGallery;