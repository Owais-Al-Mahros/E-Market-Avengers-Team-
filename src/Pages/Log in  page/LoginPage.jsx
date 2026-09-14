import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./LoginPage.css";
import { supabase } from "../../lib/supabase.js";

function LoginPage({ setIsAdmin }) {
  const navigate = useNavigate();

  const [adminInfo, setAdminInfo] = useState({ name: "", password: "" });
  const [showpassword, setShowpassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { id, value } = event.target;
    setAdminInfo((prevState) => ({
      ...prevState,
      [id]: value,
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminInfo.name,
      password: adminInfo.password,
    });

    if (error) {
      toast.error(`Login failed: ${error.message}`);
      setAdminInfo({ name: "", password: "" });
      setIsLoading(false);
      return;
    }

    const user = data.user;

    const { data: profileData, error: profileError } = await supabase
      .from("profiles")
      .select("is_admin, email, name, image")
      .eq("id", user.id)
      .single();

    if (profileError || !profileData) {
      toast.error("Your account is not fully set up. Please contact support.");
      await supabase.auth.signOut();
      setIsLoading(false);
      return;
    }

    if (profileData.is_admin === true) {
      toast.success("Login successful");
      setIsAdmin(true);
      setIsLoading(false);
      navigate("/dashboard");
    } else {
      toast.error("Access denied. You are not an admin.");
      await supabase.auth.signOut();
      setAdminInfo({ name: "", password: "" });
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      {/* 🌿 قسم النصوص الترحيبية المعروض فوق الصورة */}
      <div className="login-info">
        <h1 className="welcome-title">Welcome Back! 🌿</h1>
        <p className="welcome-desc">
          Log in to your account and continue shopping fresh and healthy products.
        </p>

        <div className="features-list">
          <div className="feature-item">
            <span className="feature-icon">🚚</span>
            <div>
              <h3>Fast Delivery</h3>
              <p>Get your order at your doorstep</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-icon">🛡️</span>
            <div>
              <h3>Secure Payments</h3>
              <p>100% safe and trusted</p>
            </div>
          </div>

          <div className="feature-item">
            <span className="feature-icon">🥦</span>
            <div>
              <h3>Best Quality</h3>
              <p>Fresh & quality products</p>
            </div>
          </div>
        </div>
      </div>

      {/* 💳 كارت تسجيل الدخول */}
      <div className="login-card-wrapper">
        <div className="login-card">
          <h2>Login</h2>
          <form onSubmit={handleSubmit}>
            <div className="input-group">
              <label htmlFor="name">👤 Enter your Email: </label>
              <input
                id="name"
                type="email"
                value={adminInfo.name}
                onChange={handleChange}
                placeholder="Your email"
                disabled={isLoading}
                required
              />
            </div>
            <div className="input-group">
              <label htmlFor="password">🔒 Enter your password</label>
              <div className="password-fields">
                <input
                  id="password"
                  type={showpassword ? "text" : "password"}
                  value={adminInfo.password}
                  onChange={handleChange}
                  placeholder="Enter your password"
                  disabled={isLoading}
                  required
                />
                {adminInfo.password.length > 0 && (
                  <button
                    className="password-field-btn"
                    type="button"
                    onMouseLeave={() => setShowpassword(false)}
                    onMouseDown={() => setShowpassword(true)}
                    onMouseUp={() => setShowpassword(false)}
                  >
                    {showpassword ? "✋" : "✍"}
                  </button>
                )}
              </div>
            </div>
            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? "Loading..." : "Enter"}
            </button>
          </form>
          <div className="login-footer">
            <div className="forgot-password">
              <span>Forgot your password? </span>
              <a href="mailto:support@namecompany.com">Contact Support</a>
            </div>
            <div className="signup-link">
              <span>Don't have an account? </span>
              <a href="/signup">Sign Up</a>
            </div>
            <div className="copyright">
              <span>© 2024 E-Market. All rights reserved.</span>
            </div>
          </div>
        </div>

        {/* 🛡️ شريط الضمانات أسفل الكارت */}
        <div className="trust-badges">
          <div className="badge-item">
            <span className="badge-icon">✅</span>
            <span>Secure & Trusted</span>
          </div>
          <span className="badge-divider">|</span>
          <div className="badge-item">
            <span className="badge-icon">🔒</span>
            <span>Your Data is Safe</span>
          </div>
          <span className="badge-divider">|</span>
          <div className="badge-item">
            <span className="badge-icon">🌿</span>
            <span>Fresh Guarantee</span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LoginPage;