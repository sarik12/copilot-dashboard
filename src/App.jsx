import React, { useState, useEffect } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import {
  MessageSquare, Code2, Clock, GitPullRequest, Github, Users,
  Calendar, Filter, Download, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import {
  TeamActivityChart,
  UserComparisonChart,
  TeamPerformanceChart,
  ActivityHeatmap,
  LanguageTrendsChart
} from './components/OrganizationVisuals';
import { TeamManagement } from './components/TeamManagement';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./components/ui/tabs"

const GITHUB_CLIENT_ID = 'Ov23li78WLoahHs6bmLU'; // Replace with your client ID
const BACKEND_URL = 'http://localhost:3000'; // Add /api to make it clear this is the API server
const FRONTEND_URL = 'http://localhost:5173'; // Add this for clarity

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

const StatCard = ({ title, value, icon: Icon, description, trend }) => (
  <div className="bg-white p-6 rounded-lg shadow-md relative">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-sm font-medium text-gray-600">{title}</h3>
      <Icon className="h-4 w-4 text-gray-500" />
    </div>
    <div className="text-2xl font-bold">{value}</div>
    <p className="text-xs text-gray-500 mt-1">{description}</p>
    {trend && (
      <div className={`absolute top-2 right-2 px-2 py-1 text-xs rounded-full ${
        trend > 0 ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'
      }`}>
        {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
      </div>
    )}
  </div>
);

function App() {
  // State management
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [loading, setLoading] = useState(true);
  const [userData, setUserData] = useState(null);
  const [copilotData, setCopilotData] = useState(null);
  const [orgData, setOrgData] = useState(null);
  const [dateRange, setDateRange] = useState('30d');
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: 'total_suggestions', direction: 'desc' });
  const [filteredLanguage, setFilteredLanguage] = useState('all');
  const [selectedTab, setSelectedTab] = useState('overview');
  const [teams, setTeams] = useState([]);
  const [selectedUsers, setSelectedUsers] = useState([]);

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setIsLoggedIn(true);
      fetchAllData(token);
    } else {
      setLoading(false);
    }

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
      console.log('User Data:', userData);

      // Fetch organization data
      const orgResponse = await fetch(`${BACKEND_URL}/api/github/orgs`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const orgData = await orgResponse.json();
      setOrgData(orgData);
      console.log('Organization Data:', orgData);

      // Fetch Copilot data
      const username = userData.login;
      if (username) {
        const copilotResponse = await fetch(`${BACKEND_URL}/api/github/copilot/user/${username}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const copilotData = await copilotResponse.json();
        setCopilotData(copilotData);
        console.log('Copilot Data:', copilotData);
      } else {
        console.error('Username is undefined');
      }

      // Fetch organization members' usage data
      if (orgData.length > 0) {
        const orgMembersResponse = await fetch(`${BACKEND_URL}/api/github/copilot/org/${orgData[0].login}/members`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const orgMembersData = await orgMembersResponse.json();
        setOrgData((prevOrgData) => ({
          ...prevOrgData,
          memberUsage: orgMembersData,
        }));
        console.log('Organization Members Data:', orgMembersData);
      } else {
        console.error('Organization login is undefined');
      }

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
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

      {orgData && (
        <>
          <h2 className="text-2xl font-bold mb-6">Organization Copilot Usage</h2>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Active Seats</h3>
              <div className="text-3xl font-bold">{orgData.seats?.total_seats || 'N/A'}</div>
              <p className="text-sm text-gray-500">Used: {orgData.seats?.used_seats || 'N/A'}</p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Total Usage</h3>
              <div className="text-3xl font-bold">
                {orgData.organizationUsage?.total_suggestions || 'N/A'} suggestions
              </div>
              <p className="text-sm text-gray-500">
                Acceptance rate: {orgData.organizationUsage?.acceptance_rate || 'N/A'}%
              </p>
            </div>
            
            <div className="bg-white p-6 rounded-lg shadow">
              <h3 className="text-lg font-semibold mb-2">Active Users</h3>
              <div className="text-3xl font-bold">
                {orgData.memberUsage?.filter(m => m.usage).length || 'N/A'}
              </div>
              <p className="text-sm text-gray-500">
                Total members: {orgData.memberUsage?.length || 'N/A'}
              </p>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Suggestions
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Acceptance Rate
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Lines Saved
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Last Active
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {orgData.memberUsage?.map((member, index) => (
                  <tr key={index}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img 
                          className="h-8 w-8 rounded-full" 
                          src={member.user.avatar_url} 
                          alt="" 
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {member.user.login}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.usage?.total_suggestions || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.usage?.acceptance_rate ? 
                        `${member.usage.acceptance_rate}%` : 
                        'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      {member.usage?.lines_saved || 'N/A'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {member.usage?.last_active ? 
                        new Date(member.usage.last_active).toLocaleDateString() : 
                        'N/A'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

export default App;