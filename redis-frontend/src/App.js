import React, { useState, useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "./App.css";

// Importing pages
import Homepage from "./Homepage";
import Login from "./auth/Login";
import Register from "./auth/Register";

// Role-based Dashboards
import AdminDashboard from "./pages/Admin/AdminDashboard";
import StaffDashboard from "./pages/Staff/StaffDashboard";
import UserDashboard from "./pages/User/UserDashboard";

// Admin Pages
import Residents from "./pages/Admin/Residents";
import Officials from "./pages/Admin/Officials";
import Staff from "./pages/Admin/Staff";
import Clearance from "./pages/Admin/Clearance";
import Announcements from "./pages/Admin/Announcements";

// Components
import Sidebar from "./components/Sidebar";
import Certificates from "./pages/User/Certificates";
import UOfficials from "./pages/User/UOfficials";

import Account from './pages/User/Account'; 


const API_URL = "http://localhost:5000";

function App() {
  const [token, setToken] = useState(null);
  const [role, setRole] = useState(null);
  const [residents, setResidents] = useState([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");  // You can remove this if you don't need it

  // Login & Register modal states
  const [showLogin, setShowLogin] = useState(false);
  const [showRegister, setShowRegister] = useState(false);

  useEffect(() => {
    const storedToken = localStorage.getItem("token");
    const storedRole = localStorage.getItem("role");
    if (storedToken) {
      setToken(storedToken);
      setRole(storedRole);
      setIsLoggedIn(true);
    }
  }, []);

  const fetchResidents = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/residents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidents(response.data);  // Update the residents state with the fetched data
    } catch (error) {
      toast.error("Failed to fetch residents.");
    }
  };

  useEffect(() => {
    fetchResidents();  // Fetch residents when the component mounts or when the token changes
  }, [token]);

  const handleLoginSuccess = (token, role) => {
    setToken(token);
    setRole(role);
    setIsLoggedIn(true);
    localStorage.setItem("token", token);
    localStorage.setItem("role", role);
    setShowLogin(false);
  };

  const handleLogout = () => {
    setToken(null);
    setRole(null);
    setIsLoggedIn(false);
    setResidents([]);
    localStorage.removeItem("token");
    localStorage.removeItem("role");
    
  };

  // Filter residents by search query (you can remove this part if you remove the search input)
  const filteredResidents = residents.filter((resident) =>
    Object.values(resident).some((value) =>
      String(value).toLowerCase().includes(searchQuery.toLowerCase())
    )
  );

  return (
    <Router>
      <div className="App">
        <ToastContainer position="top-right" autoClose={5000} />

        {!isLoggedIn ? (
          <Homepage openLoginModal={() => setShowLogin(true)} openRegisterModal={() => setShowRegister(true)} />
        ) : (
          <div className="main-layout">
            <Sidebar role={role} />
            <div className="content">
              <button className="logout-btn" onClick={handleLogout}>
                Logout
              </button>

             

              <Routes>
                {role === "admin" && (
                  <>
                    <Route path="/dashboard" element={<AdminDashboard residents={residents} API_URL={API_URL} token={token} />}
                    />
                   
                    <Route
                      path="/residents"
                      element={<Residents API_URL={API_URL} token={token} residents={filteredResidents} fetchResidents={fetchResidents} />}
                    />
                    <Route path="/officials" element={<Officials API_URL={API_URL} token={token}role={role}/>} />
                    <Route path="/staffs" element={<Staff />} />
                    <Route path="/clearance" element={<Clearance API_URL={API_URL} token={token}  />} />
                    <Route path="/announcements" element={<Announcements  API_URL={API_URL} token={token} role={role} />}/>
                  </>
                )}

                {role === "staff" && <Route path="/dashboard" element={<StaffDashboard />} />}

                {role === "user" && (
                <>
                   <Route path="/dashboard" element={<UserDashboard API_URL={API_URL} token={token}  />} />
                  <Route path="/uofficials" element={<UOfficials API_URL={API_URL} token={token} />} />
                  <Route path="/certificates" element={<Certificates API_URL={API_URL} token={token} />} />
                  <Route path="/account" element={<Account API_URL={API_URL} token={token} />} />
                </>
              )}


                <Route path="*" element={<Navigate to="/dashboard" />} />
              </Routes>
            </div>
          </div>
        )}

        {showLogin && <Login API_URL={API_URL} onLogin={handleLoginSuccess} onClose={() => setShowLogin(false)} />}
        {showRegister && <Register API_URL={API_URL} onClose={() => setShowRegister(false)} />}
      </div>
    </Router>
  );
}

export default App;
