import React, { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { MessageSquare, Code2, Clock, GitPullRequest, Users } from 'lucide-react';

const OrganizationDashboard = () => {
  const [orgData, setOrgData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchOrgData();
  }, []);

  const fetchOrgData = async () => {
    try {
      const token = localStorage.getItem('github_token');
      const orgName = 'your-org-name'; // Replace with your organization name
      
      const response = await fetch(`http://localhost:3001/api/github/copilot/org/${orgName}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch organization data');
      }
      
      const data = await response.json();
      setOrgData(data);
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div>Loading organization data...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!orgData) return <div>No data available</div>;

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Organization Copilot Usage</h2>
      
      {/* Seats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Seats</h3>
          <div className="text-3xl font-bold">{orgData.seats.total_seats}</div>
          <p className="text-sm text-gray-500">Used: {orgData.seats.used_seats}</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Total Usage</h3>
          <div className="text-3xl font-bold">
            {orgData.organizationUsage.total_suggestions} suggestions
          </div>
          <p className="text-sm text-gray-500">
            Acceptance rate: {orgData.organizationUsage.acceptance_rate}%
          </p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">Active Users</h3>
          <div className="text-3xl font-bold">
            {orgData.memberUsage.filter(m => m.usage).length}
          </div>
          <p className="text-sm text-gray-500">
            Total members: {orgData.memberUsage.length}
          </p>
        </div>
      </div>

      {/* Member Usage Table */}
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
            {orgData.memberUsage.map((member, index) => (
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
    </div>
  );
};

export default OrganizationDashboard;