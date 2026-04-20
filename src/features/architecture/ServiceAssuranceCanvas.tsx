import React, { useCallback, useEffect, useMemo, useRef } from 'react';
import {
  Background,
  BaseEdge,
  EdgeLabelRenderer,
  Handle,
  MarkerType,
  Position,
  ReactFlow,
  type ReactFlowInstance,
  getSmoothStepPath,
  type Edge,
  type EdgeProps,
  type Node,
  type NodeProps,
} from '@xyflow/react';
import { Activity, Radar, RotateCcw, Server, Shield, Sparkles, Users } from 'lucide-react';
import '@xyflow/react/dist/style.css';
import './ArchitectureGraph.css';
import './ServiceAssuranceCanvas.css';

type TourStep = {
  id: string;
  title: string;
  summary: string;
  details: string[];
  activeNodeIds: string[];
  activeEdgeIds: string[];
};

type MechanismNodeKind =
  | 'actors'
  | 'group'
  | 'planning'
  | 'guardrail'
  | 'evaluation'
  | 'fallback'
  | 'execution'
  | 'spacer';

type MechanismEdgeTone = 'feedback' | 'outcome' | 'correction' | 'fallback';

type MechanismNodeData = {
  kind: MechanismNodeKind;
  title: string;
  subtitle?: string;
  lines?: string[];
  badge?: string;
  isActive: boolean;
};

type MechanismEdgeData = {
  active: boolean;
  label?: string;
  tone?: MechanismEdgeTone;
  labelDx?: number;
  labelDy?: number;
  pathOffset?: number;
  pathRadius?: number;
};

const FLOW_BOUNDS = {
  minX: 96,
  minY: 102,
  maxX: 1018,
  maxY: 596,
};

const tourSteps: TourStep[] = [
  {
    id: 'policy-path',
    title: 'Policy decision path',
    summary: 'Network agents interpret intent, shape candidate policies, and pass them through Guardrail before any network function is touched.',
    details: [
      'LLM-based network agents can steer QoS control, traffic steering, and resource orchestration decisions.',
      'Guardrail stays inline before execution so unsafe or unstable actions are constrained before they affect live services.',
    ],
    activeNodeIds: ['actors', 'planning', 'guardrail', 'execution'],
    activeEdgeIds: ['planning-to-guardrail', 'guardrail-to-execution'],
  },
  {
    id: 'evaluation-loop',
    title: 'Evaluation against target state',
    summary: 'Measured outcome and measurable feedback are combined against the target state to detect drift from desired service behavior.',
    details: [
      'Internal results include QoS KPIs and operational network indicators from the core network.',
      'External feedback captures QoE and user satisfaction so the loop evaluates technical success and service experience together.',
    ],
    activeNodeIds: ['actors', 'evaluation', 'execution'],
    activeEdgeIds: ['actors-to-evaluation', 'execution-to-evaluation'],
  },
  {
    id: 'closed-loop-correction',
    title: 'Closed-loop correction',
    summary: 'When evaluation detects deviation, policy reflection feeds back into planning so the next decision drives the system toward convergence.',
    details: [
      'Evaluation stays anchored to the desired target state instead of reacting only to local changes.',
      'The agent reflects on policy effectiveness and adapts its next action before suboptimal behavior accumulates.',
    ],
    activeNodeIds: ['planning', 'evaluation'],
    activeEdgeIds: ['evaluation-to-planning'],
  },
  {
    id: 'fallback-protection',
    title: 'Fallback protection',
    summary: 'If autonomous correction still diverges, Fallback Rule constrains risk by restoring a last known-good policy or applying a default safe scheme.',
    details: [
      'Fallback Trigger hands control from adaptive optimization to a bounded recovery path.',
      'The safe-policy branch preserves service stability and performance inside an acceptable boundary even when agent behavior becomes suboptimal.',
    ],
    activeNodeIds: ['evaluation', 'fallback', 'execution'],
    activeEdgeIds: ['evaluation-to-fallback', 'fallback-to-execution'],
  },
];

const hiddenHandle = 'service-flow-handle';

