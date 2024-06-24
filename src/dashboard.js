import React, { useState, useEffect, useMemo } from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, ReferenceLine } from 'recharts';

const GOOGLE_APPS_SCRIPT_URL = 'https://script.google.com/a/macros/sterlinglawyers.com/s/AKfycbw14XuRPASDcVECLJSHme8COz4Y0LXJV57xlS8ICuanPdFhGyS-Hom-r7rTITNVTaIQ/exec';

const fetchData = async () => {
  try {
    const response = await fetch(GOOGLE_APPS_SCRIPT_URL);
    if (!response.ok) {
      throw new Error('Network response was not ok');
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    return [];
  }
};

const getColor = (value) => {
  if (value < 84) return "#FF0000";
  if (value >= 85 && value <= 91) return "#FFA500";
  return "#00FF00";
};

const kpis = [
  { value: 'ProjectedRate', label: 'Projected' },
  { value: 'ClientExperienceRate', label: 'Client Experience' },
  { value: 'NextStepsRate', label: 'Next Steps' },
  { value: 'NextTriggerRate', label: 'Next Trigger' },
  { value: 'CleanDashboardRate', label: 'Clean Dashboard' }
];

const KPISummary = ({ data }) => {
  const summaries = kpis.map(kpi => {
    const values = data.map(item => item[kpi.value]);
    const average = Math.round(values.reduce((sum, val) => sum + val, 0) / values.length);
    const min = Math.min(...values);
    const max = Math.max(...values);
    return { ...kpi, average, min, max };
  });

  return (
    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
      {summaries.map(summary => (
        <div key={summary.value} className="bg-white p-4 rounded-lg shadow">
          <h3 className="text-lg font-semibold mb-2">{summary.label}</h3>
          <div className="flex justify-between items-center">
            <span className="text-3xl font-bold" style={{ color: getColor(summary.average) }}>{summary.average}%</span>
            <div className="text-sm">
              <div>Min: <span style={{ color: getColor(summary.min) }}>{summary.min}%</span></div>
              <div>Max: <span style={{ color: getColor(summary.max) }}>{summary.max}%</span></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div className="bg-white p-4 border rounded shadow">
        <p className="font-bold">{data.name}</p>
        {kpis.map(kpi => (
          <p key={kpi.value} style={{ color: getColor(data[kpi.value]) }}>
            {kpi.label}: {data[kpi.value]}%
          </p>
        ))}
      </div>
    );
  }
  return null;
};

const Dashboard = () => {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('regions');
  const [selectedKPI, setSelectedKPI] = useState('ProjectedRate');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'ascending' });
  const [filterValue, setFilterValue] = useState('');
  const [showUnderperforming, setShowUnderperforming] = useState(false);

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const fetchedData = await fetchData();
        setData(fetchedData);
        setError(null);
      } catch (err) {
        setError('Failed to load data. Please try again later.');
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const filteredData = useMemo(() => {
    return data
      .filter(item => item.type === activeTab.slice(0, -1))
      .filter(item => item.name.toLowerCase().includes(filterValue.toLowerCase()))
      .filter(item => !showUnderperforming || item[selectedKPI] < 84);
  }, [data, activeTab, filterValue, showUnderperforming, selectedKPI]);

  const sortedData = useMemo(() => {
    let sortableItems = [...filteredData];
    if (sortConfig.key !== null) {
      sortableItems.sort((a, b) => {
        if (a[sortConfig.key] < b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? -1 : 1;
        }
        if (a[sortConfig.key] > b[sortConfig.key]) {
          return sortConfig.direction === 'ascending' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableItems;
  }, [filteredData, sortConfig]);

  const requestSort = (key) => {
    let direction = 'ascending';
    if (sortConfig.key === key && sortConfig.direction === 'ascending') {
      direction = 'descending';
    }
    setSortConfig({ key, direction });
  };

  const average = Math.round(sortedData.reduce((sum, item) => sum + item[selectedKPI], 0) / sortedData.length);

  if (loading) {
    return <div className="p-4">Loading...</div>;
  }

  if (error) {
    return <div className="p-4 text-red-500">{error}</div>;
  }

  return (
    <div className="p-4 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">KPI Dashboard</h1>
      
      <div className="mb-6 flex space-x-2">
        {['regions', 'paralegals', 'attorneys'].map(tab => (
          <button 
            key={tab}
            className={`px-4 py-2 rounded ${activeTab === tab ? 'bg-blue-500 text-white' : 'bg-white'}`}
            onClick={() => setActiveTab(tab)}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)}
          </button>
        ))}
      </div>

      <KPISummary data={sortedData} />

      <div className="flex flex-wrap items-center mb-6 space-y-2 md:space-y-0">
        <select 
          value={selectedKPI} 
          onChange={(e) => setSelectedKPI(e.target.value)}
          className="p-2 border rounded mr-4"
        >
          {kpis.map(kpi => (
            <option key={kpi.value} value={kpi.value}>{kpi.label}</option>
          ))}
        </select>
        <input 
          type="text"
          placeholder="Filter by name" 
          value={filterValue} 
          onChange={(e) => setFilterValue(e.target.value)}
          className="p-2 border rounded mr-4"
        />
        <label className="flex items-center mr-4">
          <input
            type="checkbox"
            checked={showUnderperforming}
            onChange={(e) => setShowUnderperforming(e.target.checked)}
            className="mr-2"
          />
          Show only underperforming
        </label>
        <div className="text-sm flex items-center">
          <span className="inline-block w-3 h-3 bg-red-500 mr-1"></span> &lt;84%
          <span className="inline-block w-3 h-3 bg-orange-500 mx-1"></span> 85-91%
          <span className="inline-block w-3 h-3 bg-green-500 ml-1"></span> 92-100%
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow mb-6">
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={sortedData} layout="vertical" margin={{ left: 120 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis type="number" domain={[0, 100]} />
            <YAxis dataKey="name" type="category" width={100} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={average} stroke="#666" label={`Average: ${average}%`} />
            <Bar dataKey={selectedKPI}>
              {sortedData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={getColor(entry[selectedKPI])} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2 text-left">Name</th>
              {kpis.map(kpi => (
                <th 
                  key={kpi.value}
                  className="p-2 text-left cursor-pointer"
                  onClick={() => requestSort(kpi.value)}
                >
                  {kpi.label}
                  {sortConfig.key === kpi.value && (
                    sortConfig.direction === 'ascending' ? ' ▲' : ' ▼'
                  )}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.map((item) => (
              <tr key={item.name}>
                <td className="p-2">{item.name}</td>
                {kpis.map(kpi => (
                  <td 
                    key={kpi.value}
                    className="p-2"
                    style={{ color: getColor(item[kpi.value]) }}
                  >
                    {item[kpi.value]}%
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Dashboard;
