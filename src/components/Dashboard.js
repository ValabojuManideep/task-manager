import React, { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { format } from "date-fns";
import { ListTodo, Clock, CheckCircle2, TrendingUp } from "lucide-react";

export default function Dashboard() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      toast({
        title: "Unauthorized",
        description: "You are logged out. Redirecting to login...",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/login";
      }, 800);
    }
  }, [isAuthenticated, isLoading, toast]);

  // Simulated data fetching
  const { data: tasks = [], isLoading: tasksLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      return [
        {
          id: 1,
          title: "Design UI Layout",
          status: "done",
          priority: "high",
          dueDate: "2025-10-30",
          createdAt: "2025-10-25",
        },
        {
          id: 2,
          title: "Integrate API",
          status: "in_progress",
          priority: "medium",
          dueDate: "2025-10-29",
          createdAt: "2025-10-26",
        },
        {
          id: 3,
          title: "Fix Navbar Bug",
          status: "todo",
          priority: "low",
          dueDate: "2025-10-31",
          createdAt: "2025-10-27",
        },
      ];
    },
  });

  if (isLoading || tasksLoading) {
    return <div style={{ padding: "20px" }}>Loading Dashboard...</div>;
  }

  // stats
  const totalTasks = tasks.length;
  const todoTasks = tasks.filter((t) => t.status === "todo").length;
  const inProgressTasks = tasks.filter((t) => t.status === "in_progress").length;
  const completedTasks = tasks.filter((t) => t.status === "done").length;
  const completionRate =
    totalTasks > 0 ? Math.round((completedTasks / totalTasks) * 100) : 0;

  const recentTasks = tasks
    .sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    )
    .slice(0, 5);

  const getPriorityColor = (priority) => {
    switch (priority) {
      case "high":
        return "#ef4444";
      case "medium":
        return "#f59e0b";
      case "low":
        return "#10b981";
      default:
        return "#6b7280";
    }
  };

  const getStatusLabel = (status) => {
    switch (status) {
      case "todo":
        return "To Do";
      case "in_progress":
        return "In Progress";
      case "done":
        return "Completed";
      default:
        return status;
    }
  };

  return (
    <div style={{ padding: "30px" }}>
      <h1 style={{ fontSize: "24px", fontWeight: "bold" }}>Dashboard</h1>
      <p style={{ color: "#6b7280" }}>Overview of your tasks</p>

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",
          gap: "16px",
          marginTop: "30px",
        }}
      >
        <StatCard icon={<ListTodo />} title="Total Tasks" value={totalTasks} />
        <StatCard
          icon={<Clock />}
          title="In Progress"
          value={inProgressTasks}
        />
        <StatCard
          icon={<CheckCircle2 />}
          title="Completed"
          value={completedTasks}
        />
        <StatCard
          icon={<TrendingUp />}
          title="Completion Rate"
          value={`${completionRate}%`}
        />
      </div>

      <div
        style={{
          marginTop: "40px",
          padding: "20px",
          border: "1px solid #e5e7eb",
          borderRadius: "12px",
          backgroundColor: "#fff",
        }}
      >
        <h2 style={{ fontSize: "20px", marginBottom: "16px" }}>Recent Tasks</h2>

        {recentTasks.length === 0 ? (
          <div style={{ textAlign: "center", color: "#9ca3af" }}>
            <p>No tasks available</p>
          </div>
        ) : (
          <ul style={{ listStyle: "none", padding: 0 }}>
            {recentTasks.map((task) => (
              <li
                key={task.id}
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  padding: "12px 16px",
                  marginBottom: "8px",
                  backgroundColor: "#f9fafb",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <div>
                    <h3 style={{ margin: 0 }}>{task.title}</h3>
                    <div style={{ fontSize: "13px", color: "#6b7280" }}>
                      Status: {getStatusLabel(task.status)} | Priority:{" "}
                      <span
                        style={{
                          color: getPriorityColor(task.priority),
                          fontWeight: "bold",
                        }}
                      >
                        {task.priority}
                      </span>
                      {task.dueDate && (
                        <>
                          {" "}
                          | Due: {format(new Date(task.dueDate), "MMM d")}
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function StatCard({ icon, title, value }) {
  return (
    <div
      style={{
        border: "1px solid #e5e7eb",
        borderRadius: "12px",
        padding: "20px",
        backgroundColor: "#fff",
        display: "flex",
        flexDirection: "column",
        alignItems: "flex-start",
        justifyContent: "center",
        boxShadow: "0 2px 6px rgba(0,0,0,0.05)",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span style={{ color: "#6b7280" }}>{icon}</span>
        <h3 style={{ fontSize: "14px", color: "#6b7280" }}>{title}</h3>
      </div>
      <h2 style={{ fontSize: "24px", marginTop: "8px" }}>{value}</h2>
    </div>
  );
}
