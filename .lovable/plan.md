

## Plan: Four Changes to the Platform

### 1. Phone Number Validation (9 digits exactly)
Update `src/pages/Auth.tsx` registration schema to enforce exactly 9 digits for merchant phone numbers. Add a validation that strips non-digits and checks `length === 9`. Show error message in red if invalid.

### 2. Theme Redesign - White-based with colorful gradients
Redesign the color scheme inspired by the uploaded logo (green, orange, blue, yellow on white background) while keeping the glass effect aesthetic.

**Files:** `src/index.css`, `src/pages/Index.tsx`, `tailwind.config.ts`

Changes:
- Switch `:root` CSS variables from dark teal to a white/light base: `--background` white, `--foreground` dark, `--card` white with subtle shadows
- Add colorful gradient accents using the logo colors: green (#4CAF50), orange (#FF9800), blue (#1565C0), yellow (#FFC107)
- Keep glass-card effect but adapt for light theme (use colored shadows instead of white/10 borders)
- Update bokeh background to use the four logo colors with soft gradients on white
- Keep category glow colors but adapt for light background
- Update auth page, header, footer to match new light theme
- Maintain the premium feel with gradient borders, subtle shadows, and smooth animations

### 3. Admin Panel - Add Call Clicks Counter
The KPI for call clicks already exists in `AdminPanel.tsx` (line 102). Verify it's working. If the `admin-data` edge function doesn't return `callClicks`, update it.

**File:** `supabase/functions/admin-data/index.ts` (verify callClicks is returned)

### 4. Emergency Maintenance - Sort Providers by Ratings
Update `src/components/EmergencyRequestModal.tsx` to fetch ratings for each provider and sort by average rating (highest first).

Changes:
- After fetching providers, also fetch ratings from `ratings` table for those providers
- Calculate average rating per provider
- Sort: highest rated first, then emergency mode, then alphabetical
- Display rating stars on each provider card

### Technical Details

**Phone validation** (`Auth.tsx`):
```typescript
phone: z.string().refine(val => val.replace(/[^0-9]/g, '').length === 9, 
  { message: isAr ? 'رقم الهاتف يجب أن يكون 9 خانات' : 'Phone must be 9 digits' })
```

**Emergency sorting** (`EmergencyRequestModal.tsx`):
- Add `avg_rating` to ProviderProfile interface
- Fetch ratings: `supabase.from('ratings').select('merchant_id, rating').in('merchant_id', providerIds)`
- Group and average, then sort descending

**Theme colors** (from logo):
- Primary green: `#2E7D32` / `#4CAF50`
- Orange: `#F57C00` / `#FF9800`  
- Blue: `#1565C0` / `#2196F3`
- Yellow: `#F9A825` / `#FFC107`
- Background: white `#FFFFFF`
- Cards: white with colored border gradients

