const express = require('express');
const cors = require('cors');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');  // ✅ Importación correcta
const { nanoid } = require('nanoid');
const path = require('path');

const app = express();
app.use(cors());
app.use(express.json());

// ✅ Configuración de lowdb (versión moderna)
const file = path.join(__dirname, 'db.json');
const defaultData = { tasks: [] };  // 👈 Esto evita el error "missing default data"
const adapter = new JSONFile(file);
const db = new Low(adapter, defaultData);


// valid statuses
const VALID_STATUSES = new Set(['todo', 'doing', 'done']);

// initialize DB
async function initDB() {
  await db.read();
  db.data = db.data || { tasks: [] };
  await db.write();
}
initDB().catch(console.error);

/**
 * Helper: find task by id
 */
function findTask(id) {
  return db.data.tasks.find(t => t.id === id);
}

/**
 * GET /tasks
 * supports optional ?status=todo|doing|done
 */
app.get('/tasks', async (req, res) => {
  await db.read();
  const { status } = req.query;
  let tasks = db.data.tasks;
  if (status) {
    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ detail: 'Invalid status filter' });
    }
    tasks = tasks.filter(t => t.status === status);
  }
  return res.json(tasks);
});

/**
 * GET /tasks/:id
 */
app.get('/tasks/:id', async (req, res) => {
  await db.read();
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ detail: 'Task not found' });
  return res.json(task);
});

/**
 * POST /tasks
 * body: { title, description? }
 * status is set to 'todo' by the server
 */
app.post('/tasks', async (req, res) => {
  const { title, description = '' } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ detail: 'Title is required' });
  }
  const newTask = {
    id: nanoid(),
    title: title.trim(),
    description: description || '',
    status: 'todo',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await db.read();
  db.data.tasks.push(newTask);
  await db.write();
  return res.status(201).json(newTask);
});

/**
 * PUT /tasks/:id
 * Replace entire task (title, description, status)
 */
app.put('/tasks/:id', async (req, res) => {
  const { title, description = '', status } = req.body || {};
  if (!title || typeof title !== 'string' || !title.trim()) {
    return res.status(400).json({ detail: 'Title is required' });
  }
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ detail: 'Invalid status' });
  }
  await db.read();
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ detail: 'Task not found' });

  task.title = title.trim();
  task.description = description;
  task.status = status;
  task.updated_at = new Date().toISOString();

  await db.write();
  return res.json({ id: task.id, title: task.title, description: task.description, status: task.status });
});

/**
 * PATCH /tasks/:id/status
 * body: { status }
 */
app.patch('/tasks/:id/status', async (req, res) => {
  const { status } = req.body || {};
  if (!VALID_STATUSES.has(status)) {
    return res.status(400).json({ detail: 'Invalid status' });
  }
  await db.read();
  const task = findTask(req.params.id);
  if (!task) return res.status(404).json({ detail: 'Task not found' });

  task.status = status;
  task.updated_at = new Date().toISOString();
  await db.write();
  return res.json({ id: task.id, status: task.status });
});

/**
 * DELETE /tasks/:id
 */
app.delete('/tasks/:id', async (req, res) => {
  await db.read();
  const idx = db.data.tasks.findIndex(t => t.id === req.params.id);
  if (idx === -1) return res.status(404).json({ detail: 'Task not found' });
  db.data.tasks.splice(idx, 1);
  await db.write();
  return res.json({ message: 'Task deleted successfully' });
});

/**
 * GET /tasks/summary
 * returns counts per status
 */
app.get('/tasks/summary', async (req, res) => {
  await db.read();
  const counts = { todo: 0, doing: 0, done: 0 };
  for (const t of db.data.tasks) {
    if (VALID_STATUSES.has(t.status)) counts[t.status] = (counts[t.status] || 0) + 1;
  }
  return res.json(counts);
});

/**
 * Start server
 */
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
  console.log(`Server running on http://127.0.0.1:${PORT}`);
});
