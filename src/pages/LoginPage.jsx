import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./LoginPage.css";
import AdminDashboard from "./AdminDashboard";
import { fetchData } from "../hooks/useProduct.js"

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


  const handleSubmit = (event) => {
    event.preventDefault();
    setIsLoading(true);

    const foundAdmin = adminsList.find(
      (admin) =>
        admin.name.toLowerCase() === adminInfo.name.trim().toLowerCase() &&
        admin.password === adminInfo.password.trim()
    );

    if (foundAdmin) {

      localStorage.setItem("isAdmin", "true");
      localStorage.setItem("adminName", foundAdmin.name);
      setIsAdmin(true);

      setTimeout(() => {
        setIsLoading(false);
        navigate("/dashboard");
      }, 500);

    }
    else {
      setAdminInfo({ name: "", password: "" });
      alert("The user name or the password is wrong");
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
