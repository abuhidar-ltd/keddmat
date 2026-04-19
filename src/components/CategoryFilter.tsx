import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LayoutGrid, Zap, Wrench, Hammer, Shield, Home, Sparkles, Truck, Settings } from 'lucide-react';

interface CategoryFilterProps { selectedCategory: string | null; onCategoryChange: (category: string) => void; }

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const { t } = useLanguage();
  const categories = [
    { id: 'all', label: t('categories.all'), icon: LayoutGrid },
    { id: 'كهربجي', label: t('categories.electrician'), icon: Zap },
    { id: 'موسرجي', label: t('categories.plumber'), icon: Wrench },
    { id: 'صيانة الأجهزة المنزلية', label: t('categories.applianceRepair'), icon: Settings },
    { id: 'تنظيف ودراي كلين', label: t('categories.cleaning'), icon: Sparkles },
    { id: 'نقل أثاث', label: t('categories.furnitureMoving'), icon: Truck },
    { id: 'نجّار', label: t('categories.carpenter'), icon: Hammer },
    { id: 'ديكور منزلي', label: t('categories.homeDecor'), icon: Home },
    { id: 'حداد، زجاج، ألمنيوم', label: t('categories.blacksmith'), icon: Shield },
  ];

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {categories.map((category) => {
            const Icon = category.icon;
            const isSelected = selectedCategory === category.id || (!selectedCategory && category.id === 'all');
            return (
              <Button
                key={category.id}
                variant={isSelected ? "default" : "outline"}
                size="sm"
                onClick={() => onCategoryChange(category.id)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 transition-all font-bold text-base backdrop-blur-sm ${isSelected ? 'bg-primary text-white shadow-lg border-2 border-white/30 scale-105' : 'bg-primary/90 text-white hover:bg-primary border-2 border-primary/50 hover:scale-102 shadow-md'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{category.label}</span>
              </Button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default CategoryFilter;
