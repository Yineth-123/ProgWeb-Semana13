<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import TaskColumn from './TaskColumn.vue'
import { fetchTasks, createTask, deleteTask, updateStatus } from '../api.js'

const newTask = ref('')
const tasks = reactive({
  todo: [],
  doing: [],
  done: []
})

const loadTasks = async () => {
  try {
    const all = await fetchTasks()
    tasks.todo = all.filter(t => t.status === 'todo')
    tasks.doing = all.filter(t => t.status === 'doing')
    tasks.done = all.filter(t => t.status === 'done')
  } catch (err) {
    console.error('Error cargando tareas:', err)
  }
}

onMounted(loadTasks)

const addTask = async () => {
  const text = newTask.value.trim()
  if (!text) return
  try {
    const created = await createTask(text)
    tasks.todo.push(created)
    newTask.value = ''
  } catch (err) {
    alert('Error creando tarea: ' + err.message)
  }
}

const removeTask = async (column, index) => {
  const task = tasks[column][index]
  try {
    await deleteTask(task.id)
    tasks[column].splice(index, 1)
  } catch (err) {
    alert('Error eliminando tarea: ' + err.message)
  }
}

const moveTask = async (from, { index, direction }) => {
  const columns = ['todo', 'doing', 'done']
  const fromIndex = columns.indexOf(from)
  const toIndex = fromIndex + direction
  if (toIndex < 0 || toIndex >= columns.length) return

  const task = tasks[from][index]
  const newStatus = columns[toIndex]
  try {
    await updateStatus(task.id, newStatus)
    tasks[from].splice(index, 1)
    tasks[newStatus].push({ ...task, status: newStatus })
  } catch (err) {
    alert('Error moviendo tarea: ' + err.message)
  }
}

const hasTasks = computed(() =>
  tasks.todo.length > 0 || tasks.doing.length > 0 || tasks.done.length > 0
)
</script>


<style scoped>
.task-manager {
  max-width: 1000px;
  margin: 0 auto;
  text-align: center;
  font-family: Arial, sans-serif;
}

h1 {
  color: rgba(110, 53, 6, 0.979);
  font-size: 2.5rem;
  margin: 20px 0;
}

.task-input {
  display: flex;
  justify-content: center;
  margin-bottom: 20px;
}

.task-input input {
  padding: 10px;
  width: 60%;
  border: 2px solid #d17245;
  border-radius: 20px 0 0 20px;
  outline: none;
}

.task-input button {
  background: #c07333;
  color: rgb(245, 232, 223);
  border: none;
  padding: 10px 20px;
  border-radius: 0 20px 20px 0;
  cursor: pointer;
}

.task-sections {
  display: flex;
  justify-content: space-between;
  gap: 20px;
}

.no-tasks {
  text-align: center;
  font-size: 1.3rem;
  color: #666;
  margin-top: 40px;
  font-style: italic;
}
</style>
