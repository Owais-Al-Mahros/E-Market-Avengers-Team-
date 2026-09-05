import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState, useRef, lazy, Suspense } from "react";
import { ProductProvider } from "./context/ProductContext";
import { supabase } from "./lib/supabase";

// 🚀 تطبيق Lazy Loading على جميع الصفحات
const AdminDashboard = lazy(() => import("./Pages/Admin dashboard/AdminDashboard"));
const HomePage = lazy(() => import("./Pages/Home page/HomePage"));
const LoginPage = lazy(() => import("./Pages/Log in  page/LoginPage"));
const CartAndPayments = lazy(() => import("./Pages/Cart and payments/CartAndPayments"));

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true);

  // دالة التحقق (تُستخدم في الخلفية بدون تغيير حالة التحميل)
  const checkAdminStatus = async (session) => {
    if (!session) {
      setIsAdmin(false);
      return;
    }

    const { data: profile, error } = await supabase
      .from("profiles")
      .select("is_admin")
      .eq("id", session.user.id)
      .single();

    if (!error && profile) {
      setIsAdmin(profile.is_admin === true);
    } else {
      setIsAdmin(false);
    }
  };

  useEffect(() => {
    // 1. التحقق الأولي عند تحميل التطبيق (مرة واحدة فقط)
    const initializeAuth = async () => {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      await checkAdminStatus(session);

      setIsLoading(false);
      isInitialMount.current = false;
    };

    initializeAuth();

    // 2. الاستماع لتغيرات المصادقة (تسجيل الدخول/الخروج)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await checkAdminStatus(session);

        if (event === "SIGNED_OUT") {
          window.location.href = "/";
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return <h1>... wait a minute</h1>;
  }

  return (
    <>
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 99999,
        }}
      />
      <ProductProvider>
        {/* ⏳ تغليف الـ Routes بـ Suspense لعرض شاشة تحميل خفيفة أثناء جلب الصفحة المطلوب فتحها فقط */}
        <Suspense fallback={<h1>Loading page...</h1>}>
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/Cart&Payments/*" element={<CartAndPayments />} />
            <Route
              path="/dashboard"
              element={
                isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />
              }
            />
            <Route
              path="/login"
              element={<LoginPage setIsAdmin={setIsAdmin} />}
            />
          </Routes>
        </Suspense>
      </ProductProvider>
    </>
  );
}

export default App;