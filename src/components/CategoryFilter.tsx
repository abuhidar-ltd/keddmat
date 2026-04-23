import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LayoutGrid } from 'lucide-react';
import { CATEGORIES } from '@/lib/categoryIcons';

interface CategoryFilterProps { selectedCategory: string | null; onCategoryChange: (category: string) => void; }

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const { t } = useLanguage();

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          {(() => {
            const isAllSelected = !selectedCategory || selectedCategory === 'all';
            return (
              <Button
                key="all"
                variant={isAllSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange('all')}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 transition-all font-bold text-base backdrop-blur-sm ${isAllSelected ? 'bg-primary text-white shadow-lg border-2 border-white/30 scale-105' : 'bg-primary/90 text-white hover:bg-primary border-2 border-primary/50 hover:scale-102 shadow-md'}`}
              >
                <LayoutGrid className="h-5 w-5" />
                <span>{t('categories.all')}</span>
              </Button>
            );
          })()}
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.category;
            return (
              <Button
                key={cat.category}
                variant={isSelected ? 'default' : 'outline'}
                size="sm"
                onClick={() => onCategoryChange(cat.category)}
                className={`flex items-center gap-2 rounded-full px-5 py-2.5 transition-all font-bold text-base backdrop-blur-sm ${isSelected ? 'bg-primary text-white shadow-lg border-2 border-white/30 scale-105' : 'bg-primary/90 text-white hover:bg-primary border-2 border-primary/50 hover:scale-102 shadow-md'}`}
              >
                <Icon className="h-5 w-5" />
                <span>{t(cat.labelKey)}</span>
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
