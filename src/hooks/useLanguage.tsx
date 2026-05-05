import { type ReactNode } from 'react';

type Language = 'ar' | 'en';
interface Translations { [key: string]: { ar: string; en: string; }; }

const translations: Translations = {
  'auth.resetPassword': { ar: 'إعادة تعيين كلمة المرور', en: 'Reset Password' },
  'auth.enterPhoneReset': { ar: 'أدخل رقم هاتفك لإعادة تعيين كلمة المرور', en: 'Enter your phone number to reset password' },
  'auth.sendCode': { ar: 'إرسال الكود', en: 'Send Code' },
  'auth.enterOtp': { ar: 'أدخل كود التحقق', en: 'Enter verification code' },
  'auth.codeSentTo': { ar: 'تم إرسال الكود إلى', en: 'Code sent to' },
  'auth.validFor': { ar: 'صالح لمدة 5 دقائق', en: 'Valid for 5 minutes' },
  'auth.verify': { ar: 'تحقق', en: 'Verify' },
  'auth.resendCode': { ar: 'إعادة إرسال الكود', en: 'Resend Code' },
  'auth.resendIn': { ar: 'إعادة الإرسال بعد', en: 'Resend in' },
  'auth.newPassword': { ar: 'كلمة المرور الجديدة', en: 'New Password' },
  'auth.enterNewPassword': { ar: 'أدخل كلمة المرور الجديدة', en: 'Enter your new password' },
  'auth.changePassword': { ar: 'تغيير كلمة المرور', en: 'Change Password' },
  'auth.passwordChanged': { ar: 'تم تغيير كلمة المرور بنجاح!', en: 'Password changed successfully!' },
  'auth.canLoginNow': { ar: 'يمكنك تسجيل الدخول الآن', en: 'You can login now' },
  'auth.phoneNotFound': { ar: 'رقم الهاتف غير مسجل', en: 'Phone number not registered' },
  'auth.invalidOtp': { ar: 'كود التحقق غير صحيح', en: 'Invalid verification code' },
  'auth.otpExpired': { ar: 'انتهت صلاحية الكود، اطلب رمزاً جديداً', en: 'Code expired, request a new one' },
  'auth.otpSent': { ar: 'تم إرسال الكود بنجاح', en: 'Code sent successfully' },
  'auth.checkWhatsApp': { ar: 'تحقق من رسائل WhatsApp', en: 'Check your WhatsApp messages' },
  'auth.rateLimited': { ar: 'تم تجاوز الحد الأقصى للمحاولات. حاول بعد ساعة.', en: 'Too many attempts. Try again in an hour.' },
  'auth.sendOtpFailed': { ar: 'فشل في إرسال الكود', en: 'Failed to send code' },
  'auth.verifyOtpFailed': { ar: 'فشل في التحقق من الكود', en: 'Failed to verify code' },
  'auth.tokenExpired': { ar: 'انتهت صلاحية الجلسة، أعد المحاولة', en: 'Session expired, please try again' },
  'auth.resetPasswordFailed': { ar: 'فشل في تغيير كلمة المرور', en: 'Failed to change password' },
  'auth.phone': { ar: 'رقم الهاتف', en: 'Phone Number' },
  'auth.password': { ar: 'كلمة المرور', en: 'Password' },
  'auth.login': { ar: 'تسجيل الدخول', en: 'Login' },
  'auth.newAccount': { ar: 'حساب جديد', en: 'New Account' },
  'auth.agreeTerms': { ar: 'أوافق على', en: 'I agree to' },
  'auth.termsLink': { ar: 'الشروط والأحكام وسياسة الخصوصية', en: 'Terms & Conditions and Privacy Policy' },
  'auth.loggingIn': { ar: 'جاري تسجيل الدخول...', en: 'Logging in...' },
  'auth.creatingAccount': { ar: 'جاري إنشاء الحساب...', en: 'Creating account...' },
  'auth.createAccount': { ar: 'إنشاء حساب', en: 'Create Account' },
  'auth.backHome': { ar: 'العودة للصفحة الرئيسية', en: 'Back to Home' },
  'auth.loginError': { ar: 'خطأ في تسجيل الدخول', en: 'Login Error' },
  'auth.wrongCredentials': { ar: 'رقم الهاتف أو كلمة المرور غير صحيحة', en: 'Wrong phone number or password' },
  'auth.accountExists': { ar: 'الحساب موجود مسبقاً', en: 'Account already exists' },
  'auth.phoneExists': { ar: 'هذا الرقم مسجل بالفعل', en: 'This phone is already registered' },
  'auth.registerError': { ar: 'خطأ في التسجيل', en: 'Registration Error' },
  'auth.registerSuccess': { ar: 'تم التسجيل بنجاح!', en: 'Registration successful!' },
  'auth.welcomeMerchant': { ar: 'مرحباً بك، يمكنك الآن إضافة منتجاتك', en: 'Welcome! You can now add your products' },
  'auth.forgotPassword': { ar: 'نسيت كلمة المرور؟', en: 'Forgot Password?' },
  'auth.phoneInvalid': { ar: 'رقم الهاتف غير صالح', en: 'Invalid phone number' },
  'auth.phoneTooLong': { ar: 'رقم الهاتف طويل جداً', en: 'Phone number is too long' },
  'auth.passwordMin': { ar: 'كلمة المرور يجب أن تكون 6 أحرف على الأقل', en: 'Password must be at least 6 characters' },
  'auth.agreeRequired': { ar: 'يجب الموافقة على الشروط والأحكام', en: 'You must agree to the terms' },
  'common.error': { ar: 'حدث خطأ', en: 'An error occurred' },
};

export const LanguageProvider = ({ children }: { children: ReactNode }) => <>{children}</>;

export const useLanguage = () => ({
  language: 'ar' as Language,
  setLanguage: (_lang: Language) => {},
  t: (key: string): string => translations[key]?.ar ?? key,
  dir: 'rtl' as const,
  isRTL: true,
});
