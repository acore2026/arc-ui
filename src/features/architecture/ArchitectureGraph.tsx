import React, { useEffect, useMemo, useState, useCallback } from 'react';
import {
  Background,
  Controls,
  Handle,
  NodeResizer,
  Position,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  useEdgesState,
  useNodesState,
  addEdge,
  type Edge,
  type OnConnect,
  type Node,
} from '@xyflow/react';
import {
  Bot,
  CircleDot,
  Cpu,
  Database,
  Globe2,
  Shield,
  Waypoints,
  Zap,
} from 'lucide-react';
import {
  ARCHITECTURE_EDGES,
  type ArchitectureEdgeData,
  type ArchitectureNodeData,
} from '../../lib/architectureData';
import architectureInit from '../../lib/architecture-init.json';
import CardEditPanel from './CardEditPanel';
import '@xyflow/react/dist/style.css';
import './ArchitectureGraph.css';

const NodeIcon: React.FC<{ type: ArchitectureNodeData['type'] }> = ({ type }) => {
  switch (type) {
    case 'srf':
      return <Waypoints size={18} />;
    case 'agent':
      return <Bot size={18} />;
    case 'registry':
      return <Database size={18} />;
    case 'gateway':
      return <Globe2 size={18} />;
    case 'nf':
      return <Cpu size={18} />;
    case 'domain':
      return <CircleDot size={14} />;
    default:
      return <Shield size={18} />;
  }
};

