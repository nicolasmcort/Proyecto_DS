from typing import Any, List

class CustomMaxHeap:
    """
    Implementación de un Montículo Máximo (Max Heap) para priorizar tareas.
    """
    def __init__(self):
        self.heap: List[Any] = []
        # Mapa de prioridades a valores numéricos para comparación
        self.priority_map = {
            "Crítica": 4,
            "Alta": 3,
            "Media": 2,
            "Baja": 1
        }

    def _get_priority_value(self, task: Any) -> int:
        """Obtiene el valor numérico de la prioridad de una tarea."""
        # Asumimos que el objeto task tiene un atributo 'priority'
        return self.priority_map.get(task.priority, 0)

    def insert(self, item: Any):
        """Inserta un elemento en el heap."""
        self.heap.append(item)
        self._sift_up(len(self.heap) - 1)

    def extract_max(self) -> Any:
        """Extrae y devuelve el elemento con mayor prioridad."""
        if self.is_empty():
            raise IndexError("Extract from empty heap")

        max_item = self.heap[0]
        last_item = self.heap.pop()

        if not self.is_empty():
            self.heap[0] = last_item
            self._sift_down(0)

        return max_item

    def is_empty(self) -> bool:
        """Verifica si el heap está vacío."""
        return len(self.heap) == 0

    def _sift_up(self, index: int):
        """Mueve un elemento hacia arriba para mantener la propiedad de heap."""
        parent_index = (index - 1) // 2
        
        if index > 0:
            current_val = self._get_priority_value(self.heap[index])
            parent_val = self._get_priority_value(self.heap[parent_index])

            if current_val > parent_val:
                # Intercambiar
                self.heap[index], self.heap[parent_index] = self.heap[parent_index], self.heap[index]
                self._sift_up(parent_index)

    def _sift_down(self, index: int):
        """Mueve un elemento hacia abajo para mantener la propiedad de heap."""
        largest = index
        left_child = 2 * index + 1
        right_child = 2 * index + 2

        # Comparar con hijo izquierdo
        if left_child < len(self.heap):
            left_val = self._get_priority_value(self.heap[left_child])
            largest_val = self._get_priority_value(self.heap[largest])
            if left_val > largest_val:
                largest = left_child

        # Comparar con hijo derecho
        if right_child < len(self.heap):
            right_val = self._get_priority_value(self.heap[right_child])
            largest_val = self._get_priority_value(self.heap[largest])
            if right_val > largest_val:
                largest = right_child

        if largest != index:
            # Intercambiar
            self.heap[index], self.heap[largest] = self.heap[largest], self.heap[index]
            self._sift_down(largest)
