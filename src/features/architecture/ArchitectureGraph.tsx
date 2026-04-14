import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
  getBezierPath,
  type EdgeProps,
  type Edge,
  type Node,
} from '@xyflow/react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Check,
  Cloud,
  Cpu,
  Database,
  FileText,
  Fingerprint,
  Gauge,
  HardDrive,
  Network,
  RadioTower,
  Route,
  ShieldCheck,
  Zap,
} from 'lucide-react';
import {
  ARCHITECTURE_NODES,
  type ArchitectureNodeData,
} from '../../lib/architectureData';
import '@xyflow/react/dist/style.css';
import './ArchitectureGraph.css';

type AnimationStage = NonNullable<ArchitectureNodeData['animationStage']>;
type StoryPhase =
  | 'idle'
  | 'intent-source'
  | 'intent-to-srf'
  | 'intent-to-planning'
  | 'skill-lookup'
  | 'skill-to-planning'
  | 'delegation'
  | 'connection-planning'
  | 'tool-call-sm'
  | 'tool-call-up'
  | 'complete';

type ArtifactId = 'ue-intent' | 'planning-intent' | 'planning-skill' | 'planning-delegation' | 'connection-task' | 'connection-checklist';
type ToolId = 'sm-characteristics' | 'up-config' | 'forwarding';
type Tone = 'intent' | 'agent' | 'skill' | 'tool' | 'owner';

type FlowCardDef = {
  kicker: string;
  label: string;
  tone: Tone;
};

const FLOW_CARD_RECT = {
  width: 154,
  height: 42,
};

const flowCards: Record<ArtifactId, FlowCardDef> = {
  'ue-intent': { kicker: 'intent', label: 'service assurance ask', tone: 'intent' },
  'planning-intent': { kicker: 'intent', label: 'service assurance ask', tone: 'intent' },
  'planning-skill': { kicker: 'selected skill', label: 'connection assurance', tone: 'skill' },
  'planning-delegation': { kicker: 'delegation', label: 'connection execution', tone: 'agent' },
  'connection-task': { kicker: 'task', label: 'connection execution', tone: 'agent' },
  'connection-checklist': { kicker: 'checklist', label: 'connection plan', tone: 'tool' },
};

const stageSummary: Record<StoryPhase, string> = {
  idle: 'Ready to animate the request path',
  'intent-source': 'Intent appears inside the UE card',
  'intent-to-srf': 'Intent enters SRF',
  'intent-to-planning': 'SRF routes intent to Planning Agent',
  'skill-lookup': 'Planning Agent searches ARF skills',
  'skill-to-planning': 'Connection Skill lands in Planning Agent',
  delegation: 'Planning Agent delegates the connection task',
  'connection-planning': 'Connection Agent builds a checklist',
  'tool-call-sm': 'Checklist calls session tools',
  'tool-call-up': 'Checklist calls user-plane tools',
  complete: 'Tool call path completed',
};

const phaseToStage = (phase: StoryPhase): AnimationStage => {
  switch (phase) {
    case 'intent-source':
    case 'intent-to-srf':
      return 'intent-intake';
    case 'intent-to-planning':
      return 'agent-dispatch';
    case 'skill-lookup':
    case 'skill-to-planning':
      return 'skill-selection';
    case 'delegation':
    case 'connection-planning':
      return 'delegation';
    case 'tool-call-sm':
      return 'tool-call';
    case 'tool-call-up':
    case 'complete':
      return 'ownership';
    default:
      return 'idle';
  }
};

const sleep = (ms: number) => new Promise((resolve) => window.setTimeout(resolve, ms));

const getNodeAnimationState = (id: string, stage: AnimationStage): ArchitectureNodeData['animationState'] => {
  if (stage === 'idle') {
    return undefined;
  }

  const activeByStage: Record<Exclude<AnimationStage, 'idle'>, string[]> = {
    'intent-intake': ['ue-request', 'srf'],
    'agent-dispatch': ['srf', 'planning-agent'],
    'skill-selection': ['planning-agent', 'connection-skill'],
    delegation: ['planning-agent', 'connection-agent'],
    'tool-call': ['connection-agent', 'sm-tools', 'up-tools'],
    ownership: ['connection-agent', 'up-tools'],
  };

  if (stage === 'ownership' && id === 'up-tools') {
    return 'owner';
  }

  if (stage === 'tool-call' && (id === 'sm-tools' || id === 'up-tools')) {
    return 'active-tool';
  }

  return activeByStage[stage].includes(id) ? 'glow' : 'dimmed';
};

