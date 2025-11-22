import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Layout from "@/components/Layout";
import { ProjectData, Task } from '../../shared/api';

const PRIORITY_MAP_FROM_BACKEND: { [k: string]: "Baja" | "Media" | "Alta" | "Crítica" } = {
  Baja: "Baja",
  Media: "Media",
  Alta: "Alta",
  Crítica: "Crítica",
};

export default function TaskManagement() {
  const navigate = useNavigate();
  const itemsPerPage = 5;
  const [allTasks, setAllTasks] = useState<Task[]>([]);

  useEffect(() => {
    // Cargar los datos de localStorage al inicializar el componente
    const storedTasks = localStorage.getItem('allTasks');
    if (storedTasks) {
      setAllTasks(JSON.parse(storedTasks));
    }
  }, []);

  useEffect(() => {
    // Guardar los datos en localStorage cada vez que cambian
    localStorage.setItem('allTasks', JSON.stringify(allTasks));
  }, [allTasks]);

  const [projectData, setProjectData] = useState<ProjectData | null>(null);
  const [graphImageBase64, setGraphImageBase64] = useState<string | null>(null); // Nuevo estado


  // Calcula las páginas automáticamente al cargar y cada vez que cambian las tareas
  const [currentPage, setCurrentPage] = useState(1);
  const totalPages = Math.max(1, Math.ceil(allTasks.length / itemsPerPage));

  // Form state
  const [taskName, setTaskName] = useState("");
  const [duration, setDuration] = useState("");
  const [unit, setUnit] = useState<"Horas" | "Minutos">("Horas");
  const [priority, setPriority] = useState<"Baja" | "Media" | "Alta" | "Crítica">("Baja");
  const [dependencies, setDependencies] = useState("");
  const [searchId, setSearchId] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [messageType, setMessageType] = useState<"error" | "success">("success");
  const [lastTaskId, setLastTaskId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);

  // Pagination helpers
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentTasks = allTasks.slice(startIndex, endIndex);

  // Show message and auto-clear
  function showMessage(msg: string, type: "success" | "error") {
    setMessage(msg);
    setMessageType(type);
    setTimeout(() => setMessage(null), 3000);
  }

  // Parse dependencias, retorna array de IDs válidos y mensaje de error si hay alguno inválido
  function parseDependencies(input: string, excludeId?: number): { ids: number[]; error?: string } {
    const cleaned = input.replace(/\s/g, "");
    if (!cleaned) return { ids: [] };
    if (cleaned === "Ninguna") return { ids: [] };
    const ids = cleaned.split(",").filter(Boolean).map(Number);
    // Solo números enteros positivos
    if (ids.some(id => !Number.isInteger(id) || id < 1)) {
      return { ids: [], error: "Las dependencias deben ser IDs numéricos mayores que 0." };
    }
    // Verificar existencia (excluyendo el propio ID si se actualiza)
    const validIds = allTasks.map(t => t.id);
    if (excludeId) {
      const idx = validIds.indexOf(excludeId);
      if (idx !== -1) validIds.splice(idx, 1);
    }
    const invalid = ids.filter(id => !validIds.includes(id));
    if (invalid.length > 0) {
      return { ids: [], error: `Las siguientes dependencias no existen: ${invalid.join(", ")}.` };
    }
    // Quitar repetidos
    return { ids: [...new Set(ids)] };
  }

  const [availableIds, setAvailableIds] = useState<number[]>([])

  // Add Task
  function handleAddTask() {
    if (!taskName.trim()) {
      showMessage("El campo 'Nombre de la Tarea' es obligatorio.", "error");
      return;
    }
    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) < 1) {
      showMessage("La duración debe ser un número mayor que cero.", "error");
      return;
    }
    if (allTasks.some(t => t.name === taskName.trim())) {
      showMessage("Ya existe una tarea con ese nombre.", "error");
      return;
    }
    const { ids, error } = parseDependencies(dependencies);
    if (error) {
      showMessage(error, "error");
      return;
    }
    const newId = availableIds.length ? Math.min(...availableIds) : allTasks.length ? Math.max(...allTasks.map(t => t.id)) + 1 : 1;
    const task: Task = {
      id: newId,
      name: taskName.trim(),
      duration: Number(duration),
      unit,
      priority: PRIORITY_MAP_FROM_BACKEND[priority],
      dependencies: ids.length ? ids.join(", ") : "Ninguna",
    };
    setAllTasks(prev => {
      const updated = [...prev, task];
      return updated;
    });
    setAvailableIds(prev => {
      return prev.filter(id => id !== newId)
    })
    setLastTaskId(newId);
    showMessage(`Tarea agregada. El ID es ${newId}.`, "success");
    setTaskName("");
    setDuration("");
    setDependencies("");
    setSearchId("");
    setEditingId(null);
  }

  // Update Task
  function handleUpdateTask() {
    if (editingId === null) return;

    const id = editingId;
    const idx = allTasks.findIndex(t => t.id === id);
    if (idx === -1) {
      showMessage("No existe una tarea con ese ID.", "error");
      return;
    }
    if (!taskName.trim()) {
      showMessage("El campo 'Nombre de la Tarea' es obligatorio para actualizar.", "error");
      return;
    }
    if (!duration.trim() || isNaN(Number(duration)) || Number(duration) < 1) {
      showMessage("La duración debe ser un número mayor que cero.", "error");
      return;
    }
    const { ids, error } = parseDependencies(dependencies, id);
    if (error) {
      showMessage(error, "error");
      return;
    }
    const updated: Task = {
      id,
      name: taskName.trim(),
      duration: Number(duration),
      unit,
      priority: PRIORITY_MAP_FROM_BACKEND[priority],
      dependencies: ids.length ? ids.join(", ") : "Ninguna",
    };
    setAllTasks(prev => {
      const arr = [...prev];
      arr[idx] = updated;
      return arr;
    });
    setLastTaskId(id);
    showMessage(`Tarea actualizada correctamente (ID ${id}).`, "success");
    setTaskName("");
    setDuration("");
    setDependencies("");
    setSearchId("");
    setEditingId(null);
  }

  // Delete Task
  function handleDeleteTask(idToDelete?: number) {
    const id = idToDelete !== undefined ? idToDelete : Number(searchId);

    if (!id || isNaN(id)) {
      showMessage("Ingrese un ID válido para eliminar.", "error");
      return;
    }

    if (!allTasks.some(t => t.id === id)) {
      showMessage("No existe una tarea con ese ID.", "error");
      return;
    }
    setAllTasks(prev => {
      // Elimina la tarea
      let updated = prev.filter(t => t.id !== id);
      // Quitar referencias a este ID en dependencias de otras tareas
      updated = updated.map(t => {
        if (t.dependencies === "Ninguna") return t;
        const depArr = t.dependencies.split(",").map(d => d.trim()).filter(Boolean);
        const newDeps = depArr.filter(depId => depId !== String(id));
        return {
          ...t,
          dependencies: newDeps.length ? newDeps.join(", ") : "Ninguna",
        };
      });
      return updated;
    });
    setAvailableIds(prev => {
      return [...prev, id]
    });
    setLastTaskId(null);
    showMessage(`Tarea eliminada correctamente (ID ${id}).`, "success");

    // Only clear form if we were editing the deleted task
    if (editingId === id) {
      setTaskName("");
      setDuration("");
      setDependencies("");
      setUnit("Horas");
      setPriority("Baja");
      setEditingId(null);
    }
    setSearchId("");
  }

  function handleSubmit() {
    if (editingId !== null) {
      handleUpdateTask();
    } else {
      handleAddTask();
    }
  }

  function handleCancelEdit() {
    setEditingId(null);
    setTaskName("");
    setDuration("");
    setDependencies("");
    setUnit("Horas");
    setPriority("Baja");
  }

  // Search Task by ID (lupa)
  function handleSearchTask() {
    if (!searchId.trim() || isNaN(Number(searchId))) {
      showMessage("Ingrese un ID válido para buscar.", "error");
      return;
    }
    const id = Number(searchId);
    const task = allTasks.find(t => t.id === id);
    if (!task) {
      showMessage("No existe una tarea con ese ID.", "error");
      return;
    }
    setTaskName(task.name);
    setDuration(task.duration.toString());
    setUnit(task.unit);
    setPriority(PRIORITY_MAP_FROM_BACKEND[task.priority]); // Utilizar el mapa de conversión
    setDependencies(task.dependencies !== "Ninguna" ? task.dependencies : "");
    setLastTaskId(id);
    showMessage("Tarea cargada en el formulario.", "success");
  }

  // NEW: Handler para el botón "Generar Plan / Calcular Ruta Crítica"
  const [isGeneratingPlan, setIsGeneratingPlan] = useState(false);
  const [planError, setPlanError] = useState<string | null>(null);

  async function handleGeneratePlanAndSend() {
    console.log("Botón 'Generar Plan' oprimido. Enviando tareas al backend...");

    // Validar que haya tareas
    if (allTasks.length === 0) {
      showMessage("Debe agregar al menos una tarea antes de generar el plan.", "error");
      return;
    }

    setIsGeneratingPlan(true);
    setPlanError(null);

    try {
      // Convertir las tareas a un formato que el backend pueda entender
      const tasksToSend = allTasks.map(task => ({
        id: task.id,
        name: task.name,
        duration: task.duration,
        unit: task.unit === "Horas" ? "hours" : "minutes", // Convertir la unidad
        priority: task.priority,
        dependencies: task.dependencies.split(',').map(Number).filter(Boolean) // Convertir a array de números
      }));

      const response = await fetch('http://localhost:8000/generate-plan', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(tasksToSend)
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error(`Error HTTP! Estado: ${response.status}, Detalles:`, errorData);
        throw new Error(errorData.detail || `Error ${response.status}: ${response.statusText}`);
      }

      const data = await response.json();
      console.log("Respuesta del backend:", data);

      // Actualizar el estado con la cadena Base64
      setGraphImageBase64(data.image_base64);
      setProjectData(data);

      // Guardar en localStorage para persistencia
      localStorage.setItem('lastProjectData', JSON.stringify(data));

      // Navegar a CriticalPathAnalysis.tsx y pasar los datos
      navigate('/analysis', { state: data });
    } catch (error) {
      console.error("Error al enviar las tareas a FastAPI:", error);
      const errorMessage = error instanceof Error ? error.message : "Error desconocido al generar el plan";
      setPlanError(errorMessage);
      showMessage(`Error: ${errorMessage}`, "error");
    } finally {
      setIsGeneratingPlan(false);
    }
  }


  const rightContent = (
    <div
      className="flex items-center gap-2 text-xs"
      style={{ color: "#9CA3AF" }}
    >
      <span>Total:</span>
      <span style={{ color: "#00D4AA", fontWeight: 500 }}>
        {allTasks.length}
      </span>
      <span>tareas</span>
      <div
        className="w-2 h-2 rounded-full ml-2"
        style={{ backgroundColor: "#00D4AA", opacity: 0.838 }}
      ></div>
    </div>
  );

  return (
    <Layout title="Panel de Control de Tareas" rightContent={rightContent}>
      {/* Loading Overlay */}
      {isGeneratingPlan && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(15, 15, 35, 0.95)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            gap: '20px'
          }}
        >
          <div
            style={{
              width: '60px',
              height: '60px',
              border: '4px solid rgba(0, 212, 170, 0.2)',
              borderTop: '4px solid #00D4AA',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}
          />
          <div
            style={{
              color: '#E5E7EB',
              fontSize: '18px',
              fontFamily: 'Inter',
              fontWeight: 500
            }}
          >
            Generando plan y calculando ruta crítica...
          </div>
          <style>
            {`
              @keyframes spin {
                0% { transform: rotate(0deg); }
                100% { transform: rotate(360deg); }
              }
            `}
          </style>
        </div>
      )}

      <div className="grid grid-cols-2 gap-6 mb-6">
        {/* Task Entry Form */}
        <div
          className="rounded-lg border p-6"
          style={{ backgroundColor: "#16213E", borderColor: "#374151" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M10 2C10.2652 2 10.5196 2.10536 10.7071 2.29289C10.8946 2.48043 11 2.73478 11 3V9H17C17.2652 9 17.5196 9.10536 17.7071 9.29289C17.8946 9.48043 18 9.73478 18 10C18 10.2652 17.8946 10.5196 17.7071 10.7071C17.5196 10.8946 17.2652 11 17 11H11V17C11 17.2652 10.8946 17.5196 10.7071 17.7071C10.5196 17.8946 10.2652 18 10 18C9.73478 18 9.48043 17.8946 9.29289 17.7071C9.10536 17.5196 9 17.2652 9 17V11H3C2.73478 11 2.48043 10.8946 2.29289 10.7071C2.10536 10.5196 2 10.2652 2 10C2 9.73478 2.10536 9.48043 2.29289 9.29289C2.48043 9.10536 2.73478 9 3 9H9V3C9 2.73478 9.10536 2.48043 9.29289 2.29289C9.48043 2.10536 9.73478 2 10 2Z"
                fill="#00D4AA"
              />
            </svg>
            <h3
              className="text-base font-semibold"
              style={{ color: "#E5E7EB", fontFamily: "Inter" }}
            >
              Entrada de Tareas
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className="text-xs font-medium block mb-2"
                style={{ color: "#9CA3AF", fontFamily: "Inter" }}
              >
                Nombre de la Tarea
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={taskName}
                  onChange={e => setTaskName(e.target.value)}
                  className="w-full h-[39px] px-3 rounded border text-sm"
                  style={{
                    backgroundColor: "#0F0F23",
                    borderColor: "#374151",
                    color: "#FFF",
                    fontFamily: "Inter",
                  }}
                  placeholder="Ingrese el nombre de la tarea..."
                />
              </div>
              {lastTaskId && (
                <div className="text-xs mt-1" style={{ color: "#00D4AA" }}>
                  ID de la última tarea añadida o editada: <b>{lastTaskId}</b>
                </div>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label
                  className="text-xs font-medium block mb-2"
                  style={{ color: "#9CA3AF", fontFamily: "Inter" }}
                >
                  Duración
                </label>
                <input
                  type="number"
                  min={1}
                  value={duration}
                  onChange={e => setDuration(e.target.value)}
                  className="w-full h-[39px] px-3 rounded border text-sm"
                  style={{
                    backgroundColor: "#0F0F23",
                    borderColor: "#374151",
                    color: "#999",
                    fontFamily: "Inter",
                  }}
                  placeholder="0"
                />
              </div>
              <div>
                <label
                  className="text-xs font-medium block mb-2"
                  style={{ color: "#9CA3AF", fontFamily: "Inter" }}
                >
                  Unidad
                </label>
                <select
                  value={unit}
                  onChange={e => setUnit(e.target.value as "Horas" | "Minutos")}
                  className="w-full h-[37px] px-3 rounded border text-sm"
                  style={{
                    backgroundColor: "#0F0F23",
                    borderColor: "#374151",
                    color: "#FFF",
                    fontFamily: "Inter",
                  }}
                >
                  <option value="Horas">Horas</option>
                  <option value="Minutos">Minutos</option>
                </select>
              </div>
            </div>

            <div>
              <label
                className="text-xs font-medium block mb-2"
                style={{ color: "#9CA3AF", fontFamily: "Inter" }}
              >
                Prioridad
              </label>
              <select
                value={priority}
                onChange={e =>
                  setPriority(e.target.value as "Baja" | "Media" | "Alta" | "Crítica")
                }
                className="w-full h-[37px] px-3 rounded border text-sm"
                style={{
                  backgroundColor: "#0F0F23",
                  borderColor: "#374151",
                  color: "#FFF",
                  fontFamily: "Inter",
                }}
              >
                <option value="Baja">Baja</option>
                <option value="Media">Media</option>
                <option value="Alta">Alta</option>
                <option value="Crítica">Crítica</option>
              </select>
            </div>

            <div>
              <label
                className="text-xs font-medium block mb-2"
                style={{ color: "#9CA3AF", fontFamily: "Inter" }}
              >
                Dependencias (IDs separados por comas)
              </label>
              <input
                type="text"
                value={dependencies}
                onChange={e => setDependencies(e.target.value)}
                className="w-full h-[39px] px-3 rounded border text-sm"
                style={{
                  backgroundColor: "#0F0F23",
                  borderColor: "#374151",
                  color: "#999",
                  fontFamily: "Inter",
                }}
              />
              {message && (
                <div className="text-xs mt-1" style={{ color: messageType === "error" ? "#EF4444" : "#00D4AA" }}>
                  {message}
                </div>
              )}
            </div>

            <div className="flex gap-2">
              <button
                onClick={handleSubmit}
                className="flex-1 h-[40px] rounded flex items-center justify-center gap-2 text-sm font-medium"
                style={{
                  backgroundColor: editingId !== null ? "#2563EB" : "#00D4AA",
                  color: "#FFF",
                  fontFamily: "Inter",
                }}
              >
                {editingId !== null ? "Actualizar Tarea" : "Agregar Tarea"}
              </button>

              {editingId !== null && (
                <button
                  onClick={handleCancelEdit}
                  className="px-4 h-[40px] rounded flex items-center justify-center text-sm font-medium"
                  style={{
                    backgroundColor: "#374151",
                    color: "#FFF",
                    fontFamily: "Inter",
                  }}
                >
                  Cancelar
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Search and Management */}
        <div
          className="rounded-lg border p-6"
          style={{ backgroundColor: "#16213E", borderColor: "#374151" }}
        >
          <div className="flex items-center gap-3 mb-6">
            <svg
              width="20"
              height="20"
              viewBox="0 0 20 20"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M8 4C6.93913 4 5.92172 4.42143 5.17157 5.17158C4.42143 5.92172 4 6.93914 4 8C4 9.06087 4.42143 10.0783 5.17157 10.8284C5.92172 11.5786 6.93913 12 8 12C9.06087 12 10.0783 11.5786 10.8284 10.8284C11.5786 10.0783 12 9.06087 12 8C12 6.93914 11.5786 5.92172 10.8284 5.17158C10.0783 4.42143 9.06087 4 8 4ZM2 8C2 5.23858 4.23858 3 8 3C11.7614 3 14 5.23858 14 8C14 10.7614 11.7614 13 8 13C4.23858 13 2 10.7614 2 8Z"
                fill="#00D4AA"
              />
            </svg>
            <h3
              className="text-base font-semibold"
              style={{ color: "#E5E7EB", fontFamily: "Inter" }}
            >
              Gestión y Búsqueda
            </h3>
          </div>

          <div className="space-y-4">
            <div>
              <label
                className="text-xs font-medium block mb-2"
                style={{ color: "#9CA3AF", fontFamily: "Inter" }}
              >
                ID de Tarea para Gestión
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  value={searchId}
                  onChange={e => setSearchId(e.target.value)}
                  className="flex-1 h-[39px] px-3 rounded border text-sm"
                  style={{
                    backgroundColor: "#0F0F23",
                    borderColor: "#374151",
                    color: "#999",
                    fontFamily: "Inter",
                  }}
                  placeholder="Ingrese ID..."
                />
                <div
                  className="w-[40px] h-[39px] rounded border flex items-center justify-center cursor-pointer"
                  style={{
                    backgroundColor: "#374151",
                    borderColor: "#374151",
                  }}
                  title="Buscar tarea por ID"
                  onClick={handleSearchTask}
                >
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 16 16"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path
                      fillRule="evenodd"
                      clipRule="evenodd"
                      d="M6.39998 3.19999C5.55128 3.19999 4.73735 3.53714 4.13723 4.13725C3.53712 4.73737 3.19998 5.5513 3.19998 6.39999C3.19998 7.24869 3.53712 8.06262 4.13723 8.66274C4.73735 9.26285 5.55128 9.59999 6.39998 9.59999C7.24867 9.59999 8.0626 9.26285 8.66272 8.66274C9.26283 8.06262 9.59998 7.24869 9.59998 6.39999C9.59998 5.5513 9.26283 4.73737 8.66272 4.13725C8.0626 3.53714 7.24867 3.19999 6.39998 3.19999ZM1.59998 6.39999C1.59998 4.09316 4.09315 1.59999 6.39998 1.59999C8.70681 1.59999 11.2 4.09316 11.2 6.39999C11.2 8.70682 8.70681 11.2 6.39998 11.2C4.09315 11.2 1.59998 8.70682 1.59998 6.39999ZM10.5781 10.5781C10.8349 10.3213 11.248 10.3213 11.5048 10.5781L14.5048 13.5781C14.7616 13.8349 14.7616 14.248 14.5048 14.5048C14.248 14.7616 13.8349 14.7616 13.5781 14.5048L10.5781 11.5048C10.3213 11.248 10.3213 10.8349 10.5781 10.5781Z"
                      fill="white"
                    />
                  </svg>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2">

            </div>

            <button
              onClick={handleGeneratePlanAndSend}
              className="w-full h-[40px] rounded flex items-center justify-center gap-2 text-base font-semibold"
              style={{
                background: "linear-gradient(90deg, #A855F7 100%, #7C3AED 0%)",
                color: "#FFF",
                fontFamily: "Inter",
              }}
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M2.39998 2.39999C2.1878 2.39999 1.98432 2.48428 1.83429 2.63431C1.68426 2.78434 1.59998 2.98782 1.59998 3.19999C1.59998 3.41217 1.68426 3.61565 1.83429 3.76568C1.98432 3.9157 2.1878 3.99999 2.39998 3.99999H13.6C13.8122 3.99999 14.0157 3.9157 14.1657 3.76568C14.3157 3.61565 14.4 3.41217 14.4 3.19999C14.4 2.98782 14.3157 2.78434 14.1657 2.63431C14.0157 2.48428 13.8122 2.39999 13.6 2.39999H2.39998ZM2.39998 7.19999C2.1878 7.19999 1.98432 7.28428 1.83429 7.43431C1.68426 7.58434 1.59998 7.78782 1.59998 7.99999C1.59998 8.21217 1.68426 8.41565 1.83429 8.56568C1.98432 8.7157 2.1878 8.79999 2.39998 8.79999H13.6C13.8122 8.79999 14.0157 8.7157 14.1657 8.56568C14.3157 8.41565 14.4 8.21217 14.4 7.99999C14.4 7.78782 14.3157 7.58434 14.1657 7.43431C14.0157 7.28428 13.8122 7.19999 13.6 7.19999H2.39998ZM1.59998 12C1.59998 11.7878 1.68426 11.5843 1.83429 11.4343C1.98432 11.2843 2.1878 11.2 2.39998 11.2H13.6C13.8122 11.2 14.0157 11.2843 14.1657 11.4343C14.3157 11.5843 14.4 11.7878 14.4 12C14.4 12.2122 14.3157 12.4157 14.1657 12.5657C14.0157 12.7157 13.8122 12.8 13.6 12.8H2.39998C2.1878 12.8 1.98432 12.7157 1.83429 12.5657C1.68426 12.4157 1.59998 12.2122 1.59998 12Z"
                  fill="white"
                />
              </svg>
              Generar Plan
            </button>
          </div>
        </div>
      </div>

      {/* Task Visualization Table */}
      <div
        className="rounded-lg border"
        style={{ backgroundColor: "#16213E", borderColor: "#374151" }}
      >
        <div className="p-6 border-b" style={{ borderColor: "#374151" }}>
          <div className="flex items-center gap-3">
            <svg
              width="21"
              height="21"
              viewBox="0 0 21 21"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                d="M3.20605 4.50586C3.20605 4.24064 3.31141 3.98629 3.49895 3.79875C3.68648 3.61122 3.94084 3.50586 4.20605 3.50586H16.2061C16.4713 3.50586 16.7256 3.61122 16.9132 3.79875C17.1007 3.98629 17.2061 4.24064 17.2061 4.50586V16.5059C17.2061 16.7711 17.1007 17.0255 16.9132 17.213C16.7256 17.4006 16.4713 17.5059 16.2061 17.5059H4.20605C3.94084 17.5059 3.68648 17.4006 3.49895 17.213C3.31141 17.0255 3.20605 16.7711 3.20605 16.5059V4.50586Z"
                fill="#00D4AA"
              />
            </svg>
            <h3
              className="text-base font-semibold"
              style={{ color: "#E5E7EB", fontFamily: "Inter" }}
            >
              Visualización de Tareas
            </h3>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b" style={{ borderColor: "#374151" }}>
              <tr className="text-xs font-medium" style={{ color: "#9CA3AF" }}>
                <th className="text-left p-4" style={{ fontFamily: "Inter" }}>
                  ID
                </th>
                <th className="text-left p-4" style={{ fontFamily: "Inter" }}>
                  Nombre
                </th>
                <th className="text-left p-4" style={{ fontFamily: "Inter" }}>
                  Duración
                </th>
                <th className="text-left p-4" style={{ fontFamily: "Inter" }}>
                  Unidad
                </th>
                <th className="text-left p-4" style={{ fontFamily: "Inter" }}>
                  Prioridad
                </th>
                <th className="text-left p-4" style={{ fontFamily: "Inter" }}>
                  Dependencias
                </th>
                <th className="text-center p-4" style={{ fontFamily: "Inter" }}>
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {currentTasks.map((task) => (
                <tr key={task.id} className="border-b border-black">
                  <td
                    className="p-4 text-sm"
                    style={{ color: "#E5E7EB", fontFamily: "Inter" }}
                  >
                    {task.id}
                  </td>
                  <td
                    className="p-4 text-sm"
                    style={{ color: "#E5E7EB", fontFamily: "Inter" }}
                  >
                    {task.name}
                  </td>
                  <td className="p-4 text-sm" style={{ fontFamily: "Inter" }}>
                    <span style={{ color: "#E5E7EB" }}>{task.duration}</span>
                  </td>
                  <td className="p-4 text-sm" style={{ fontFamily: "Inter", color: "#9CA3AF" }}>
                    {task.unit}
                  </td>
                  <td className="p-4">
                    <span
                      className="px-2 py-1 rounded text-xs font-medium text-white"
                      style={{
                        backgroundColor:
                          task.priority === "Alta"
                            ? "#EA580C"
                            : task.priority === "Media"
                              ? "#2563EB"
                              : task.priority === "Crítica"
                                ? "#DC2626"
                                : "#6B7280",
                        fontFamily: "Inter",
                      }}
                    >
                      {PRIORITY_MAP_FROM_BACKEND[task.priority]}
                    </span>
                  </td>
                  <td
                    className="p-4 text-sm"
                    style={{ color: "#9CA3AF", fontFamily: "Inter" }}
                  >
                    {task.dependencies}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center justify-center gap-2">
                      <button
                        onClick={() => {
                          setEditingId(task.id);
                          setTaskName(task.name);
                          setDuration(task.duration.toString());
                          setUnit(task.unit);
                          setPriority(PRIORITY_MAP_FROM_BACKEND[task.priority]);
                          setDependencies(task.dependencies !== "Ninguna" ? task.dependencies : "");
                        }}
                        className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: "#2563EB",
                          color: "#FFF",
                          fontFamily: "Inter",
                        }}
                        title="Editar tarea"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M11.013 1.427a1.75 1.75 0 0 1 2.474 0l1.086 1.086a1.75 1.75 0 0 1 0 2.474l-8.61 8.61c-.21.21-.47.364-.756.445l-3.251.93a.75.75 0 0 1-.927-.928l.929-3.25c.081-.286.235-.547.445-.758l8.61-8.61Zm.176 4.823L9.75 4.81l-6.286 6.287a.253.253 0 0 0-.064.108l-.558 1.953 1.953-.558a.253.253 0 0 0 .108-.064Zm1.238-3.763a.25.25 0 0 0-.354 0L10.811 3.75l1.439 1.44 1.263-1.263a.25.25 0 0 0 0-.354Z" fill="white" />
                        </svg>
                        Editar
                      </button>
                      <button
                        onClick={() => {
                          if (window.confirm(`¿Estás seguro de eliminar la tarea "${task.name}"?`)) {
                            handleDeleteTask(task.id);
                          }
                        }}
                        className="px-3 py-1 rounded text-xs font-medium flex items-center gap-1"
                        style={{
                          backgroundColor: "#DC2626",
                          color: "#FFF",
                          fontFamily: "Inter",
                        }}
                        title="Eliminar tarea"
                      >
                        <svg width="12" height="12" viewBox="0 0 16 16" fill="none" xmlns="http://www.w3.org/2000/svg">
                          <path d="M6.5 1.75V2.5h3V1.75a.25.25 0 0 0-.25-.25h-2.5a.25.25 0 0 0-.25.25ZM5 1.75V2.5h-2A.75.75 0 0 0 3 4v.5h10V4a.75.75 0 0 0-.75-.75h-2V1.75C10.25.784 9.466 0 8.5 0h-2.5C5.034 0 4.25.784 4.25 1.75ZM4.496 6.675l.66 6.6a.25.25 0 0 0 .249.225h5.19a.25.25 0 0 0 .249-.225l.66-6.6a.75.75 0 0 1 1.492.149l-.66 6.6A1.748 1.748 0 0 1 10.595 15h-5.19a1.748 1.748 0 0 1-1.741-1.575l-.66-6.6a.75.75 0 1 1 1.492-.15ZM6.5 7.5v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-1.5 0Zm3.75-.75a.75.75 0 0 0-.75.75v5a.75.75 0 0 0 1.5 0v-5a.75.75 0 0 0-.75-.75Z" fill="white" />
                        </svg>
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        <div
          className="flex items-center justify-between p-4 border-t"
          style={{ borderColor: "#374151" }}
        >
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
              disabled={currentPage === 1}
              className="text-xs px-3 py-1"
              style={{
                color: currentPage === 1 ? "#6B7280" : "#E5E7EB",
                fontFamily: "Inter",
                cursor: currentPage === 1 ? "not-allowed" : "pointer",
              }}
            >
              Anterior
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className="text-xs px-2 py-1 rounded"
                style={{
                  backgroundColor:
                    currentPage === page ? "#00D4AA" : "transparent",
                  color: currentPage === page ? "#0F0F23" : "#E5E7EB",
                  fontFamily: "Inter",
                  border: currentPage === page ? "none" : "1px solid #374151",
                }}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
              disabled={currentPage === totalPages}
              className="text-xs px-3 py-1"
              style={{
                color: currentPage === totalPages ? "#6B7280" : "#E5E7EB",
                fontFamily: "Inter",
                cursor: currentPage === totalPages ? "not-allowed" : "pointer",
              }}
            >
              Siguiente
            </button>
          </div>
          <div
            className="text-xs"
            style={{ color: "#9CA3AF", fontFamily: "Inter" }}
          >
            Página {currentPage} de {totalPages}
          </div>
        </div>
      </div>
    </Layout>
  );
}


