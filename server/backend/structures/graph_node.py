from typing import Any, List

class GraphNode:
    """
    Nodo para el Grafo Personalizado.
    """
    def __init__(self, name: str, data: Any = None):
        self.name = name
        self.data = data
        self.neighbors: List['GraphNode'] = []

    def add_neighbor(self, neighbor: 'GraphNode'):
        self.neighbors.append(neighbor)

    def __repr__(self):
        return f"GraphNode({self.name})"
