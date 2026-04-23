import { useLanguage } from '@/hooks/useLanguage';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import { LayoutGrid } from 'lucide-react';
import { CATEGORIES } from '@/lib/categoryIcons';

interface CategoryFilterProps { selectedCategory: string | null; onCategoryChange: (category: string) => void; }

const CategoryFilter = ({ selectedCategory, onCategoryChange }: CategoryFilterProps) => {
  const { t } = useLanguage();
  const isAllSelected = !selectedCategory || selectedCategory === 'all';

  return (
    <div className="w-full">
      <ScrollArea className="w-full whitespace-nowrap">
        <div className="flex gap-2 pb-2">
          <button
            key="all"
            onClick={() => onCategoryChange('all')}
            className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all border ${
              isAllSelected
                ? 'bg-[#2D7D46] text-white border-[#2D7D46] shadow-md'
                : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:border-[#2D7D46]/50'
            }`}
          >
            <LayoutGrid className="h-4 w-4" />
            <span>{t('categories.all')}</span>
          </button>
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const isSelected = selectedCategory === cat.category;
            return (
              <button
                key={cat.category}
                onClick={() => onCategoryChange(cat.category)}
                className={`flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-bold transition-all border ${
                  isSelected
                    ? 'bg-[#2D7D46] text-white border-[#2D7D46] shadow-md'
                    : 'bg-white text-[#1A1A2E] border-[#E5E7EB] hover:border-[#2D7D46]/50'
                }`}
              >
                <Icon className="h-4 w-4" />
                <span>{t(cat.labelKey)}</span>
              </button>
            );
          })}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  );
};

export default CategoryFilter;
