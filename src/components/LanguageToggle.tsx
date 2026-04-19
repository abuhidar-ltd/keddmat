import { Button } from '@/components/ui/button';
import { useLanguage } from '@/hooks/useLanguage';
import { Globe } from 'lucide-react';

const LanguageToggle = () => {
  const { language, setLanguage } = useLanguage();
  const toggleLanguage = () => { setLanguage(language === 'ar' ? 'en' : 'ar'); };
  return (
    <Button variant="ghost" size="sm" onClick={toggleLanguage} className="gap-2">
      <Globe className="h-4 w-4" />
      <span>{language === 'ar' ? 'EN' : 'ع'}</span>
    </Button>
  );
};

export default LanguageToggle;