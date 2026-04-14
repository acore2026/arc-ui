import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  Controls,
  Handle,
  Position,
  ReactFlow,
  useNodesInitialized,
  useReactFlow,
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

type NodeRect = {
  x: number;
  y: number;
  width: number;
  height: number;
};

type Anchor = 'top' | 'right' | 'bottom' | 'left' | 'center';
type Tone = 'intent' | 'agent' | 'skill' | 'tool' | 'owner';

type FlowLine = {
  id: string;
  source: string;
  target: string;
  sourceAnchor?: Anchor;
  targetAnchor?: Anchor;
  tone: Tone;
  delay?: number;
};

type FlowToken = {
  id: string;
  artifactId: ArtifactId;
  points: string[];
  delay?: number;
};

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

const anchorPoint = (rect: NodeRect, anchor: Anchor = 'center') => {
  switch (anchor) {
    case 'top':
      return { x: rect.x + rect.width / 2, y: rect.y };
    case 'right':
      return { x: rect.x + rect.width, y: rect.y + rect.height / 2 };
    case 'bottom':
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height };
    case 'left':
      return { x: rect.x, y: rect.y + rect.height / 2 };
    default:
      return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
  }
};

const buildCurve = (start: { x: number; y: number }, end: { x: number; y: number }) => {
  const dx = Math.abs(end.x - start.x);
  const controlOffset = Math.max(62, dx * 0.42);
  const c1 = { x: start.x + controlOffset, y: start.y };
  const c2 = { x: end.x - controlOffset, y: end.y };
  return `M ${start.x} ${start.y} C ${c1.x} ${c1.y}, ${c2.x} ${c2.y}, ${end.x} ${end.y}`;
};

const getFlowLines = (phase: StoryPhase): FlowLine[] => {
  switch (phase) {
    case 'intent-to-srf':
      return [{ id: 'intent-srf-line', source: 'slot:ue-intent', target: 'srf', sourceAnchor: 'bottom', targetAnchor: 'top', tone: 'intent' }];
    case 'intent-to-planning':
      return [{ id: 'srf-planning-line', source: 'srf', target: 'slot:planning-intent', sourceAnchor: 'right', targetAnchor: 'left', tone: 'agent' }];
    case 'skill-lookup':
      return [{ id: 'skill-lookup-line', source: 'slot:planning-skill', target: 'connection-skill', sourceAnchor: 'top', targetAnchor: 'bottom', tone: 'skill' }];
    case 'skill-to-planning':
      return [{ id: 'skill-planning-line', source: 'connection-skill', target: 'slot:planning-skill', sourceAnchor: 'bottom', targetAnchor: 'top', tone: 'skill' }];
    case 'delegation':
      return [{ id: 'planning-connection-line', source: 'slot:planning-delegation', target: 'slot:connection-task', sourceAnchor: 'right', targetAnchor: 'left', tone: 'agent' }];
    case 'tool-call-sm':
      return [
        { id: 'connection-sm-characteristics-line', source: 'slot:connection-checklist', target: 'tool:sm-characteristics', sourceAnchor: 'right', targetAnchor: 'left', tone: 'tool' },
        { id: 'connection-up-config-line', source: 'slot:connection-checklist', target: 'tool:up-config', sourceAnchor: 'right', targetAnchor: 'left', tone: 'tool', delay: 0.16 },
      ];
    case 'tool-call-up':
    case 'complete':
      return [
        { id: 'connection-forwarding-line', source: 'slot:connection-checklist', target: 'tool:forwarding', sourceAnchor: 'right', targetAnchor: 'left', tone: 'owner' },
      ];
    default:
      return [];
  }
};

const getFlowTokens = (phase: StoryPhase): FlowToken[] => {
  switch (phase) {
    case 'intent-source':
      return [{ id: 'intent-source-token', artifactId: 'ue-intent', points: ['slot:ue-intent', 'slot:ue-intent'] }];
    case 'intent-to-srf':
      return [{ id: 'intent-to-srf-token', artifactId: 'ue-intent', points: ['slot:ue-intent', 'srf'] }];
    case 'intent-to-planning':
      return [{ id: 'intent-to-planning-token', artifactId: 'planning-intent', points: ['srf', 'slot:planning-intent'] }];
    case 'skill-to-planning':
      return [{ id: 'skill-to-planning-token', artifactId: 'planning-skill', points: ['connection-skill', 'slot:planning-skill'] }];
    case 'delegation':
      return [{ id: 'delegation-token', artifactId: 'connection-task', points: ['slot:planning-delegation', 'slot:connection-task'] }];
    default:
      return [];
  }
};

