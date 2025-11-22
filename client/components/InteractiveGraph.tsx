import * as React from 'react';
import CytoscapeComponent from 'react-cytoscapejs';
import cytoscape from 'cytoscape';
import { X } from 'lucide-react';

interface GraphNode {
    data: {
        id: string;
        label: string;
        priority: string;
        duration?: number;
        dependencies?: string[];
    };
}

interface GraphEdge {
    data: {
        source: string;
        target: string;
    };
}

interface GraphData {
    nodes: GraphNode[];
    edges: GraphEdge[];
}

interface InteractiveGraphProps {
    graphData: GraphData;
    cycles: string[][] | null;
}

interface SelectedNodeData {
    id: string;
    label: string;
    priority: string;
    duration?: number;
    dependencies?: string[];
}

const InteractiveGraph: React.FC<InteractiveGraphProps> = ({ graphData, cycles }) => {
    const [selectedNode, setSelectedNode] = React.useState<SelectedNodeData | null>(null);

    const elements = [
        ...graphData.nodes,
        ...graphData.edges
    ];

    const layout = {
        name: 'cose',
        animate: true,
        animationDuration: 500,
        refresh: 20,
        fit: true,
        padding: 30,
        randomize: false,
        componentSpacing: 100,
        nodeRepulsion: 400000,
        nodeOverlap: 10,
        idealEdgeLength: 100,
        edgeElasticity: 100,
        nestingFactor: 5,
        gravity: 80,
        numIter: 1000,
        initialTemp: 200,
        coolingFactor: 0.95,
        minTemp: 1.0
    };

    const stylesheet: cytoscape.StylesheetStyle[] = [
        {
            selector: 'node',
            style: {
                'background-color': '#3b82f6',
                'label': 'data(id)',
                'color': '#e2e8f0',
                'text-valign': 'center',
                'text-halign': 'center',
                'width': 60,
                'height': 60,
                'font-size': '12px',
                'font-weight': 'bold',
                'text-wrap': 'wrap',
                'text-max-width': '80px',
                'border-width': 2,
                'border-color': '#1e293b'
            }
        },
        {
            selector: 'edge',
            style: {
                'width': 3,
                'line-color': '#64748b',
                'target-arrow-color': '#64748b',
                'target-arrow-shape': 'triangle',
                'curve-style': 'bezier'
            }
        },
        {
            selector: 'node[priority="Alta"]',
            style: {
                'background-color': '#f59e0b'
            }
        },
        {
            selector: 'node[priority="Baja"]',
            style: {
                'background-color': '#10b981'
            }
        },
        {
            selector: 'node[priority="Crítica"]',
            style: {
                'background-color': '#ef4444'
            }
        },
        {
            selector: '.cycle-edge',
            style: {
                'line-color': '#ef4444',
                'target-arrow-color': '#ef4444',
                'width': 4
            }
        },
        {
            selector: 'node:selected',
            style: {
                'border-width': 4,
                'border-color': '#22d3ee'
            }
        }
    ];

    const cyCallback = (cy: cytoscape.Core) => {
        if (cycles) {
            cycles.forEach(cycle => {
                for (let i = 0; i < cycle.length - 1; i++) {
                    const source = cycle[i];
                    const target = cycle[i + 1];
                    cy.$(`edge[source="${source}"][target="${target}"]`).addClass('cycle-edge');
                }
            });
        }

        cy.on('tap', 'node', (event) => {
            const node = event.target;
            const nodeData = node.data();

            setSelectedNode({
                id: nodeData.id,
                label: nodeData.label || nodeData.id,
                priority: nodeData.priority,
                duration: nodeData.duration,
                dependencies: nodeData.dependencies
            });
        });

        cy.on('tap', (event) => {
            if (event.target === cy) {
                setSelectedNode(null);
            }
        });
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'Crítica':
                return 'text-red-400';
            case 'Alta':
                return 'text-amber-400';
            case 'Baja':
                return 'text-emerald-400';
            default:
                return 'text-blue-400';
        }
    };

    return (
        <div className="w-full h-full min-h-[400px] relative">
            <div className="w-full h-full bg-slate-900 rounded-lg overflow-hidden border border-slate-700">
                <CytoscapeComponent
                    elements={elements}
                    style={{ width: '100%', height: '100%', minHeight: '400px' }}
                    layout={layout}
                    stylesheet={stylesheet}
                    cy={cyCallback}
                    wheelSensitivity={0.3}
                />
            </div>

            {selectedNode && (
                <div className="absolute top-4 right-4 bg-slate-800 border border-slate-600 rounded-lg p-4 shadow-xl min-w-[250px] max-w-[300px] animate-slide-in">
                    <div className="flex items-start justify-between mb-3">
                        <h4 className="text-white font-semibold text-sm">Detalles de la Tarea</h4>
                        <button
                            onClick={() => setSelectedNode(null)}
                            className="text-slate-400 hover:text-white transition-colors"
                            aria-label="Cerrar"
                        >
                            <X size={16} />
                        </button>
                    </div>

                    <div className="space-y-3">
                        <div>
                            <span className="text-slate-400 text-xs">Nombre:</span>
                            <p className="text-white font-medium text-sm">{selectedNode.label}</p>
                        </div>

                        <div>
                            <span className="text-slate-400 text-xs">Prioridad:</span>
                            <p className={`font-semibold text-sm ${getPriorityColor(selectedNode.priority)}`}>
                                {selectedNode.priority}
                            </p>
                        </div>

                        {selectedNode.duration !== undefined && (
                            <div>
                                <span className="text-slate-400 text-xs">Duración:</span>
                                <div className="mt-1 space-y-1">
                                    <p className="text-white font-medium text-sm">
                                        {selectedNode.duration} minutos
                                    </p>
                                    <p className="text-slate-300 text-xs">
                                        ({(selectedNode.duration / 60).toFixed(2)} horas)
                                    </p>
                                </div>
                            </div>
                        )}

                        {selectedNode.dependencies && selectedNode.dependencies.length > 0 && (
                            <div>
                                <span className="text-slate-400 text-xs">Dependencias:</span>
                                <ul className="mt-1 space-y-1">
                                    {selectedNode.dependencies.map((dep, idx) => (
                                        <li key={idx} className="text-white text-xs bg-slate-700 px-2 py-1 rounded">
                                            {dep}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                </div>
            )}

            <style>{`
                @keyframes slide-in {
                    from {
                        opacity: 0;
                        transform: translateX(20px);
                    }
                    to {
                        opacity: 1;
                        transform: translateX(0);
                    }
                }
                .animate-slide-in {
                    animation: slide-in 0.2s ease-out;
                }
            `}</style>
        </div>
    );
};

export default InteractiveGraph;