const ArchitectureNode: React.FC<{ data: ArchitectureNodeData; selected?: boolean }> = ({ data, selected }) => {
  if (data.type === 'domain') {
    return (
      <div className={`arch-domain-label arch-domain-${String(data.domain).toLowerCase().replaceAll(' ', '-')}`}>
        <NodeResizer
          isVisible={Boolean(selected)}
          minWidth={190}
          minHeight={160}
          lineStyle={{ borderColor: '#38bdf8', borderWidth: 1 }}
          handleStyle={{ width: 10, height: 10, borderRadius: 8, border: '2px solid #fff', background: '#0ea5e9' }}
        />
        <div className="arch-domain-title">
          <NodeIcon type={data.type} />
          <span>{data.label}</span>
        </div>
        {data.subtitle && <div className="arch-domain-subtitle">{data.subtitle}</div>}
      </div>
    );
  }

  const isPillNode = data.type === 'srf' || (data.type === 'gateway' && data.label === 'IGW');
  const showCardHandles = data.type !== 'nf';

  const getHandlePosition = (pos: string) => {
    switch (pos) {
      case 'right': return Position.Right;
      case 'left':
      default: return Position.Left;
    }
  };

  return (
    <div className={`arch-node arch-node-${data.type} ${isPillNode ? 'arch-node-pill' : ''} ${selected ? 'is-selected' : ''}`}>
      {data.handles?.filter((h) => h.position === 'left' || h.position === 'right').map((h, idx) => (
        <Handle
          key={h.id || idx}
          id={h.id}
          type={h.type}
          position={getHandlePosition(h.position)}
          className="arch-card-handle"
        />
      ))}

      {data.showDefaultHandles && (
        <>
          {showCardHandles && <Handle type="target" position={Position.Left} className="arch-card-handle" />}
          {showCardHandles && <Handle type="source" position={Position.Right} className="arch-card-handle arch-card-source" />}
        </>
      )}

      <div className="arch-node-heading">
        <div className="arch-node-icon">
          <NodeIcon type={data.type} />
        </div>
        <div className="arch-node-copy">
          <div className="arch-node-label">{data.label}</div>
          {data.subtitle && <div className="arch-node-subtitle">{data.subtitle}</div>}
        </div>
      </div>

      {data.skills && (
        <div className="arch-skill-list" aria-label={`${data.label} skills`}>
          {data.skills.map((skill) => (
            <span key={skill.id} className="arch-skill-pill">
              {skill.label}
            </span>
          ))}
        </div>
      )}

      {data.tools && (
        <div className="arch-tool-list" aria-label={`${data.label} tools`}>
          {data.tools.map((tool) => (
            <div key={tool.id} className="arch-tool-pill">
              <Handle
                id={`tool-${tool.id}`}
                type="target"
                position={Position.Left}
                className="arch-tool-handle"
              />
              <span>{tool.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const nodeTypes = {
  architectureNode: ArchitectureNode,
};

const AutoFitViewport: React.FC = () => {
  const { fitView } = useReactFlow();
  const nodesReady = useNodesInitialized();

  useEffect(() => {
    if (!nodesReady) {
      return;
    }

    const refit = () => {
      void fitView({
        padding: 0.08,
        duration: 180,
      });
    };

    refit();
    const flowWrapper = document.querySelector('.arch-flow-wrap');
    let animationFrame: number | null = null;
    const observer = flowWrapper
      ? new ResizeObserver(() => {
          if (animationFrame !== null) {
            window.cancelAnimationFrame(animationFrame);
          }
          animationFrame = window.requestAnimationFrame(refit);
        })
      : null;

    if (flowWrapper && observer) {
      observer.observe(flowWrapper);
    }

    window.addEventListener('resize', refit);
    return () => {
      window.removeEventListener('resize', refit);
      observer?.disconnect();
      if (animationFrame !== null) {
        window.cancelAnimationFrame(animationFrame);
      }
    };
  }, [fitView, nodesReady]);

  return null;
};

const ArchitectureGraph: React.FC = () => {
  const defaultEdges = useMemo<Edge<ArchitectureEdgeData>[]>(() => {
    return ARCHITECTURE_EDGES.map((edge) => {
      const kind = edge.data?.kind ?? 'ingress';

      return {
        ...edge,
        className: ['arch-edge', `arch-edge-${kind}`].join(' '),
      };
    });
  }, []);
  const [nodes, setNodes, onNodesChange] = useNodesState(architectureInit as Node<ArchitectureNodeData>[]);
  const [edges, setEdges, onEdgesChange] = useEdgesState(defaultEdges);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [showLines, setShowLines] = useState(false);
  const [exportLabel, setExportLabel] = useState('Copy JSON');

  const selectedNode = useMemo(() => 
    nodes.find((n) => n.id === selectedNodeId),
    [nodes, selectedNodeId]
  );

  const onNodeClick = useCallback((_: React.MouseEvent, node: Node<ArchitectureNodeData>) => {
    if (node.data.type !== 'domain') {
      setSelectedNodeId(node.id);
    } else {
      setSelectedNodeId(null);
    }
  }, []);

  const updateNodeData = useCallback((id: string, updates: Partial<ArchitectureNodeData>) => {
    setNodes((nds) => 
      nds.map((node) => {
        if (node.id === id) {
          return {
            ...node,
            data: { ...node.data, ...updates },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  const onConnect: OnConnect = useCallback(
    (params) => setEdges((eds) => addEdge({ ...params, type: 'default', className: 'arch-edge arch-edge-handoff' }, eds)),
    [setEdges]
  );

  const handleCopyLayout = async () => {
    const payload = nodes.map((node) => {
      const style = node.style as Record<string, unknown> | undefined;
      const width = typeof style?.width === 'number' ? style.width : node.width;
      const height = typeof style?.height === 'number' ? style.height : node.height;

      return {
        id: node.id,
        type: node.type,
        parentId: node.parentId ?? null,
        position: node.position,
        data: {
          label: node.data.label,
          type: node.data.type,
          subtitle: node.data.subtitle,
          description: node.data.description,
          showDefaultHandles: node.data.showDefaultHandles,
          handles: node.data.handles,
          skills: node.data.skills,
          tools: node.data.tools,
          domain: node.data.domain,
        },
        ...(node.data.type === 'domain' ? { style: { width, height } } : {}),
      };
    });
    const json = `${JSON.stringify(payload, null, 2)}\n`;

    try {
      if (navigator.clipboard && window.isSecureContext) {
        await navigator.clipboard.writeText(json);
      } else {
        const textArea = document.createElement('textarea');
        textArea.value = json;
        textArea.setAttribute('readonly', 'true');
        textArea.style.position = 'fixed';
        textArea.style.left = '-9999px';
        document.body.appendChild(textArea);
        textArea.select();
        document.execCommand('copy');
        document.body.removeChild(textArea);
      }
      setExportLabel('Copied JSON');
    } catch {
      setExportLabel('Copy failed');
    } finally {
      window.setTimeout(() => setExportLabel('Copy JSON'), 1200);
    }
  };

  return (
    <div className="arch-demo">
      <header className="arch-topbar">
        <div className="arch-brand">
          <div className="arch-brand-mark">
            <Zap size={15} />
          </div>
          <h1>Agentic Core Topology</h1>
        </div>

        <div className="arch-topbar-actions">
          <button
            type="button"
            className={`arch-toggle-button ${showLines ? 'is-active' : ''}`}
            aria-pressed={showLines}
            onClick={() => setShowLines((value) => !value)}
          >
            {showLines ? 'Hide lines' : 'Show lines'}
          </button>
          <button type="button" className="arch-export-button" onClick={handleCopyLayout}>
            {exportLabel}
          </button>
        </div>
      </header>

      <main className="arch-layout">
        <section className="arch-canvas-shell" aria-label="Agentic topology sandbox">
          <div className="arch-flow-wrap">
            <ReactFlow
              nodes={nodes}
              edges={showLines ? edges : []}
              nodeTypes={nodeTypes}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onNodeClick={onNodeClick}
              onConnect={onConnect}
              onEdgesDelete={(deletedEdges) => {
                setEdges((eds) => eds.filter((e) => !deletedEdges.some((d) => d.id === e.id)));
              }}
              fitView
              fitViewOptions={{ padding: 0.08 }}
              minZoom={0.45}
              maxZoom={1.35}
              nodesDraggable
              nodesConnectable={true}
              elementsSelectable
            >
              <Background color="#dbeafe" gap={28} size={1} />
              <Controls showInteractive={false} />
              <AutoFitViewport />
            </ReactFlow>
          </div>
        </section>

        {selectedNode && (
          <CardEditPanel
            nodeId={selectedNode.id}
            data={selectedNode.data}
            onUpdate={updateNodeData}
            onClose={() => setSelectedNodeId(null)}
          />
        )}
      </main>
    </div>
  );
};

export default ArchitectureGraph;
