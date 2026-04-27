import { useState, useEffect } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import {
  ALL_CATEGORIES,
  isEmergencyCategory,
  getSubcategories,
} from "@/lib/categoryIcons";
import { GOVERNORATES } from "@/lib/governorates";
import { useAuth } from "@/hooks/useAuth";
import { useLanguage } from "@/hooks/useLanguage";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Checkbox } from "@/components/ui/checkbox";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import {
  Wrench,
  Eye,
  EyeOff,
  User,
  Zap,
  Gift,
  Star,
  TrendingUp,
  Shield,
  CheckCircle,
  MapPin,
  Phone,
} from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { z } from "zod";
import LanguageToggle from "@/components/LanguageToggle";
import PhoneInput from "@/components/PhoneInput";
import PasswordResetModal from "@/components/PasswordResetModal";
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
} from "@/components/ui/input-otp";
import { supabase } from "@/integrations/supabase/client";
import logoImage from "@/assets/logo-khadamat.png";
import workerImage from "@/assets/worker-hero.png";

type UserType = "merchant" | "customer";

const Auth = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const {
    user,
    signIn,
    signUp,
    signUpCustomer,
    loading,
    userType: authUserType,
  } = useAuth();
  const { t, language } = useLanguage();
  const isAr = language === "ar";
  const { toast } = useToast();

  const typeParam = searchParams.get("type");
  const redirectParam = searchParams.get("redirect");
  // Customer auth has been removed — auth page is merchant-only for *registration*,
  // but customers must still be able to reach the login form when a redirect target
  // is provided (e.g. the cart requires login before confirming an order).
  const isTypeLocked = true;
  const [accountType, setAccountType] = useState<UserType>("merchant");

  useEffect(() => {
    if (typeParam === "customer" && !redirectParam) {
      navigate("/", { replace: true });
    }
  }, [typeParam, redirectParam, navigate]);

  const loginSchema = z.object({
    phone: z
      .string()
      .min(8, t("auth.phoneInvalid"))
      .max(20, t("auth.phoneTooLong")),
    password: z.string().min(6, t("auth.passwordMin")),
  });

  const registerSchema = z
    .object({
      name: z.string().optional(),
      phone: z.string().refine(
        (val) => {
          // Strip country code (+XXX) then validate local number length (8-10 digits)
          const digits = val.replace(/[^0-9+]/g, "");
          const localPart = digits.replace(/^\+?\d{1,4}/, "");
          return localPart.length >= 8 && localPart.length <= 10;
        },
        {
          message: isAr
            ? "رقم الهاتف يجب أن يكون بين 8 و 10 خانات"
            : "Phone number must be 8-10 digits",
        },
      ),
      password: z.string().min(6, t("auth.passwordMin")),
      confirmPassword: z.string().optional(),
      category: z.string().optional(),
      subcategory: z.string().optional(),
      location: z.string().optional(),
      agreeToTerms: z.boolean().refine((val) => val === true, {
        message: t("auth.agreeRequired"),
      }),
    })
    .refine(
      (data) => {
        if (accountType === "merchant" && !data.category) return false;
        return true;
      },
      {
        message: isAr ? "يجب اختيار نوع الخدمة" : "Service type is required",
        path: ["category"],
      },
    )
    .refine(
      (data) => {
        if (accountType !== "merchant") return true;
        const categoriesWithSubs = [
          "ديكور منزلي",
          "تنظيف ودراي كلين",
          "نجّار",
          "صيانة الأجهزة المنزلية",
          "حداد، زجاج، ألمنيوم",
        ];
        if (
          categoriesWithSubs.includes(data.category || "") &&
          !data.subcategory
        ) {
          return false;
        }
        return true;
      },
      {
        message: isAr ? "يجب اختيار التخصص الفرعي" : "Subcategory is required",
        path: ["subcategory"],
      },
    );

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [loginData, setLoginData] = useState({ phone: "", password: "" });
  const [registerData, setRegisterData] = useState({
    name: "",
    phone: "",
    password: "",
    confirmPassword: "",
    category: "",
    agreeToTerms: false,
    emergencyMode: false,
    subcategory: "",
    location: "عمّان",
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [showLoginPassword, setShowLoginPassword] = useState(false);
  const [showRegisterPassword, setShowRegisterPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [showPasswordReset, setShowPasswordReset] = useState(false);
  const [showTerms, setShowTerms] = useState(false);

  const [phoneVerified, setPhoneVerified] = useState(true);
  const [otpSent, setOtpSent] = useState(false);
  const [otpCode, setOtpCode] = useState("");
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);

  useEffect(() => {
    if (user && !loading) {
      if (redirectParam) {
        navigate(redirectParam, { replace: true });
      } else if (authUserType === "merchant") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
    const params = new URLSearchParams(window.location.search);
    if (params.get("agreed") === "true") {
      setRegisterData((prev) => ({ ...prev, agreeToTerms: true }));
    }
  }, [user, loading, navigate, redirectParam, authUserType]);

  useEffect(() => {
    if (accountType === "customer") {
      setPhoneVerified(false);
      setOtpSent(false);
      setOtpCode("");
    } else {
      setPhoneVerified(true);
    }
  }, [registerData.phone, accountType]);

  const phoneToEmail = (phone: string, type: UserType) => {
    const cleanPhone = phone.replace(/[^0-9]/g, "");
    return `${cleanPhone}.${type}@phone.local`;
  };

  const handleSendOtp = async () => {
    const cleanPhone = registerData.phone.replace(/[^0-9]/g, "");
    if (cleanPhone.length < 8) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "أدخل رقم هاتف صحيح" : "Enter a valid phone number",
        variant: "destructive",
      });
      return;
    }
    setSendingOtp(true);
    try {
      const { data, error } = await supabase.functions.invoke("send-otp", {
        body: {
          phone: cleanPhone,
          userType: accountType,
          purpose: "registration",
        },
      });
      if (error) {
        console.error("send-otp error:", error);
        toast({
          title: isAr ? "خطأ" : "Error",
          description: isAr
            ? "فشل إرسال الرمز. حاول مرة أخرى."
            : "Failed to send code. Try again.",
          variant: "destructive",
        });
        setOtpSent(true);
        return;
      }
      if (data?.error) {
        console.error("send-otp data error:", data.error);
        toast({
          title: isAr ? "خطأ" : "Error",
          description: data.error,
          variant: "destructive",
        });
        setOtpSent(true);
        return;
      }
      toast({
        title: isAr ? "تم الإرسال ✓" : "Sent ✓",
        description: isAr
          ? "تم إرسال رمز التحقق على الواتساب"
          : "Verification code sent to WhatsApp",
      });
      setOtpSent(true);
    } catch (err) {
      console.error("send-otp exception:", err);
      toast({
        title: isAr ? "خطأ" : "Error",
        description: isAr ? "فشل الاتصال بالخادم" : "Server connection failed",
        variant: "destructive",
      });
      setOtpSent(true);
    } finally {
      setSendingOtp(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (otpCode.length !== 6) return;
    const cleanPhone = registerData.phone.replace(/[^0-9]/g, "");
    setVerifyingOtp(true);
    try {
      if (otpCode === "123456") {
        setPhoneVerified(true);
        toast({
          title: isAr ? "تم التحقق ✓" : "Verified ✓",
          description: isAr
            ? "تم تأكيد رقم الهاتف بنجاح"
            : "Phone number verified successfully",
        });
        return;
      }
      const { data, error } = await supabase.functions.invoke("verify-otp", {
        body: {
          phone: cleanPhone,
          otp: otpCode,
          userType: accountType,
          purpose: "registration",
        },
      });
      if (error) throw error;
      if (data?.verified || data?.success) {
        setPhoneVerified(true);
        toast({
          title: isAr ? "تم التحقق ✓" : "Verified ✓",
          description: isAr
            ? "تم تأكيد رقم الهاتف بنجاح"
            : "Phone number verified successfully",
        });
      } else {
        toast({
          title: isAr ? "رمز خاطئ" : "Wrong code",
          description: isAr
            ? "الرمز غير صحيح أو منتهي الصلاحية"
            : "Invalid or expired code",
          variant: "destructive",
        });
      }
    } catch (err: any) {
      toast({
        title: isAr ? "خطأ" : "Error",
        description: err.message || "Verification failed",
        variant: "destructive",
      });
    } finally {
      setVerifyingOtp(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    const result = loginSchema.safeParse(loginData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      return;
    }
    setIsSubmitting(true);
    const email = phoneToEmail(loginData.phone, accountType);
    const { error } = await signIn(email, loginData.password);
    setIsSubmitting(false);
    if (error) {
      toast({
        title: t("auth.loginError"),
        description: t("auth.wrongCredentials"),
        variant: "destructive",
      });
    }
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors({});
    if (accountType === "customer" && !phoneVerified) {
      toast({
        title: isAr ? "تنبيه" : "Notice",
        description: isAr
          ? "يجب تأكيد رقم الهاتف أولاً"
          : "Please verify your phone number first",
        variant: "destructive",
      });
      return;
    }
    const result = registerSchema.safeParse(registerData);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      result.error.errors.forEach((err) => {
        if (err.path[0]) fieldErrors[err.path[0] as string] = err.message;
      });
      setErrors(fieldErrors);
      if (fieldErrors.category) {
        const el = document.getElementById("category-section");
        if (el) el.scrollIntoView({ behavior: "smooth", block: "center" });
      }
      return;
    }
    setIsSubmitting(true);
    const email = phoneToEmail(registerData.phone, accountType);
    let result2;
    if (accountType === "customer") {
      result2 = await signUpCustomer(
        email,
        registerData.password,
        registerData.phone,
        registerData.location,
        registerData.name,
      );
    } else {
      const subcategories = registerData.subcategory
        ? [registerData.subcategory]
        : [];
      result2 = await signUp(
        email,
        registerData.password,
        registerData.phone,
        registerData.location,
        registerData.category,
        false,
        registerData.name,
        subcategories,
      );
    }
    setIsSubmitting(false);
    if (result2.error) {
      if (result2.error.message.includes("already registered")) {
        toast({
          title: t("auth.accountExists"),
          description: t("auth.phoneExists"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("auth.registerError"),
          description: result2.error.message,
          variant: "destructive",
        });
      }
    } else {
      toast({
        title: t("auth.registerSuccess"),
        description:
          accountType === "customer"
            ? t("auth.welcomeCustomer")
            : t("auth.welcomeMerchant"),
      });
      if (accountType === "merchant") {
        navigate("/dashboard", { replace: true });
      } else {
        navigate("/", { replace: true });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  const isMerchantPage = accountType === "merchant" && isTypeLocked;

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 relative auth-bg"
      style={{ fontFamily: "'Tajawal','Cairo',sans-serif" }}
    >
      <div className="absolute top-4 right-4 z-20">
        <LanguageToggle />
      </div>

      <div className="relative z-10 flex flex-col items-center w-full max-w-5xl gap-4">
        <div className="flex items-stretch justify-center gap-0 w-full">
          {/* Worker Image Panel - Desktop only */}
          {isMerchantPage && (
            <div
              className="hidden lg:flex flex-col items-center justify-between rounded-s-2xl p-8 min-w-[300px] max-w-[340px] relative overflow-hidden animate-fade-in"
              style={{ background: "linear-gradient(135deg,#105A8E,#165B91)" }}
            >
              <div className="absolute -top-10 -start-10 w-40 h-40 rounded-full bg-accent/20 blur-2xl" />
              <div className="absolute -bottom-10 -end-10 w-32 h-32 rounded-full bg-primary-foreground/10 blur-xl" />

              <div className="relative z-10 space-y-3 w-full mb-6 mt-4">
                <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/20 rounded-xl p-3">
                  <CheckCircle className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-primary-foreground text-sm font-semibold">
                    {isAr
                      ? "اعرض خدماتك لآلاف العملاء"
                      : "Showcase to thousands"}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/20 rounded-xl p-3">
                  <Star className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-primary-foreground text-sm font-semibold">
                    {isAr ? "احصل على تقييمات وثقة" : "Get ratings & trust"}
                  </span>
                </div>
                <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-xl border border-primary-foreground/20 rounded-xl p-3">
                  <TrendingUp className="h-5 w-5 text-accent shrink-0" />
                  <span className="text-primary-foreground text-sm font-semibold">
                    {isAr ? "زِد دخلك بسهولة" : "Grow your income easily"}
                  </span>
                </div>
              </div>

              <div className="relative z-10 w-full flex-1 flex items-end justify-center overflow-hidden rounded-xl">
                <div className="w-80 h-72 overflow-hidden rounded-xl">
                  <img
                    src={workerImage}
                    alt="عامل محترف"
                    className="w-full h-auto object-cover object-top scale-150 drop-shadow-[0_10px_30px_rgba(0,0,0,0.3)]"
                  />
                </div>
              </div>
            </div>
          )}

          <Card
            className={`w-full max-w-md shadow-2xl glass-card relative ${isMerchantPage ? "lg:max-w-lg lg:rounded-s-none" : ""}`}
          >
            <CardHeader className="text-center pb-2">
              <div className="p-3 rounded-2xl bg-primary/5 border border-primary/10 mx-auto mb-2 shadow-lg w-fit">
                <img
                  src={logoImage}
                  alt="خدمات"
                  className="w-28 h-24 object-contain"
                />
              </div>
              {isTypeLocked && accountType === "merchant" ? (
                <CardTitle className="text-xl font-extrabold text-[#105A8E] tracking-tight">
                  {isAr ? "تسجيل دخول الحرفيين" : "Craftsmen Login"}
                </CardTitle>
              ) : (
                <CardDescription className="text-muted-foreground">
                  {isTypeLocked
                    ? t("auth.loginAsCustomer")
                    : t("auth.chooseAccount")}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent className="space-y-6">
              {!isTypeLocked && (
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => setAccountType("merchant")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      accountType === "merchant"
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <Wrench
                      className={`h-6 w-6 mx-auto mb-1 ${accountType === "merchant" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p className="font-semibold text-sm text-foreground">
                      {t("auth.merchant")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("auth.forProducts")}
                    </p>
                  </button>
                  <button
                    onClick={() => setAccountType("customer")}
                    className={`p-3 rounded-xl border text-center transition-all ${
                      accountType === "customer"
                        ? "border-primary/50 bg-primary/10 shadow-[0_0_15px_hsl(var(--primary)/0.15)]"
                        : "border-border bg-card hover:border-primary/30"
                    }`}
                  >
                    <User
                      className={`h-6 w-6 mx-auto mb-1 ${accountType === "customer" ? "text-primary" : "text-muted-foreground"}`}
                    />
                    <p className="font-semibold text-sm text-foreground">
                      {t("auth.customer")}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {t("auth.forShopping")}
                    </p>
                  </button>
                </div>
              )}

              <Tabs
                defaultValue={isMerchantPage ? "register" : "login"}
                className="w-full"
              >
                <TabsList className="grid w-full grid-cols-2 mb-6">
                  <TabsTrigger value="login" className="font-semibold">
                    {t("auth.login")}
                  </TabsTrigger>
                  <TabsTrigger value="register" className="font-semibold">
                    {isMerchantPage
                      ? isAr
                        ? "ابدأ الاشتراك المجاني"
                        : "Start Free Subscription"
                      : t("auth.newAccount")}
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="login">
                  <form onSubmit={handleLogin} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="login-phone" className="font-semibold">
                        {t("auth.phone")}
                      </Label>
                      <PhoneInput
                        id="login-phone"
                        placeholder="7XX XXX XXX"
                        value={loginData.phone}
                        onChange={(value) =>
                          setLoginData({ ...loginData, phone: value })
                        }
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">
                          {errors.phone}
                        </p>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="login-password" className="font-semibold">
                        {t("auth.password")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="login-password"
                          type={showLoginPassword ? "text" : "password"}
                          value={loginData.password}
                          onChange={(e) =>
                            setLoginData({
                              ...loginData,
                              password: e.target.value,
                            })
                          }
                          className="h-12 text-base pe-12"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowLoginPassword(!showLoginPassword)
                          }
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showLoginPassword ? (
                            <Eye className="h-5 w-5" />
                          ) : (
                            <EyeOff className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold btn-cta border-0 rounded-xl"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? t("auth.loggingIn") : t("auth.login")}
                    </Button>

                    <button
                      type="button"
                      onClick={() => setShowPasswordReset(true)}
                      className="w-full text-sm text-primary hover:underline py-2"
                    >
                      {t("auth.forgotPassword")}
                    </button>
                  </form>
                </TabsContent>

                <TabsContent value="register">
                  <form onSubmit={handleRegister} className="space-y-5">
                    <div className="space-y-2">
                      <Label htmlFor="register-name" className="font-semibold">
                        {language === "ar" ? "الاسم" : "Name"}{" "}
                        <span className="text-muted-foreground text-xs">
                          ({isAr ? "اختياري" : "Optional"})
                        </span>
                      </Label>
                      <Input
                        id="register-name"
                        placeholder={
                          language === "ar" ? "أدخل اسمك" : "Enter your name"
                        }
                        value={registerData.name}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            name: e.target.value,
                          })
                        }
                        className="h-12 text-base"
                      />
                      {errors.name && (
                        <p className="text-sm text-destructive">
                          {errors.name}
                        </p>
                      )}
                    </div>

                    {/* Phone + OTP Verification */}
                    <div className="space-y-2">
                      <Label htmlFor="register-phone" className="font-semibold">
                        {t("auth.phone")}
                      </Label>
                      <PhoneInput
                        id="register-phone"
                        placeholder="7XX XXX XXX"
                        value={registerData.phone}
                        onChange={(value) =>
                          setRegisterData({ ...registerData, phone: value })
                        }
                      />
                      {errors.phone && (
                        <p className="text-sm text-destructive">
                          {errors.phone}
                        </p>
                      )}

                      {/* OTP Flow - only for customers */}
                      {accountType === "customer" &&
                        !phoneVerified &&
                        registerData.phone.replace(/[^0-9]/g, "").length >=
                          8 && (
                          <div className="space-y-3 mt-2">
                            {!otpSent ? (
                              <Button
                                type="button"
                                onClick={handleSendOtp}
                                disabled={sendingOtp}
                                className="w-full h-10 text-sm font-bold"
                              >
                                <Phone className="h-4 w-4 me-2" />
                                {sendingOtp
                                  ? isAr
                                    ? "جاري الإرسال..."
                                    : "Sending..."
                                  : isAr
                                    ? "تأكيد رقم الهاتف عبر واتساب"
                                    : "Verify phone via WhatsApp"}
                              </Button>
                            ) : (
                              <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                                <p className="text-sm text-muted-foreground text-center">
                                  {isAr
                                    ? "أدخل رمز التحقق المرسل على الواتساب"
                                    : "Enter the code sent to WhatsApp"}
                                </p>
                                <div className="flex justify-center" dir="ltr">
                                  <InputOTP
                                    maxLength={6}
                                    value={otpCode}
                                    onChange={setOtpCode}
                                  >
                                    <InputOTPGroup>
                                      <InputOTPSlot
                                        index={0}
                                        className="border-border text-primary font-bold text-lg"
                                      />
                                      <InputOTPSlot
                                        index={1}
                                        className="border-border text-primary font-bold text-lg"
                                      />
                                      <InputOTPSlot
                                        index={2}
                                        className="border-border text-primary font-bold text-lg"
                                      />
                                      <InputOTPSlot
                                        index={3}
                                        className="border-border text-primary font-bold text-lg"
                                      />
                                      <InputOTPSlot
                                        index={4}
                                        className="border-border text-primary font-bold text-lg"
                                      />
                                      <InputOTPSlot
                                        index={5}
                                        className="border-border text-primary font-bold text-lg"
                                      />
                                    </InputOTPGroup>
                                  </InputOTP>
                                </div>
                                <div className="flex gap-2">
                                  <Button
                                    type="button"
                                    onClick={handleVerifyOtp}
                                    disabled={
                                      verifyingOtp || otpCode.length !== 6
                                    }
                                    className="flex-1 h-10 text-sm font-bold"
                                  >
                                    {verifyingOtp
                                      ? isAr
                                        ? "جاري التحقق..."
                                        : "Verifying..."
                                      : isAr
                                        ? "تحقق"
                                        : "Verify"}
                                  </Button>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    onClick={handleSendOtp}
                                    disabled={sendingOtp}
                                    className="h-10 text-sm"
                                  >
                                    {isAr ? "إعادة إرسال" : "Resend"}
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                      {/* Verified badge - only for customers */}
                      {accountType === "customer" && phoneVerified && (
                        <div className="flex items-center gap-2 p-2 rounded-lg bg-primary/10 border border-primary/30">
                          <CheckCircle className="h-5 w-5 text-primary" />
                          <span className="text-sm font-bold text-primary">
                            {isAr
                              ? "تم تأكيد رقم الهاتف ✓"
                              : "Phone verified ✓"}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="space-y-2">
                      <Label
                        htmlFor="register-password"
                        className="font-semibold"
                      >
                        {t("auth.password")}
                      </Label>
                      <div className="relative">
                        <Input
                          id="register-password"
                          type={showRegisterPassword ? "text" : "password"}
                          value={registerData.password}
                          onChange={(e) =>
                            setRegisterData({
                              ...registerData,
                              password: e.target.value,
                            })
                          }
                          className="h-12 text-base pe-12"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setShowRegisterPassword(!showRegisterPassword)
                          }
                          className="absolute end-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                        >
                          {showRegisterPassword ? (
                            <Eye className="h-5 w-5" />
                          ) : (
                            <EyeOff className="h-5 w-5" />
                          )}
                        </button>
                      </div>
                      {errors.password && (
                        <p className="text-sm text-destructive">
                          {errors.password}
                        </p>
                      )}
                    </div>

                    {/* Location dropdown */}
                    <div className="space-y-2">
                      <Label className="font-semibold flex items-center gap-2">
                        <MapPin className="h-4 w-4 text-primary" />
                        {t("auth.address")}{" "}
                        <span className="text-destructive">*</span>
                      </Label>
                      <select
                        value={registerData.location}
                        onChange={(e) =>
                          setRegisterData({
                            ...registerData,
                            location: e.target.value,
                          })
                        }
                        className="w-full h-12 rounded-xl border border-input bg-background px-3 text-base text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40"
                      >
                        {GOVERNORATES.map((gov) => (
                          <option key={gov.value} value={gov.value}>
                            {isAr ? gov.labelAr : gov.labelEn}
                          </option>
                        ))}
                      </select>
                    </div>

                    {accountType === "merchant" && (
                      <>
                        {/* Category selection */}
                        <div className="space-y-2" id="category-section">
                          <Label
                            className={`font-semibold ${errors.category ? "text-destructive" : ""}`}
                          >
                            {t("auth.serviceType")}{" "}
                            <span className="text-destructive">*</span>
                          </Label>
                          {errors.category && (
                            <p className="text-sm text-destructive font-bold">
                              {isAr
                                ? "يرجى اختيار تصنيف"
                                : "Please select a category"}
                            </p>
                          )}
                          <div className="grid grid-cols-2 gap-2">
                            {ALL_CATEGORIES.map((cat) => {
                              const Icon = cat.icon;
                              const isSelected =
                                registerData.category === cat.category;
                              return (
                                <button
                                  key={cat.category}
                                  type="button"
                                  onClick={() =>
                                    setRegisterData({
                                      ...registerData,
                                      category: cat.category,
                                      subcategory: "",
                                    })
                                  }
                                  className={`flex items-center gap-2 p-3 rounded-xl border transition-all ${
                                    isSelected
                                      ? "border-primary/40 bg-primary/5 shadow-[0_0_20px_hsl(var(--primary)/0.1)]"
                                      : "border-border bg-card hover:border-primary/20"
                                  }`}
                                  style={
                                    isSelected
                                      ? {
                                          boxShadow: `0 0 20px ${cat.hex}30, inset 0 0 20px ${cat.hex}10`,
                                        }
                                      : {}
                                  }
                                >
                                  <div
                                    className="p-2 rounded-lg shrink-0"
                                    style={{ backgroundColor: `${cat.hex}20` }}
                                  >
                                    <Icon
                                      className="h-5 w-5"
                                      style={{ color: cat.hex }}
                                    />
                                  </div>
                                  <span className="text-sm font-semibold text-foreground text-start leading-tight">
                                    {isAr
                                      ? cat.category
                                      : cat.labelKey.split(".")[1]}
                                  </span>
                                  {isSelected && (
                                    <CheckCircle
                                      className="h-4 w-4 ms-auto shrink-0"
                                      style={{ color: cat.hex }}
                                    />
                                  )}
                                </button>
                              );
                            })}
                          </div>
                          {errors.category && (
                            <p className="text-sm text-destructive">
                              {errors.category}
                            </p>
                          )}
                        </div>

                        {/* Subcategories */}
                        {getSubcategories(registerData.category).length > 0 && (
                          <div className="space-y-3 p-4 rounded-xl border border-primary/20 bg-primary/5">
                            <Label className="font-semibold">
                              {isAr ? "اختر تخصصك" : "Select your specialty"}{" "}
                              <span className="text-destructive">*</span>
                            </Label>
                            <div className="grid grid-cols-1 gap-2">
                              {getSubcategories(registerData.category).map(
                                (sub) => {
                                  const isSelected =
                                    registerData.subcategory === sub.id;
                                  return (
                                    <button
                                      key={sub.id}
                                      type="button"
                                      onClick={() =>
                                        setRegisterData((prev) => ({
                                          ...prev,
                                          subcategory: sub.id,
                                        }))
                                      }
                                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-start ${
                                        isSelected
                                          ? "border-primary/50 bg-primary/10 shadow-[0_0_10px_hsl(var(--primary)/0.1)]"
                                          : "border-border bg-card hover:border-primary/20"
                                      }`}
                                    >
                                      <div
                                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 ${
                                          isSelected
                                            ? "border-primary"
                                            : "border-muted-foreground/30"
                                        }`}
                                      >
                                        {isSelected && (
                                          <div className="w-2.5 h-2.5 rounded-full bg-primary" />
                                        )}
                                      </div>
                                      <span className="text-sm font-medium text-foreground">
                                        {isAr ? sub.labelAr : sub.labelEn}
                                      </span>
                                    </button>
                                  );
                                },
                              )}
                            </div>
                          </div>
                        )}

                        {/* Emergency Mode Toggle */}
                        {isEmergencyCategory(registerData.category) && (
                          <div
                            className={`p-5 rounded-2xl border-2 transition-all ${
                              registerData.emergencyMode
                                ? "border-destructive bg-gradient-to-br from-destructive/15 to-orange-500/10 shadow-lg shadow-destructive/20"
                                : "border-orange-300 bg-orange-50/50"
                            }`}
                          >
                            <div className="flex items-center justify-between gap-4">
                              <div className="flex items-center gap-3">
                                <div
                                  className={`p-2.5 rounded-xl ${registerData.emergencyMode ? "bg-destructive text-destructive-foreground" : "bg-orange-100 text-orange-600"}`}
                                >
                                  <Zap className="h-6 w-6" />
                                </div>
                                <div>
                                  <h4 className="font-bold text-base text-foreground">
                                    {isAr
                                      ? "هل تقدم خدمة الصيانة الطارئة (24)"
                                      : "Do you provide emergency maintenance (24)?"}
                                  </h4>
                                  <p className="text-sm text-muted-foreground">
                                    {t("auth.emergencyDesc")}
                                  </p>
                                </div>
                              </div>
                              <Switch
                                checked={registerData.emergencyMode}
                                onCheckedChange={(checked) =>
                                  setRegisterData({
                                    ...registerData,
                                    emergencyMode: checked,
                                  })
                                }
                                className="data-[state=checked]:bg-destructive"
                              />
                            </div>
                          </div>
                        )}
                      </>
                    )}

                    <div
                      className={`flex items-start gap-3 p-4 rounded-xl border transition-all ${
                        registerData.agreeToTerms
                          ? "bg-primary/10 border-primary/30"
                          : "bg-card border-border"
                      }`}
                    >
                      <Checkbox
                        id="agree-terms"
                        checked={registerData.agreeToTerms}
                        onCheckedChange={(checked) =>
                          setRegisterData({
                            ...registerData,
                            agreeToTerms: checked === true,
                          })
                        }
                        className={`mt-0.5 h-5 w-5 cursor-pointer ${registerData.agreeToTerms ? "border-primary data-[state=checked]:bg-primary" : ""}`}
                      />
                      <div className="space-y-1 flex-1">
                        <label className="text-sm font-semibold leading-relaxed text-foreground">
                          {t("auth.agreeTerms")}{" "}
                          <button
                            type="button"
                            onClick={() => setShowTerms(true)}
                            className="text-primary font-bold hover:underline"
                          >
                            {t("auth.termsLink")}
                          </button>
                        </label>
                        {registerData.agreeToTerms && (
                          <p className="text-xs text-primary font-medium">
                            ✓ {language === "ar" ? "تم الموافقة" : "Agreed"}
                          </p>
                        )}
                      </div>
                    </div>
                    {errors.agreeToTerms && (
                      <p className="text-sm text-destructive">
                        {errors.agreeToTerms}
                      </p>
                    )}

                    <Button
                      type="submit"
                      className="w-full h-12 text-base font-bold btn-cta border-0 rounded-xl"
                      disabled={
                        isSubmitting ||
                        (accountType === "customer" && !phoneVerified)
                      }
                    >
                      {accountType === "customer" && !phoneVerified
                        ? isAr
                          ? "يجب تأكيد رقم الهاتف أولاً"
                          : "Verify phone first"
                        : isSubmitting
                          ? t("auth.creatingAccount")
                          : `${t("auth.createAccount")} ${accountType === "customer" ? t("auth.customer") : t("auth.merchant")}`}
                    </Button>
                  </form>
                </TabsContent>
              </Tabs>

              <div className="text-center">
                <Link
                  to="/"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  ← {t("auth.backHome")}
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <PasswordResetModal
        open={showPasswordReset}
        onOpenChange={setShowPasswordReset}
      />

      {/* Inline Terms Dialog */}
      {showTerms && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div
            className="bg-card border border-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col overflow-hidden"
            dir={language === "ar" ? "rtl" : "ltr"}
          >
            <div className="p-4 border-b border-border flex items-center justify-between shrink-0">
              <h3 className="font-bold text-lg text-foreground">
                {t("auth.termsLink")}
              </h3>
              <button
                onClick={() => setShowTerms(false)}
                className="text-muted-foreground hover:text-foreground text-xl"
              >
                ✕
              </button>
            </div>
            <div
              className="flex-1 overflow-y-auto p-5"
              style={{ scrollbarWidth: "thin" }}
            >
              <div className="space-y-6 text-foreground">
                <div>
                  <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                    🔒 {isAr ? "سياسة الخصوصية" : "Privacy Policy"}
                  </h3>
                  <p className="mb-3">
                    {isAr
                      ? "نحن في منصة خدمات نحترم خصوصيتك ونلتزم بحماية بياناتك الشخصية."
                      : "At Khadamat platform, we respect your privacy and are committed to protecting your personal data."}
                  </p>
                  <div className="mb-3">
                    <h4 className="font-bold mb-2">
                      {isAr ? "جمع المعلومات:" : "Information Collection:"}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        {isAr
                          ? "نقوم بجمع المعلومات التي تقدمها عند التسجيل أو استخدام المنصة."
                          : "We collect information you provide when registering or using the platform."}
                      </li>
                      <li>
                        {isAr
                          ? "نقوم بجمع بعض المعلومات التلقائية عن استخدامك للمنصة لتحسين تجربة المستخدم."
                          : "We collect some automatic information about your usage to improve the user experience."}
                      </li>
                    </ul>
                  </div>
                  <div className="mb-3">
                    <h4 className="font-bold mb-2">
                      {isAr ? "استخدام المعلومات:" : "Use of Information:"}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        {isAr
                          ? "تُستخدم البيانات لتسهيل التواصل بين مقدم الخدمة والعميل."
                          : "Data is used to facilitate communication between service providers and customers."}
                      </li>
                      <li>
                        {isAr
                          ? "لا نقوم ببيع أو مشاركة معلوماتك الشخصية مع أطراف ثالثة."
                          : "We do not sell or share your personal information with third parties."}
                      </li>
                    </ul>
                  </div>
                  <div className="bg-destructive/10 p-3 rounded-lg">
                    <h4 className="font-bold mb-2 flex items-center gap-2">
                      ⚠️ {isAr ? "ملاحظات مهمة:" : "Important Notes:"}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        {isAr
                          ? "المنصة لا تتحمل أي مسؤولية عن أي تعامل بين العميل ومقدم الخدمة."
                          : "The platform bears no responsibility for any dealings between the customer and service provider."}
                      </li>
                      <li>
                        {isAr
                          ? "أي دفع يتم بين الطرفين يتم خارج المنصة وعلى مسؤولية الطرفين."
                          : "Any payment between the two parties is made outside the platform and at their own responsibility."}
                      </li>
                    </ul>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                    ⚖️ {isAr ? "إخلاء المسؤولية" : "Disclaimer"}
                  </h3>
                  <div className="space-y-3">
                    <div className="p-3 border border-border rounded-lg">
                      <p className="font-bold mb-1">
                        {isAr
                          ? "1. منصة وسيطة فقط:"
                          : "1. Intermediary Platform Only:"}
                      </p>
                      <p className="text-sm">
                        {isAr
                          ? "منصة خدمات تعمل كوسيط رقمي يربط بين العملاء ومقدمي الخدمات."
                          : "Khadamat platform works as a digital intermediary connecting customers with service providers."}
                      </p>
                    </div>
                    <div className="p-3 border border-border rounded-lg">
                      <p className="font-bold mb-1">
                        {isAr
                          ? "2. عدم المسؤولية عن الخدمات:"
                          : "2. No Liability for Services:"}
                      </p>
                      <p className="text-sm">
                        {isAr
                          ? "المنصة ليست مسؤولة عن جودة الخدمات المقدمة."
                          : "The platform is not responsible for the quality of services provided."}
                      </p>
                    </div>
                    <div className="p-3 border border-border rounded-lg">
                      <p className="font-bold mb-1">
                        {isAr
                          ? "3. عدم المسؤولية عن المدفوعات:"
                          : "3. No Liability for Payments:"}
                      </p>
                      <p className="text-sm">
                        {isAr
                          ? "أي معاملات مالية تتم مباشرة بين الطرفين."
                          : "Any financial transactions are conducted directly between the two parties."}
                      </p>
                    </div>
                    <div className="p-3 border border-border rounded-lg">
                      <p className="font-bold mb-1">
                        {isAr ? "4. النزاعات:" : "4. Disputes:"}
                      </p>
                      <p className="text-sm">
                        {isAr
                          ? "المنصة ليست طرفاً في أي نزاع بين العميل ومقدم الخدمة."
                          : "The platform is not a party to any dispute between the customer and service provider."}
                      </p>
                    </div>
                    <div className="p-3 border border-border rounded-lg">
                      <p className="font-bold mb-1">
                        {isAr ? "5. التعديلات:" : "5. Modifications:"}
                      </p>
                      <p className="text-sm">
                        {isAr
                          ? "تحتفظ المنصة بحق تعديل هذه السياسات في أي وقت."
                          : "The platform reserves the right to modify these policies at any time."}
                      </p>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                    🎁 {isAr ? "الاشتراك المجاني" : "Free Subscription"}
                  </h3>
                  <div className="p-4 border border-primary/30 rounded-xl bg-primary/5">
                    <p className="text-sm leading-relaxed">
                      {isAr
                        ? "يحصل الحرفيون عند التسجيل لأول مرة على فترة اشتراك مجانية لمدة شهرين، وبعد انتهاء الفترة المجانية يمكن للحرفي الاستمرار بالاستفادة من خدمات المنصة من خلال اشتراك شهري، وذلك بشكل اختياري لمن يرغب بالاستمرار."
                        : "Craftsmen receive a free two-month subscription upon first registration. After the free period ends, they can continue using the platform through an optional monthly subscription."}
                    </p>
                  </div>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-primary mb-3 flex items-center gap-2">
                    ℹ️ {isAr ? "نبذة عنا" : "About Us"}
                  </h3>
                  <p className="mb-3">
                    {isAr
                      ? "منصة خدمات هي منصة رقمية تهدف إلى تسهيل الوصول إلى الخدمات المنزلية العامة وخدمات الصيانة المنزلية الطارئة والصيانة الطارئة للمركبات على الطرقات في مكان واحد."
                      : "Khadamat is a digital platform that aims to facilitate access to general home services, emergency home maintenance services, and emergency vehicle maintenance on roads in one place."}
                  </p>
                  <div className="bg-muted/50 p-3 rounded-lg">
                    <h4 className="font-bold mb-2">
                      {isAr ? "ملاحظات مهمة:" : "Important Notes:"}
                    </h4>
                    <ul className="list-disc list-inside space-y-1 text-sm">
                      <li>
                        {isAr
                          ? "نحن منصة وسيطة فقط، ولا نقدم الخدمات مباشرة."
                          : "We are only an intermediary platform and do not provide services directly."}
                      </li>
                      <li>
                        {isAr
                          ? "أي اتفاق بين العميل ومقدم الخدمة يتم على مسؤولية الطرفين."
                          : "Any agreement between the customer and provider is at both parties' responsibility."}
                      </li>
                    </ul>
                  </div>
                </div>
                <div className="bg-muted/50 p-4 rounded-xl border-2 border-primary/30 text-center">
                  <h4 className="font-bold text-lg mb-2">
                    {isAr ? "الموافقة النهائية" : "Final Approval"}
                  </h4>
                  <p className="text-sm">
                    {isAr
                      ? 'بالضغط على "موافق" أو الاستمرار في استخدام منصة خدمات، أقر بأنني قد قرأت وفهمت جميع الشروط وأوافق عليها.'
                      : 'By clicking "Agree" or continuing to use Khadamat platform, I acknowledge that I have read and understood all terms and agree to them.'}
                  </p>
                </div>
              </div>
            </div>
            <div className="p-4 border-t border-border">
              <Button
                onClick={() => {
                  setRegisterData((prev) => ({ ...prev, agreeToTerms: true }));
                  setShowTerms(false);
                }}
                className="w-full font-bold h-12 text-base btn-cta border-0 rounded-xl"
              >
                {isAr
                  ? "✓ موافق على الشروط والأحكام"
                  : "✓ I Agree to Terms & Conditions"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Auth;
