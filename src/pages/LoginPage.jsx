import { useState } from "react";
import { Navigate, useAsyncError, useNavigate } from "react-router-dom";
import AdminDashboard from "./AdminDashboard";

import "./LoginPage.css";

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

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      (adminInfo.name === "owais" ||
        adminInfo.name === "rslan" ||
        adminInfo.name === "mariam") &&
      adminInfo.password === "1234"
    ) {
      localStorage.setItem("isAdmin", "true");
      setIsAdmin(true);

      setIsLoading(true);

      setTimeout(() => {
        navigate("/dashboard");
        setIsLoading(false);
      }, 500);
    } else {
      setAdminInfo({ name: "", password: "" });
      alert("The user name or the password is wrong");
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
                onMouseMove={() => setShowpassword((prev) => !prev)}
              >
                {showpassword ? "✋" : "✍"}
              </button>
            </div>
          </div>
          <button type="submit" className="login-btn">
            Enter
          </button>
        </form>
      </div>
    </div>
  );
}

export default LoginPage;
