import { useTasks } from "../context/TaskContext";

const Analytics = () => {
  const { tasks } = useTasks();
  const done = tasks.filter((t) => t.status === "Done").length;
  const total = tasks.length;
  const rate = total ? Math.round((done / total) * 100) : 0;

  return (
    <div className="analytics">
      <h3>Analytics</h3>
      <p>Tasks Completed: {done} / {total}</p>
      <p>Completion Rate: {rate}%</p>
    </div>
  );
};

export default Analytics;