const baseNodes: Array<Node<MechanismNodeData>> = [
  {
    id: 'canvas-bounds-top-left',
    type: 'mechanism',
    position: { x: FLOW_BOUNDS.minX, y: FLOW_BOUNDS.minY },
    style: { width: 1, height: 1, zIndex: -2 },
    selectable: false,
    draggable: false,
    data: {
      kind: 'spacer',
      title: '',
      isActive: false,
    },
  },
  {
    id: 'actors',
    type: 'mechanism',
    position: { x: 134, y: 214 },
    style: { width: 118, height: 186, zIndex: 3 },
    selectable: false,
    draggable: false,
    data: {
      kind: 'actors',
      title: 'Signal sources',
      lines: ['Human', 'Agent'],
      isActive: false,
    },
  },
  {
    id: 'network-shell',
    type: 'mechanism',
    position: { x: 278, y: 118 },
    style: { width: 520, height: 294, zIndex: 0 },
    selectable: false,
    draggable: false,
    data: {
      kind: 'group',
      title: 'Network Agents',
      subtitle: '',
      isActive: false,
    },
  },
  {
    id: 'planning',
    type: 'mechanism',
    position: { x: 340, y: 158 },
    style: { width: 186, height: 92, zIndex: 3 },
    sourcePosition: Position.Right,
    targetPosition: Position.Bottom,
    selectable: false,
    draggable: false,
    data: {
      kind: 'planning',
      title: 'Intent Parsing',
      subtitle: 'Planning',
      isActive: false,
    },
  },
  {
    id: 'guardrail',
    type: 'mechanism',
    position: { x: 568, y: 160 },
    style: { width: 162, height: 88, zIndex: 3 },
    sourcePosition: Position.Right,
    targetPosition: Position.Left,
    selectable: false,
    draggable: false,
    data: {
      kind: 'guardrail',
      title: 'Guardrail',
      isActive: false,
    },
  },
  {
    id: 'evaluation',
    type: 'mechanism',
    position: { x: 388, y: 298 },
    style: { width: 202, height: 88, zIndex: 3 },
    sourcePosition: Position.Top,
    targetPosition: Position.Left,
    selectable: false,
    draggable: false,
    data: {
      kind: 'evaluation',
      title: 'Evaluation',
      subtitle: 'Target state',
      isActive: false,
    },
  },
  {
    id: 'fallback',
    type: 'mechanism',
    position: { x: 406, y: 452 },
    style: { width: 188, height: 74, zIndex: 3 },
    sourcePosition: Position.Right,
    targetPosition: Position.Top,
    selectable: false,
    draggable: false,
    data: {
      kind: 'fallback',
      title: 'Fallback Rule',
      isActive: false,
    },
  },
  {
    id: 'execution',
    type: 'mechanism',
    position: { x: 838, y: 230 },
    style: { width: 170, height: 138, zIndex: 3 },
    sourcePosition: Position.Left,
    targetPosition: Position.Left,
    selectable: false,
    draggable: false,
    data: {
      kind: 'execution',
      title: 'Execution Point',
      subtitle: 'Network function',
      isActive: false,
    },
  },
  {
    id: 'canvas-bounds-bottom-right',
    type: 'mechanism',
    position: { x: FLOW_BOUNDS.maxX, y: FLOW_BOUNDS.maxY },
    style: { width: 1, height: 1, zIndex: -2 },
    selectable: false,
    draggable: false,
    data: {
      kind: 'spacer',
      title: '',
      isActive: false,
    },
  },
];

const baseEdges: Array<Edge<MechanismEdgeData>> = [
  {
    id: 'planning-to-guardrail',
    type: 'mechanism',
    source: 'planning',
    sourceHandle: 'policy-out',
    target: 'guardrail',
    targetHandle: 'policy-in',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { active: false, pathOffset: 28, pathRadius: 22 },
  },
  {
    id: 'guardrail-to-execution',
    type: 'mechanism',
    source: 'guardrail',
    sourceHandle: 'policy-out',
    target: 'execution',
    targetHandle: 'policy-in',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: { active: false, pathOffset: 36, pathRadius: 22 },
  },
  {
    id: 'actors-to-evaluation',
    type: 'mechanism',
    source: 'actors',
    sourceHandle: 'feedback-out',
    target: 'evaluation',
    targetHandle: 'feedback-in',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      active: false,
      label: 'Measurable Feedback',
      tone: 'feedback',
      labelDx: -8,
      labelDy: -34,
      pathOffset: 38,
      pathRadius: 22,
    },
  },
  {
    id: 'execution-to-evaluation',
    type: 'mechanism',
    source: 'execution',
    sourceHandle: 'outcome-out',
    target: 'evaluation',
    targetHandle: 'outcome-in',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      active: false,
      label: 'Measured Outcome',
      tone: 'outcome',
      labelDx: 12,
      labelDy: -36,
      pathOffset: 44,
      pathRadius: 22,
    },
  },
  {
    id: 'evaluation-to-planning',
    type: 'mechanism',
    source: 'evaluation',
    sourceHandle: 'reflection-out',
    target: 'planning',
    targetHandle: 'reflection-in',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      active: false,
      label: 'Closed-loop Correction',
      tone: 'correction',
      labelDx: 96,
      labelDy: -16,
      pathOffset: 24,
      pathRadius: 22,
    },
  },
  {
    id: 'evaluation-to-fallback',
    type: 'mechanism',
    source: 'evaluation',
    sourceHandle: 'trigger-out',
    target: 'fallback',
    targetHandle: 'trigger-in',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      active: false,
      label: 'Fallback Trigger',
      tone: 'fallback',
      labelDx: 96,
      labelDy: 12,
      pathOffset: 26,
      pathRadius: 22,
    },
  },
  {
    id: 'fallback-to-execution',
    type: 'mechanism',
    source: 'fallback',
    sourceHandle: 'safe-out',
    target: 'execution',
    targetHandle: 'safe-in',
    markerEnd: { type: MarkerType.ArrowClosed },
    data: {
      active: false,
      label: 'Default Safe Scheme',
      tone: 'fallback',
      labelDx: 22,
      labelDy: 42,
      pathOffset: 46,
      pathRadius: 22,
    },
  },
];

