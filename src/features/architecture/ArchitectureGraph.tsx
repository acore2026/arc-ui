import React, { useState } from 'react';
import {
  Controls,
  ReactFlow,
  Handle,
  Position,
  useNodesState,
  useEdgesState,
  type Node,
} from '@xyflow/react';
import { 
  Cpu, Database, Router, Shield, 
  Smartphone, Bot, Info, X, Globe, Layout
} from 'lucide-react';
import { ARCHITECTURE_NODES, ARCHITECTURE_EDGES, type ArchitectureNodeData } from '../../lib/architectureData';
import '@xyflow/react/dist/style.css';
import './ArchitectureGraph.css';

// --- CUSTOM NODE COMPONENT ---

const NodeIcon: React.FC<{ type: ArchitectureNodeData['type'] }> = ({ type }) => {
  switch (type) {
    case 'ue': 
      return <Smartphone size={18} />;
    case 'app': return <Layout size={18} />;
    case 'ran': return <Router size={18} />;
    case 'core': return <Cpu size={18} />;
    case 'registry': return <Database size={18} />;
    case 'agent': return <Bot size={18} />;
    case 'gateway': return <Globe size={18} />;
    case 'policy': return <Shield size={18} />;
    default: return <Shield size={18} />;
  }
};

const ArchitectureNode: React.FC<{ data: ArchitectureNodeData; selected?: boolean }> = ({ data, selected }) => {
  if (data.type === 'domain') {
    const domainIcon = data.domain === 'Device' ? <Smartphone size={14} /> : data.domain === 'App' ? <Layout size={14} /> : <Globe size={14} />;

    return (
      <div className="arch-domain-label-container">
        {!data.hideTitle && (
          <div className="arch-domain-header">
            {domainIcon}
            <span>{data.label}</span>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className={`arch-node arch-node-${data.type} ${selected ? 'is-selected' : ''}`}>
      <Handle type="target" position={Position.Left} style={{ visibility: 'hidden' }} />
      <Handle type="target" position={Position.Top} style={{ visibility: 'hidden' }} />
      <div className="arch-node-icon">
        <NodeIcon type={data.type} />
      </div>
      <div className="arch-node-label">{data.label}</div>
      <Handle type="source" position={Position.Right} style={{ visibility: 'hidden' }} />
      <Handle type="source" position={Position.Bottom} style={{ visibility: 'hidden' }} />
    </div>
  );
};

const nodeTypes = {
  architectureNode: ArchitectureNode,
};

// --- MAIN COMPONENT ---

const ArchitectureGraph: React.FC = () => {
  const [nodes, , onNodesChange] = useNodesState(ARCHITECTURE_NODES);
  const [edges, , onEdgesChange] = useEdgesState(ARCHITECTURE_EDGES);
  const [selectedNode, setSelectedNode] = useState<ArchitectureNodeData | null>(null);
  const [exportStatus, setExportStatus] = useState('Export positions');

  const onNodeClick = (_: React.MouseEvent, node: Node) => {
    setSelectedNode(node.data as unknown as ArchitectureNodeData);
  };

  const onPaneClick = () => {
    setSelectedNode(null);
  };

  const handleExportPositions = () => {
    const positions = nodes
      .filter((node) => (node.data as unknown as ArchitectureNodeData).type !== 'domain')
      .map((node) => ({
        id: node.id,
        label: (node.data as unknown as ArchitectureNodeData).label,
        parentId: node.parentId ?? null,
        position: node.position,
      }));

    const blob = new Blob([`${JSON.stringify(positions, null, 2)}\n`], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'architecture-card-positions.json';
    link.click();
    URL.revokeObjectURL(url);

    setExportStatus('Exported');
    window.setTimeout(() => setExportStatus('Export positions'), 1400);
  };

  return (
    <div className="arch-graph-container">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onNodeClick={onNodeClick}
        onPaneClick={onPaneClick}
        fitView
        fitViewOptions={{ padding: 0.05 }}
        minZoom={0.5}
        maxZoom={2}
        defaultEdgeOptions={{ 
          type: 'simplebezier',
          style: { strokeWidth: 1.6, stroke: '#d1d5db' }
        }}
      >
        <Controls showInteractive={false} />
      </ReactFlow>

      <button type="button" className="arch-export-button" onClick={handleExportPositions}>
        {exportStatus}
      </button>

      {/* INSPECTOR OVERLAY */}
      {selectedNode && (
        <div className="arch-inspector">
          <div className="arch-inspector-header">
            <div className="arch-inspector-title">
              <NodeIcon type={selectedNode.type} />
              <span>{selectedNode.label}</span>
            </div>
            <button onClick={() => setSelectedNode(null)} className="arch-inspector-close">
              <X size={14} />
            </button>
          </div>
          <div className="arch-inspector-body">
            <p className="arch-inspector-desc">{selectedNode.description}</p>
            {selectedNode.properties && (
              <div className="arch-properties">
                <div className="arch-properties-header">
                  <Info size={12} />
                  <span>Attributes</span>
                </div>
                <div className="arch-properties-grid">
                  {Object.entries(selectedNode.properties).map(([key, val]) => (
                    <React.Fragment key={key}>
                      <div className="arch-prop-key">{key}</div>
                      <div className="arch-prop-val">{val}</div>
                    </React.Fragment>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

export default ArchitectureGraph;
