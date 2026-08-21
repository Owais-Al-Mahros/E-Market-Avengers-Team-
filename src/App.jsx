import { Routes, Route } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import AdminDashboard from "./Pages/Admin dashboard/AdminDashboard";
import HomePage from "./Pages/Home page/HomePage";
import LoginPage from "./Pages/Log in  page/LoginPage";

import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";

function App() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const StorgedAdmin = localStorage.getItem("isAdmin");
    if (StorgedAdmin === "true") {
      setIsAdmin(true);
    }
    setIsLoading(false);
  }, []);

  if (isLoading) {
    return (
      <>
        <h1>... waite a minute</h1>
      </>
    );
  }

  return (
    <>
      <Toaster position="top-center" reverseOrder={false} />

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
    </>
  );
}

export default App;