const FlowCardFace: React.FC<{ card: FlowCardDef; active?: boolean }> = ({ card, active }) => (
  <div className={`arch-flow-card-face arch-flow-card-face-${card.tone} ${active ? 'is-active' : ''}`}>
    <span>{card.kicker}</span>
    <strong>{card.label}</strong>
  </div>
);

const StoryEdge = ({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  data,
}: EdgeProps) => {
  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  const tone = data?.tone as Tone;
  const isVisible = data?.isVisible as boolean;
  const tokenCard = data?.tokenCard as FlowCardDef | undefined;
  const tokenVisible = data?.tokenVisible as boolean;

  return (
    <>
      <AnimatePresence>
        {isVisible && (
          <motion.path
            key={`${id}-path`}
            d={edgePath}
            fill="none"
            className={`arch-process-line arch-process-line-${tone}`}
            markerEnd={`url(#arch-arrow-${tone})`}
            initial={{ pathLength: 0, opacity: 0 }}
            animate={{ pathLength: 1, opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.72, ease: 'easeInOut', delay: (data?.delay as number) ?? 0 }}
          />
        )}
        {isVisible && (
           <motion.circle
             key={`${id}-endpoint`}
             className={`arch-process-endpoint arch-process-endpoint-${tone}`}
             cx={targetX}
             cy={targetY}
             r={4.2}
             initial={{ scale: 0.6, opacity: 0 }}
             animate={{ scale: 1, opacity: 1 }}
             exit={{ opacity: 0, scale: 0.6 }}
             transition={{ duration: 0.24, delay: ((data?.delay as number) ?? 0) + 0.58 }}
           />
        )}
      </AnimatePresence>

      <AnimatePresence>
        {tokenVisible && tokenCard && (
          <motion.foreignObject
            key={`${id}-token`}
            width={FLOW_CARD_RECT.width}
            height={FLOW_CARD_RECT.height}
            initial={{ x: sourceX - FLOW_CARD_RECT.width / 2, y: sourceY - FLOW_CARD_RECT.height / 2, opacity: 0, scale: 0.92 }}
            animate={{ x: targetX - FLOW_CARD_RECT.width / 2, y: targetY - FLOW_CARD_RECT.height / 2, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 200, damping: 28, mass: 1.2, delay: (data?.tokenDelay as number) ?? 0 }}
            style={{ overflow: 'visible' }}
          >
            <div className="arch-motion-card" style={{ width: FLOW_CARD_RECT.width, height: FLOW_CARD_RECT.height }}>
              <FlowCardFace card={tokenCard} />
            </div>
          </motion.foreignObject>
        )}
      </AnimatePresence>
    </>
  );
};

const FlowSlot: React.FC<{ id: ArtifactId }> = ({ id }) => <span data-flow-slot={id} className="arch-flow-slot" />;

const LandedFlowCard: React.FC<{ id: ArtifactId; active?: boolean }> = ({ id, active }) => (
  <motion.div
    className="arch-landed-card is-visible"
    initial={{ opacity: 0, y: 8, scale: 0.95 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ type: 'spring', stiffness: 350, damping: 25 }}
  >
    <FlowCardFace card={flowCards[id]} active={active} />
  </motion.div>
);

const ChecklistPlan: React.FC<{ visible: boolean }> = ({ visible }) => {
  const items = ['SM characteristics', 'UP configuration', 'Forwarding setup'];

  if (!visible) {
    return null;
  }

  return (
    <motion.div
      className="arch-checklist-plan is-visible"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 350, damping: 25 }}
    >
      <span className="arch-artifact-kicker">checklist</span>
      {items.map((item, index) => (
        <motion.div
          key={item}
          className="arch-checklist-item"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ type: 'spring', stiffness: 300, damping: 24, delay: index * 0.08 }}
        >
          <Check size={12} />
          <span>{item}</span>
        </motion.div>
      ))}
    </motion.div>
  );
};

