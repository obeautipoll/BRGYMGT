import React from "react";
import "./Homepage.css"; // Add a CSS file for styling

function Homepage({ openLoginModal, openRegisterModal }) {
  return (
    <div className="homepage">
      <h1>Welcome Barangay Mainit</h1>
      <p>Iligan City, Philippines</p>

      <button className="homepage-btn login" onClick={openLoginModal}>Login</button>
      <button className="homepage-btn register" onClick={openRegisterModal}>Register</button>
    </div>
  );
}

export default Homepage;