import { useState, useMemo } from "react";
import Layout from "@/components/Layout";
import { Plus, Info, MapPin } from "lucide-react";
import { useLocation } from 'react-router-dom';
import { ProjectData } from '../../shared/api';
import InteractiveGraph from "@/components/InteractiveGraph";

interface Route {
  id: number;
  type: "critical" | "alternative";
  name: string;
  path: string;
  duration: string;
  color: string;
}

export default function CriticalPathAnalysis() {
  const location = useLocation();

  const projectData = useMemo(() => {
    if (location.state) return location.state as ProjectData;
    const stored = localStorage.getItem('lastProjectData');
    return stored ? JSON.parse(stored) : null;
  }, [location.state]);

  const totalProjectDurationHours = projectData ? projectData.duracion_total : 0;
  const criticalTasksCount = projectData ? projectData.tareas_criticas : 0;
  const cyclicDependencies = projectData && projectData.ciclos_detectados ? projectData.ciclos_detectados : [];
  const topologicalOrder = projectData ? projectData.orden_tareas : null;

  const [selectedRoute, setSelectedRoute] = useState<number | null>(1);
  const [currentPage, setCurrentPage] = useState(1);

  return (
    <Layout title="Análisis de Tareas y Dependencias">
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-4 md:gap-6 mb-6">
        {/* Dependency Graph - Modificado para ser flexible */}
        <div className="taskflow-card rounded-lg border p-6 flex flex-col">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-5 h-5 text-primary">
              <svg viewBox="0 0 20 20" fill="currentColor">
                <path d="M2 3C2 2.44772 2.44772 2 3 2H17C17.5523 2 18 2.44772 18 3C18 3.55228 17.5523 4 17 4H3C2.44772 4 2 3.55228 2 3ZM2 7C2 6.44772 2.44772 6 3 6H17C17.5523 6 18 6.44772 18 7C18 7.55228 17.5523 8 17 8H3C2.44772 8 2 7.55228 2 7ZM3 10C2.44772 10 2 10.4477 2 11C2 11.5523 2.44772 12 3 12H17C17.5523 12 18 11.5523 18 11C18 10.4477 17.5523 10 17 10H3ZM3 14C2.44772 14 2 14.4477 2 15C2 15.5523 2.44772 16 3 16H17C17.5523 16 18 15.5523 18 15C18 14.4477 17.5523 14 17 14H3Z" />
              </svg>
            </div >
            <h3 className="text-foreground text-base font-semibold">
              Grafo de Dependencias
            </h3>
          </div >

          <div className="taskflow-input border rounded flex-grow flex flex-col items-center justify-center bg-input-background overflow-hidden p-2">
            {projectData && projectData.graph_data ? (
              <InteractiveGraph
                graphData={projectData.graph_data}
                cycles={projectData.ciclos_detectados || null}
              />
            ) : projectData && projectData.image_base64 ? (
              <img
                src={`data:image/png;base64,${projectData.image_base64}`}
                alt="Grafo de Dependencias"
                style={{ width: '100%', height: 'auto', objectFit: 'contain' }}
              />
            ) : (
              <>
                <div className="w-16 h-16 rounded-lg bg-border flex items-center justify-center mb-4">
                  <Plus className="text-muted-foreground" size={32} />
                </div>
                <h4 className="text-muted-foreground text-sm font-medium text-center mb-2">
                  Grafo Generado por Python
                </h4>
                <p className="text-muted-foreground text-xs text-center max-w-64 leading-relaxed">
                  El grafo de dependencias se generará automáticamente y se mostrará
                  aquí una vez procesado
                </p>
              </>
            )}
          </div>
        </div >

        {/* Analysis Summary */}
        < div className="taskflow-card rounded-lg border p-6" >
          <div className="flex items-center gap-3 mb-6">
            <Info className="text-primary" size={20} />
            <h3 className="text-foreground text-base font-semibold">
              Resumen del Análisis
            </h3>
          </div>
          <div className="space-y-4">
            <div className="taskflow-input border rounded p-4 flex items-center justify-between bg-input-background">
              <span className="text-muted-foreground text-xs font-medium">
                Duración Total del Proyecto
              </span>
              <span className={`text-lg font-bold ${totalProjectDurationHours > 0 ? 'text-primary' : 'text-red-400'}`}>
                {totalProjectDurationHours > 0
                  ? `${totalProjectDurationHours.toFixed(2)} horas`
                  : "Ciclos detectados"}
              </span>
            </div>
            <div className="taskflow-input border rounded p-4 flex items-center justify-between bg-input-background">
              <span className="text-muted-foreground text-xs font-medium">
                Número de Tareas Críticas
              </span>
              <span className="text-warning text-lg font-bold">
                {criticalTasksCount !== null && criticalTasksCount !== undefined ? criticalTasksCount : "N/A"}
              </span>
            </div>
          </div>
        </div >
      </div >

      {/* Rutas de Ejecución Detectadas */}
      < div className="mb-6" >
        <div className="flex items-center gap-3 mb-4">
          <MapPin className="text-primary" size={20} />
          <h3 className="text-foreground text-base font-semibold">
            Ruta de Ejecución Detectada
          </h3>
        </div>
        <p className="text-muted-foreground text-xs mb-4">
          Ruta Crítica Detectada
        </p>
        <div className="taskflow-card rounded-lg border p-6">
          {topologicalOrder && Array.isArray(topologicalOrder) ? (
            <ul className="space-y-3">
              {topologicalOrder.map((taskItem, index) => {
                const taskName = taskItem.split(":")[0].trim();
                return (
                  <li
                    key={index}
                    tabIndex={0}
                    className={`
                    group p-4 rounded border cursor-pointer select-none transition-all
                    border-info bg-info/10 text-white font-medium text-sm outline-none
                    hover:bg-info/20 hover:border-info
                    focus:bg-info/20 focus:border-info
                    active:bg-info/30
                  `}
                    style={{
                      position: "relative",
                    }}
                    aria-label="Tarea en la ruta crítica"
                  >
                    <span className="mr-2">{index + 1}.</span>{taskName}
                  </li>
                );
              })}
            </ul>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No se pudo determinar la ruta
              </p>
            </div>
          )}
        </div>
      </div >

      {/* Sección de Dependencias Cíclicas */}
      < div className="mb-6" >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-4 h-4 rounded-full" style={{ backgroundColor: "rgba(0, 214, 203, 1)" }}></div>
          <h3 className="text-foreground text-base font-semibold">
            Dependencias Cíclicas
          </h3>
        </div>
        <div className="taskflow-card rounded-lg border p-6">
          {cyclicDependencies && cyclicDependencies[0] ? (
            <div className="space-y-6">
              {cyclicDependencies.map((cycle, cycleIndex) => (
                <div
                  key={cycleIndex}
                  className="border-2 border-red-500/30 rounded-lg p-4 bg-red-500/5"
                >
                  {/* Encabezado del ciclo */}
                  <div className="flex items-center gap-2 mb-3 pb-2 border-b border-red-500/20">
                    <div className="w-6 h-6 rounded-full bg-red-500 flex items-center justify-center">
                      <span className="text-white text-xs font-bold">{cycleIndex + 1}</span>
                    </div>
                    <h4 className="text-red-400 font-semibold text-sm">
                      Ciclo #{cycleIndex + 1}
                    </h4>
                    <span className="text-red-400/60 text-xs ml-auto">
                      {cycle.length} tareas
                    </span>
                  </div>

                  {/* Lista de tareas del ciclo */}
                  <ul className="space-y-2">
                    {cycle.map((task, taskIndex) => (
                      <li
                        key={`${cycleIndex}-${taskIndex}`}
                        tabIndex={0}
                        className="group p-4 rounded border cursor-pointer select-none transition-all text-info font-medium text-sm outline-none"
                        style={{
                          position: "relative",
                          borderColor: "red",
                          backgroundColor: "rgba(255, 0, 0, 0.1)",
                          color: "rgba(255, 223, 223, 1)",
                        }}
                        aria-label="Dependencia cíclica"
                      >
                        <span className="mr-2">{taskIndex + 1}.</span>{task}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No se detectó ninguna dependencia cíclica
              </p>
            </div>
          )}
        </div>
      </div >

      <style>{`
      @keyframes fade-in {
        from { opacity: 0; transform: translateY(8px);}
        to { opacity: 1; transform: translateY(0);}
      }
      .animate-fade-in {
        animation: fade-in 0.3s;
      }
      `}</style>
    </Layout >
  );
}