import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import { CartProvider } from "@/hooks/useCart";
import { LanguageProvider } from "@/hooks/useLanguage";
import Index from "./pages/Index";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";

import PublicPage from "./pages/PublicPage";
import Terms from "./pages/Terms";
import Browse from "./pages/Browse";
import CategoryPage from "./pages/CategoryPage";
import PaymentSuccess from "./pages/PaymentSuccess";
import Customer from "./pages/Customer";
import Cart from "./pages/Cart";
import NotFound from "./pages/NotFound";
import ServiceSEOPage from "./pages/ServiceSEOPage";
import { useState } from "react";

const App = () => {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LanguageProvider>
        <AuthProvider>
          <CartProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/auth" element={<Auth />} />
                  <Route path="/dashboard" element={<Dashboard />} />
                  
                  <Route path="/customer" element={<Customer />} />
                  <Route path="/terms" element={<Terms />} />
                  <Route path="/browse" element={<Browse />} />
                  <Route path="/cart" element={<Cart />} />
                  <Route path="/category/:category" element={<CategoryPage />} />
                  <Route path="/payment-result" element={<PaymentSuccess />} />
                  <Route path="/p/:slug" element={<PublicPage />} />
                  <Route path="/services/:slug" element={<ServiceSEOPage />} />
                  <Route path="*" element={<NotFound />} />
                </Routes>
              </BrowserRouter>
            </TooltipProvider>
          </CartProvider>
        </AuthProvider>
      </LanguageProvider>
    </QueryClientProvider>
  );
};

export default App;