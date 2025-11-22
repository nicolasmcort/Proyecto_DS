from typing import Any, Optional, List, Tuple

class CustomHashTable:
    """
    Implementación de una Tabla Hash con resolución de colisiones por encadenamiento.
    """
    def __init__(self, capacity: int = 100):
        self.capacity = capacity
        self.size = 0
        # Inicializamos los buckets como listas vacías
        self.buckets: List[List[Tuple[str, Any]]] = [[] for _ in range(capacity)]

    def _hash(self, key: str) -> int:
        """Función hash simple para cadenas."""
        hash_sum = 0
        for char in key:
            hash_sum += ord(char)
        return hash_sum % self.capacity

    def put(self, key: str, value: Any):
        """Inserta o actualiza un par clave-valor."""
        index = self._hash(key)
        bucket = self.buckets[index]

        for i, (k, v) in enumerate(bucket):
            if k == key:
                bucket[i] = (key, value) # Actualizar
                return

        bucket.append((key, value)) # Insertar nuevo
        self.size += 1

    def get(self, key: str) -> Optional[Any]:
        """Obtiene el valor asociado a una clave."""
        index = self._hash(key)
        bucket = self.buckets[index]

        for k, v in bucket:
            if k == key:
                return v
        return None

    def remove(self, key: str) -> bool:
        """Elimina un par clave-valor. Devuelve True si se eliminó."""
        index = self._hash(key)
        bucket = self.buckets[index]

        for i, (k, v) in enumerate(bucket):
            if k == key:
                del bucket[i]
                self.size -= 1
                return True
        return False

    def contains(self, key: str) -> bool:
        """Verifica si una clave existe en la tabla."""
        return self.get(key) is not None
