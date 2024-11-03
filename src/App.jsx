import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Code2, Clock, GitPullRequest, Github } from 'lucide-react';

const GITHUB_CLIENT_ID = 'Ov23li78WLoahHs6bmLU'; // Replace with your client ID
const BACKEND_URL = 'http://localhost:3000';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

const StatCard = ({ title, value, icon: Icon, description }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <Icon className="h-4 w-4 text-gray-500" />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
  </div>
);

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [copilotData, setCopilotData] = useState(null);
  const [orgData, setOrgData] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setIsLoggedIn(true);
      fetchAllData(token);
    }
    setLoading(false);

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCode(code);
    }
  }, []);

  const fetchAllData = async (token) => {
    try {
      // Fetch user data
      const userResponse = await fetch(`${BACKEND_URL}/api/github/user`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const userData = await userResponse.json();
      setUserData(userData);

      // Fetch organization data
      const orgResponse = await fetch(`${BACKEND_URL}/api/github/orgs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const orgData = await orgResponse.json();
      setOrgData(orgData);

      // Fetch Copilot data
      const username = userData.login;
      const copilotResponse = await fetch(`${BACKEND_URL}/api/github/copilot/user/${username}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const copilotData = await copilotResponse.json();
      setCopilotData(copilotData);

    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLogin = () => {
    const scopes = [
      'read:org',
      'copilot',
      'org:read',
      'read:user',
      'repo'
    ].join(' ');

    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&scope=${scopes}`;
  };

  const handleOAuthCode = async (code) => {
    try {
      const response = await fetch(`${BACKEND_URL}/api/auth/github/callback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ code }),
      });
      
      const data = await response.json();
      
      if (data.access_token) {
        localStorage.setItem('github_token', data.access_token);
        setIsLoggedIn(true);
        fetchAllData(data.access_token);
      }
    } catch (error) {
      console.error('Error handling OAuth code:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('github_token');
    setIsLoggedIn(false);
    setUserData(null);
    setCopilotData(null);
    setOrgData(null);
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  if (!isLoggedIn) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50">
        <div className="p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-2xl font-bold mb-8 text-center">GitHub Copilot Dashboard</h1>
          <button
            onClick={handleLogin}
            className="flex items-center justify-center gap-2 px-6 py-3 bg-gray-900 text-white rounded-lg hover:bg-gray-800 w-full transition-colors"
          >
            <Github className="w-5 h-5" />
            Login with GitHub
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">GitHub Copilot Dashboard</h1>
          {userData && (
            <div className="flex items-center gap-2 text-gray-500">
              <img src={userData.avatar_url} alt="Profile" className="w-8 h-8 rounded-full" />
              <span>{userData.name || userData.login}</span>
            </div>
          )}
        </div>
        <button
          onClick={handleLogout}
          className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
        >
          Logout
        </button>
      </div>

      {copilotData && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Suggestions"
              value={copilotData.total_suggestions || '0'}
              icon={MessageSquare}
              description="Total code suggestions"
            />
            <StatCard
              title="Acceptance Rate"
              value={`${copilotData.acceptance_rate || '0'}%`}
              icon={GitPullRequest}
              description="Suggestion acceptance rate"
            />
            <StatCard
              title="Lines Saved"
              value={copilotData.lines_saved || '0'}
              icon={Code2}
              description="Total lines of code saved"
            />
            <StatCard
              title="Active Time"
              value={copilotData.active_time || '0h'}
              icon={Clock}
              description="Time spent with Copilot"
            />
          </div>

          {copilotData.usage_by_language && (
            <div className="bg-white p-6 rounded-lg shadow-md mb-8">
              <h2 className="text-xl font-bold mb-4">Language Distribution</h2>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(copilotData.usage_by_language).map(([language, value]) => ({
                        name: language,
                        value: value
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {Object.entries(copilotData.usage_by_language).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {copilotData.daily_usage && (
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h2 className="text-xl font-bold mb-4">Daily Usage</h2>
              <div className="h-[400px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={copilotData.daily_usage}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="suggestions"
                      name="Suggestions"
                      stroke="#0088FE"
                      strokeWidth={2}
                    />
                    <Line
                      type="monotone"
                      dataKey="acceptance_rate"
                      name="Acceptance Rate"
                      stroke="#00C49F"
                      strokeWidth={2}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default App;