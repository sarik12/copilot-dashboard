import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export function AuthCallback() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleCallback = async () => {
      const code = new URLSearchParams(window.location.search).get('code');
      
      try {
        // Exchange code for access token (this would typically be done through your backend)
        const response = await fetch('YOUR_BACKEND_URL/auth/github/callback', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ code }),
        });

        const { access_token } = await response.json();
        
        // Store the token
        localStorage.setItem('github_token', access_token);
        
        // Redirect to dashboard
        navigate('/');
      } catch (error) {
        console.error('Auth callback error:', error);
        navigate('/');
      }
    };

    handleCallback();
  }, [navigate]);

  return <div>Authenticating...</div>;
}