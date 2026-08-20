import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./LoginPage.css";
import AdminDashboard from "../Admin dashboard/AdminDashboard.jsx";
import { fetchData } from "../../hooks/useProduct.js"
import { supabase } from "../../lib/supabase.js";

function LoginPage({ setIsAdmin }) {
  const navigate = useNavigate();

  const [adminInfo, setAdminInfo] = useState({ name: "", password: "", });
  const [adminsList, setAdminsList] = useState([]);
  const [showpassword, setShowpassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { id, value } = event.target;

    setAdminInfo((prevState) => ({
      ...prevState,
      [id]: value,
    }));

  };

  const fetchAdminsInfo = async () => {
    const AdminsInfoFromDataBase = await fetchData("Admins");
    setAdminsList(AdminsInfoFromDataBase);
  }
  useEffect(() => {
    fetchAdminsInfo();
  }, [])


  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    // 1. محاولة تسجيل الدخول عبر Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminInfo.name, // هنا نستخدم البريد الإلكتروني
      password: adminInfo.password,
    });

    if (error) {
      alert(`Login failed: ${error.message}`);
      setAdminInfo({ name: "", password: "" });
      setIsLoading(false);
      return;
    }

    // 2. بعد نجاح تسجيل الدخول، نحصل على بيانات المستخدم من Auth
    const user = data.user;

    // 3. نذهب إلى جدول profiles لمعرفة إذا كان هذا المستخدم أدمن
    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, email")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      alert("Your account is not fully set up. Please contact support.");
      await supabase.auth.signOut(); // تسجيل الخروج فوراً
      setIsLoading(false);
      return;
    }

    // 4. إذا كان الأدمن (is_admin = true)، نسمح بالدخول
    if (profileData.is_admin === true) {
      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminName", profileData.email || adminInfo.name);
      setIsAdmin(true);

      setTimeout(() => {
        setIsLoading(false);
        navigate("/dashboard");
      }, 500);
    } else {
      // 5. إذا لم يكن أدمن، نمنع الدخول ونسجل الخروج
      alert("Access denied. You are not an admin.");
      await supabase.auth.signOut();
      setAdminInfo({ name: "", password: "" });
      setIsLoading(false);
    }
  };


  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login Page</h2>
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="name">Enter your Name: </label>
            <input
              id="name"
              type="text"
              value={adminInfo.name}
              onChange={handleChange}
              placeholder="Your name"
              disabled={isLoading}
            />
          </div>
          <div className="input-group">
            <label htmlFor="password">Enter your password</label>
            <div className="password-fileds">
              <input
                id="password"
                type={showpassword ? "text" : "password"}
                value={adminInfo.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isLoading}
              />
              <button
                className="password-filed"
                type="button"
                onMouseLeave={() => setShowpassword(false)}
                onMouseDown={() => setShowpassword(true)}
                onMouseUp={() => setShowpassword(false)}
              >
                {showpassword ? "✋" : "✍"}
              </button>
            </div>
          </div>
          <button type="submit" className="login-btn">
            {isLoading ? "Loding.." : "Enter"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
