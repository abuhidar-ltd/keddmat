/**
 * SUBCATEGORY RENAME MIGRATION — run in Supabase SQL editor
 * (required because `profiles.subcategories` stores raw Arabic IDs)
 *
 * UPDATE profiles
 * SET subcategories = array_replace(subcategories, 'الدهان والطلاء', 'دهان الجدران و الفروشات')
 * WHERE subcategories @> ARRAY['الدهان والطلاء'];
 *
 * UPDATE profiles
 * SET subcategories = array_replace(subcategories, 'البلاط والأرضيات', 'التبليط و الباركيه')
 * WHERE subcategories @> ARRAY['البلاط والأرضيات'];
 *
 * UPDATE profiles
 * SET subcategories = array_replace(subcategories, 'برادي', 'البرادي و ورق الجدران')
 * WHERE subcategories @> ARRAY['برادي'];
 *
 * UPDATE profiles
 * SET subcategories = array_replace(subcategories, 'ترميم المنازل', 'شركات ترميم المنازل')
 * WHERE subcategories @> ARRAY['ترميم المنازل'];
 *
 * UPDATE profiles
 * SET subcategories = array_replace(subcategories, 'التصميم الداخلي', 'شركات التصميم الداخلي')
 * WHERE subcategories @> ARRAY['التصميم الداخلي'];
 *
 * UPDATE profiles
 * SET subcategories = array_replace(subcategories, 'دهان الجدران و الفروشات', 'دهان الجدران و الاثاث')
 * WHERE 'دهان الجدران و الفروشات' = ANY(subcategories);
 *
 * UPDATE profiles
 * SET category = 'عامل يومي'
 * WHERE category = 'عامل يومي (مياومة)';
 *
 * UPDATE profiles
 * SET category = 'ونشات سيارات'
 * WHERE category = 'ونشات';
 */

import { Plug, Wrench, Hammer, Paintbrush, Droplets, Truck, Anvil, Settings, Construction, HardHat, type LucideIcon } from "lucide-react";

export interface CategoryInfo {
  icon: LucideIcon;
  labelKey: string;
  category: string;
  color: string;
  hex: string;
}

// All main categories for homepage
export const CATEGORIES: CategoryInfo[] = [
  { icon: Plug, labelKey: "service.electrician", category: "كهربجي", color: "text-[hsl(var(--cat-electrician))]", hex: "#FFD700" },
  { icon: Wrench, labelKey: "service.plumber", category: "موسرجي", color: "text-[hsl(var(--cat-plumber))]", hex: "#00BCD4" },
  { icon: Settings, labelKey: "service.applianceMaintenance", category: "صيانة الأجهزة المنزلية", color: "text-[hsl(var(--cat-maintenance))]", hex: "#FF6B6B" },
  { icon: Droplets, labelKey: "service.cleaning", category: "تنظيف ودراي كلين", color: "text-[hsl(var(--cat-cleaning))]", hex: "#4CAF50" },
  { icon: Truck, labelKey: "service.furnitureMoving", category: "نقل أثاث", color: "text-[hsl(var(--cat-moving))]", hex: "#FF9800" },
  { icon: Hammer, labelKey: "service.carpenter", category: "نجّار", color: "text-[hsl(var(--cat-carpenter))]", hex: "#E65100" },
  { icon: Paintbrush, labelKey: "service.homeDecor", category: "ديكور منزلي", color: "text-[hsl(var(--cat-decor))]", hex: "#FF69B4" },
  { icon: Anvil, labelKey: "service.blacksmith", category: "حداد، زجاج، ألمنيوم", color: "text-[hsl(var(--cat-blacksmith))]", hex: "#64B5F6" },
  { icon: Droplets, labelKey: "service.waterTanks", category: "صهاريج مياه", color: "text-[hsl(var(--cat-plumber))]", hex: "#00BCD4" },
  { icon: Settings, labelKey: "service.roadMechanic", category: "ميكانيكي طرقات", color: "text-[hsl(var(--cat-maintenance))]", hex: "#FF6B6B" },
  { icon: Construction, labelKey: "service.towTrucks", category: "ونشات سيارات", color: "text-[hsl(var(--cat-blacksmith))]", hex: "#64B5F6" },
  { icon: HardHat, labelKey: "service.dailyWorker", category: "عامل يومي", color: "text-[hsl(var(--cat-moving))]", hex: "#9C27B0" },
];

// No more emergency-only categories - all are on main page now
export const EMERGENCY_ONLY_CATEGORIES: CategoryInfo[] = [];

// All categories (for registration dropdown)
export const ALL_CATEGORIES: CategoryInfo[] = [
  ...CATEGORIES,
  ...EMERGENCY_ONLY_CATEGORIES,
];

