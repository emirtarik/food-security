import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiClient } from '../apiClient';
import '../styles/Login.css';

function Login({ onLogin }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      const u = username.trim();
      const p = password; // don't trim passwords

      const res = await apiClient.post('/login', { username: u, password: p });
      const { country, role } = res.data;

      // NOTE: localStorage stores strings
      localStorage.setItem('country', country);
      localStorage.setItem('role', role);
      localStorage.setItem('isLoggedIn', 'true');

      onLogin(true, role, country);

      if (role === 'master') {
        navigate('/module-selection', { state: { role, country } });
      } else {
        navigate(`/questionnaire/${role}`);
      }
    } catch (err) {
      const status = err.response?.status;
      if (status === 401) setErrorMessage('Incorrect username or password');
      else if (status === 429) setErrorMessage('Too many attempts. Please try again in a moment.');
      else setErrorMessage('Unable to login right now. Please try again.');
      console.error('login error', {
        status,
        data: err.response?.data,
        msg: err.message
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <h2>Login</h2>
        <form onSubmit={handleSubmit} autoComplete="on">
          <input
            type="text"
            placeholder="Username"
            value={username}
            autoComplete="username"
            onChange={(e) => setUsername(e.target.value)}
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            autoComplete="current-password"
            onChange={(e) => setPassword(e.target.value)}
          />
          <button type="submit" disabled={loading || !username || !password}>
            {loading ? 'Logging in…' : 'Login'}
          </button>
        </form>
        {errorMessage && <p className="error-message">{errorMessage}</p>}
        <button 
          type="button" 
          className="homepage-button"
          onClick={() => navigate('/')}
          disabled={loading}
        >
          Return to Homepage
        </button>
      </div>
    </div>
  );
}

export default Login;
