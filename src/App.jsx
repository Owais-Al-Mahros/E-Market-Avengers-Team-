import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminDashboard from "./Pages/Admin dashboard/AdminDashboard";
import HomePage from "./Pages/Home page/HomePage";
import LoginPage from "./Pages/Log in  page/LoginPage";
import { useEffect, useState, useRef } from "react";
import { Navigate } from "react-router-dom";
import { ProductProvider } from "./context/ProductContext";
import { supabase } from "./lib/supabase";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const isInitialMount = useRef(true); // ✅ لتتبع التحميل الأول

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

      const { data: { session } } = await supabase.auth.getSession();
      await checkAdminStatus(session);

      setIsLoading(false);
      isInitialMount.current = false;
    };

    initializeAuth();

    // 2. الاستماع لتغيرات المصادقة (تسجيل الدخول/الخروج)
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        // ✅ نحدّث الحالة بدون تغيير `isLoading` (بدون شاشة تحميل)
        await checkAdminStatus(session);

        // إذا كان تسجيل خروج، أعد التوجيه للصفحة الرئيسية
        if (event === "SIGNED_OUT") {
          window.location.href = "/"; // أو استخدم navigate إذا كان في سياق راوتر
        }
      }
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []); // ✅ المصفوفة الفارغة تضمن تنفيذ التأثير مرة واحدة فقط

  if (isLoading) {
    return <h1>... wait a minute</h1>;
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} containerStyle={{
        zIndex: 99999, // ✅ بدلاً من 5
      }} />
      <ProductProvider>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route
            path="/dashboard"
            element={
              isAdmin ? <AdminDashboard /> : <Navigate to="/login" replace />
            }
          />
          <Route path="/login" element={<LoginPage setIsAdmin={setIsAdmin} />} />
        </Routes>
      </ProductProvider>
    </>
  );
}

export default App;