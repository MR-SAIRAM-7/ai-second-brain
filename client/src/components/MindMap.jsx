import { useState, useEffect, useCallback } from 'react';
import ReactFlow, {
    Background,
    Controls,
    useNodesState,
    useEdgesState,
    MarkerType
} from 'reactflow';
import 'reactflow/dist/style.css';
import dagre from 'dagre';
import api from '../api/axios';
import { Loader2 } from 'lucide-react';

const nodeWidth = 172;
const nodeHeight = 36;

const getLayoutedElements = (nodes, edges, direction = 'LR') => {
    const dagreGraph = new dagre.graphlib.Graph();
    dagreGraph.setDefaultEdgeLabel(() => ({}));

    dagreGraph.setGraph({ rankdir: direction });

    nodes.forEach((node) => {
        dagreGraph.setNode(node.id, { width: nodeWidth, height: nodeHeight });
    });

    edges.forEach((edge) => {
        dagreGraph.setEdge(edge.source, edge.target);
    });

    dagre.layout(dagreGraph);

    nodes.forEach((node) => {
        const nodeWithPosition = dagreGraph.node(node.id);
        node.targetPosition = direction === 'LR' ? 'left' : 'top';
        node.sourcePosition = direction === 'LR' ? 'right' : 'bottom';

        // We are shifting the dagre node position (anchor=center center) to the top left
        // so it matches the React Flow node anchor point (top left).
        node.position = {
            x: nodeWithPosition.x - nodeWidth / 2,
            y: nodeWithPosition.y - nodeHeight / 2,
        };

        return node;
    });

    return { nodes, edges };
};

const MindMap = ({ noteId, text }) => {
    const [nodes, setNodes, onNodesChange] = useNodesState([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const fetchData = useCallback(async () => {
        if (!noteId && !text) return;

        setLoading(true);
        setError(null);
        try {
            const res = await api.post('/visualize', { noteId, text });
            const { nodes: rawNodes, edges: rawEdges } = res.data;

            // Transform for React Flow
            const flowNodes = rawNodes.map((n) => ({
                id: n.id || n.label, // Fallback if ID invalid
                data: { label: n.label },
                position: { x: 0, y: 0 }, // Initial position, handled by dagre
                type: 'default', // or 'input'/'output' if detectable
            }));

            const flowEdges = rawEdges.map((e, i) => ({
                id: `e${i}`,
                source: e.source,
                target: e.target,
                label: e.label,
                animated: true,
                style: { stroke: '#3b82f6' },
                markerEnd: {
                    type: MarkerType.ArrowClosed,
                    color: '#3b82f6',
                },
            }));

            const { nodes: layoutedNodes, edges: layoutedEdges } = getLayoutedElements(
                flowNodes,
                flowEdges
            );

            setNodes(layoutedNodes);
            setEdges(layoutedEdges);

        } catch (err) {
            console.error("Failed to load graph:", err);
            setError("Failed to generate mind map.");
        } finally {
            setLoading(false);
        }
    }, [noteId, text, setNodes, setEdges]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    if (loading) {
        return (
            <div className="flex flex-col items-center justify-center h-full text-gray-400">
                <Loader2 size={32} className="animate-spin mb-2" />
                <p>Generating Knowledge Graph...</p>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex items-center justify-center h-full text-red-400">
                <p>{error}</p>
            </div>
        );
    }

    if (nodes.length === 0) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <p>No concepts found to visualize.</p>
            </div>
        );
    }

    return (
        <div className="w-full h-full bg-slate-950 p-4 rounded-lg border border-gray-800 shadow-inner">
            {/* Key helps reset view if data changes radically */}
            <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-right"
            >
                <Background color="#1e293b" gap={16} />
                <Controls className="bg-white text-black" />
            </ReactFlow>
        </div>
    );
};

export default MindMap;
