import React, { useState, useEffect } from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend 
} from 'recharts';
import { 
  MessageSquare, Code2, Clock, GitPullRequest, Github, Users,
  Calendar, Filter, Download, Search, ChevronDown, ChevronUp 
} from 'lucide-react';

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

  // Initial data fetch
  useEffect(() => {
    const token = localStorage.getItem('github_token');
    if (token) {
      setIsLoggedIn(true);
      fetchAllData();
    } else {
      setLoading(false);
    }

    const urlParams = new URLSearchParams(window.location.search);
    const code = urlParams.get('code');
    if (code) {
      handleOAuthCode(code);
    }
  }, []);

 // Update the fetchAllData function
const fetchAllData = async () => {
  try {
    setLoading(true);
    const token = localStorage.getItem('github_token');
    if (!token) {
      console.error("Error: No token found in localStorage");
      return;
    }

    // Fetch user data
    const userResponse = await fetch(`${BACKEND_URL}/api/github/user`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!userResponse.ok) {
      const errorData = await userResponse.json();
      throw new Error(`Error fetching user data: ${userResponse.status} - ${JSON.stringify(errorData)}`);
    }
    const userData = await userResponse.json();
    setUserData(userData);

    // Fetch organizations
    const orgsResponse = await fetch(`${BACKEND_URL}/api/github/orgs`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    if (!orgsResponse.ok) {
      const errorData = await orgsResponse.json();
      throw new Error(`Error fetching organizations: ${orgsResponse.status} - ${JSON.stringify(errorData)}`);
    }
    const orgsData = await orgsResponse.json();

    // Fetch org data if available
    if (orgsData && orgsData.length > 0) {
      const orgName = orgsData[0].login;
      const orgDataResponse = await fetch(
        `${BACKEND_URL}/api/github/copilot/org/${orgName}/members?dateRange=${dateRange}&language=${filteredLanguage}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!orgDataResponse.ok) {
        const errorData = await orgDataResponse.json();
        throw new Error(`Error fetching org data: ${orgDataResponse.status} - ${JSON.stringify(errorData)}`);
      }
      const orgDetailData = await orgDataResponse.json();
      setOrgData(orgDetailData);
    }

    // Fetch individual Copilot data
    if (userData.login) {
      const copilotResponse = await fetch(
        `${BACKEND_URL}/api/github/copilot/user/${userData.login}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!copilotResponse.ok) {
        const errorData = await copilotResponse.json();
        throw new Error(`Error fetching copilot data: ${copilotResponse.status} - ${JSON.stringify(errorData)}`);
      }
      const copilotData = await copilotResponse.json();
      setCopilotData(copilotData);
    }
  } catch (error) {
    console.error("Error fetching data:", error);
  } finally {
    setLoading(false);
  }
};

  // Auth handlers
  const handleLogin = () => {
    const scopes = [
      'read:org',
      'copilot',
      'org:read',
      'read:user',
      'repo'
    ].join(' ');
  
    const redirectUri = `${FRONTEND_URL}`;
    window.location.href = `https://github.com/login/oauth/authorize?client_id=${GITHUB_CLIENT_ID}&redirect_uri=${redirectUri}&scope=${scopes}`;
  };

 // Update handleOAuthCode
const handleOAuthCode = async (code) => {
  try {
    const response = await fetch(`${BACKEND_URL}/api/auth/github/callback`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ code }),
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(`OAuth error: ${response.status} - ${JSON.stringify(errorData)}`);
    }
    
    const data = await response.json();
    
    if (data.access_token) {
      localStorage.setItem('github_token', data.access_token);
      setIsLoggedIn(true);
      await fetchAllData();
    } else {
      throw new Error('No access token in response');
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

  // Sorting and filtering helpers
  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig.key === key && sortConfig.direction === 'asc' ? 'desc' : 'asc'
    });
  };

  const sortedMembers = orgData?.memberUsage ? [...orgData.memberUsage].sort((a, b) => {
    const aValue = a.usage?.[sortConfig.key] || 0;
    const bValue = b.usage?.[sortConfig.key] || 0;
    return sortConfig.direction === 'asc' ? aValue - bValue : bValue - aValue;
  }) : [];

  const filteredMembers = sortedMembers.filter(member => 
    member.user.login.toLowerCase().includes(searchTerm.toLowerCase()) &&
    (filteredLanguage === 'all' || 
     member.usage?.languages?.[filteredLanguage])
  );

  // Export functionality
  const exportData = () => {
    const csvData = [
      ['Username', 'Suggestions', 'Acceptance Rate', 'Lines Saved', 'Repositories', 'Last Active'],
      ...filteredMembers.map(member => [
        member.user.login,
        member.usage?.total_suggestions || 0,
        member.usage?.acceptance_rate || 0,
        member.usage?.lines_saved || 0,
        member.usage?.repositories || 0,
        member.usage?.last_active || ''
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvData], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `copilot-stats-${new Date().toISOString()}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };
  // Loading and login states
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
      {/* Header */}
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
        <div className="flex items-center gap-4">
          <button
            onClick={exportData}
            className="flex items-center gap-2 px-4 py-2 bg-white border rounded-lg hover:bg-gray-50"
          >
            <Download className="h-4 w-4" />
            Export Data
          </button>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white p-4 rounded-lg shadow-md mb-8">
        <div className="flex flex-wrap gap-4 items-center justify-between">
          <div className="flex items-center gap-4">
            <select
              value={dateRange}
              onChange={(e) => setDateRange(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>

            <select
              value={filteredLanguage}
              onChange={(e) => setFilteredLanguage(e.target.value)}
              className="border rounded-md px-3 py-2"
            >
              <option value="all">All Languages</option>
              {orgData?.organizationUsage?.languages && 
                Object.keys(orgData.organizationUsage.languages).map(lang => (
                  <option key={lang} value={lang}>{lang}</option>
                ))
              }
            </select>
          </div>

          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search members..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border rounded-md"
            />
          </div>
        </div>
      </div>

      {/* Individual Stats */}
      {copilotData && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Personal Usage</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Suggestions"
              value={copilotData.total_suggestions?.toLocaleString() || '0'}
              icon={MessageSquare}
              description="Total code suggestions"
              trend={copilotData.trending_metrics?.suggestions_trend}
            />
            <StatCard
              title="Acceptance Rate"
              value={`${copilotData.acceptance_rate || '0'}%`}
              icon={GitPullRequest}
              description="Suggestion acceptance rate"
              trend={copilotData.trending_metrics?.acceptance_trend}
            />
            <StatCard
              title="Lines Saved"
              value={copilotData.lines_saved?.toLocaleString() || '0'}
              icon={Code2}
              description="Total lines of code saved"
              trend={copilotData.trending_metrics?.lines_trend}
            />
            <StatCard
              title="Active Time"
              value={copilotData.active_time || '0h'}
              icon={Clock}
              description="Time spent with Copilot"
            />
          </div>
        </div>
      )}

      {/* Organization Stats */}
      {orgData && (
        <div className="mb-8">
          <h2 className="text-2xl font-bold mb-6">Organization Overview</h2>
          
          {/* Organization Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <StatCard
              title="Active Seats"
              value={`${orgData.seats?.used_seats || 0} / ${orgData.seats?.total_seats || 0}`}
              icon={Users}
              description="Used vs Total seats"
            />
            <StatCard
              title="Total Suggestions"
              value={orgData.organizationUsage?.total_suggestions?.toLocaleString() || '0'}
              icon={MessageSquare}
              description="Organization-wide suggestions"
            />
            <StatCard
              title="Avg. Acceptance"
              value={`${orgData.organizationUsage?.acceptance_rate?.toFixed(1) || '0'}%`}
              icon={GitPullRequest}
              description="Average acceptance rate"
            />
            <StatCard
              title="Total Impact"
              value={orgData.organizationUsage?.lines_saved?.toLocaleString() || '0'}
              icon={Code2}
              description="Total lines of code saved"
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Language Distribution */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Language Distribution</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={Object.entries(orgData.organizationUsage?.languages || {}).map(([name, value]) => ({
                        name,
                        value
                      }))}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      outerRadius={100}
                      label
                    >
                      {Object.entries(orgData.organizationUsage?.languages || {}).map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Top Contributors */}
            <div className="bg-white p-6 rounded-lg shadow-md">
              <h3 className="text-xl font-bold mb-4">Top Contributors</h3>
              <div className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={filteredMembers.slice(0, 5)}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="user.login" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar 
                      dataKey="usage.total_suggestions" 
                      name="Suggestions" 
                      fill="#8884d8" 
                    />
                    <Bar 
                      dataKey="usage.lines_saved" 
                      name="Lines Saved" 
                      fill="#82ca9d" 
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Member Table */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-xl font-bold">Member Activity Details</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      { key: 'user', label: 'User' },
                      { key: 'total_suggestions', label: 'Suggestions' },
                      { key: 'acceptance_rate', label: 'Acceptance Rate' },
                      { key: 'lines_saved', label: 'Lines Saved' },
                      { key: 'repositories', label: 'Repositories' },
                      { key: 'last_active', label: 'Last Active' }
                    ].map(({ key, label }) => (
                      <th
                        key={key}
                        onClick={() => handleSort(key)}
                        className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
                      >
                        <div className="flex items-center gap-2">
                          {label}
                          {sortConfig.key === key && (
                            sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
                          )}
                        </div>
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {filteredMembers.map((member, index) => (
                    <tr key={index} className="hover:bg-gray-50">
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
                        {member.usage?.total_suggestions?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.usage?.acceptance_rate ? 
                          `${member.usage.acceptance_rate.toFixed(1)}%` : 
                          'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.usage?.lines_saved?.toLocaleString() || 'N/A'}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {member.usage?.repositories || 'N/A'}
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
          </div>
        </div>
      )}
    </div>
  );
}

export default App;