const HiddenHandle: React.FC<{
  id: string;
  type: 'source' | 'target';
  position: Position;
  style?: React.CSSProperties;
}> = ({ id, type, position, style }) => (
  <Handle id={id} type={type} position={position} className={hiddenHandle} style={style} />
);

const iconForNodeKind = (kind: MechanismNodeKind) => {
  switch (kind) {
    case 'actors':
      return Users;
    case 'planning':
      return Sparkles;
    case 'guardrail':
      return Shield;
    case 'evaluation':
      return Activity;
    case 'fallback':
      return RotateCcw;
    case 'execution':
      return Server;
    case 'group':
      return Radar;
    default:
      return Sparkles;
  }
};

const ServiceMechanismNode: React.FC<NodeProps<Node<MechanismNodeData>>> = ({ data }) => {
  if (data.kind === 'spacer') {
    return <div className="service-flow-spacer" aria-hidden="true" />;
  }

  if (data.kind === 'group') {
    const GroupIcon = iconForNodeKind(data.kind);

    return (
      <div className={`service-flow-node service-flow-node-group ${data.isActive ? 'is-active' : ''}`}>
        <div className="service-flow-group-title">
          <span className="service-flow-icon service-flow-icon-group">
            <GroupIcon size={14} strokeWidth={2} />
          </span>
          {data.title}
        </div>
        <div className="service-flow-group-subtitle">{data.subtitle}</div>
      </div>
    );
  }

  if (data.kind === 'actors') {
    const ActorIcon = iconForNodeKind(data.kind);

    return (
      <div className={`service-flow-node service-flow-node-actors ${data.isActive ? 'is-active' : ''}`}>
        <div className="service-flow-node-copy">
          <span className="service-flow-icon service-flow-icon-actors">
            <ActorIcon size={16} strokeWidth={2} />
          </span>
          <div className="service-flow-actors-title">{data.title}</div>
          <div className="service-flow-actor-stack">
            {data.lines?.map((line) => (
              <div key={line} className="service-flow-actor-label">
                {line}
              </div>
            ))}
          </div>
        </div>
        <HiddenHandle id="feedback-out" type="source" position={Position.Right} />
      </div>
    );
  }

  const NodeIcon = iconForNodeKind(data.kind);

  return (
    <div className={`service-flow-node service-flow-node-${data.kind} ${data.isActive ? 'is-active' : ''}`}>
      {data.badge ? <span className="service-flow-node-badge">{data.badge}</span> : null}
      <div className="service-flow-node-copy">
        <span className={`service-flow-icon service-flow-icon-${data.kind}`}>
          <NodeIcon size={16} strokeWidth={2} />
        </span>
        <strong>{data.title}</strong>
        {data.subtitle ? <span>{data.subtitle}</span> : null}
      </div>

      {data.kind === 'planning' ? (
        <>
          <HiddenHandle id="policy-out" type="source" position={Position.Right} />
          <HiddenHandle id="reflection-in" type="target" position={Position.Bottom} />
        </>
      ) : null}

      {data.kind === 'guardrail' ? (
        <>
          <HiddenHandle id="policy-in" type="target" position={Position.Left} />
          <HiddenHandle id="policy-out" type="source" position={Position.Right} />
        </>
      ) : null}

      {data.kind === 'evaluation' ? (
        <>
          <HiddenHandle id="feedback-in" type="target" position={Position.Left} />
          <HiddenHandle id="outcome-in" type="target" position={Position.Right} />
          <HiddenHandle id="reflection-out" type="source" position={Position.Top} />
          <HiddenHandle id="trigger-out" type="source" position={Position.Bottom} />
        </>
      ) : null}

      {data.kind === 'fallback' ? (
        <>
          <HiddenHandle id="trigger-in" type="target" position={Position.Top} />
          <HiddenHandle id="safe-out" type="source" position={Position.Right} />
        </>
      ) : null}

      {data.kind === 'execution' ? (
        <>
          <HiddenHandle id="policy-in" type="target" position={Position.Left} style={{ top: '28%' }} />
          <HiddenHandle id="outcome-out" type="source" position={Position.Left} style={{ top: '62%' }} />
          <HiddenHandle id="safe-in" type="target" position={Position.Left} style={{ top: '88%' }} />
        </>
      ) : null}
    </div>
  );
};

