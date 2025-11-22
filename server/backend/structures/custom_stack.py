from typing import Any, Optional
from .node import Node

class CustomStack:
    """
    Implementación de una Pila (Stack) usando una lista enlazada.
    LIFO: Last In, First Out.
    """
    def __init__(self):
        self.top: Optional[Node] = None
        self._size = 0

    def push(self, item: Any):
        """Añade un elemento al tope de la pila."""
        new_node = Node(item)
        new_node.next = self.top
        self.top = new_node
        self._size += 1

    def pop(self) -> Any:
        """Elimina y devuelve el elemento del tope de la pila."""
        if self.is_empty():
            raise IndexError("Pop from empty stack")
        
        temp = self.top
        self.top = self.top.next
        self._size -= 1
        return temp.data

    def peek(self) -> Any:
        """Devuelve el elemento del tope sin eliminarlo."""
        if self.is_empty():
            raise IndexError("Peek from empty stack")
        return self.top.data

    def is_empty(self) -> bool:
        """Verifica si la pila está vacía."""
        return self.top is None

    def size(self) -> int:
        """Devuelve el número de elementos en la pila."""
        return self._size
