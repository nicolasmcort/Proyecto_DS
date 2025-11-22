class Task:
    """
    Representa una tarea con sus propiedades: nombre, duración, unidad de duración (minutos/horas), prioridad y dependencias.
    """
    def __init__(self, name: str, duration: float, duration_unit: str = "minutes", priority: str = "Media", dependencies: list = None):
        self.name = name
        self.duration = duration
        self.duration_unit = duration_unit.lower() # Almacenar en minúsculas para consistencia
        self.priority = priority
        self.dependencies = dependencies if dependencies is not None else []

    def __repr__(self):
        return f"Task(name='{self.name}', duration={self.duration} {self.duration_unit}, priority='{self.priority}', dependencies={self.dependencies})"
    
    def __str__(self):
        return f"Tarea: {self.name}, Duración: {self.duration} {self.duration_unit}, Prioridad: {self.priority}, Depende de: {', '.join(self.dependencies) if self.dependencies else 'Ninguna'}"