const toneClassForEdge = (tone?: MechanismEdgeTone) => {
  switch (tone) {
    case 'feedback':
      return 'tone-feedback';
    case 'outcome':
      return 'tone-outcome';
    case 'correction':
      return 'tone-correction';
    case 'fallback':
      return 'tone-fallback';
    default:
      return '';
  }
};

const ServiceMechanismEdge: React.FC<EdgeProps<Edge<MechanismEdgeData>>> = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  markerEnd,
  data,
}) => {
  const [path, labelX, labelY] = getSmoothStepPath({
    sourceX,
    sourceY,
    targetX,
    targetY,
    sourcePosition,
    targetPosition,
    borderRadius: data?.pathRadius ?? 20,
    offset: data?.pathOffset ?? 28,
  });

  const resolvedLabelX = labelX + (data?.labelDx ?? 0);
  const resolvedLabelY = labelY + (data?.labelDy ?? 0);
  const toneClass = toneClassForEdge(data?.tone);
  const activeClass = data?.active ? 'is-active' : '';

  return (
    <>
      <BaseEdge
        id={id}
        path={path}
        markerEnd={markerEnd}
        className={`service-flow-edge ${toneClass} ${activeClass}`}
      />
      {data?.label && data?.active ? (
        <EdgeLabelRenderer>
          <div
            className={`service-flow-edge-label ${toneClass} ${activeClass}`}
            style={{
              transform: `translate(-50%, -50%) translate(${resolvedLabelX}px, ${resolvedLabelY}px)`,
            }}
          >
            {data.label}
          </div>
        </EdgeLabelRenderer>
      ) : null}
    </>
  );
};

const nodeTypes = {
  mechanism: ServiceMechanismNode,
};

const edgeTypes = {
  mechanism: ServiceMechanismEdge,
};

const FLOW_FIT_PADDING = 0.03;

const ServiceAssuranceCanvas: React.FC = () => {
  const activeStep = tourSteps[0];
  const flowRef = useRef<ReactFlowInstance<any, any> | null>(null);
  const diagramRef = useRef<HTMLDivElement | null>(null);

  const fitFlow = useCallback(() => {
    flowRef.current?.fitView({ padding: FLOW_FIT_PADDING, duration: 0 });
  }, []);

  useEffect(() => {
    const frame = window.requestAnimationFrame(() => {
      fitFlow();
    });

    return () => window.cancelAnimationFrame(frame);
  }, [fitFlow]);

  useEffect(() => {
    const element = diagramRef.current;

    if (!element) {
      return undefined;
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(() => {
        fitFlow();
      });
    });

    observer.observe(element);

    return () => observer.disconnect();
  }, [fitFlow]);

  const flowNodes = useMemo(
    () =>
      baseNodes.map((node) => ({
        ...node,
        data: {
          ...node.data,
          isActive: activeStep.activeNodeIds.includes(node.id),
        },
      })),
    [activeStep.activeNodeIds],
  );

  const flowEdges = useMemo(
    () =>
      baseEdges.map((edge) => ({
        ...edge,
        data: {
          ...edge.data,
          active: activeStep.activeEdgeIds.includes(edge.id),
        },
      })),
    [activeStep.activeEdgeIds],
  );

  return (
    <div className="arch-demo service-assurance-demo">
      <main className="arch-layout">
        <div className="arch-workbench service-tour-workbench">
          <section className="arch-canvas-shell service-assurance-shell" aria-label="Closed-loop guardrail mechanism">
            <div className="service-tour-board">
              <section className="service-tour-diagram-card">
                <div ref={diagramRef} className="service-tour-diagram">
                  <ReactFlow
                    nodes={flowNodes}
                    edges={flowEdges}
                    nodeTypes={nodeTypes}
                    edgeTypes={edgeTypes}
                    onInit={(instance) => {
                      flowRef.current = instance;
                      fitFlow();
                    }}
                    nodesDraggable={false}
                    nodesConnectable={false}
                    elementsSelectable={false}
                    panOnDrag={false}
                    zoomOnScroll={false}
                    zoomOnPinch={false}
                    zoomOnDoubleClick={false}
                    proOptions={{ hideAttribution: true }}
                    className="service-tour-reactflow"
                  >
                    <Background color="rgba(148, 163, 184, 0.16)" gap={24} size={1.2} />
                  </ReactFlow>
                </div>
              </section>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default ServiceAssuranceCanvas;
