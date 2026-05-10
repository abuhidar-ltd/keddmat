import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts';
import { brand } from '@/lib/brand';
import { Link2, MessageCircle, Loader2 } from 'lucide-react';
import type { StoreAnalyticsEvent, Product } from '@/types/keddmat';

interface DayData { date: string; رابط: number; واتساب: number; }

const AnalyticsTab = () => {
  const { user } = useAuth();
  const [events, setEvents] = useState<StoreAnalyticsEvent[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) fetchData();
  }, [user]);

  const fetchData = async () => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const [eventsRes, productsRes] = await Promise.all([
      supabase.from('store_analytics').select('*')
        .eq('store_id', user!.id)
        .gte('created_at', thirtyDaysAgo.toISOString()),
      supabase.from('products').select('id, title').eq('user_id', user!.id),
    ]);

    setEvents((eventsRes.data as StoreAnalyticsEvent[]) || []);
    setProducts((productsRes.data as Product[]) || []);
    setLoading(false);
  };

  const totalLinkClicks = events.filter(e => e.event_type === 'link_click').length;
  const totalWaClicks = events.filter(e => e.event_type === 'whatsapp_click').length;

  const chartData: DayData[] = (() => {
    const days: Record<string, DayData> = {};
    for (let i = 29; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      days[key] = { date: key.slice(5), رابط: 0, واتساب: 0 };
    }
    events.forEach(e => {
      const key = e.created_at.slice(0, 10);
      if (days[key]) {
        if (e.event_type === 'link_click') days[key].رابط++;
        else if (e.event_type === 'whatsapp_click') days[key].واتساب++;
      }
    });
    return Object.values(days);
  })();

  const productWaClicks = products.map(p => ({
    name: p.title,
    clicks: events.filter(e => e.event_type === 'whatsapp_click' && e.product_id === p.id).length,
  })).sort((a, b) => b.clicks - a.clicks);

  if (loading) return <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-brand-purple" /></div>;

  return (
    <div className="space-y-6 p-1">
      {/* Stat Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-[#f3ebfa] to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-[#e2dfff]"><Link2 className="h-6 w-6 text-brand-cyan" /></div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{totalLinkClicks}</p>
              <p className="text-sm text-gray-500">زيارات الرابط</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-0 shadow-md rounded-2xl bg-gradient-to-br from-violet-50 to-white">
          <CardContent className="p-5 flex items-center gap-4">
            <div className="p-3 rounded-xl bg-violet-100"><MessageCircle className="h-6 w-6 text-brand-purple" /></div>
            <div>
              <p className="text-3xl font-extrabold text-gray-900">{totalWaClicks}</p>
              <p className="text-sm text-gray-500">نقرات واتساب</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Activity Chart */}
      <Card className="border-0 shadow-md rounded-2xl">
        <CardHeader><CardTitle className="text-base font-bold">النشاط - آخر 30 يوماً</CardTitle></CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis dataKey="date" tick={{ fontSize: 10 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="رابط" fill={brand.cyan} radius={[3, 3, 0, 0]} />
              <Bar dataKey="واتساب" fill={brand.purple} radius={[3, 3, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Per-product WhatsApp breakdown */}
      {productWaClicks.length > 0 && (
        <Card className="border-0 shadow-md rounded-2xl">
          <CardHeader><CardTitle className="text-base font-bold">نقرات واتساب لكل منتج</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-3">
              {productWaClicks.map(p => (
                <div key={p.name} className="flex items-center justify-between gap-3">
                  <span className="text-sm text-gray-700 flex-1 min-w-0 truncate">{p.name}</span>
                  <div className="flex items-center gap-2">
                    <div className="h-2 rounded-full bg-brand-purple" style={{ width: `${Math.max(8, (p.clicks / (productWaClicks[0]?.clicks || 1)) * 80)}px` }} />
                    <span className="text-sm font-bold text-brand-purple w-8 text-end">{p.clicks}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default AnalyticsTab;
