import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser, registerUser } from '../api';

function Auth() {
  const navigate = useNavigate();
  const [mode, setMode] = useState('login');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [bannerError, setBannerError] = useState('');
  const [fieldErrors, setFieldErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [loading, setLoading] = useState(false);

  const validateFields = () => {
    const errors = {};
    if (!username.trim()) {
      errors.username = 'Username cannot be blank.';
    }
    if (!password) {
      errors.password = 'Password cannot be blank.';
    } else if (mode === 'register' && password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    return errors;
  };

  const handleBlur = (field) => {
    setTouched((prev) => ({ ...prev, [field]: true }));
    const errors = validateFields();
    setFieldErrors((prev) => ({
      ...prev,
      [field]: errors[field] || '',
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setBannerError('');
    const errors = validateFields();
    setFieldErrors(errors);
    setTouched({ username: true, password: true, email: true });

    if (Object.keys(errors).length > 0) {
      setBannerError('Please correct the highlighted fields before continuing.');
      return;
    }

    const trimmedUsername = username.trim();
    const trimmedPassword = password;

    setLoading(true);
    try {
      let data;
      if (mode === 'register') {
        data = await registerUser({
          username: trimmedUsername,
          email: email.trim(),
          password: trimmedPassword,
        });
      } else {
        data = await loginUser({
          username: trimmedUsername,
          password: trimmedPassword,
        });
      }
      localStorage.setItem('algospace_token', data.token);
      localStorage.setItem('algospace_username', data.user.username);
      navigate('/dashboard');
    } catch (err) {
      setBannerError(err.message || 'Authentication failed.');
    } finally {
      setLoading(false);
    }
  };

  const inputClass = (field) => {
    const classes = ['auth-input'];
    if (touched[field] && fieldErrors[field]) {
      classes.push('auth-input-invalid');
    }
    return classes.join(' ');
  };

  return (
    <div className="auth-page-glass">
      <div className="auth-ambient auth-ambient-one" />
      <div className="auth-ambient auth-ambient-two" />
      <div className="auth-glass-card">
        <div className="auth-brand">
          <span className="auth-logo-mark">{'</>'}</span>
          <div>
            <h1>AlgoSpace</h1>
            <p>Static analysis workspace for Python algorithms</p>
          </div>
        </div>

        <div className="auth-tabs-glass">
          <button
            type="button"
            className={mode === 'login' ? 'active' : ''}
            onClick={() => {
              setMode('login');
              setBannerError('');
              setFieldErrors({});
              setTouched({});
            }}
          >
            Log in
          </button>
          <button
            type="button"
            className={mode === 'register' ? 'active' : ''}
            onClick={() => {
              setMode('register');
              setBannerError('');
              setFieldErrors({});
              setTouched({});
            }}
          >
            Register
          </button>
        </div>

        {bannerError && (
          <div className="auth-error-banner" role="alert">
            <strong>Validation failed</strong>
            <span>{bannerError}</span>
          </div>
        )}

        <form className="auth-form-glass" onSubmit={handleSubmit} noValidate>
          <div className="auth-field">
            <label htmlFor="username">Username</label>
            <input
              id="username"
              type="text"
              className={inputClass('username')}
              autoComplete="username"
              value={username}
              onChange={(e) => {
                setUsername(e.target.value);
                if (fieldErrors.username) {
                  setFieldErrors((prev) => ({ ...prev, username: '' }));
                }
              }}
              onBlur={() => handleBlur('username')}
            />
            {touched.username && fieldErrors.username && (
              <span className="auth-field-error">{fieldErrors.username}</span>
            )}
          </div>

          {mode === 'register' && (
            <div className="auth-field">
              <label htmlFor="email">Email (optional)</label>
              <input
                id="email"
                type="email"
                className="auth-input"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
          )}

          <div className="auth-field">
            <label htmlFor="password">Password</label>
            <input
              id="password"
              type="password"
              className={inputClass('password')}
              autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (fieldErrors.password) {
                  setFieldErrors((prev) => ({ ...prev, password: '' }));
                }
              }}
              onBlur={() => handleBlur('password')}
            />
            {touched.password && fieldErrors.password && (
              <span className="auth-field-error">{fieldErrors.password}</span>
            )}
          </div>

          <button type="submit" className="auth-submit-btn" disabled={loading}>
            {loading ? 'Authenticating...' : mode === 'login' ? 'Enter workspace' : 'Create account'}
          </button>
        </form>

        <p className="auth-footer-note">
          AST-powered complexity profiling · Token-secured API
        </p>
      </div>
    </div>
  );
}

export default Auth;
