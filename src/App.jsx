import { Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import { useEffect, useState, lazy, Suspense } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "./lib/supabase";
import LoadingPage from "./components/ui/LoadingPage";

import DisplayProducts from "./Pages/DisplayProducts/DisplayProducts";
import ProductDetails from "./Pages/DisplayProducts/ProductDetails";

import TrackOrder from "./Pages/Track Orders/TrackOrder";
import FavoriteList from "./Pages/favorites/FavoriteList";
import MyInfo from "./Pages/my-info/MyInfo";

// 🚀 تطبيق Lazy Loading على باقي الصفحات (بدون DisplayProducts)
const FaqPage = lazy(() => import("./Pages/Faq/FaqPage"));
const HelpPage = lazy(() => import("./Pages/Help/HelpPage"));
const DriverDashboard = lazy(() => import("./Pages/driver/DriverDashboard"));
const AdminDashboard = lazy(
  () => import("./Pages/Admin dashboard/AdminDashboard"),
);
const HomePage = lazy(() => import("./Pages/home/HomePage"));
const LoginPage = lazy(() => import("./Pages/Log in  page/LoginPage"));
const CartAndPayments = lazy(
  () => import("./Pages/Cart and payments/CartAndPayments"),
);
const AGB = lazy(() => import("./Pages/Legal/AGB"));
const Impressum = lazy(() => import("./Pages/Legal/Impressum"));
const Datenschutz = lazy(() => import("./Pages/Legal/Datenschutz"));
const Widerruf = lazy(() => import("./Pages/Legal/Widerruf"));
const LieferungZahlung = lazy(() => import("./Pages/Legal/LieferungZahlung"));

function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

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
    const initializeAuth = async () => {
      setIsLoading(true);

      const {
        data: { session },
      } = await supabase.auth.getSession();
      await checkAdminStatus(session);

      setIsLoading(false);
    };

    initializeAuth();

    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        await checkAdminStatus(session);

        if (event === "SIGNED_OUT") {
          window.location.href = "/";
        }
      },
    );

    return () => {
      authListener?.subscription.unsubscribe();
    };
  }, []);

  if (isLoading) {
    return (
      <div className="Loading">
        <LoadingPage />
      </div>
    );
  }

  return (
    <>
      <ScrollToTop />
      <Toaster
        position="top-center"
        reverseOrder={false}
        containerStyle={{
          zIndex: 99999,
        }}
      />
      {/* ⏳ Suspense لباقي الصفحات (بدون DisplayProducts) */}
      <Suspense fallback={<LoadingPage />}>
        <Routes>
          <Route path="/" element={<HomePage />} />
          <Route path="/Cart&Payments/*" element={<CartAndPayments />} />
          {/* ✅ DisplayProducts مباشر — لا Suspense fallback له */}
          <Route path="/DisplayProducts" element={<DisplayProducts />} />
          <Route path="/favorites" element={<FavoriteList />} />
          <Route path="/my-info" element={<MyInfo />} />
          <Route
            path="/DisplayProducts/ProductCardDetails"
            element={<ProductDetails />}
          />
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
          <Route path="/agb" element={<AGB />} />
          <Route path="/impressum" element={<Impressum />} />
          <Route path="/datenschutz" element={<Datenschutz />} />
          <Route path="/widerruf" element={<Widerruf />} />
          <Route path="/lieferung-zahlung" element={<LieferungZahlung />} />
          <Route path="/track-order" element={<TrackOrder />} />
          <Route path="/faq" element={<FaqPage />} />
          <Route path="/help" element={<HelpPage />} />
          {/* <Route path="/driver" element={<DriverDashboard />} /> */}
        </Routes>
      </Suspense>
    </>
  );
}

export default App;
