import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/hooks/useLanguage';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { CheckCircle, ArrowRight, Loader2, XCircle } from 'lucide-react';

const PaymentSuccess = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { dir } = useLanguage();
  const [countdown, setCountdown] = useState(5);
  const [isVisible, setIsVisible] = useState(false);
  const status = searchParams.get('status');
  const isSuccess = status === 'success';
  const isCancelled = status === 'cancelled';

  useEffect(() => { setTimeout(() => setIsVisible(true), 100); }, []);

  useEffect(() => {
    if (isSuccess) {
      const timer = setInterval(() => {
        setCountdown((prev) => { if (prev <= 1) { clearInterval(timer); navigate('/dashboard'); return 0; } return prev - 1; });
      }, 1000);
      return () => clearInterval(timer);
    }
  }, [isSuccess, navigate]);

  if (isCancelled) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
        <Card className="max-w-md w-full">
          <CardContent className="pt-8 pb-8 text-center space-y-6">
            <div className={`mx-auto w-20 h-20 bg-destructive/10 rounded-full flex items-center justify-center transition-transform duration-500 ${isVisible ? 'scale-100' : 'scale-0'}`}>
              <XCircle className="h-10 w-10 text-destructive" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-bold">{dir === 'rtl' ? 'تم إلغاء الدفع' : 'Payment Cancelled'}</h1>
              <p className="text-muted-foreground">{dir === 'rtl' ? 'تم إلغاء عملية الدفع. يمكنك المحاولة مرة أخرى.' : 'Payment was cancelled. You can try again.'}</p>
            </div>
            <Button onClick={() => navigate('/dashboard')} className="w-full">
              {dir === 'rtl' ? 'العودة للوحة التحكم' : 'Back to Dashboard'}<ArrowRight className="h-4 w-4 mx-2" />
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4" dir={dir}>
      <Card className="max-w-md w-full">
        <CardContent className="pt-8 pb-8 text-center space-y-6">
          <div className={`mx-auto w-20 h-20 bg-success/10 rounded-full flex items-center justify-center transition-transform duration-500 ${isVisible ? 'scale-100' : 'scale-0'}`}>
            <CheckCircle className={`h-10 w-10 text-success transition-transform duration-300 delay-200 ${isVisible ? 'scale-100' : 'scale-0'}`} />
          </div>
          <div className={`space-y-2 transition-all duration-500 delay-300 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            <h1 className="text-2xl font-bold text-success">{dir === 'rtl' ? 'تم الدفع بنجاح!' : 'Payment Successful!'}</h1>
            <p className="text-muted-foreground">{dir === 'rtl' ? 'شكراً لك! تم تفعيل اشتراكك.' : 'Thank you! Your subscription is active.'}</p>
          </div>
          <div className={`bg-muted/50 rounded-lg p-4 space-y-2 transition-all duration-500 delay-400 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <div className="flex justify-between items-center"><span className="text-muted-foreground">{dir === 'rtl' ? 'المبلغ:' : 'Amount:'}</span><span className="font-semibold text-primary">10 USD</span></div>
          </div>
          <div className={`flex items-center justify-center gap-2 text-sm text-muted-foreground transition-opacity duration-500 delay-500 ${isVisible ? 'opacity-100' : 'opacity-0'}`}>
            <Loader2 className="h-4 w-4 animate-spin" />
            <span>{dir === 'rtl' ? `سيتم توجيهك خلال ${countdown} ثواني...` : `Redirecting in ${countdown} seconds...`}</span>
          </div>
          <Button onClick={() => navigate('/dashboard')} className="w-full">
            {dir === 'rtl' ? 'انتقل للوحة التحكم الآن' : 'Go to Dashboard Now'}<ArrowRight className="h-4 w-4 mx-2" />
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

export default PaymentSuccess;