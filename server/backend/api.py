
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from typing_extensions import TypedDict
import io
import base64
import networkx as nx
import matplotlib.pyplot as plt

# Importar estructuras personalizadas
from structures.custom_graph import CustomGraph
from task import Task
from custom_service import CustomService

app = FastAPI()

# Permitir todos los orígenes durante desarrollo
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Permite todos los orígenes
    allow_credentials=False,  # Debe ser False cuando allow_origins=["*"]
    allow_methods=["*"],
    allow_headers=["*"],
)

class MessagePayload(BaseModel):
    message: str

class TaskInput(BaseModel):
    id: int
    name: str
    duration: float
    unit: str
    priority: str
    dependencies: List[int]

class GraphNode(TypedDict):
    data: Dict[str, Any]

class GraphEdge(TypedDict):
    data: Dict[str, Any]

class GraphData(BaseModel):
    nodes: List[GraphNode]
    edges: List[GraphEdge]

class ProjectData(BaseModel):
    duracion_total: float
    tareas_criticas: int
    ciclos_detectados: Optional[List[List[str]]] = None
    orden_tareas: Optional[List[str]] = None
    image_base64: str
    graph_data: Optional[GraphData] = None

def convert_to_minutes(duration: float, unit: str) -> float:
    """Convierte la duración a minutos según la unidad especificada."""
    unit_lower = unit.lower()
    if unit_lower == "minutes" or unit_lower == "minutos":
        return duration
    elif unit_lower == "hours" or unit_lower == "horas":
        return duration * 60
    elif unit_lower == "days" or unit_lower == "días" or unit_lower == "dias":
        return duration * 60 * 24
    else:
        # Por defecto, asumir minutos
        return duration

def draw_graph_static(graph: nx.DiGraph, title: str, buffer: io.BytesIO):
    """Dibuja el grafo usando matplotlib y lo guarda en el buffer."""
    plt.figure(figsize=(12, 8))
    pos = nx.spring_layout(graph, k=2, iterations=50)
    
    nx.draw(
        graph,
        pos,
        with_labels=True,
        node_color='lightblue',
        node_size=3000,
        font_size=10,
        font_weight='bold',
        arrows=True,
        arrowsize=20,
        edge_color='gray',
        linewidths=2,
        arrowstyle='->'
    )
    
    plt.title(title, fontsize=16, fontweight='bold')
    plt.tight_layout()
    plt.savefig(buffer, format='png', dpi=150, bbox_inches='tight')
    plt.close()

@app.post("/generate-plan", response_model=ProjectData)
async def generate_plan(tasks: List[TaskInput]):
    try:
        task_map: Dict[int, Task] = {}
        all_tasks: List[Task] = []
        
        # Construir grafo personalizado
        custom_graph = CustomGraph()

        for t in tasks:
            # Convertir duración a minutos para el grafo
            duration_minutes = convert_to_minutes(t.duration, t.unit)
            
            # Crear objeto Task (manteniendo unidad original para display si fuera necesario, 
            # pero para cálculo usamos minutos)
            task = Task(
                t.name,
                duration_minutes, # Guardamos en minutos
                "minutes",
                t.priority,
                []
            )
            task_map[t.id] = task
            all_tasks.append(task)
            
            # Añadir nodo al grafo
            custom_graph.add_node(t.name, data=task)
            
        # Añadir aristas (dependencias)
        for t in tasks:
            task = task_map[t.id]
            # Resolver nombres de dependencias
            dep_names = [task_map[dep_id].name for dep_id in t.dependencies if dep_id in task_map]
            task.dependencies = dep_names
            
            for dep_name in dep_names:
                custom_graph.add_edge(dep_name, task.name)

        # Analizar usando CustomGraph
        cycles_list = custom_graph.detect_cycles()
        order_result = custom_graph.get_tasks_order()

        duracion_total = 0.0
        tareas_criticas = 0
        order_tasks: Optional[List[str]] = None

        if order_result:
            order_tasks = order_result["order"]
            duracion_total = order_result["total_duration_hours"]
            tareas_criticas = order_result["critical_tasks_count"]
        else:
            # Si hay ciclos, no hay orden topológico pero aún podemos contar tareas críticas
            # Contar todas las tareas con prioridad "Crítica"
            for task in all_tasks:
                if task.priority == "Crítica":
                    tareas_criticas += 1

        # Generar imagen usando NetworkX (solo para visualización)
        nx_graph = nx.DiGraph()
        for node in custom_graph.get_all_nodes():
            nx_graph.add_node(node.name)
            for neighbor in node.neighbors:
                nx_graph.add_edge(node.name, neighbor.name)
        
        buffer = io.BytesIO()
        if cycles_list: 
            graph_title = "Grafo con Dependencias Cíclicas"
        else: 
            graph_title = "Grafo de Dependencias sin Ciclos"
            
        draw_graph_static(nx_graph, graph_title, buffer=buffer)
        buffer.seek(0)
        image_base64 = base64.b64encode(buffer.read()).decode("utf-8")

        # Preparar datos para Cytoscape
        cytoscape_nodes = []
        cytoscape_edges = []
        
        for node in custom_graph.get_all_nodes():
            # Determinar si es crítica
            is_critical = False
            if order_tasks and node.name in order_tasks:
                 # Lógica simplificada: si está en el orden topológico es parte del plan válido.
                 # Para saber si es crítica real necesitaríamos el cálculo de holgura (slack).
                 # Por ahora marcaremos como crítica si está en el camino más largo (esto requeriría más lógica en CustomGraph).
                 # Asumiremos que el frontend puede resaltar basado en la lista de tareas críticas si la tuviéramos detallada.
                 pass

            # Obtener las dependencias (nodos que apuntan a este nodo)
            dependencies = [dep.name for dep in custom_graph.get_all_nodes() if node in dep.neighbors]

            cytoscape_nodes.append({
                "data": {
                    "id": node.name,
                    "label": node.name,  # Solo el nombre, sin duración
                    "priority": node.data.priority,
                    "duration": node.data.duration,  # Duración como campo separado
                    "dependencies": dependencies  # Lista de dependencias
                }
            })
            
            for neighbor in node.neighbors:
                cytoscape_edges.append({
                    "data": {
                        "source": node.name,
                        "target": neighbor.name
                    }
                })

        return ProjectData(
            duracion_total=duracion_total,
            tareas_criticas=tareas_criticas,
            ciclos_detectados=cycles_list if cycles_list else None,
            orden_tareas=order_tasks,
            image_base64=image_base64,
            graph_data=GraphData(nodes=cytoscape_nodes, edges=cytoscape_edges)
        )

    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))





class CustomProjectData(BaseModel):
    levels: Dict[int, List[str]]
    priority_order: List[str]

@app.post("/generate-custom-plan", response_model=CustomProjectData)
async def generate_custom_plan(tasks: List[TaskInput]):
    try:
        task_map: Dict[int, Task] = {}
        all_tasks: List[Task] = []
        for t in tasks:
            task = Task(
                t.name,
                t.duration,
                t.unit,
                t.priority,
                [] 
            )
            task_map[t.id] = task
            all_tasks.append(task)
            
        for t in tasks:
            task = task_map[t.id]
            task.dependencies = [task_map[dep_id].name for dep_id in t.dependencies if dep_id in task_map]

        service = CustomService()
        levels = service.calculate_levels(all_tasks)
        priority_order = service.priority_ordering(all_tasks)

        return CustomProjectData(
            levels=levels,
            priority_order=priority_order
        )

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
