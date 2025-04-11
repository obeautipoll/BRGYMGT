import './Login.css';
import React, { useState } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';

function Login({ onLogin, API_URL, onClose }) {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [showPassword, setShowPassword] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsLoading(true); // Set loading state
        try {
            const response = await axios.post(`${API_URL}/login`, { username, password });
            
            // Store token and role in localStorage or sessionStorage
            localStorage.setItem('token', response.data.token);
            localStorage.setItem('role', response.data.role);

            // Pass token and role to parent
            onLogin(response.data.token, response.data.role);

            toast.success('Login successful!');
            onClose(); // Close the modal on successful login

            // Redirect after login (optional)
            window.location.href = '/dashboard';  // Redirect to dashboard or relevant page
        } catch (error) {
            toast.error(error.response?.data?.message || 'Login failed');
        } finally {
            setIsLoading(false); // Reset loading state
        }
    };

    return (
        <div className="modal">
            <div className="modal-content">
                <span className="close" onClick={onClose}>&times;</span> {/* Close button */}
                <form onSubmit={handleSubmit}>
                    <h2>Login</h2>

                    {/* Username input */}
                    <input
                        type="text"
                        placeholder="Username"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                        required
                    />

                    {/* Password input */}
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

                    {/* Submit button */}
                    <button type="submit" disabled={isLoading}>
                        {isLoading ? 'Logging in...' : 'Login'}
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Login;
