import React, { useMemo, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import axios from "axios";
import useAppStore from "../store/useAppStore";
import SearchableSelect from "./SearchableSelect";
import "./Analytics.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Analytics() {
  const allTasks = useAppStore((s) => s.allTasks);
  const { user } = useAuth();
  const chartType = useAppStore((s) => s.analytics_chartType);
  const setChartType = useAppStore((s) => s.setAnalytics_chartType);
  const userFilter = useAppStore((s) => s.analytics_userFilter);
  const setUserFilter = useAppStore((s) => s.setAnalytics_userFilter);
  const users = useAppStore((s) => s.analytics_users);
  const setUsers = useAppStore((s) => s.setAnalytics_users);

  const isAdmin = user?.role === "admin";

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    try {
      const { data } = await axios.get("/api/auth/users");
      setUsers(data);
    } catch (err) {
      console.error("Error fetching users:", err);
    }
  };

  // Filter tasks based on role and user filter
  const userTasks = useMemo(() => {
    let filtered;

    if (isAdmin) {
      // Admin viewing - start with all tasks
      if (userFilter === "All Users") {
        filtered = allTasks;
      } else {
        // Filter by specific user
        filtered = allTasks.filter(t => {
          const assignedId = t.assignedTo?._id || t.assignedTo;
          return assignedId === userFilter;
        });
      }
    } else {
      // Regular user - only show their assigned tasks
      filtered = allTasks.filter(t => {
        const assignedId = t.assignedTo?._id || t.assignedTo;
        return assignedId === user?.id || assignedId === user?._id;
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
          color: document.body.classList.contains('dark-mode') ? '#f9fafb' : '#1f2937',
        },
      },
    },
    scales: chartType === 'bar' ? {
      y: {
        ticks: {
          color: document.body.classList.contains('dark-mode') ? '#f9fafb' : '#1f2937',
        },
        grid: {
          color: document.body.classList.contains('dark-mode') ? '#374151' : '#e5e7eb',
        }
      },
      x: {
        ticks: {
          color: document.body.classList.contains('dark-mode') ? '#f9fafb' : '#1f2937',
        },
        grid: {
          color: document.body.classList.contains('dark-mode') ? '#374151' : '#e5e7eb',
        }
      }
    } : {}
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

  // Prepare user options for SearchableSelect
  const userOptions = useMemo(() => {
    const options = [{ value: "All Users", label: "All Users" }];
    if (users.length > 0) {
      users.forEach(u => {
        options.push({
          value: u._id,
          label: `${u.username} (${u.email})${u.role ? ` [${u.role}]` : ''}`
        });
      });
    }
    return options;
  }, [users]);

  // Prepare chart type options
  const chartTypeOptions = [
    { value: "pie", label: "Pie Chart" },
    { value: "bar", label: "Bar Chart" },
    { value: "doughnut", label: "Doughnut Chart" }
  ];

  // Export logic
  const teams = useAppStore((s) => s.teams);
  const exportFormat = useAppStore((s) => s.analytics_exportFormat);
  const setExportFormat = useAppStore((s) => s.setAnalytics_exportFormat);
  const showExportModal = useAppStore((s) => s.analytics_showExportModal);
  const setShowExportModal = useAppStore((s) => s.setAnalytics_showExportModal);

  function downloadFile(data, filename, type) {
    const blob = new Blob([data], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Export handler
  async function handleExport() {
    let data, filename, type;
    if (!isAdmin) {
      // Only export logged-in user's data
      const exportUser = { username: user.username, email: user.email, role: user.role, createdAt: user.createdAt, _id: user.id || user._id };
      const exportTasks = allTasks.filter(t => t.assignedTo?._id === user.id || t.assignedTo === user.id).map(t => ({
        title: t.title,
        description: t.description,
        status: t.status,
        assignedTo: t.assignedTo?._id || t.assignedTo,
        dueDate: t.dueDate,
        isRecurrent: t.isRecurrent,
        recurrencePattern: t.recurrencePattern,
        recurrenceEndDate: t.recurrenceEndDate,
        completionLog: t.completionLog,
        createdAt: t.createdAt,
        _id: t._id
      }));
      const userId = user.id || user._id;
      const exportTeams = teams.filter(team =>
        team.members?.some(member => (member._id || member) === userId)
      ).map(t => ({
        name: t.name,
        description: t.description,
        members: t.members,
        createdBy: t.createdBy,
        createdAt: t.createdAt,
        _id: t._id
      }));
      if (exportFormat === "csv") {
        const XLSX = require('xlsx');
        const wb = XLSX.utils.book_new();
        const wsUser = XLSX.utils.json_to_sheet([exportUser]);
        const wsTeams = XLSX.utils.json_to_sheet(exportTeams);
        const wsTasks = XLSX.utils.json_to_sheet(exportTasks);
        XLSX.utils.book_append_sheet(wb, wsUser, 'User');
        XLSX.utils.book_append_sheet(wb, wsTeams, 'Teams');
        XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadFile(wbout, `analytics_export_${user.username}_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else {
        data = JSON.stringify({ user: exportUser, teams: exportTeams, tasks: exportTasks }, null, 2);
        filename = `analytics_export_${user.username}_${Date.now()}.json`;
        type = "application/json";
        downloadFile(data, filename, type);
      }
    } else {
      // Admin: export all data
      const exportUsers = users.map(u => ({ username: u.username, email: u.email, role: u.role, createdAt: u.createdAt, _id: u._id }));
      const exportTeams = teams.map(t => ({ name: t.name, description: t.description, members: t.members, createdBy: t.createdBy, createdAt: t.createdAt, _id: t._id }));
      const exportTasks = allTasks.map(t => ({
        title: t.title,
        description: t.description,
        status: t.status,
        assignedTo: t.assignedTo?._id || t.assignedTo,
        dueDate: t.dueDate,
        isRecurrent: t.isRecurrent,
        recurrencePattern: t.recurrencePattern,
        recurrenceEndDate: t.recurrenceEndDate,
        completionLog: t.completionLog,
        createdAt: t.createdAt,
        _id: t._id
      }));
      if (exportFormat === "csv") {
        const XLSX = require('xlsx');
        const wb = XLSX.utils.book_new();
        const wsUsers = XLSX.utils.json_to_sheet(exportUsers);
        const wsTeams = XLSX.utils.json_to_sheet(exportTeams);
        const wsTasks = XLSX.utils.json_to_sheet(exportTasks);
        XLSX.utils.book_append_sheet(wb, wsUsers, 'Users');
        XLSX.utils.book_append_sheet(wb, wsTeams, 'Teams');
        XLSX.utils.book_append_sheet(wb, wsTasks, 'Tasks');
        const wbout = XLSX.write(wb, { bookType: 'xlsx', type: 'array' });
        downloadFile(wbout, `analytics_export_${Date.now()}.xlsx`, 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
      } else {
        data = JSON.stringify({ users: exportUsers, teams: exportTeams, tasks: exportTasks }, null, 2);
        filename = `analytics_export_${Date.now()}.json`;
        type = "application/json";
        downloadFile(data, filename, type);
      }
    }
  }

  return (
    <div style={{ width: '100%', maxWidth: '100vw', overflowX: 'hidden' }}>
      <div className="analytics-container">
        <div className="analytics-header-section">
          <div>
            <h1 className="page-title">Analytics</h1>
            <p className="page-subtitle">
              {isAdmin ? "Insights into task performance and team productivity" : "Your task performance insights"}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
            {isAdmin && users.length > 0 && (
              <SearchableSelect
                options={userOptions}
                value={userFilter}
                onChange={setUserFilter}
                placeholder="Select User"
              />
            )}
            <button
              className="export-btn"
              style={{
                padding: '0.5rem 1.2rem',
                background: '#5B7FFF',
                color: '#fff',
                border: 'none',
                borderRadius: '6px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 8px rgba(91,127,255,0.12)'
              }}
              onClick={() => setShowExportModal(true)}
            >
              Export Data
            </button>
            {showExportModal && (
              <div style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                background: document.body.classList.contains('dark-mode') ? 'rgba(17,24,39,0.7)' : 'rgba(0,0,0,0.45)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 9999
              }}>
                <div style={{
                  background: document.body.classList.contains('dark-mode')
                    ? 'linear-gradient(135deg, #1e293b 0%, #374151 100%)'
                    : 'linear-gradient(135deg, #f9fafb 0%, #e0e7ff 100%)',
                  borderRadius: '16px',
                  padding: '2.5rem 2rem 2rem 2rem',
                  minWidth: '340px',
                  boxShadow: document.body.classList.contains('dark-mode')
                    ? '0 8px 32px rgba(91,127,255,0.28)'
                    : '0 8px 32px rgba(91,127,255,0.18)',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  gap: '2rem',
                  position: 'relative',
                  border: document.body.classList.contains('dark-mode') ? '1px solid #374151' : '1px solid #e0e7ff'
                }}>
                  <h2 style={{
                    marginBottom: '0.5rem',
                    fontSize: '2rem',
                    fontWeight: 700,
                    color: document.body.classList.contains('dark-mode') ? '#5B7FFF' : '#5B7FFF',
                    textAlign: 'center',
                    letterSpacing: '0.02em'
                  }}>Export Data</h2>
                  <p style={{
                    marginBottom: '1rem',
                    fontSize: '1.1rem',
                    color: document.body.classList.contains('dark-mode') ? '#cbd5e1' : '#374151',
                    textAlign: 'center',
                    fontWeight: 500
                  }}>Choose export format:</p>
                  <button
                    style={{
                      padding: '0.7rem 1.2rem',
                      background: '#5B7FFF',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      marginBottom: '0.7rem',
                      width: '100%',
                      fontSize: '1.1rem',
                      boxShadow: '0 2px 8px rgba(91,127,255,0.12)',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#3b5ccc'}
                    onMouseOut={e => e.currentTarget.style.background = '#5B7FFF'}
                    onClick={() => { setExportFormat('csv'); setShowExportModal(false); handleExport(); }}
                  >
                    Excel (XLSX)
                  </button>
                  <button
                    style={{
                      padding: '0.7rem 1.2rem',
                      background: '#10b981',
                      color: '#fff',
                      border: 'none',
                      borderRadius: '8px',
                      fontWeight: 'bold',
                      cursor: 'pointer',
                      width: '100%',
                      fontSize: '1.1rem',
                      boxShadow: '0 2px 8px rgba(16,185,129,0.12)',
                      transition: 'background 0.2s',
                    }}
                    onMouseOver={e => e.currentTarget.style.background = '#059669'}
                    onMouseOut={e => e.currentTarget.style.background = '#10b981'}
                    onClick={() => { setExportFormat('json'); setShowExportModal(false); handleExport(); }}
                  >
                    JSON
                  </button>
                  <button
                    style={{
                      position: 'absolute',
                      top: '1rem',
                      right: '1rem',
                      background: 'transparent',
                      border: 'none',
                      fontSize: '2rem',
                      color: '#5B7FFF',
                      cursor: 'pointer',
                      fontWeight: 700,
                      lineHeight: 1
                    }}
                    aria-label="Close export modal"
                    onClick={() => setShowExportModal(false)}
                  >
                    &times;
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        <div className="stats-grid">
          <div className="stat-card-large">
            <div className="stat-label">Total Tasks</div>
            <div className="stat-value-large">{stats.total}</div>
          </div>

          <div className="stat-card-large">
            <div className="stat-label">Completed</div>
            <div className="stat-value-large">{stats.done}</div>
          </div>

          <div className="stat-card-large">
            <div className="stat-label">In Progress</div>
            <div className="stat-value-large">{stats.inProgress}</div>
          </div>

          <div className="stat-card-large">
            <div className="stat-label">Completion Rate</div>
            <div className="stat-value-large">{stats.rate}%</div>
          </div>
        </div>

        <div className="chart-section">
          <div className="chart-header">
            <h2 className="chart-title">Task Status Distribution</h2>
            <SearchableSelect
              options={chartTypeOptions}
              value={chartType}
              onChange={setChartType}
              placeholder="Select Chart Type"
            />
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
    </div>
  );
}
