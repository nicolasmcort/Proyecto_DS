/**
* Código compartido entre cliente y servidor
* Útil para compartir tipos entre cliente y servidor
* y/o pequeñas funciones que se pueden usar tanto en el cliente como en el servidor
 */

/**
* Tipo de respuesta de ejemplo para /api/demo
 */
export interface DemoResponse {
  message: string;
}

export interface Task {
  id: number;
  name: string;
  duration: number;
  unit: "Horas" | "Minutos";
  priority: "Alta" | "Media" | "Baja" | "Crítica";
  dependencies: string;
}

export interface GraphNode {
  data: {
    id: string;
    label: string;
    priority: string;
  };
}

export interface GraphEdge {
  data: {
    source: string;
    target: string;
  };
}

export interface GraphData {
  nodes: GraphNode[];
  edges: GraphEdge[];
}

export interface ProjectData {
  duracion_total: number;
  tareas_criticas: number;
  ciclos_detectados?: string[][];
  orden_tareas?: string[];
  image_base64: string;
  graph_data?: GraphData;
}