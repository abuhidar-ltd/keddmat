import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Bell, Check } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useAuth } from '@/hooks/useAuth';

interface Notification { id: string; title: string; message: string; type: string; is_read: boolean; created_at: string; }

const NotificationBell = () => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  const playNotificationSound = () => {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.frequency.value = 660;
      osc.type = 'sine';
      gain.gain.value = 0.3;
      osc.start();
      osc.stop(audioCtx.currentTime + 0.2);
      setTimeout(() => {
        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.frequency.value = 880;
        osc2.type = 'sine';
        gain2.gain.value = 0.3;
        osc2.start();
        osc2.stop(audioCtx.currentTime + 0.3);
      }, 200);
    } catch (e) { console.warn('Notification sound failed:', e); }
  };

  useEffect(() => {
    if (!user) return;
    fetchNotifications();
    const channel = supabase.channel('notifications-' + user.id).on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'notifications', filter: `user_id=eq.${user.id}` }, () => { playNotificationSound(); if (navigator.vibrate) navigator.vibrate([200, 100, 200]); fetchNotifications(); }).subscribe();
    return () => { supabase.removeChannel(channel); };
  }, [user]);

  const fetchNotifications = async () => {
    if (!user) return;
    const { data } = await supabase.from('notifications').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(20);
    if (data) {
      setNotifications(data as Notification[]);
      const unread = data.filter((n: any) => !n.is_read).length;
      setUnreadCount(unread);
      document.title = unread > 0 ? `(${unread}) خدمات` : 'خدمات';
    }
  };

  const markAsRead = async (id: string) => { await supabase.from('notifications').update({ is_read: true }).eq('id', id); fetchNotifications(); };
  const markAllRead = async () => { if (!user) return; await supabase.from('notifications').update({ is_read: true }).eq('user_id', user.id).eq('is_read', false); fetchNotifications(); };
  const deleteAll = async () => { if (!user) return; await supabase.from('notifications').delete().eq('user_id', user.id); fetchNotifications(); };
  const timeAgo = (date: string) => { const diff = Date.now() - new Date(date).getTime(); const mins = Math.floor(diff / 60000); if (mins < 1) return 'الآن'; if (mins < 60) return `منذ ${mins} دقيقة`; const hours = Math.floor(mins / 60); if (hours < 24) return `منذ ${hours} ساعة`; const days = Math.floor(hours / 24); return `منذ ${days} يوم`; };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && ( <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 flex items-center justify-center text-xs bg-destructive text-destructive-foreground">{unreadCount}</Badge> )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end" dir="rtl">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">الإشعارات</h4>
          <div className="flex gap-1">
            {unreadCount > 0 && ( <Button variant="ghost" size="sm" className="text-xs h-7" onClick={markAllRead}><Check className="h-3 w-3 ml-1" /> قراءة الكل</Button> )}
            {notifications.length > 0 && ( <Button variant="ghost" size="sm" className="text-xs h-7 text-destructive hover:text-destructive" onClick={deleteAll}>حذف الكل</Button> )}
          </div>
        </div>
        <ScrollArea className="max-h-80">
          {notifications.length === 0 ? ( <p className="text-center text-sm text-muted-foreground py-8">لا توجد إشعارات</p> ) : ( notifications.map(n => (
            <div key={n.id} className={`p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 transition-colors ${!n.is_read ? 'bg-primary/5' : ''}`} onClick={() => !n.is_read && markAsRead(n.id)}>
              <div className="flex items-start justify-between gap-2"><div className="flex-1 min-w-0"><p className="font-medium text-sm">{n.title}</p><p className="text-xs text-muted-foreground line-clamp-2">{n.message}</p></div>{!n.is_read && <div className="w-2 h-2 rounded-full bg-primary mt-1.5 shrink-0" />}</div>
              <p className="text-xs text-muted-foreground mt-1">{timeAgo(n.created_at)}</p>
            </div>
          )) )}
        </ScrollArea>
      </PopoverContent>
    </Popover>
  );
};

export default NotificationBell;