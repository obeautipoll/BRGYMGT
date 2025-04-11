import React, { useState } from 'react';
import axios from 'axios';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function Register({ API_URL, onClose }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [secretCode, setSecretCode] = useState(''); // Stores the actual secret code
  const [isLoading, setIsLoading] = useState(false); // Loading state
  const [showPassword, setShowPassword] = useState(false);

  // Regex to ensure the username is in the format 'lastname.firstname.age'
  const usernameRegex = /^[a-zA-Z]+(?:\.[a-zA-Z]+){1}\.\d+$/;

  // Handle the secret code change and mask the input
  const handleSecretChange = (e) => {
    setSecretCode(e.target.value);  // Store the real secret code
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);

    // Validate the username format
    if (!usernameRegex.test(username)) {
      toast.error("Username must be in the format 'lastname.firstname.age'");
      setIsLoading(false);
      return;
    }

    try {
      // Send the real secret code to the backend
      await axios.post(`${API_URL}/register`, { username, password, secretCode });

      toast.success('Registration successful! Please wait for admin confirmation.');
      onClose();  // Close the modal on successful registration
    } catch (error) {
      toast.error(error.response?.data?.message || 'Registration failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="modal">
      <div className="modal-content">
        <span className="close" onClick={onClose}>&times;</span> {/* Ensure the close button calls onClose */}
        <form onSubmit={handleSubmit}>
          <h2>Register</h2>
          <input
            type="text"
            placeholder="Username: 'lastname.first.age'"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
          <div className="password-field">
            <input
              type={showPassword ? 'text' : 'password'}
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button
              type="button"
              className="show-password-btn"
              onClick={() => setShowPassword(!showPassword)}
            >
              {showPassword ? 'Hide' : 'Show'}
            </button>
          </div>
          
          
          
          <button type="submit" disabled={isLoading}>
            {isLoading ? 'Registering...' : 'Register'}
          </button>
        </form>
      </div>
    </div>
  );
}

export default Register;