const NodeIcon: React.FC<{ type: ArchitectureNodeData['type'] }> = ({ type }) => {
  switch (type) {
    case 'request':
      return <FileText size={18} />;
    case 'srf':
      return <Route size={18} />;
    case 'agent':
      return <Bot size={18} />;
    case 'skill':
      return <Database size={18} />;
    case 'nf':
      return <Cpu size={18} />;
    default:
      return <RadioTower size={16} />;
  }
};

const NfIcon: React.FC<{ nodeId?: string }> = ({ nodeId }) => {
  switch (nodeId) {
    case 'am-tools':
      return <Fingerprint size={18} />;
    case 'sm-tools':
      return <Network size={18} />;
    case 'pcf-tools':
      return <ShieldCheck size={18} />;
    case 'up-tools':
      return <Gauge size={18} />;
    default:
      return <HardDrive size={18} />;
  }
};

const NodeGlyph: React.FC<{ data: ArchitectureNodeData }> = ({ data }) => {
  if (data.type === 'nf') {
    return <NfIcon nodeId={data.nodeId} />;
  }

  if (data.type === 'domain' && data.domain === 'TRF') {
    return <Cloud size={16} />;
  }

  return <NodeIcon type={data.type} />;
};

const hasArtifact = (data: ArchitectureNodeData, id: ArtifactId) => data.completedArtifacts?.includes(id) ?? false;

const IntentArtifacts: React.FC<{ data: ArchitectureNodeData }> = ({ data }) => {
  const visible = hasArtifact(data, 'ue-intent') || data.storyPhase === 'intent-source';

  return (
    <div className="arch-artifact-shelf">
      <FlowSlot id="ue-intent" />
      {visible && <LandedFlowCard id="ue-intent" active={data.storyPhase === 'intent-source'} />}
    </div>
  );
};

const PlanningArtifacts: React.FC<{ data: ArchitectureNodeData }> = ({ data }) => (
  <div className="arch-artifact-shelf">
    <FlowSlot id="planning-intent" />
    {hasArtifact(data, 'planning-intent') && <LandedFlowCard id="planning-intent" />}
    <FlowSlot id="planning-skill" />
    {hasArtifact(data, 'planning-skill') && <LandedFlowCard id="planning-skill" />}
    <FlowSlot id="planning-delegation" />
    {hasArtifact(data, 'planning-delegation') && <LandedFlowCard id="planning-delegation" />}
  </div>
);

const ConnectionArtifacts: React.FC<{ data: ArchitectureNodeData }> = ({ data }) => (
  <div className="arch-artifact-shelf">
    <FlowSlot id="connection-task" />
    {hasArtifact(data, 'connection-task') && <LandedFlowCard id="connection-task" />}
    <FlowSlot id="connection-checklist" />
    <ChecklistPlan visible={hasArtifact(data, 'connection-checklist')} />
  </div>
);

const ArchitectureNode: React.FC<{ data: ArchitectureNodeData }> = ({ data }) => {
  if (data.type === 'domain') {
    return (
      <div className={`arch-domain-label arch-domain-${String(data.domain).toLowerCase().replaceAll(' ', '-').replaceAll('/', '')}`}>
        <div className="arch-domain-title">
          <NodeGlyph data={data} />
          <span>{data.label}</span>
        </div>
        {data.subtitle && <div className="arch-domain-subtitle">{data.subtitle}</div>}
      </div>
    );
  }

  return (
    <article className={`arch-node arch-node-${data.type} ${data.emphasis === 'primary' ? 'arch-node-primary' : ''} ${data.animationState ? `is-${data.animationState}` : ''}`}>
      <Handle type="target" position={Position.Left} id="left" className="arch-card-handle" />
      <Handle type="source" position={Position.Right} id="right" className="arch-card-handle" />
      <Handle type="target" position={Position.Top} id="top" className="arch-card-handle" />
      <Handle type="source" position={Position.Bottom} id="bottom" className="arch-card-handle" />

      <div className="arch-node-heading">
        <div className="arch-node-icon">
          <NodeGlyph data={data} />
        </div>
        <div className="arch-node-copy">
          <div className="arch-node-label">{data.label}</div>
          {data.subtitle && <div className="arch-node-subtitle">{data.subtitle}</div>}
        </div>
      </div>

      {data.description && <p className="arch-node-description">{data.description}</p>}

      {data.nodeId === 'ue-request' && <IntentArtifacts data={data} />}
      {data.nodeId === 'planning-agent' && <PlanningArtifacts data={data} />}
      {data.nodeId === 'connection-agent' && <ConnectionArtifacts data={data} />}

      {data.capabilities && (
        <div className="arch-capability-list" aria-label={`${data.label} capabilities`}>
          {data.capabilities.map((capability) => (
            <span key={capability.id} className="arch-capability-pill">
              {capability.label}
            </span>
          ))}
        </div>
      )}

      {data.tools && (
        <div className="arch-tool-list" aria-label={`${data.label} tools`}>
          {data.tools.map((tool) => (
            <div
              key={tool.id}
              data-tool-id={tool.id}
              className={`arch-tool-pill ${data.activeTools?.includes(tool.id) ? 'is-active-tool' : ''}`}
            >
              <span className="arch-tool-name">{tool.name}</span>
              <span className="arch-tool-purpose">{tool.purpose}</span>
            </div>
          ))}
        </div>
      )}
    </article>
  );
};

