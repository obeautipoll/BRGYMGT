import React from "react";
import { NavLink } from "react-router-dom";
import "./Sidebar.css"; // Ensure you have the correct path for CSS

const Sidebar = ({ role }) => {
  return (
    <div className="sidebar">
      <div className="logo-container">
        <img
          src="./mainit.jpg" // Correct path to your logo image
          alt="BRGY.MAINIT Logo"
          className="sidebar-logo"
        />
      </div>
      <h3>BRGY. MAINIT</h3>
      <ul>
        {/* Admin Sidebar Links */}
        {role === "admin" && (
          <>
            <li>
              <NavLink to="/dashboard" className="active">
                Dashboard
              </NavLink>
            </li>
            <li>
              <NavLink to="/residents" className="active">
                Residents
              </NavLink>
            </li>
            <li>
              <NavLink to="/officials" className="active">
                Officials
              </NavLink>
            </li>
            
            <li>
              <NavLink to="/clearance" className="active">
                Clearance
              </NavLink>
            </li>
            <li>
              <NavLink to="/announcements" className="active">
                Announcements
              </NavLink>
            </li>
          </>
        )}

{role === "user" && (
  <>
    <li>
      <NavLink 
        to="/dashboard" 
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        User Dashboard
      </NavLink>
    </li>
    <li>
      <NavLink 
        to="/uofficials" 
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Officials (Album)
      </NavLink>
    </li>
    <li>
      <NavLink 
        to="/certificates" 
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Certificates
      </NavLink>
      </li>
    {/* New "Account" section */}
    <li>
      <NavLink 
        to="/account" 
        className={({ isActive }) => (isActive ? "active" : "")}
      >
        Account
      </NavLink>
    </li>
  </>
)}
      </ul>
    </div>
  );
};

export default Sidebar;
