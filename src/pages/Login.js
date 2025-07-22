import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';
import '../styles/Login.css'; // Import the CSS

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const navigate = useNavigate();


  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      const response = await apiClient.post('/login', { username, password });
      const { country, role } = response.data;

      if (response.status === 200) {
        console.log('Login successful:', country, role);

        // Save country and role to localStorage
        localStorage.setItem('country', country);
        localStorage.setItem('role', role);
        localStorage.setItem('isLoggedIn', true);

        // Call onLogin function with role and navigate to the section
        onLogin(true, role, country);

        if (role === 'master') {
          navigate('/module-selection', { state: { role, country } });
        } else {
          navigate(`/questionnaire/${role}`);
        }
      }
    } catch (error) {
      console.error('Login failed:', error);
      setErrorMessage('Incorrect username or password');
    }
  };


  return (
    <div className="login-page"> {/* Updated the wrapper to use the new login-page class */}
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit">Login</button>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>} {/* Display error message */}
      </div>
    </div>
  );
}

export default Login;