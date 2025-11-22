from typing import List, Dict, Any, Optional, TypedDict

from .custom_hash_table import CustomHashTable
from .graph_node import GraphNode
from .custom_stack import CustomStack
from .custom_set import CustomSet

class OrderResult(TypedDict):
    order: List[str]
    total_duration_hours: float
    critical_tasks_count: int

class CustomGraph:
    """
    Implementación de un Grafo Dirigido personalizado.
    Incluye lógica de detección de ciclos (DFS) y ordenamiento topológico.
    """
    def __init__(self):
        # Usamos nuestra Tabla Hash para almacenar los nodos: nombre -> GraphNode
        self.nodes = CustomHashTable(capacity=100)
        self._node_keys: List[str] = [] # Lista auxiliar para iterar sobre las claves

    def add_node(self, name: str, data: Any = None):
        """Añade un nodo al grafo si no existe."""
        if not self.nodes.contains(name):
            node = GraphNode(name, data)
            self.nodes.put(name, node)
            self._node_keys.append(name)

    def add_edge(self, from_name: str, to_name: str):
        """Añade una arista dirigida de from_name a to_name."""
        if not self.nodes.contains(from_name):
            raise ValueError(f"Node {from_name} does not exist")
        if not self.nodes.contains(to_name):
            raise ValueError(f"Node {to_name} does not exist")

        from_node = self.nodes.get(from_name)
        to_node = self.nodes.get(to_name)
        
        # Evitar duplicados
        if to_node not in from_node.neighbors:
            from_node.add_neighbor(to_node)

    def get_node(self, name: str) -> Optional[GraphNode]:
        return self.nodes.get(name)

    def get_all_nodes(self) -> List[GraphNode]:
        """Devuelve una lista de todos los nodos."""
        return [self.nodes.get(key) for key in self._node_keys]

    def detect_cycles(self) -> List[List[str]]:
        """
        Detecta TODOS los ciclos encontrados usando DFS.
        Devuelve una lista de ciclos, donde cada ciclo es una lista de nombres de nodos.
        """
        white_set = CustomSet(capacity=len(self._node_keys) * 2)
        for key in self._node_keys:
            white_set.add(key)
            
        gray_set = CustomSet(capacity=len(self._node_keys) * 2)
        black_set = CustomSet(capacity=len(self._node_keys) * 2)
        
        found_cycles = []
        path = [] # Usamos lista estándar en lugar de deque

        def dfs_cycle_check(node_name: str):
            if white_set.contains(node_name):
                white_set.remove(node_name)
            gray_set.add(node_name)
            path.append(node_name)

            current_node = self.nodes.get(node_name)
            if current_node:
                for neighbor in current_node.neighbors:
                    if gray_set.contains(neighbor.name):
                        # Ciclo detectado
                        cycle_start_index = path.index(neighbor.name)
                        current_cycle = path[cycle_start_index:] + [neighbor.name]
                        
                        # Verificar si el ciclo ya fue encontrado
                        if current_cycle not in found_cycles:
                             found_cycles.append(current_cycle)
                        # No retornamos True aquí para seguir buscando otros ciclos en otras ramas
                    
                    elif white_set.contains(neighbor.name):
                        dfs_cycle_check(neighbor.name)
            
            gray_set.remove(node_name)
            black_set.add(node_name)
            path.pop()

        # Iterar sobre una copia de la lista de claves para evitar problemas si white_set cambia
        # Aunque white_set es un CustomSet, usamos to_list() para iterar
        initial_nodes = white_set.to_list()
        for node_name in initial_nodes:
            if white_set.contains(node_name):
                dfs_cycle_check(node_name)
        
        return found_cycles

    def get_tasks_order(self) -> Optional[OrderResult]:
        """
        Calcula un orden válido usando DFS (Topological Sort).
        """
        if self.detect_cycles(): # Si la lista no está vacía, hay ciclos
            return None

        visited = CustomSet(capacity=len(self._node_keys) * 2)
        order_stack = CustomStack() # Usamos CustomStack

        def dfs_sort_recursive(node_name: str):
            visited.add(node_name)
            
            current_node = self.nodes.get(node_name)
            if current_node:
                for neighbor in current_node.neighbors:
                    if not visited.contains(neighbor.name):
                        dfs_sort_recursive(neighbor.name)
            
            order_stack.push(node_name)

        for node_name in self._node_keys:
            if not visited.contains(node_name):
                dfs_sort_recursive(node_name)

        # Convertir pila a lista (popping elements)
        order = []
        while not order_stack.is_empty():
            order.append(order_stack.pop())

        # Calcular métricas
        total_duration_minutes = 0
        critical_tasks_count = 0

        for task_name in order:
            node = self.nodes.get(task_name)
            if node and node.data:
                # Asumimos que node.data es un objeto Task o dict con 'duration' y 'priority'
                # En api.py pasaremos el objeto Task completo o un dict con atributos
                # Ajustaremos esto para que sea compatible con lo que guardemos en 'data'
                task_data = node.data
                # Si es objeto Task
                if hasattr(task_data, 'duration'):
                     # Convertir a minutos si es necesario, pero asumiremos que ya viene en minutos o se maneja antes
                     # En graph_builder original convertía a minutos. Haremos eso al insertar.
                     total_duration_minutes += task_data.duration
                     if task_data.priority == "Crítica":
                         critical_tasks_count += 1
                # Si es dict (compatibilidad con networkx node attrs)
                elif isinstance(task_data, dict):
                    total_duration_minutes += task_data.get('duration', 0)
                    if task_data.get('priority') == "Crítica":
                        critical_tasks_count += 1

        total_duration_hours = total_duration_minutes / 60.0

        return {
            "order": order,
            "total_duration_hours": total_duration_hours,
            "critical_tasks_count": critical_tasks_count
        }
