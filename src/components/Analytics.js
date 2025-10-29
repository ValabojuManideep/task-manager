import React, { useContext, useMemo, useState, useEffect } from "react";
import { TaskContext } from "../context/TaskContext";
import { useAuth } from "../context/AuthContext";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import axios from "axios";
import "./Analytics.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Analytics() {
  const { allTasks } = useContext(TaskContext);
  const { user } = useAuth();
  const [chartType, setChartType] = useState("pie");
  const [userFilter, setUserFilter] = useState("All Users");
  const [users, setUsers] = useState([]);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("http://localhost:5000/api/auth/users");
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Filter tasks based on role and user filter
  const userTasks = useMemo(() => {
    let filtered = isAdmin 
      ? allTasks 
      : allTasks.filter(t => t.assignedTo?._id === user.id || t.assignedTo === user.id);

    // Apply user filter for admin
    if (isAdmin && userFilter !== "All Users") {
      filtered = filtered.filter(t => {
        const assignedId = t.assignedTo?._id || t.assignedTo;
        return assignedId === userFilter;
      });
    }

    return filtered;
  }, [allTasks, user, isAdmin, userFilter]);

  const stats = useMemo(() => {
    const total = userTasks.length;
    const todo = userTasks.filter(t => t.status === "todo").length;
    const inProgress = userTasks.filter(t => t.status === "in_progress").length;
    const done = userTasks.filter(t => t.status === "done").length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    return { total, todo, inProgress, done, rate };
  }, [userTasks]);

  const chartData = {
    labels: ["To Do", "In Progress", "Done"],
    datasets: [
      {
        label: "Tasks",
        data: [stats.todo, stats.inProgress, stats.done],
        backgroundColor: ["#f59e0b", "#5B7FFF", "#10b981"],
        borderColor: ["#ffffff", "#ffffff", "#ffffff"],
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          font: { size: 14 },
          padding: 20,
        },
      },
    },
  };

  const renderChart = () => {
    switch (chartType) {
      case "pie":
        return <Pie data={chartData} options={chartOptions} />;
      case "bar":
        return <Bar data={chartData} options={chartOptions} />;
      case "doughnut":
        return <Doughnut data={chartData} options={chartOptions} />;
      default:
        return <Pie data={chartData} options={chartOptions} />;
    }
  };

  return (
    <div className="analytics-container">
      <div className="analytics-header-section">
        <div>
          <h1 className="page-title">Analytics</h1>
          <p className="page-subtitle">
            {isAdmin ? "Insights into task performance and team productivity" : "Your task performance insights"}
          </p>
        </div>
        
        {isAdmin && users.length > 0 && (
          <select 
            className="analytics-user-select"
            value={userFilter}
            onChange={(e) => setUserFilter(e.target.value)}
          >
            <option value="All Users">All Users</option>
            {users.map(u => (
              <option key={u._id} value={u._id}>
                {u.username}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="stats-grid">
        <div className="stat-card-large">
          <div className="stat-title">Total Tasks</div>
          <div className="stat-value-large">{stats.total}</div>
        </div>

        <div className="stat-card-large">
          <div className="stat-title">Completed</div>
          <div className="stat-value-large">{stats.done}</div>
        </div>

        <div className="stat-card-large">
          <div className="stat-title">In Progress</div>
          <div className="stat-value-large">{stats.inProgress}</div>
        </div>

        <div className="stat-card-large">
          <div className="stat-title">Completion Rate</div>
          <div className="stat-value-large">{stats.rate}%</div>
        </div>
      </div>

      <div className="chart-section">
        <div className="chart-header">
          <h2 className="section-title">Task Status Distribution</h2>
          <select className="chart-selector" value={chartType} onChange={(e) => setChartType(e.target.value)}>
            <option value="pie">Pie Chart</option>
            <option value="bar">Bar Chart</option>
            <option value="doughnut">Doughnut Chart</option>
          </select>
        </div>
        <div className="chart-container">
          {stats.total === 0 ? (
            <div className="chart-placeholder">
              <p>No data to display. {isAdmin ? "Create tasks" : "Wait for tasks to be assigned"} to see visualizations.</p>
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>
    </div>
  );
}
