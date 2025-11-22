from typing import Any, Optional

class Node:
    """
    Nodo genérico para estructuras de datos enlazadas.
    """
    def __init__(self, data: Any):
        self.data = data
        self.next: Optional['Node'] = None