const FlowCardFace: React.FC<{ card: FlowCardDef; active?: boolean }> = ({ card, active }) => (
  <div className={`arch-flow-card-face arch-flow-card-face-${card.tone} ${active ? 'is-active' : ''}`}>
    <span>{card.kicker}</span>
    <strong>{card.label}</strong>
  </div>
);

const FlowingCardOverlay: React.FC<{ phase: StoryPhase; targetRects: Record<string, NodeRect> }> = ({ phase, targetRects }) => {
  const lines = getFlowLines(phase)
    .map((line) => {
      const source = targetRects[line.source];
      const target = targetRects[line.target];

      if (!source || !target) {
        return null;
      }

      const start = anchorPoint(source, line.sourceAnchor);
      const end = anchorPoint(target, line.targetAnchor);
      return { ...line, path: buildCurve(start, end), end };
    })
    .filter((line): line is FlowLine & { path: string; end: { x: number; y: number } } => Boolean(line));

  const tokens = getFlowTokens(phase)
    .map((token) => {
      const points = token.points.map((point) => targetRects[point]).filter((rect): rect is NodeRect => Boolean(rect));
      if (points.length !== token.points.length) {
        return null;
      }

      return {
        ...token,
        card: flowCards[token.artifactId],
        x: points.map((rect) => rect.x + rect.width / 2),
        y: points.map((rect) => rect.y + rect.height / 2),
      };
    })
    .filter((token): token is FlowToken & { card: FlowCardDef; x: number[]; y: number[] } => Boolean(token));

  return (
    <div className="arch-process-overlay" aria-hidden="true">
      <svg className="arch-process-lines">
        <defs>
          {(['intent', 'agent', 'skill', 'tool', 'owner'] as Tone[]).map((tone) => (
            <marker key={tone} id={`arch-arrow-${tone}`} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto" markerUnits="strokeWidth">
              <path d="M 0 0 L 8 4 L 0 8 z" className={`arch-arrow-fill-${tone}`} />
            </marker>
          ))}
        </defs>
        {lines.map((line) => (
          <g key={`${phase}-${line.id}`} className={`arch-process-group arch-process-group-${line.tone}`}>
            <motion.path
              className={`arch-process-line arch-process-line-${line.tone}`}
              d={line.path}
              pathLength={1}
              markerEnd={`url(#arch-arrow-${line.tone})`}
              initial={{ pathLength: 0, opacity: 0 }}
              animate={{ pathLength: 1, opacity: 1 }}
              transition={{ duration: 0.72, ease: 'easeInOut', delay: line.delay ?? 0 }}
            />
            <motion.circle
              className={`arch-process-endpoint arch-process-endpoint-${line.tone}`}
              cx={line.end.x}
              cy={line.end.y}
              r={4.2}
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.24, delay: (line.delay ?? 0) + 0.58 }}
            />
          </g>
        ))}
      </svg>
      <AnimatePresence mode="popLayout">
        {tokens.map((token) => (
          <motion.div
            key={`${phase}-${token.id}`}
            className="arch-motion-card"
            initial={{ x: token.x[0], y: token.y[0], opacity: 0, scale: 0.92 }}
            animate={{ x: token.x, y: token.y, opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.92 }}
            transition={{ duration: phase === 'intent-source' ? 0.42 : 0.82, ease: [0.22, 1, 0.36, 1], delay: token.delay ?? 0 }}
          >
            <FlowCardFace card={token.card} />
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
};

const FlowSlot: React.FC<{ id: ArtifactId }> = ({ id }) => <span data-flow-slot={id} className="arch-flow-slot" />;

const LandedFlowCard: React.FC<{ id: ArtifactId; active?: boolean }> = ({ id, active }) => (
  <motion.div
    className="arch-landed-card is-visible"
    initial={{ opacity: 0, y: 2, scale: 0.995 }}
    animate={{ opacity: 1, y: 0, scale: 1 }}
    transition={{ duration: 0.18, ease: 'easeOut' }}
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
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      <span className="arch-artifact-kicker">checklist</span>
      {items.map((item, index) => (
        <motion.div
          key={item}
          className="arch-checklist-item"
          initial={{ opacity: 0, x: -8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.24, delay: index * 0.08 }}
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
      <Handle type="target" position={Position.Left} className="arch-card-handle" />
      <Handle type="source" position={Position.Right} className="arch-card-handle" />
      <Handle type="target" position={Position.Top} className="arch-card-handle" />
      <Handle type="source" position={Position.Bottom} className="arch-card-handle" />

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

const AutoFitViewport: React.FC<{ onFit?: () => void }> = ({ onFit }) => {
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
      window.setTimeout(() => onFit?.(), 40);
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
  }, [fitView, nodesReady, onFit]);

  return null;
};

const ArchitectureGraph: React.FC = () => {
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('idle');
  const [completedArtifacts, setCompletedArtifacts] = useState<ArtifactId[]>([]);
  const [activeTools, setActiveTools] = useState<ToolId[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [targetRects, setTargetRects] = useState<Record<string, NodeRect>>({});
  const flowWrapRef = useRef<HTMLDivElement | null>(null);
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

  const measureTargets = useCallback(() => {
    const flowWrap = flowWrapRef.current;
    if (!flowWrap) {
      return;
    }

    const wrapRect = flowWrap.getBoundingClientRect();
    const nextRects: Record<string, NodeRect> = {};

    ARCHITECTURE_NODES.forEach((node) => {
      const element = flowWrap.querySelector<HTMLElement>(`.react-flow__node[data-id="${node.id}"]`);
      if (!element) {
        return;
      }

      const rect = element.getBoundingClientRect();
      nextRects[node.id] = {
        x: rect.left - wrapRect.left,
        y: rect.top - wrapRect.top,
        width: rect.width,
        height: rect.height,
      };
    });

    flowWrap.querySelectorAll<HTMLElement>('[data-flow-slot]').forEach((element) => {
      const rect = element.getBoundingClientRect();
      nextRects[`slot:${element.dataset.flowSlot}`] = {
        x: rect.left - wrapRect.left,
        y: rect.top - wrapRect.top,
        width: FLOW_CARD_RECT.width,
        height: FLOW_CARD_RECT.height,
      };
    });

    flowWrap.querySelectorAll<HTMLElement>('[data-tool-id]').forEach((element) => {
      const rect = element.getBoundingClientRect();
      nextRects[`tool:${element.dataset.toolId}`] = {
        x: rect.left - wrapRect.left,
        y: rect.top - wrapRect.top,
        width: rect.width,
        height: rect.height,
      };
    });

    setTargetRects(nextRects);
  }, []);

  useEffect(() => {
    const firstFrame = window.requestAnimationFrame(() => {
      measureTargets();
      window.setTimeout(measureTargets, 90);
    });

    return () => window.cancelAnimationFrame(firstFrame);
  }, [measureTargets, nodes]);

  useEffect(() => {
    const flowWrap = flowWrapRef.current;
    if (!flowWrap) {
      return;
    }

    const observer = new ResizeObserver(() => {
      window.requestAnimationFrame(measureTargets);
    });
    observer.observe(flowWrap);
    return () => observer.disconnect();
  }, [measureTargets]);

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
          <div className="arch-flow-wrap" ref={flowWrapRef}>
            <ReactFlow
              nodes={nodes}
              edges={[]}
              nodeTypes={nodeTypes}
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
              onMoveEnd={measureTargets}
              proOptions={{ hideAttribution: true }}
            >
              <Background color="#dbeafe" gap={28} size={1} />
              <Controls showInteractive={false} />
              <AutoFitViewport onFit={measureTargets} />
            </ReactFlow>
            <FlowingCardOverlay phase={storyPhase} targetRects={targetRects} />
          </div>
        </section>
      </main>
    </div>
  );
};

export default ArchitectureGraph;
