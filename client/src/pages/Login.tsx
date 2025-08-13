import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext.tsx';

const Login: React.FC = () => {
  const [formData, setFormData] = useState({
    usernameOrEmail: '',
    password: ''
  });
  const [errors, setErrors] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const { login, user } = useAuth();
  const navigate = useNavigate();

  // Redirect if already logged in
  React.useEffect(() => {
    if (user) {
      navigate('/');
    }
  }, [user, navigate]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
    // Clear errors when user starts typing
    if (errors.length > 0) {
      setErrors([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrors([]);

    // Client-side validation
    const newErrors: string[] = [];

    if (!formData.usernameOrEmail.trim()) {
      newErrors.push('Username or email is required');
    }

    if (!formData.password) {
      newErrors.push('Password is required');
    }

    if (newErrors.length > 0) {
      setErrors(newErrors);
      return;
    }

    setIsLoading(true);

    try {
      // Use the AuthContext login function
      await login(formData.usernameOrEmail, formData.password);
      
      // Redirect to home page
      navigate('/');
    } catch (error: any) {
      console.error('Login error:', error);
      setErrors([error.message || 'Login failed']);
    } finally {
      setIsLoading(false);
    }
  };

  if (user) {
    return null; // Will redirect
  }

  return (
    <div className="max-w-md mx-auto">
      <div className="card">
        <h2 className="text-2xl font-bold mb-6 text-center text-primary">Login</h2>
        
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-red-900/30 border border-red-500/50 text-red-400 rounded-lg">
            <ul className="list-disc list-inside">
              {errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="usernameOrEmail" className="form-label">
              Username or Email
            </label>
            <input
              type="text"
              id="usernameOrEmail"
              name="usernameOrEmail"
              value={formData.usernameOrEmail}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your username or email"
              disabled={isLoading}
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="form-label">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="form-input"
              placeholder="Enter your password"
              disabled={isLoading}
              required
            />
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className={`w-full btn-primary ${isLoading ? 'opacity-50 cursor-not-allowed' : ''}`}
          >
            {isLoading ? 'Logging in...' : 'Login'}
          </button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-secondary">
            Don't have an account?{' '}
            <Link to="/register" className="text-accent hover:text-blue-300 font-medium transition-colors">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
