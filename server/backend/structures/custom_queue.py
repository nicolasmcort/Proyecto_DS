from typing import Any, Optional
from .node import Node

class CustomQueue:
    """
    Implementación de una Cola (Queue) usando una lista enlazada.
    FIFO: First In, First Out.
    """
    def __init__(self):
        self.front: Optional[Node] = None
        self.rear: Optional[Node] = None
        self._size = 0

    def enqueue(self, item: Any):
        """Añade un elemento al final de la cola."""
        new_node = Node(item)
        if self.rear is None:
            self.front = self.rear = new_node
        else:
            self.rear.next = new_node
            self.rear = new_node
        self._size += 1

    def dequeue(self) -> Any:
        """Elimina y devuelve el elemento del frente de la cola."""
        if self.is_empty():
            raise IndexError("Dequeue from empty queue")
        
        temp = self.front
        self.front = temp.next

        if self.front is None:
            self.rear = None
            
        self._size -= 1
        return temp.data

    def is_empty(self) -> bool:
        """Verifica si la cola está vacía."""
        return self.front is None

    def size(self) -> int:
        """Devuelve el número de elementos en la cola."""
        return self._size
