import sys
import os

# Añadir el directorio actual al path para importar módulos
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from task import Task
from custom_service import CustomService
from structures.custom_queue import CustomQueue
from structures.custom_hash_table import CustomHashTable
from structures.custom_heap import CustomMaxHeap

def test_queue():
    print("Testing CustomQueue...")
    q = CustomQueue()
    assert q.is_empty()
    q.enqueue(1)
    q.enqueue(2)
    q.enqueue(3)
    assert q.size() == 3
    assert q.dequeue() == 1
    assert q.dequeue() == 2
    assert q.dequeue() == 3
    assert q.is_empty()
    print("CustomQueue Passed!")

def test_hash_table():
    print("Testing CustomHashTable...")
    ht = CustomHashTable(capacity=10)
    ht.put("key1", "value1")
    ht.put("key2", "value2")
    assert ht.get("key1") == "value1"
    assert ht.get("key2") == "value2"
    assert ht.contains("key1")
    ht.remove("key1")
    assert not ht.contains("key1")
    print("CustomHashTable Passed!")

def test_heap():
    print("Testing CustomMaxHeap...")
    heap = CustomMaxHeap()
    t1 = Task("T1", 10, priority="Baja")
    t2 = Task("T2", 10, priority="Alta")
    t3 = Task("T3", 10, priority="Crítica")
    
    heap.insert(t1)
    heap.insert(t2)
    heap.insert(t3)
    
    assert heap.extract_max().name == "T3"
    assert heap.extract_max().name == "T2"
    assert heap.extract_max().name == "T1"
    print("CustomMaxHeap Passed!")

def test_service():
    print("Testing CustomService...")
    service = CustomService()
    
    # Tareas: A -> B -> C
    #         D -> E
    tA = Task("A", 10, priority="Baja")
    tB = Task("B", 10, priority="Media", dependencies=["A"])
    tC = Task("C", 10, priority="Alta", dependencies=["B"])
    tD = Task("D", 10, priority="Crítica")
    tE = Task("E", 10, priority="Baja", dependencies=["D"])
    
    tasks = [tA, tB, tC, tD, tE]
    
    # Test Levels
    levels = service.calculate_levels(tasks)
    print(f"Levels: {levels}")
    # Level 0: A, D
    # Level 1: B, E
    # Level 2: C
    assert "A" in levels[0] and "D" in levels[0]
    assert "B" in levels[1] and "E" in levels[1]
    assert "C" in levels[2]
    
    # Test Priority Ordering
    # D (Crítica, sin deps) -> A (Baja, sin deps) -> E (Baja, dep D) -> B (Media, dep A) -> C (Alta, dep B)
    # Note: The exact order depends on when dependencies are satisfied.
    # D and A are available. D is Critical, A is Low. D first.
    # After D, E becomes available (Low). A is still available (Low).
    # Heap has [A, E]. A was inserted first? Or E? 
    # Let's just check that dependencies are respected and priorities influence order.
    
    order = service.priority_ordering(tasks)
    print(f"Priority Order: {order}")
    
    assert order.index("A") < order.index("B")
    assert order.index("B") < order.index("C")
    assert order.index("D") < order.index("E")
    # D should be before A because D is Critical and A is Low, and both start with 0 deps
    assert order.index("D") < order.index("A") 
    
    print("CustomService Passed!")


# ... (existing imports)
from structures.custom_graph import CustomGraph

# ... (existing tests)

def test_custom_graph():
    print("Testing CustomGraph...")
    graph = CustomGraph()
    
    # Test Cycle Detection
    # A -> B -> C -> A (Cycle)
    graph.add_node("A")
    graph.add_node("B")
    graph.add_node("C")
    graph.add_edge("A", "B")
    graph.add_edge("B", "C")
    graph.add_edge("C", "A")
    
    # Test Multiple Cycles
    # Cycle 1: A -> B -> A
    # Cycle 2: C -> D -> C
    multi_cycle_graph = CustomGraph()
    multi_cycle_graph.add_node("A")
    multi_cycle_graph.add_node("B")
    multi_cycle_graph.add_node("C")
    multi_cycle_graph.add_node("D")
    
    multi_cycle_graph.add_edge("A", "B")
    multi_cycle_graph.add_edge("B", "A")
    
    multi_cycle_graph.add_edge("C", "D")
    multi_cycle_graph.add_edge("D", "C")
    
    cycles = multi_cycle_graph.detect_cycles()
    print(f"Multiple cycles detected: {cycles}")
    assert len(cycles) == 2
    # Verify contents (order might vary)
    cycle_sets = [set(c) for c in cycles]
    assert {"A", "B"} in cycle_sets
    assert {"C", "D"} in cycle_sets
    
    print("CustomGraph Passed!")
    # X -> Y -> Z
    dag = CustomGraph()
    dag.add_node("X", data={"duration": 10, "priority": "Media"})
    dag.add_node("Y", data={"duration": 20, "priority": "Alta"})
    dag.add_node("Z", data={"duration": 30, "priority": "Baja"})
    dag.add_edge("X", "Y")
    dag.add_edge("Y", "Z")
    
    assert not dag.detect_cycles()
    
    order_result = dag.get_tasks_order()
    print(f"Order result: {order_result}")
    assert order_result is not None
    order = order_result["order"]
    # Order should be X, Y, Z (reverse of stack Z, Y, X)
    assert order.index("X") < order.index("Y")
    assert order.index("Y") < order.index("Z")
    
    print("CustomGraph Passed!")

if __name__ == "__main__":
    test_queue()
    test_hash_table()
    test_heap()
    test_service()
    test_custom_graph()
