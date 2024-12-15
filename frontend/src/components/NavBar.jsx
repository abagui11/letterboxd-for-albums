import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import "../styles/NavBar.css";

const NavBar = () => {
  const navigate = useNavigate();
  const location = useLocation(); // Hook to get current route

  const handleLogout = () => {
    localStorage.removeItem('userId'); // Clear user data
    navigate("/"); // Navigate back to the login page
  };

  // Function to check if link is active
  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <nav className="nav-bar">
      <ul>
        <li>
          <Link to="/feed" className={isActive('/feed') ? 'active' : ''}>
            Feed
          </Link>
        </li>
        <li>
          <Link to="/profile" className={isActive('/profile') ? 'active' : ''}>
            Profile
          </Link>
        </li>
        <li>
          <button onClick={handleLogout}>Logout</button>
        </li>
      </ul>
    </nav>
  );
};

export default NavBar;
