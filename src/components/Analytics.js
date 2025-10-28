import React, { useContext, useMemo, useState } from "react";
import { TaskContext } from "../context/TaskContext";
import { Chart as ChartJS, ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement } from "chart.js";
import { Pie, Bar, Doughnut } from "react-chartjs-2";
import "./Analytics.css";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement);

export default function Analytics() {
  const { tasks } = useContext(TaskContext);
  const [chartType, setChartType] = useState("pie");

  const stats = useMemo(() => {
    const total = tasks.length;
    const todo = tasks.filter(t => t.status === "todo").length;
    const inProgress = tasks.filter(t => t.status === "in_progress").length;
    const done = tasks.filter(t => t.status === "done").length;
    const rate = total ? Math.round((done / total) * 100) : 0;
    return { total, todo, inProgress, done, rate };
  }, [tasks]);

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
      <div>
        <h1 className="page-title">Analytics</h1>
        <p className="page-subtitle">Insights into task performance and team productivity</p>
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
              <p>No data to display. Create tasks to see visualizations.</p>
            </div>
          ) : (
            renderChart()
          )}
        </div>
      </div>
    </div>
  );
}
