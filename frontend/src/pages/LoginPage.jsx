import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import SignUpModal from "../components/SignUpModal";
import logoImage from "../assets/letterboxdforalbums.png"; // Adjust path as needed
import "../styles/LoginPage.css";

const LoginPage = () => {
  const [loginCredentials, setLoginCredentials] = useState({
    username: "",
    password: "",
  });
  const [showSignUpModal, setShowSignUpModal] = useState(false);

  const navigate = useNavigate();

  // In LoginPage.jsx, update the handleLogin function:
 // In LoginPage.jsx, update the handleLogin function:
const handleLogin = async (event) => {
  event.preventDefault();

  try {
      const response = await fetch("http://localhost:8080/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(loginCredentials),
      });

      const data = await response.json();

      if (response.ok) {
          // Store user ID in localStorage
          localStorage.setItem('userId', data.user.id);
          alert("Login successful!");
          navigate("/feed");
      } else {
          alert(data.message || "Login failed! Please try again.");
      }
  } catch (err) {
      console.error("Error logging in:", err);
      alert("An error occurred. Please try again later.");
  }
};

  const handleInputChange = (event) => {
    const { name, value } = event.target;
    setLoginCredentials((prevState) => ({ ...prevState, [name]: value }));
  };

  return (
    <div className="page-container">
      <div className="login-page">
        <img src={logoImage} alt="Letterboxd for Music Logo" className="login-logo" />
        <h1>Letterboxd for Music</h1>
        <form className="login-form" onSubmit={handleLogin}>
          <div className="form-group">
            <label htmlFor="username">Username:</label>
            <input
              type="text"
              id="username"
              name="username"
              value={loginCredentials.username}
              onChange={handleInputChange}
              placeholder="Enter your username"
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="password">Password:</label>
            <input
              type="password"
              id="password"
              name="password"
              value={loginCredentials.password}
              onChange={handleInputChange}
              placeholder="Enter your password"
              required
            />
          </div>
          <div className="button-container">
            <button type="submit" className="login-button">Login</button>
            <button 
              type="button" 
              className="signup-button"
              onClick={() => setShowSignUpModal(true)}
            >
              Sign Up
            </button>
          </div>
        </form>
      </div>

      {showSignUpModal && (
        <SignUpModal 
          onClose={() => setShowSignUpModal(false)}
          onSignUpSuccess={() => {
            setShowSignUpModal(false);
            // Optionally show a success message or auto-login
          }}
        />
      )}
    </div>
  );
};

export default LoginPage;
