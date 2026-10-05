import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-hot-toast";
import "./LoginPage.css";
import { supabase } from "../../lib/supabase.js";

export default function LoginPage({ setIsAdmin }) {
  const navigate = useNavigate();

  const [credentials, setCredentials] = useState({ email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleChange = (event) => {
    const { name, value } = event.target;
    setCredentials((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setIsLoading(true);

    try {
      // ══════════════════════════════════════════════
      // 1. تسجيل الدخول
      // ══════════════════════════════════════════════
      const { data, error } = await supabase.auth.signInWithPassword({
        email: credentials.email.trim().toLowerCase(),
        password: credentials.password,
      });

      if (error) {
        toast.error("Invalid email or password.");
        setCredentials({ email: "", password: "" });
        return;
      }

      // ══════════════════════════════════════════════
      // 2. تأكيد الإيميل
      // ══════════════════════════════════════════════
      if (!data.user?.email_confirmed_at) {
        toast.error("Please confirm your email first.");
        await supabase.auth.signOut();
        return;
      }

      // ══════════════════════════════════════════════
      // 3. جلب البروفايل الكامل
      // ══════════════════════════════════════════════
      const { data: profile, error: profileError } = await supabase
        .from("profiles")
        .select("is_admin, role, is_active")
        .eq("id", data.user.id)
        .single();

      if (profileError || !profile) {
        toast.error("Access denied.");
        await supabase.auth.signOut();
        return;
      }

      // ══════════════════════════════════════════════
      // 4. فحص الحساب المعطّل
      // ══════════════════════════════════════════════
      if (profile.is_active === false) {
        toast.error("Ihr Konto ist deaktiviert.");
        await supabase.auth.signOut();
        return;
      }

      // ══════════════════════════════════════════════
      // 5. التوجيه حسب الدور (مرة واحدة فقط!)
      // ══════════════════════════════════════════════
      if (profile.is_admin) {
        toast.success("Login successful");
        setIsAdmin(true);
        navigate("/dashboard", { replace: true });
      } else if (profile.role === "driver") {
        toast.success("Willkommen, Fahrer!");
        navigate("/driver", { replace: true });
      } else {
        toast.error("Access denied.");
        await supabase.auth.signOut();
        setCredentials({ email: "", password: "" });
      }
    } catch (err) {
      console.error("Login error:", err?.message || err);
      toast.error("Something went wrong. Please try again.");
      await supabase.auth.signOut();
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <h2>Login</h2>

        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              name="email"
              type="email"
              value={credentials.email}
              onChange={handleChange}
              placeholder="admin@shopora.com"
              disabled={isLoading}
              autoComplete="email"
              autoFocus
              required
            />
          </div>

          <div className="input-group">
            <label htmlFor="password">Password</label>
            <div className="password-fields">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={credentials.password}
                onChange={handleChange}
                placeholder="Enter your password"
                disabled={isLoading}
                autoComplete="current-password"
                required
              />
              {credentials.password.length > 0 && (
                <button
                  type="button"
                  className="password-field-btn"
                  onClick={() => setShowPassword((prev) => !prev)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  tabIndex={-1}
                >
                  {showPassword ? "🙈" : "👁️"}
                </button>
              )}
            </div>
          </div>

          <button type="submit" className="login-btn" disabled={isLoading}>
            {isLoading ? "Signing in..." : "Sign In"}
          </button>
        </form>

        <p className="login-footer">
          © {new Date().getFullYear()} Shopora. All rights reserved.
        </p>
      </div>
    </div>
  );
}