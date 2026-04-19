import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import RatingStars from '@/components/RatingStars';
import { toast } from 'sonner';
import { Send, MessageSquare, ChevronDown, ChevronUp } from 'lucide-react';

interface Rating { id: string; customer_name: string; rating: number; comment: string | null; created_at: string; }
interface RatingSectionProps { merchantId: string; dir: string; }

const RatingSection = ({ merchantId, dir }: RatingSectionProps) => {
  const [ratings, setRatings] = useState<Rating[]>([]);
  const [avgRating, setAvgRating] = useState(0);
  const [name, setName] = useState('');
  const [selectedRating, setSelectedRating] = useState(0);
  const [comment, setComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [showForm, setShowForm] = useState(false);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => { fetchRatings(); }, [merchantId]);

  const fetchRatings = async () => {
    const { data } = await supabase.from('ratings').select('*').eq('merchant_id', merchantId).order('created_at', { ascending: false });
    if (data && data.length > 0) {
      setRatings(data as Rating[]);
      const avg = data.reduce((sum: number, r: any) => sum + r.rating, 0) / data.length;
      setAvgRating(Math.round(avg * 10) / 10);
    }
  };

  const handleSubmit = async () => {
    if (!name.trim()) { toast.error(dir === 'rtl' ? 'الرجاء إدخال اسمك' : 'Please enter your name'); return; }
    if (selectedRating === 0) { toast.error(dir === 'rtl' ? 'الرجاء اختيار تقييم' : 'Please select a rating'); return; }
    setSubmitting(true);
    const { error } = await supabase.from('ratings').insert({ merchant_id: merchantId, customer_name: name.trim(), rating: selectedRating, comment: comment.trim() || null });
    if (error) { toast.error(dir === 'rtl' ? 'حدث خطأ' : 'An error occurred'); }
    else { toast.success(dir === 'rtl' ? 'شكراً لتقييمك!' : 'Thank you for your rating!'); setName(''); setSelectedRating(0); setComment(''); setShowForm(false); fetchRatings(); }
    setSubmitting(false);
  };

  const visibleRatings = showAll ? ratings : ratings.slice(0, 3);

  return (
    <section className="container py-6">
      <div className="flex items-center justify-center gap-4 mb-4">
        <div className="flex items-center gap-2"><MessageSquare className="h-5 w-5 text-primary" /><span className="font-bold text-base">{dir === 'rtl' ? 'التقييمات' : 'Reviews'}</span>{ratings.length > 0 && <span className="text-sm text-muted-foreground">({ratings.length})</span>}</div>
        {ratings.length > 0 && <div className="flex items-center gap-1.5 bg-amber-50 dark:bg-amber-950/30 px-3 py-1 rounded-full"><RatingStars rating={Math.round(avgRating)} size={16} /><span className="font-bold text-sm">{avgRating}</span></div>}
      </div>
      {!showForm && <div className="text-center mb-4"><Button variant="outline" size="sm" onClick={() => setShowForm(true)} className="gap-2"><Send className="h-3.5 w-3.5" />{dir === 'rtl' ? 'أضف تقييمك' : 'Add Review'}</Button></div>}
      {showForm && (
        <Card className="max-w-sm mx-auto mb-4 border-primary/20">
          <CardContent className="p-4 space-y-3">
            <Input placeholder={dir === 'rtl' ? 'اسمك' : 'Your name'} value={name} onChange={(e) => setName(e.target.value)} className="h-9 text-sm" />
            <div className="flex items-center gap-2"><span className="text-xs text-muted-foreground">{dir === 'rtl' ? 'تقييمك:' : 'Rating:'}</span><RatingStars rating={selectedRating} size={22} interactive onRate={setSelectedRating} /></div>
            <Textarea placeholder={dir === 'rtl' ? 'تعليق (اختياري)' : 'Comment (optional)'} value={comment} onChange={(e) => setComment(e.target.value)} rows={2} className="text-sm" />
            <div className="flex gap-2"><Button onClick={handleSubmit} disabled={submitting} size="sm" className="flex-1 gap-1"><Send className="h-3.5 w-3.5" />{dir === 'rtl' ? 'إرسال' : 'Submit'}</Button><Button variant="ghost" size="sm" onClick={() => setShowForm(false)}>{dir === 'rtl' ? 'إلغاء' : 'Cancel'}</Button></div>
          </CardContent>
        </Card>
      )}
      {ratings.length > 0 && (
        <div className="max-w-sm mx-auto space-y-2">
          {visibleRatings.map(r => (
            <div key={r.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 border border-border/50">
              <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center shrink-0"><span className="text-xs font-bold text-primary">{r.customer_name.charAt(0)}</span></div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2"><span className="font-medium text-sm">{r.customer_name}</span><RatingStars rating={r.rating} size={12} /></div>
                {r.comment && <p className="text-xs text-muted-foreground mt-0.5 line-clamp-2">{r.comment}</p>}
                <p className="text-xs text-muted-foreground/60 mt-0.5">{new Date(r.created_at).toLocaleDateString('ar-JO')}</p>
              </div>
            </div>
          ))}
          {ratings.length > 3 && <Button variant="ghost" size="sm" className="w-full text-xs gap-1" onClick={() => setShowAll(!showAll)}>{showAll ? <><ChevronUp className="h-3 w-3" /> {dir === 'rtl' ? 'عرض أقل' : 'Show less'}</> : <><ChevronDown className="h-3 w-3" /> {dir === 'rtl' ? `عرض الكل (${ratings.length})` : `Show all (${ratings.length})`}</>}</Button>}
        </div>
      )}
    </section>
  );
};

export default RatingSection;