export const EMERGENCY_CATEGORIES = [
  "كهربجي",
  "موسرجي",
  "صيانة الأجهزة المنزلية",
  "صهاريج مياه",
  "ميكانيكي طرقات",
  "ونشات سيارات",
  "حداد، زجاج، ألمنيوم",
];

export const isEmergencyCategory = (category: string): boolean => {
  return EMERGENCY_CATEGORIES.includes(category);
};

export const getCategoryInfo = (category: string): CategoryInfo | undefined => {
  return ALL_CATEGORIES.find(c => c.category === category);
};

export interface SubCategory {
  id: string;
  labelAr: string;
  labelEn: string;
}

export const CATEGORY_SUBCATEGORIES: Record<string, SubCategory[]> = {
  'ديكور منزلي': [
    { id: 'دهان الجدران و الاثاث', labelAr: 'دهان الجدران و الاثاث', labelEn: 'Wall Painting & Furniture' },
    { id: 'التبليط و الباركيه', labelAr: 'التبليط و الباركيه', labelEn: 'Tiling & Parquet' },
    { id: 'ديكور الأسقف والجدران', labelAr: 'ديكور الأسقف والجدران', labelEn: 'Ceiling & Wall Decor' },
    { id: 'البرادي و ورق الجدران', labelAr: 'البرادي و ورق الجدران', labelEn: 'Curtains & Wallpaper' },
    { id: 'التنجيد', labelAr: 'التنجيد', labelEn: 'Upholstery' },
    { id: 'خدمات العزل', labelAr: 'خدمات العزل', labelEn: 'Insulation Services' },
    { id: 'شركات التصميم الداخلي', labelAr: 'شركات التصميم الداخلي', labelEn: 'Interior Design Companies' },
    { id: 'ديكورات الحدائق', labelAr: 'ديكورات الحدائق', labelEn: 'Garden Decor' },
    { id: 'شركات ترميم المنازل', labelAr: 'شركات ترميم المنازل', labelEn: 'Home Renovation Companies' },
    { id: 'الاثاث المستعمل', labelAr: 'الاثاث المستعمل', labelEn: 'Used Furniture' },
  ],
  'نجّار': [
    { id: 'نجار متنقل', labelAr: 'نجار متنقل', labelEn: 'Mobile Carpenter' },
    { id: 'المطابخ', labelAr: 'المطابخ', labelEn: 'Kitchens' },
    { id: 'الأبواب', labelAr: 'الأبواب', labelEn: 'Doors' },
    { id: 'تفصيل المفروشات', labelAr: 'تفصيل المفروشات', labelEn: 'Custom Furniture' },
  ],
  'صيانة الأجهزة المنزلية': [
    { id: 'صيانة المكيفات', labelAr: 'صيانة المكيفات', labelEn: 'AC Maintenance' },
    { id: 'صيانة الغسالات والجلايات', labelAr: 'صيانة الغسالات والجلايات', labelEn: 'Washer & Dishwasher Maintenance' },
    { id: 'صيانة الأفران', labelAr: 'صيانة الأفران', labelEn: 'Oven Maintenance' },
    { id: 'صيانة الثلاجات', labelAr: 'صيانة الثلاجات', labelEn: 'Refrigerator Maintenance' },
    { id: 'صيانة المصاعد', labelAr: 'صيانة المصاعد', labelEn: 'Elevator Maintenance' },
    { id: 'فلاتر مياه', labelAr: 'فلاتر مياه', labelEn: 'Water Filters' },
  ],
  'تنظيف ودراي كلين': [
    { id: 'تنظيف المنازل والشركات', labelAr: 'تنظيف المنازل والشركات', labelEn: 'Home & Office Cleaning' },
    { id: 'تنظيف الكنب والسجاد', labelAr: 'تنظيف الكنب والسجاد', labelEn: 'Sofa & Carpet Cleaning' },
    { id: 'غسيل ودراي كلين سيارات', labelAr: 'غسيل ودراي كلين سيارات', labelEn: 'Car Wash & Dry Clean' },
  ],
  'حداد، زجاج، ألمنيوم': [
    { id: 'حدادة وحمايات', labelAr: 'حدادة وحمايات', labelEn: 'Blacksmith & Protection' },
    { id: 'ألمنيوم وأباجورات', labelAr: 'ألمنيوم وأباجورات', labelEn: 'Aluminum & Shutters' },
    { id: 'زجاج وسيكوريت', labelAr: 'زجاج وسيكوريت', labelEn: 'Glass & Securit' },
  ],
};

export const getSubcategories = (category: string): SubCategory[] => {
  return CATEGORY_SUBCATEGORIES[category] || [];
};

// Backward compatibility alias
export const DECOR_SUBCATEGORIES = CATEGORY_SUBCATEGORIES['ديكور منزلي'];
