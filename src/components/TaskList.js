import { useTasks } from "../context/TaskContext";

const TaskList = ({ filter }) => {
  const { tasks, updateTask, deleteTask, addComment } = useTasks();

  const filtered = filter === "All" ? tasks : tasks.filter((t) => t.status === filter);

  return (
    <div>
      {filtered.map((t) => (
        <div key={t.id} className="task">
          <h4>{t.title}</h4>
          <p>Status: {t.status}</p>
          <p>Priority: {t.priority}</p>
          <p>Due: {t.dueDate || "None"}</p>

          <button onClick={() => updateTask(t.id, { status: "Done" })}>Mark Done</button>
          <button onClick={() => deleteTask(t.id)}>Delete</button>

          <div>
            <h5>Comments</h5>
            {t.comments.map((c) => (
              <p key={c.id}>• {c.text}</p>
            ))}
            <input
              type="text"
              placeholder="Add comment..."
              onKeyDown={(e) => {
                if (e.key === "Enter") addComment(t.id, e.target.value);
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
};

export default TaskList;
