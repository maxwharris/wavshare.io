import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';

const VerifyEmail: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [message, setMessage] = useState('');

  useEffect(() => {
    const verifyEmail = async () => {
      if (!token) {
        setStatus('error');
        setMessage('Invalid verification link');
        return;
      }

      try {
        const response = await fetch(`http://localhost:5000/api/auth/verify-email/${token}`, {
          method: 'GET',
        });

        const data = await response.json();

        if (response.ok) {
          setStatus('success');
          setMessage(data.message || 'Email verified successfully!');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verification failed');
        }
      } catch (error) {
        setStatus('error');
        setMessage('Network error. Please try again later.');
      }
    };

    verifyEmail();
  }, [token]);

  return (
    <div className="max-w-md mx-auto">
      <div className="card text-center">
        <h2 className="text-2xl font-bold mb-6">Email Verification</h2>
        
        {status === 'loading' && (
          <div>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Verifying your email...</p>
          </div>
        )}

        {status === 'success' && (
          <div>
            <div className="text-green-600 text-6xl mb-4">✓</div>
            <p className="text-green-700 mb-6">{message}</p>
            <p className="text-gray-600 mb-4">
              You can now create posts and remixes on RemixThis!
            </p>
            <Link to="/login" className="btn-primary">
              Sign In
            </Link>
          </div>
        )}

        {status === 'error' && (
          <div>
            <div className="text-red-600 text-6xl mb-4">✗</div>
            <p className="text-red-700 mb-6">{message}</p>
            <div className="space-y-2">
              <Link to="/register" className="btn-primary block">
                Create New Account
              </Link>
              <Link to="/" className="btn-secondary block">
                Go Home
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default VerifyEmail;
