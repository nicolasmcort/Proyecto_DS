from typing import List, Dict, Any
from task import Task
from structures.custom_queue import CustomQueue
from structures.custom_hash_table import CustomHashTable
from structures.custom_heap import CustomMaxHeap

class CustomService:
    """
    Servicio que utiliza estructuras de datos personalizadas para analizar tareas.
    """
    def __init__(self):
        pass

    def build_task_map(self, tasks: List[Task]) -> CustomHashTable:
        """Construye un mapa de tareas usando la Tabla Hash personalizada."""
        task_map = CustomHashTable(capacity=len(tasks) * 2) # Capacidad holgada
        for task in tasks:
            task_map.put(task.name, task)
        return task_map

    def calculate_levels(self, tasks: List[Task]) -> Dict[int, List[str]]:
        """
        Calcula los niveles de las tareas usando BFS y una Cola personalizada.
        Nivel 0: Tareas sin dependencias.
        Nivel N: Tareas que dependen de tareas del nivel N-1.
        """
        task_map = self.build_task_map(tasks)
        
        # Calcular grado de entrada (in-degree) para cada tarea
        in_degree = CustomHashTable(capacity=len(tasks) * 2)
        graph = CustomHashTable(capacity=len(tasks) * 2) # Lista de adyacencia

        for task in tasks:
            if not in_degree.contains(task.name):
                in_degree.put(task.name, 0)
            
            # Asegurar que todas las tareas estén en el grafo
            if not graph.contains(task.name):
                graph.put(task.name, [])

            for dep_name in task.dependencies:
                # Incrementar in-degree de la tarea actual
                current_degree = in_degree.get(task.name)
                in_degree.put(task.name, current_degree + 1)

                # Construir grafo: dep -> [tareas que dependen de dep]
                if not graph.contains(dep_name):
                    graph.put(dep_name, [])
                
                neighbors = graph.get(dep_name)
                neighbors.append(task.name)
                graph.put(dep_name, neighbors)

        # Cola para BFS
        queue = CustomQueue()
        
        # Añadir tareas con in-degree 0 a la cola (Nivel 0)
        for task in tasks:
            if in_degree.get(task.name) == 0:
                queue.enqueue((task.name, 0)) # (nombre_tarea, nivel)

        levels: Dict[int, List[str]] = {}

        while not queue.is_empty():
            task_name, level = queue.dequeue()

            if level not in levels:
                levels[level] = []
            levels[level].append(task_name)

            # Reducir in-degree de los vecinos
            neighbors = graph.get(task_name)
            if neighbors:
                for neighbor_name in neighbors:
                    current_degree = in_degree.get(neighbor_name)
                    new_degree = current_degree - 1
                    in_degree.put(neighbor_name, new_degree)

                    if new_degree == 0:
                        queue.enqueue((neighbor_name, level + 1))

        return levels

    def priority_ordering(self, tasks: List[Task]) -> List[str]:
        """
        Ordena las tareas usando el algoritmo de Kahn modificado con un Heap de Prioridad.
        """
        in_degree = CustomHashTable(capacity=len(tasks) * 2)
        graph = CustomHashTable(capacity=len(tasks) * 2)

        # Inicialización similar a calculate_levels
        for task in tasks:
            if not in_degree.contains(task.name):
                in_degree.put(task.name, 0)
            if not graph.contains(task.name):
                graph.put(task.name, [])

            for dep_name in task.dependencies:
                current_degree = in_degree.get(task.name)
                in_degree.put(task.name, current_degree + 1)

                if not graph.contains(dep_name):
                    graph.put(dep_name, [])
                neighbors = graph.get(dep_name)
                neighbors.append(task.name)
                graph.put(dep_name, neighbors)

        # Heap de Prioridad en lugar de Cola
        heap = CustomMaxHeap()
        task_map = self.build_task_map(tasks)

        # Añadir tareas iniciales al heap
        for task in tasks:
            if in_degree.get(task.name) == 0:
                heap.insert(task)

        ordered_tasks = []

        while not heap.is_empty():
            current_task = heap.extract_max()
            ordered_tasks.append(current_task.name)

            neighbors = graph.get(current_task.name)
            if neighbors:
                for neighbor_name in neighbors:
                    current_degree = in_degree.get(neighbor_name)
                    new_degree = current_degree - 1
                    in_degree.put(neighbor_name, new_degree)

                    if new_degree == 0:
                        neighbor_task = task_map.get(neighbor_name)
                        if neighbor_task:
                            heap.insert(neighbor_task)
        
        # Si no se ordenaron todas las tareas, hay un ciclo (aunque aquí asumimos que se valida antes)
        return ordered_tasks
