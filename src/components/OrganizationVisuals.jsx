import React from 'react';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  PieChart, Pie, Cell, BarChart, Bar, Legend, RadarChart, Radar, 
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, AreaChart, Area 
} from 'recharts';
import { 
  Users, Trophy, GitBranch, GitCommit, Code, 
  BarChart2, PieChart as PieChartIcon, Activity 
} from 'lucide-react';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8', '#82ca9d'];

// Team Activity Chart
export const TeamActivityChart = ({ data }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Activity className="h-5 w-5" />
      Team Activity Overview
    </h3>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {Object.keys(data[0]?.teams || {}).map((team, index) => (
            <Area
              key={team}
              type="monotone"
              dataKey={`teams.${team}`}
              name={team}
              stackId="1"
              fill={COLORS[index % COLORS.length]}
              stroke={COLORS[index % COLORS.length]}
            />
          ))}
        </AreaChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// User Comparison Radar Chart
export const UserComparisonChart = ({ users }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Users className="h-5 w-5" />
      Developer Skills Comparison
    </h3>
    <div className="h-[400px]">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart outerRadius={150}>
          <PolarGrid />
          <PolarAngleAxis dataKey="subject" />
          <PolarRadiusAxis angle={30} domain={[0, 100]} />
          {users.map((user, index) => (
            <Radar
              key={user.login}
              name={user.login}
              dataKey="value"
              data={user.skills}
              fill={COLORS[index % COLORS.length]}
              fillOpacity={0.6}
            />
          ))}
          <Legend />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Team Performance Chart
export const TeamPerformanceChart = ({ teams }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Trophy className="h-5 w-5" />
      Team Performance Metrics
    </h3>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={teams}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="name" />
          <YAxis />
          <Tooltip />
          <Legend />
          <Bar dataKey="suggestions" name="Suggestions" fill="#0088FE" />
          <Bar dataKey="acceptanceRate" name="Acceptance Rate" fill="#00C49F" />
          <Bar dataKey="linesSaved" name="Lines Saved" fill="#FFBB28" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  </div>
);

// Activity Heatmap
export const ActivityHeatmap = ({ data }) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const hours = Array.from({ length: 24 }, (_, i) => i);

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
        <GitCommit className="h-5 w-5" />
        Activity Heatmap
      </h3>
      <div className="grid grid-cols-25 gap-1">
        {days.map(day => (
          <div key={day} className="text-xs text-gray-500">{day}</div>
        ))}
        {hours.map(hour => (
          <div
            key={hour}
            className="w-4 h-4"
            style={{
              backgroundColor: `rgba(0, 136, 254, ${data[day]?.[hour] || 0})`
            }}
            title={`${data[day]?.[hour] || 0} activities`}
          />
        ))}
      </div>
    </div>
  );
};

// Language Trends Chart
export const LanguageTrendsChart = ({ data }) => (
  <div className="bg-white p-6 rounded-lg shadow-md">
    <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
      <Code className="h-5 w-5" />
      Language Usage Trends
    </h3>
    <div className="h-[300px]">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="date" />
          <YAxis />
          <Tooltip />
          <Legend />
          {Object.keys(data[0]?.languages || {}).map((lang, index) => (
            <Line
              key={lang}
              type="monotone"
              dataKey={`languages.${lang}`}
              name={lang}
              stroke={COLORS[index % COLORS.length]}
              strokeWidth={2}
            />
          ))}
        </LineChart>
      </ResponsiveContainer>
    </div>
  </div>
);

export default {
  TeamActivityChart,
  UserComparisonChart,
  TeamPerformanceChart,
  ActivityHeatmap,
  LanguageTrendsChart
};