from typing import Any, List, Optional
from .custom_hash_table import CustomHashTable

class CustomSet:
    """
    Implementación de un Conjunto (Set) usando una Tabla Hash personalizada.
    Garantiza unicidad de elementos.
    """
    def __init__(self, capacity: int = 100):
        self.table = CustomHashTable(capacity)
        self._size = 0

    def add(self, item: Any):
        """Añade un elemento al conjunto si no existe."""
        # Usamos el item como clave y valor (o True como valor)
        if not self.table.contains(item):
            self.table.put(item, True)
            self._size += 1

    def remove(self, item: Any):
        """Elimina un elemento del conjunto."""
        if self.table.contains(item):
            self.table.remove(item)
            self._size -= 1

    def contains(self, item: Any) -> bool:
        """Verifica si el elemento está en el conjunto."""
        return self.table.contains(item)

    def size(self) -> int:
        """Devuelve el número de elementos."""
        return self._size

    def to_list(self) -> List[Any]:
        """Devuelve todos los elementos como una lista."""
        items = []
        for bucket in self.table.buckets:
            for key, _ in bucket:
                items.append(key)
        return items 