const nodeTypes = {
  architectureNode: ArchitectureNode,
};

const edgeTypes = {
  storyEdge: StoryEdge,
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
        duration: 0,
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
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('idle');
  const [completedArtifacts, setCompletedArtifacts] = useState<ArtifactId[]>([]);
  const [activeTools, setActiveTools] = useState<ToolId[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const runRef = useRef(0);
  const activeStage = phaseToStage(storyPhase);

  const nodes = useMemo<Node<ArchitectureNodeData>[]>(() => {
    return ARCHITECTURE_NODES.map((node) => ({
      ...node,
      data: {
        ...node.data,
        nodeId: node.id,
        animationStage: activeStage,
        animationState: getNodeAnimationState(node.id, activeStage),
        storyPhase,
        completedArtifacts,
        activeTools,
      },
    }));
  }, [activeStage, activeTools, completedArtifacts, storyPhase]);

  const edges = useMemo<Edge[]>(() => {
    return [
      {
        id: 'intent-srf',
        source: 'ue-request',
        target: 'srf',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'storyEdge',
        data: {
          tone: 'intent',
          isVisible: storyPhase === 'intent-to-srf',
          tokenVisible: storyPhase === 'intent-to-srf',
          tokenCard: flowCards['ue-intent'],
        },
      },
      {
        id: 'srf-planning',
        source: 'srf',
        target: 'planning-agent',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'storyEdge',
        data: {
          tone: 'agent',
          isVisible: storyPhase === 'intent-to-planning',
          tokenVisible: storyPhase === 'intent-to-planning',
          tokenCard: flowCards['planning-intent'],
        },
      },
      {
        id: 'planning-skill',
        source: 'planning-agent',
        target: 'connection-skill',
        sourceHandle: 'top',
        targetHandle: 'bottom',
        type: 'storyEdge',
        data: {
          tone: 'skill',
          isVisible: storyPhase === 'skill-lookup',
          tokenVisible: false,
        },
      },
      {
        id: 'skill-planning',
        source: 'connection-skill',
        target: 'planning-agent',
        sourceHandle: 'bottom',
        targetHandle: 'top',
        type: 'storyEdge',
        data: {
          tone: 'skill',
          isVisible: storyPhase === 'skill-to-planning',
          tokenVisible: storyPhase === 'skill-to-planning',
          tokenCard: flowCards['planning-skill'],
        },
      },
      {
        id: 'planning-connection',
        source: 'planning-agent',
        target: 'connection-agent',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'storyEdge',
        data: {
          tone: 'agent',
          isVisible: storyPhase === 'delegation',
          tokenVisible: storyPhase === 'delegation',
          tokenCard: flowCards['connection-task'],
        },
      },
      {
        id: 'connection-sm',
        source: 'connection-agent',
        target: 'sm-tools',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'storyEdge',
        data: {
          tone: 'tool',
          isVisible: storyPhase === 'tool-call-sm',
          tokenVisible: false,
        },
      },
      {
        id: 'connection-up',
        source: 'connection-agent',
        target: 'up-tools',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'storyEdge',
        data: {
          tone: 'owner',
          isVisible: storyPhase === 'tool-call-up' || storyPhase === 'complete',
          tokenVisible: false,
        },
      },
    ];
  }, [storyPhase]);

  const runStoryboard = async () => {
    const runId = runRef.current + 1;
    runRef.current = runId;
    setIsPlaying(true);
    setCompletedArtifacts([]);
    setActiveTools([]);
    setStoryPhase('idle');
    await sleep(180);

    const setPhase = async (phase: StoryPhase, duration: number) => {
      if (runRef.current !== runId) {
        return false;
      }

      setStoryPhase(phase);
      await sleep(duration);
      return runRef.current === runId;
    };

    setCompletedArtifacts(['ue-intent']);
    if (!(await setPhase('intent-source', 620))) return;
    if (!(await setPhase('intent-to-srf', 760))) return;
    setCompletedArtifacts([]);
    if (!(await setPhase('intent-to-planning', 860))) return;
    setCompletedArtifacts(['planning-intent']);
    if (!(await setPhase('skill-lookup', 620))) return;
    if (!(await setPhase('skill-to-planning', 820))) return;
    setCompletedArtifacts(['planning-intent', 'planning-skill', 'planning-delegation']);
    if (!(await setPhase('delegation', 860))) return;
    setCompletedArtifacts(['planning-intent', 'planning-skill', 'connection-task']);
    if (!(await setPhase('connection-planning', 720))) return;
    setCompletedArtifacts(['planning-intent', 'planning-skill', 'connection-task', 'connection-checklist']);
    setActiveTools(['sm-characteristics', 'up-config']);
    if (!(await setPhase('tool-call-sm', 940))) return;
    setActiveTools(['forwarding']);
    if (!(await setPhase('tool-call-up', 940))) return;
    setCompletedArtifacts(['planning-intent', 'planning-skill', 'connection-task', 'connection-checklist']);
    setStoryPhase('complete');
    setIsPlaying(false);
  };

  const handlePlay = () => {
    void runStoryboard();
  };

  const buttonLabel = isPlaying ? 'Playing' : storyPhase === 'complete' ? 'Replay' : 'Play';

  return (
    <div className="arch-demo">
      <header className="arch-topbar">
        <div className="arch-brand">
          <div className="arch-brand-mark">
            <Zap size={15} />
          </div>
          <div>
            <h1>NW-Agent Architecture Sandbox</h1>
            <p>{'request -> planning -> discovery -> tool execution'}</p>
          </div>
        </div>
        <button type="button" className="arch-step-button" onClick={handlePlay} disabled={isPlaying}>
          <span>{stageSummary[storyPhase]}</span>
          <strong>{buttonLabel}</strong>
        </button>
      </header>

      <main className="arch-layout">
        <div className="arch-stage-note" aria-live="polite">
          <span>{stageSummary[storyPhase]}</span>
        </div>
        <section className="arch-canvas-shell" aria-label="NW-Agent concept sandbox">
          <svg style={{ position: 'absolute', width: 0, height: 0 }} aria-hidden="true">
            <defs>
              {(['intent', 'agent', 'skill', 'tool', 'owner'] as Tone[]).map((tone) => (
                <marker key={tone} id={`arch-arrow-${tone}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
                  <path d="M 0 0 L 8 4 L 0 8 z" className={`arch-arrow-fill-${tone}`} />
                </marker>
              ))}
            </defs>
          </svg>
          <div className="arch-flow-wrap">
            <ReactFlow
              nodes={nodes}
              edges={edges}
              nodeTypes={nodeTypes}
              edgeTypes={edgeTypes}
              fitView
              fitViewOptions={{ padding: 0.08 }}
              minZoom={0.45}
              maxZoom={1.5}
              nodesDraggable={false}
              nodesConnectable={false}
              nodesFocusable={false}
              edgesFocusable={false}
              elementsSelectable={false}
              panOnDrag
              zoomOnScroll
              zoomOnPinch
              zoomOnDoubleClick={false}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#dbeafe" gap={28} size={1} />
              <Controls showInteractive={false} />
              <AutoFitViewport />
            </ReactFlow>
          </div>
        </section>
      </main>
    </div>
  );
};

export default ArchitectureGraph;
