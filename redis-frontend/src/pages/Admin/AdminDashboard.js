import React, { useState, useEffect } from "react";
import axios from "axios";
import { toast } from "react-toastify";
import { BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, LabelList } from "recharts";
import { PieChart, Pie, Cell } from "recharts";
import "./AdminDashboard.css";

const AdminDashboard = ({ API_URL, token }) => {
  const [residents, setResidents] = useState([]);
  const [genderCounts, setGenderCounts] = useState({ Male: 0, Female: 0 });
  const [purokCounts, setPurokCounts] = useState({});
  const [totalResidents, setTotalResidents] = useState(0);

  // Fetch residents data from the backend
  const fetchResidents = async () => {
    try {
      const response = await axios.get(`${API_URL}/residents`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setResidents(response.data);
      setTotalResidents(response.data.length);

      const genderCounts = { Male: 0, Female: 0 };
      const purokCounts = {};

      // Process residents data
      response.data.forEach((resident) => {
        genderCounts[resident.gender] = (genderCounts[resident.gender] || 0) + 1;
        purokCounts[resident.purok] = (purokCounts[resident.purok] || 0) + 1;
      });

      setGenderCounts(genderCounts);
      setPurokCounts(purokCounts);
    } catch (error) {
      toast.error("Failed to fetch residents.");
    }
  };

  useEffect(() => {
    fetchResidents(); // Fetch residents when component mounts or token changes
  }, [token]);

  // Ensure that Purok 1-8 are always present, even with 0 count
  const allPuroks = Array.from({ length: 8 }, (_, index) => index + 1);
  const allPurokCounts = allPuroks.reduce((acc, purok) => {
    acc[purok] = purokCounts[purok] || 0; // Ensure zero count for missing Puroks
    return acc;
  }, {});

  // Convert Purok counts to array format for BarChart
  const purokData = Object.keys(allPurokCounts).map((purok) => ({
    purok: `Purok ${purok}`,
    count: allPurokCounts[purok],
  }));

  // Prepare gender distribution data for PieChart
  const pieData = Object.keys(genderCounts).map((gender) => ({
    name: gender,
    value: genderCounts[gender],
    percent: totalResidents
      ? ((genderCounts[gender] / totalResidents) * 100).toFixed(1) + "%"
      : "0%",
  }));

  // Colors for Pie Chart
  const COLORS = ["#7c2727", "#f8bc41"]; // Male: Maroon, Female: Gold

  return (
    <div>
      <h2>Admin Dashboard</h2>
      <p>This is the main dashboard where you can see an overview of the system.</p>

      <div className="chart-container">
        <h3>Residents Per Purok</h3>

        {/* Bar Chart for Purok Distribution */}
        <div className="chart-row">
          <div className="recharts-wrapper">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={purokData}>
                <XAxis dataKey="purok" angle={-30} textAnchor="end" height={60} />
                <YAxis allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#7c2727">
                  <LabelList dataKey="count" position="top" fontSize={16} fill="#000" />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Gender Distribution and Total Residents beside each other */}
          <div className="gender-total-container">
            {/* Pie Chart for Gender Distribution */}
            <div className="pie-chart-container">
              <h4>Gender Distribution</h4>
              <PieChart width={280} height={200}>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  outerRadius={40}
                  dataKey="value"
                  label={({ name, percent }) => `${name}: ${percent}`}
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
              </PieChart>

              <div className="pie-legend">
                {pieData.map((entry, index) => (
                  <div key={index} className="legend-item">
                    <span
                      className="legend-color"
                      style={{ backgroundColor: COLORS[index % COLORS.length] }}
                    ></span>
                    {entry.name}: {entry.percent}
                  </div>
                ))}
              </div>
            </div>

            {/* Total Number of Residents */}
            <div className="total-residents">
              <h4>Total Residents: {totalResidents}</h4>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
