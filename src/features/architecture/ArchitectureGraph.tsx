import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  Background,
  ControlButton,
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
import ReactMarkdown from 'react-markdown';
import {
  Bot,
  Check,
  Cloud,
  Cpu,
  Database,
  FileText,
  HardDrive,
  ListChecks,
  LoaderCircle,
  Network,
  Play,
  RadioTower,
  RotateCcw,
  Route,
  Search,
  Send,
  X,
  Zap,
} from 'lucide-react';
import {
  ARCHITECTURE_NODES,
  type ArchitectureTool,
  type ArchitectureNodeData,
} from '../../lib/architectureData';
import conversationData from '../../../conversation.json';
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
type ToolId = 'subscription-tool' | 'subnet-context-tool' | 'issue-token-tool' | 'validate-token-tool' | 'create-pdu-tool' | 'forwarding-rule-tool';
type Tone = 'intent' | 'agent' | 'skill' | 'tool' | 'owner';

type FlowCardDef = {
  kicker: string;
  label: string;
  tone: Tone;
};

type InspectDetail = {
  kind: 'skill' | 'tool';
  title: string;
  subtitle: string;
  description: string;
  facts: { key: string; value: string }[];
  steps?: string[];
  parameters?: ArchitectureTool['parameters'];
};

type Frame = {
  phase: StoryPhase;
  role: string;
  name: string;
  text: string;
  isTool: boolean;
  toolName?: string;
  toolDetails?: { key: string; value: string }[];
  isSystemAction?: boolean;
  systemIcon?: string;
  activeNodeId: string;
};

const internalToolNames = ['skill_select', 'draft_plan', 'delegate_task'] as const;
type InternalToolName = typeof internalToolNames[number];

const isInternalToolName = (toolName?: string): toolName is InternalToolName =>
  Boolean(toolName && (internalToolNames as readonly string[]).includes(toolName));

const frames: Frame[] = [];
let lastPhase: StoryPhase = 'idle';

interface ConversationMessage {
  role: string;
  name?: string;
  content?: string;
  tool_calls?: Array<{ function: { name: string; arguments: string } }>;
}

const messages = conversationData.messages as ConversationMessage[];

const enrichChatText = (text: string) => text
  .replaceAll('Connect a new embodied agent into the network subnet.', '**Intent:** connect a new `embodied agent` into the network subnet.')
  .replaceAll('Searching skill library for:', '**Searching ARF** for')
  .replaceAll('Drafting execution plan for ACN skill.', '**Drafting plan** for `ACN` skill.')
  .replaceAll('Delegating task', '**Delegating task**')
  .replaceAll('to ConnectionAgent.', 'to `ConnectionAgent`.')
  .replaceAll('Found matching skill:', '**Found matching skill:**')
  .replaceAll('Plan drafted successfully:', '**Plan drafted successfully:**')
  .replaceAll('Request classified as connection onboarding.', '**Request classified** as `connection onboarding`.')
  .replaceAll('I will select the appropriate skill, prepare a deterministic plan, and delegate execution to the Connection Agent.', 'I will select the appropriate skill, prepare a **deterministic plan**, and delegate execution to **Connection Agent**.')
  .replaceAll('Skill selected: ACN.', '**Skill selected:** `ACN` via ARF.')
  .replaceAll('Plan drafted.', '**Plan drafted.**')
  .replaceAll('connection-specific task', '`connection-specific` task')
  .replaceAll('Connection Agent', '**Connection Agent**')
  .replaceAll('Task accepted.', '**Task accepted.**')
  .replaceAll('I will execute the ACN workflow exactly in the prescribed order.', 'I will execute the `ACN` workflow exactly in the prescribed order.')
  .replaceAll('Step 1 passed.', '**Step 1 passed.**')
  .replaceAll('Subscription is valid.', 'Subscription is valid.')
  .replaceAll('Step 2 passed.', '**Step 2 passed.**')
  .replaceAll('subnet_id=subnet_family_042', '`subnet_id=subnet_family_042`')
  .replaceAll('Step 3 passed.', '**Step 3 passed.**')
  .replaceAll('Access token issued.', 'Access token issued.')
  .replaceAll('Step 4 passed.', '**Step 4 passed.**')
  .replaceAll('Token validation succeeded.', 'Token validation succeeded.')
  .replaceAll('Step 5 passed.', '**Step 5 passed.**')
  .replaceAll('PDU session established.', 'PDU session established.')
  .replaceAll('Subtask completed successfully.', '**Subtask completed successfully.**')
  .replaceAll('Final result: robot_dog_01 connected to subnet_family_042 with PDU session pdu_subnet_family_042_robot_dog_01.', 'Final result: `robot_dog_01` connected to `subnet_family_042` with PDU session `pdu_subnet_family_042_robot_dog_01`.');

for (const msg of messages) {
  if (msg.role === 'system') continue;

  let phase: StoryPhase = lastPhase;
  let text = msg.content || '';
  let isTool = false;
  let activeNodeId = 'ue-request';
  let toolName: string | undefined;
  let toolDetails: { key: string; value: string }[] | undefined;
  let isSystemAction = false;
  let systemIcon: string | undefined;

  if (msg.role === 'user') {
    phase = 'intent-to-planning';
    activeNodeId = 'ue-request';
  } else if (msg.role === 'assistant') {
    if (msg.tool_calls) {
      isTool = true;
      const tc = msg.tool_calls[0];
      toolName = tc.function.name;
      text = `Calling ${tc.function.name}(...)`;

      try {
        const args = JSON.parse(tc.function.arguments);
        if (toolName === 'skill_select') {
          isTool = false;
          isSystemAction = true;
          systemIcon = 'search';
          text = `Searching skill library for: "${args.request}"`;
        } else if (toolName === 'draft_plan') {
          isTool = false;
          isSystemAction = true;
          systemIcon = 'file-text';
          text = `Drafting execution plan for ${args.skill_name} skill.`;
        } else if (toolName === 'delegate_task') {
          isTool = false;
          isSystemAction = true;
          systemIcon = 'share-2';
          text = `Delegating task ${args.task_id} to ${args.target_agent}.`;
        } else {
          toolDetails = Object.entries(args).map(([k, v]) => ({
            key: k,
            value: typeof v === 'object' ? JSON.stringify(v) : String(v)
          }));
        }
      } catch {
        // ignore parse error
      }

      if (tc.function.name === 'skill_select') phase = 'skill-lookup';
      else if (tc.function.name === 'draft_plan') phase = 'skill-to-planning';
      else if (tc.function.name === 'delegate_task') phase = 'delegation';
      else phase = 'tool-call-sm';
      activeNodeId = msg.name === 'PlanningAgent' ? 'planning-agent' : 'connection-agent';
    } else {
      if (msg.name === 'PlanningAgent' && text.includes('classified as')) phase = 'intent-to-planning';
      if (msg.name === 'PlanningAgent' && text.includes('Skill selected')) phase = 'skill-to-planning';
      if (msg.name === 'PlanningAgent' && text.includes('Plan drafted')) phase = 'delegation';
      if (msg.name === 'PlanningAgent' && text.includes('Subtask completed')) phase = 'complete';
      if (msg.name === 'ConnectionAgent' && text === 'DONE') phase = 'complete';
      activeNodeId = msg.name === 'PlanningAgent' ? 'planning-agent' : 'connection-agent';
    }
  } else if (msg.role === 'tool') {
    isTool = true;
    toolName = msg.name;
    text = `Result from ${msg.name}: ${msg.content}`;

    try {
      const res = JSON.parse(msg.content || '{}');
      if (toolName === 'skill_select') {
        isTool = false;
        isSystemAction = true;
        systemIcon = 'check-circle';
        text = `Found matching skill: ${res.selected_skill?.name}`;
      } else if (toolName === 'draft_plan') {
        isTool = false;
        isSystemAction = true;
        systemIcon = 'check-circle';
        text = `Plan drafted successfully: ${res.plan_id}`;
      } else if (toolName === 'delegate_task') {
        isTool = false;
        isSystemAction = true;
        systemIcon = 'check-circle';
        text = `Task accepted by delegate agent.`;
      } else {
        toolDetails = Object.entries(res).map(([k, v]) => ({
          key: k,
          value: typeof v === 'object' ? JSON.stringify(v) : String(v)
        }));
      }
    } catch {
      if (toolName === 'skill_select' || toolName === 'draft_plan' || toolName === 'delegate_task') {
        isTool = false;
        isSystemAction = true;
        text = `Operation completed.`;
      } else {
        toolDetails = [{ key: 'result', value: msg.content || '' }];
      }
    }

    if (msg.name === 'skill_select') {
      phase = 'skill-to-planning';
      activeNodeId = 'connection-skill';
    } else if (msg.name === 'draft_plan') {
      phase = 'delegation';
      activeNodeId = 'planning-agent';
    } else if (msg.name === 'delegate_task') {
      phase = 'connection-planning';
      activeNodeId = 'connection-agent';
    } else {
      phase = 'tool-call-sm';
      const name = msg.name || '';
      if (name.includes('Subscription') || name.includes('Context')) {
        activeNodeId = 'am-tools';
      } else if (name.includes('Token')) {
        activeNodeId = 'udm-tools';
      } else if (name.includes('PDU')) {
        activeNodeId = 'sm-tools';
      } else {
        activeNodeId = 'connection-agent';
      }
    }
  }

  lastPhase = phase;
  frames.push({
    phase,
    role: msg.role,
    name: msg.name || (msg.role === 'user' ? 'User' : 'System'),
    text: enrichChatText(text),
    isTool,
    toolName,
    toolDetails,
    isSystemAction,
    systemIcon,
    activeNodeId,
  });
}
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

const skillDetails: Record<string, InspectDetail> = {
  'connection-skill': {
    kind: 'skill',
    title: 'ACN Skill',
    subtitle: 'Agent connection workflow',
    description: 'Connects a new embodied agent into a core-network subnet by selecting AM, UDM, SM, and UP tools while preserving shared context across the tool chain.',
    facts: [
      { key: 'Input', value: 'UE intent, agent identity, requested subnet access' },
      { key: 'Output', value: 'Validated agent context and PDU session setup plan' },
      { key: 'Owner', value: 'ARF skill repository' },
    ],
    steps: [
      'Classify the request as an agent-connection workflow.',
      'Prepare subscription and subnet context through 6G AM tools.',
      'Issue and validate the subnet access token through 6G UDM tools.',
      'Create the final subnet PDU session through 6G SM.',
      'Install the user-plane forwarding rule through 6G UP.',
    ],
  },
  'qos-skill': {
    kind: 'skill',
    title: 'QoS Assurance Skill',
    subtitle: 'Service quality workflow',
    description: 'Maps service quality intent to policy and traffic treatment decisions for latency-sensitive connectivity.',
    facts: [
      { key: 'Input', value: 'Latency target, service profile, traffic treatment constraints' },
      { key: 'Output', value: 'QoS policy and enforcement plan' },
      { key: 'Owner', value: 'ARF skill repository' },
    ],
    steps: [
      'Read service quality constraints from the intent.',
      'Select a traffic treatment policy.',
      'Resolve the concrete NF tools needed for enforcement.',
    ],
  },
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

const formatChatTimestamp = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');

  return [
    `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    `${pad(date.getHours())}:${pad(date.getMinutes())}:${pad(date.getSeconds())}`,
  ].join(' ');
};

const formatMsgcapFilename = (date: Date) => {
  const pad = (value: number) => String(value).padStart(2, '0');
  const token = typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID().slice(0, 4)
    : Math.random().toString(16).slice(2, 6);

  return `acn-${pad(date.getMonth() + 1)}${pad(date.getDate())}-${pad(date.getHours())}${pad(date.getMinutes())}-${token}.msgcap`;
};

const getFrameDelay = (frame: Frame) => {
  if (frame.role === 'user') {
    return 1300;
  }

  if (frame.role === 'tool' && isInternalToolName(frame.toolName)) {
    return 850;
  }

  if (frame.role === 'assistant' && isInternalToolName(frame.toolName)) {
    return 1800;
  }

  if (frame.isTool && frame.role === 'assistant') {
    return 2200;
  }

  if (frame.isTool && frame.role === 'tool') {
    return 1250;
  }

  const readingTime = frame.text.length * 18;
  return Math.min(2800, Math.max(1400, readingTime));
};

const getNodeAnimationState = (id: string, stage: AnimationStage): ArchitectureNodeData['animationState'] => {
  if (stage === 'idle') {
    return undefined;
  }

  const activeByStage: Record<Exclude<AnimationStage, 'idle'>, string[]> = {
    'intent-intake': ['ue-request', 'srf'],
    'agent-dispatch': ['ue-request', 'planning-agent'],
    'skill-selection': ['planning-agent', 'connection-skill'],
    delegation: ['planning-agent', 'connection-agent'],
    'tool-call': ['connection-agent', 'am-tools', 'udm-tools', 'sm-tools', 'up-tools'],
    ownership: ['connection-agent', 'sm-tools', 'up-tools'],
  };

  if (stage === 'ownership' && (id === 'sm-tools' || id === 'up-tools')) {
    return 'owner';
  }

  if (stage === 'tool-call' && (id === 'am-tools' || id === 'udm-tools' || id === 'sm-tools' || id === 'up-tools')) {
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
      return <Network size={18} />;
    case 'udm-tools':
      return <Database size={18} />;
    case 'sm-tools':
      return <Route size={18} />;
    case 'up-tools':
      return <Zap size={18} />;
    default:
      return <HardDrive size={18} />;
  }
};

const DomainIcon: React.FC<{ domain?: ArchitectureNodeData['domain'] }> = ({ domain }) => {
  switch (domain) {
    case 'Request / Intent':
      return <FileText size={16} />;
    case 'Agent Layer':
      return <Bot size={16} />;
    case 'ARF':
      return <Database size={16} />;
    case 'TRF':
      return <Cloud size={16} />;
    default:
      return <RadioTower size={16} />;
  }
};

const NodeGlyph: React.FC<{ data: ArchitectureNodeData }> = ({ data }) => {
  if (data.type === 'nf') {
    return <NfIcon nodeId={data.nodeId} />;
  }

  if (data.type === 'domain') {
    return <DomainIcon domain={data.domain} />;
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

const DetailPopout: React.FC<{ detail: InspectDetail | null; onClose: () => void }> = ({ detail, onClose }) => (
  <AnimatePresence>
    {detail && (
      <motion.div
        className="arch-detail-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
      >
        <motion.aside
          className="arch-detail-panel"
          initial={{ opacity: 0, y: 18, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 12, scale: 0.98 }}
          transition={{ type: 'spring', stiffness: 320, damping: 28 }}
          onClick={(event) => event.stopPropagation()}
          aria-label={`${detail.title} details`}
        >
          <div className="arch-detail-header">
            <div>
              <span>{detail.kind}</span>
              <h2>{detail.title}</h2>
              <p>{detail.subtitle}</p>
            </div>
            <button type="button" className="arch-detail-close" onClick={onClose} aria-label="Close details">
              <X size={16} />
            </button>
          </div>

          <p className="arch-detail-description">{detail.description}</p>

          <div className="arch-detail-facts">
            {detail.facts.map((fact) => (
              <div key={fact.key}>
                <span>{fact.key}</span>
                <strong>{fact.value}</strong>
              </div>
            ))}
          </div>

          {detail.parameters && detail.parameters.length > 0 && (
            <div className="arch-detail-section">
              <h3>Parameters</h3>
              {detail.parameters.map((parameter) => (
                <div key={parameter.name} className="arch-detail-parameter">
                  <div>
                    <strong>{parameter.name}</strong>
                    <span>{parameter.type}{parameter.required ? ' / required' : ' / optional'}</span>
                  </div>
                  <p>{parameter.description}</p>
                </div>
              ))}
            </div>
          )}

          {detail.steps && detail.steps.length > 0 && (
            <div className="arch-detail-section">
              <h3>Flow</h3>
              {detail.steps.map((step, index) => (
                <div key={step} className="arch-detail-step">
                  <span>{index + 1}</span>
                  <p>{step}</p>
                </div>
              ))}
            </div>
          )}
        </motion.aside>
      </motion.div>
    )}
  </AnimatePresence>
);

const stageLabelForFrame = (frame: Frame) => {
  if (frame.role === 'user') return 'Intent';
  if (frame.phase === 'skill-lookup' || frame.toolName === 'skill_select') return 'Skill match';
  if (frame.phase === 'skill-to-planning' || frame.toolName === 'draft_plan') return 'Plan';
  if (frame.phase === 'delegation' || frame.toolName === 'delegate_task') return 'Delegation';
  if (frame.phase === 'connection-planning' || frame.name === 'ConnectionAgent' || frame.isTool) return 'Execution';
  if (frame.phase === 'complete') return 'Completion';
  return 'Planning';
};

const internalLabelForTool = (toolName?: string) => {
  switch (toolName) {
    case 'skill_select':
      return 'Match skill';
    case 'draft_plan':
      return 'Plan';
    case 'delegate_task':
      return 'Delegate';
    default:
      return 'Internal action';
  }
};

const InternalActionIcon: React.FC<{ toolName?: string }> = ({ toolName }) => {
  switch (toolName) {
    case 'skill_select':
      return <Search size={12} />;
    case 'draft_plan':
      return <ListChecks size={12} />;
    case 'delegate_task':
      return <Send size={12} />;
    default:
      return <Bot size={12} />;
  }
};

const ChatMarkdown: React.FC<{ text: string }> = ({ text }) => (
  <div className="arch-chat-markdown">
    <ReactMarkdown>{text}</ReactMarkdown>
  </div>
);

const AgentChatPanel: React.FC<{ frames: Frame[]; activeIndex: number; isPlaying: boolean }> = ({ frames, activeIndex, isPlaying }) => {
  const scrollRef = useRef<HTMLDivElement | null>(null);
  const visibleFrames = activeIndex >= 0 ? frames.slice(0, activeIndex + 1) : [];
  const activeFrame = activeIndex >= 0 ? frames[activeIndex] : null;
  const visibleItems = visibleFrames
    .map((frame, index) => ({ frame, index }))
    .filter(({ frame }) => !(frame.role === 'tool' && isInternalToolName(frame.toolName)));
  const chatRows = visibleItems.flatMap((item, itemPosition) => {
    const stage = stageLabelForFrame(item.frame);
    const previousStage = itemPosition > 0 ? stageLabelForFrame(visibleItems[itemPosition - 1].frame) : '';

    return stage !== previousStage
      ? [{ type: 'stage' as const, stage }, { type: 'item' as const, ...item }]
      : [{ type: 'item' as const, ...item }];
  });

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [activeIndex]);

  const hasCompletedInternal = (toolName?: string, itemIndex?: number) => {
    if (!isInternalToolName(toolName) || itemIndex === undefined) {
      return false;
    }

    return frames
      .slice(itemIndex + 1, activeIndex + 1)
      .some((frame) => frame.role === 'tool' && frame.toolName === toolName);
  };

  const isActiveItem = (frame: Frame, index: number) => {
    if (index === activeIndex) {
      return true;
    }

    return Boolean(
      activeFrame?.role === 'tool' &&
      isInternalToolName(activeFrame.toolName) &&
      frame.role === 'assistant' &&
      frame.toolName === activeFrame.toolName,
    );
  };

  return (
    <aside className="arch-chat-panel" aria-label="Agent chat log">
      <div className="arch-chat-header">
        <div>
          <span>Agent run</span>
          <h2>Execution log</h2>
        </div>
        <strong>
          {isPlaying && <LoaderCircle size={12} className="arch-chat-spinner" />}
          {isPlaying ? 'running' : activeIndex >= 0 ? 'ready' : 'idle'}
        </strong>
      </div>

      <div className="arch-chat-stream" ref={scrollRef}>
        {visibleItems.length === 0 && (
          <div className="arch-chat-empty">
            <span>Ready</span>
            <p>Press play to stream the agent trace.</p>
          </div>
        )}

        {chatRows.map((row) => {
          if (row.type === 'stage') {
            return (
              <div key={`stage-${row.stage}`} className="arch-chat-stage">
                <span>{row.stage}</span>
              </div>
            );
          }

          const { frame, index } = row;
          const active = isActiveItem(frame, index);
          const internal = frame.role === 'assistant' && isInternalToolName(frame.toolName);
          const internalDone = hasCompletedInternal(frame.toolName, index);
          const messageTime = formatChatTimestamp(new Date());
          const itemClass = [
            'arch-chat-item',
            `arch-chat-${frame.role === 'user' ? 'intent' : frame.isTool ? 'tool' : 'message'}`,
            `arch-chat-agent-${frame.name.toLowerCase().replaceAll(' ', '-').replaceAll('_', '-')}`,
            internal ? 'arch-chat-internal' : '',
            active ? 'is-active' : '',
          ].filter(Boolean).join(' ');

          return (
            <motion.div
              key={`${index}-${frame.name}-${frame.toolName ?? frame.role}`}
              className={itemClass}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.22, ease: 'easeOut' }}
            >
              {internal ? (
                <div className="arch-chat-check-row">
                  <span className={`arch-chat-check ${internalDone ? 'is-complete' : ''}`}>
                    {internalDone ? <Check size={12} /> : <InternalActionIcon toolName={frame.toolName} />}
                  </span>
                  <div>
                    <strong>{internalLabelForTool(frame.toolName)}</strong>
                    <ChatMarkdown text={frame.text} />
                  </div>
                </div>
              ) : frame.role === 'user' ? (
                <>
                  <div className="arch-chat-meta">
                    <FileText size={13} />
                    <span>Intent</span>
                  </div>
                  <ChatMarkdown text={frame.text} />
                </>
              ) : frame.isTool ? (
                <>
                  <div className="arch-chat-meta">
                    <Zap size={13} />
                    <span>{frame.role === 'assistant' ? 'Tool call' : 'Tool result'}</span>
                  </div>
                  <strong>{frame.toolName}</strong>
                  {frame.toolDetails && frame.toolDetails.length > 0 && (
                    <div className="arch-chat-tool-grid">
                      {frame.toolDetails.slice(0, 4).map((detail) => (
                        <div key={detail.key}>
                          <span>{detail.key}</span>
                          <p>{detail.value}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <>
                  <div className="arch-chat-meta">
                    <Bot size={13} />
                    <span>{frame.name}</span>
                  </div>
                  <ChatMarkdown text={frame.text} />
                </>
              )}
              <time className="arch-chat-time" dateTime={messageTime}>{messageTime}</time>
            </motion.div>
          );
        })}

        {isPlaying && (
          <div className="arch-chat-working" aria-live="polite">
            <LoaderCircle size={13} className="arch-chat-spinner" />
            <span>{activeFrame ? `Working on ${stageLabelForFrame(activeFrame).toLowerCase()}` : 'Working'}</span>
          </div>
        )}
      </div>
    </aside>
  );
};

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

  const getBubbleStyle = (nodeId?: string) => {
    switch (nodeId) {
      case 'ue-request':
      case 'srf':
      case 'planning-agent':
        return {
          bubble: { top: 0, left: 'calc(100% + 20px)', transform: 'none' },
          arrow: { top: '24px', left: '-6px', borderBottom: '1px solid #cbd5e1', borderLeft: '1px solid #cbd5e1' }
        };
      case 'connection-agent':
      case 'data-agent':
      case 'computing-agent':
      case 'am-tools':
      case 'udm-tools':
      case 'sm-tools':
      case 'up-tools':
        return {
          bubble: { top: 0, right: 'calc(100% + 20px)', left: 'auto', transform: 'none' },
          arrow: { top: '24px', right: '-6px', left: 'auto', borderTop: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }
        };
      case 'connection-skill':
      case 'qos-skill':
        return {
          bubble: { top: 'calc(100% + 20px)', left: '50%', transform: 'translateX(-50%)' },
          arrow: { top: '-6px', left: '50%', marginLeft: '-6px', borderTop: '1px solid #cbd5e1', borderLeft: '1px solid #cbd5e1' }
        };
      default:
        return {
          bubble: { bottom: 'calc(100% + 20px)', left: '50%', transform: 'translateX(-50%)' },
          arrow: { bottom: '-6px', left: '50%', marginLeft: '-6px', borderBottom: '1px solid #cbd5e1', borderRight: '1px solid #cbd5e1' }
        };
    }
  };

  const bStyle = getBubbleStyle(data.nodeId);

  return (
    <article
      className={`arch-node arch-node-${data.type} arch-node-id-${data.nodeId ?? 'unknown'} ${data.emphasis === 'primary' ? 'arch-node-primary' : ''} ${data.animationState ? `is-${data.animationState}` : ''}`}
      onClick={data.type === 'skill' ? () => data.onInspectSkill?.(data.nodeId!) : undefined}
      style={{ cursor: data.type === 'skill' ? 'pointer' : 'default' }}
    >
      {data.currentMessage && (
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          transition={{ type: 'spring', stiffness: 350, damping: 25 }}
          style={{
            position: 'absolute',
            background: 'white',
            border: '1px solid #cbd5e1',
            borderRadius: '12px',
            padding: '12px',
            width: 'max-content',
            maxWidth: '280px',
            boxShadow: '0 10px 25px rgba(0,0,0,0.1)',
            zIndex: 50,
            pointerEvents: 'none',
            ...bStyle.bubble,
          }}
        >
          {data.currentMessage.isTool && data.currentMessage.toolName ? (
            <div style={{ backgroundColor: '#f8fafc', borderRadius: '6px', border: '1px solid #e2e8f0', overflow: 'hidden' }}>
              <div style={{ padding: '6px 8px', backgroundColor: '#f1f5f9', borderBottom: '1px solid #e2e8f0', fontSize: '0.75rem', fontWeight: 600, color: '#334155', display: 'flex', alignItems: 'center', gap: '4px' }}>
                <Zap size={12} className="text-blue-500" />
                {data.currentMessage.role === 'assistant' ? 'call' : 'response'}: {data.currentMessage.toolName}
              </div>
              <div style={{ padding: '6px 8px', fontSize: '0.75rem', color: '#475569', fontFamily: 'monospace', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {data.currentMessage.toolDetails?.map((detail, idx) => (
                  <div key={idx} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontWeight: 600, color: '#64748b' }}>{detail.key}:</span>
                    <span style={{ wordBreak: 'break-all' }}>{detail.value}</span>
                  </div>
                ))}
              </div>
            </div>
          ) : data.currentMessage.isSystemAction ? (
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '8px' }}>
              <div style={{ width: '20px', height: '20px', borderRadius: '10px', background: '#eff6ff', border: '1px solid #bfdbfe', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: '2px' }}>
                <Check size={12} className="text-blue-600" />
              </div>
              <div style={{ fontSize: '0.85rem', color: '#1e293b', fontWeight: 500, lineHeight: 1.4 }}>
                {data.currentMessage.text}
              </div>
            </div>
          ) : (
            <>
              <div style={{ fontSize: '0.7rem', fontWeight: 'bold', color: '#64748b', textTransform: 'uppercase', marginBottom: '4px' }}>
                {data.currentMessage.name || 'User'}
              </div>
              <div style={{ fontSize: '0.85rem', color: '#0f172a', fontFamily: 'inherit', whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                {data.currentMessage.text}
              </div>
            </>
          )}
          <div style={{
            position: 'absolute',
            width: '12px',
            height: '12px',
            background: 'white',
            transform: 'rotate(45deg)',
            ...bStyle.arrow,
          }} />
        </motion.div>
      )}
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
              role="button"
              tabIndex={0}
              onClick={(event) => {
                event.stopPropagation();
                data.onInspectTool?.(tool.id, data.nodeId ?? '');
              }}
              onKeyDown={(event) => {
                if (event.key === 'Enter' || event.key === ' ') {
                  event.preventDefault();
                  event.stopPropagation();
                  data.onInspectTool?.(tool.id, data.nodeId ?? '');
                }
              }}
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
        padding: 0.16,
        duration: 120,
      });
      window.setTimeout(() => {
        void fitView({ padding: 0.16, duration: 0 });
      }, 180);
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

const FineZoomControls: React.FC = () => {
  const { getViewport, zoomTo } = useReactFlow();
  const zoomStep = 0.08;

  return (
    <>
      <ControlButton
        aria-label="Zoom in"
        title="Zoom in"
        onClick={() => {
          const { zoom } = getViewport();
          void zoomTo(Math.min(1.5, zoom + zoomStep), { duration: 120 });
        }}
      >
        +
      </ControlButton>
      <ControlButton
        aria-label="Zoom out"
        title="Zoom out"
        onClick={() => {
          const { zoom } = getViewport();
          void zoomTo(Math.max(0.35, zoom - zoomStep), { duration: 120 });
        }}
      >
        -
      </ControlButton>
    </>
  );
};

const ArchitectureGraph: React.FC = () => {
  const [storyPhase, setStoryPhase] = useState<StoryPhase>('idle');
  const [completedArtifacts, setCompletedArtifacts] = useState<ArtifactId[]>([]);
  const [activeTools, setActiveTools] = useState<ToolId[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [frameIndex, setFrameIndex] = useState(-1);
  const [selectedDetail, setSelectedDetail] = useState<InspectDetail | null>(null);
  const runRef = useRef(0);

  const activeStage = phaseToStage(storyPhase);
  const currentFrame = frameIndex >= 0 && frameIndex < frames.length ? frames[frameIndex] : null;
  const msgcapFilename = useMemo(() => formatMsgcapFilename(new Date()), []);

  const openSkillDetail = useCallback((nodeId: string) => {
    const node = ARCHITECTURE_NODES.find((candidate) => candidate.id === nodeId);
    const detail = skillDetails[nodeId];
    setSelectedDetail(detail ?? {
      kind: 'skill',
      title: node?.data.label ?? 'Skill',
      subtitle: node?.data.subtitle ?? 'ARF skill',
      description: node?.data.description ?? 'Skill details are not available yet.',
      facts: [
        { key: 'Owner', value: 'ARF skill repository' },
        { key: 'Node', value: nodeId },
      ],
    });
  }, []);

  const openToolDetail = useCallback((toolId: string, nodeId: string) => {
    const node = ARCHITECTURE_NODES.find((candidate) => candidate.id === nodeId);
    const tool = node?.data.tools?.find((candidate) => candidate.id === toolId);

    if (!node || !tool) {
      return;
    }

    setSelectedDetail({
      kind: 'tool',
      title: tool.name,
      subtitle: `${node.data.label} / ${tool.purpose}`,
      description: tool.description ?? tool.purpose,
      facts: [
        { key: 'NF owner', value: node.data.label },
        { key: 'Input', value: tool.input ?? 'No input specified' },
        { key: 'Endpoint', value: tool.endpoint ?? 'Not specified' },
      ],
      parameters: tool.parameters,
    });
  }, []);

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
        currentMessage: undefined,
        onInspectSkill: openSkillDetail,
        onInspectTool: openToolDetail,
      },
    }));
  }, [activeStage, activeTools, completedArtifacts, storyPhase, openSkillDetail, openToolDetail]);

  const edges = useMemo<Edge[]>(() => {
    return [
      {
        id: 'ue-planning',
        source: 'ue-request',
        target: 'planning-agent',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'storyEdge',
        data: {
          tone: 'intent',
          isVisible: storyPhase === 'intent-to-planning',
          tokenVisible: false,
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
          tokenVisible: false,
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
          tokenVisible: false,
          tokenCard: flowCards['connection-task'],
        },
      },
      {
        id: 'connection-am',
        source: 'connection-agent',
        target: 'am-tools',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'storyEdge',
        data: {
          tone: 'tool',
          isVisible: currentFrame?.toolName === 'Subscription_tool' || currentFrame?.toolName === 'Create_Or_Update_Subnet_Context_tool',
          tokenVisible: false,
        },
      },
      {
        id: 'connection-udm',
        source: 'connection-agent',
        target: 'udm-tools',
        sourceHandle: 'right',
        targetHandle: 'left',
        type: 'storyEdge',
        data: {
          tone: 'tool',
          isVisible: currentFrame?.toolName === 'Issue_Access_Token_tool' || currentFrame?.toolName === 'Validate_Access_Token_tool',
          tokenVisible: false,
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
          tone: 'owner',
          isVisible: currentFrame?.toolName === 'Create_Subnet_PDUSession_tool',
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
          isVisible: storyPhase === 'complete',
          tokenVisible: false,
        },
      },
    ];
  }, [storyPhase, currentFrame]);

  const runStoryboard = async () => {
    const runId = runRef.current + 1;
    runRef.current = runId;
    setIsPlaying(true);
    setCompletedArtifacts([]);
    setActiveTools([]);
    setStoryPhase('idle');
    setFrameIndex(-1);
    await sleep(180);

    let currentArtifacts: ArtifactId[] = [];

    for (let i = 0; i < frames.length; i++) {
      if (runRef.current !== runId) return;

      const frame = frames[i];
      setFrameIndex(i);
      setStoryPhase(frame.phase);

      if (frame.phase === 'intent-to-planning') currentArtifacts = ['planning-intent'];
      if (frame.phase === 'skill-to-planning') currentArtifacts = ['planning-intent', 'planning-skill'];
      if (frame.phase === 'delegation') currentArtifacts = ['planning-intent', 'planning-skill', 'planning-delegation'];
      if (frame.phase === 'connection-planning') currentArtifacts = ['planning-intent', 'planning-skill', 'connection-task', 'connection-checklist'];
      
      setCompletedArtifacts(currentArtifacts);

      if (frame.isTool && frame.role === 'assistant') {
         if (frame.text.includes('Subscription')) {
            setActiveTools(['subscription-tool']);
         } else if (frame.text.includes('Context')) {
            setActiveTools(['subnet-context-tool']);
         } else if (frame.text.includes('Issue')) {
            setActiveTools(['issue-token-tool']);
         } else if (frame.text.includes('Validate')) {
            setActiveTools(['validate-token-tool']);
         } else if (frame.text.includes('PDU')) {
            setActiveTools(['create-pdu-tool']);
         }
      }

      await sleep(getFrameDelay(frame));
    }

    if (runRef.current !== runId) return;
    setStoryPhase('complete');
    setActiveTools(['forwarding-rule-tool']);
    setIsPlaying(false);
  };

  const handlePlay = () => {
    void runStoryboard();
  };

  return (
    <div className="arch-demo">
      <header className="arch-topbar">
        <div className="arch-brand">
          <div className="arch-brand-mark">
            <Zap size={15} />
          </div>
          <div>
            <h1>AICore Intent Tracing Portal</h1>
            <label className="arch-trace-picker">
              <span>Msgcap</span>
              <select value={msgcapFilename} onChange={() => undefined} aria-label="Message capture file">
                <option value={msgcapFilename}>{msgcapFilename}</option>
              </select>
            </label>
          </div>
        </div>
        <button type="button" className="arch-step-button" onClick={handlePlay} disabled={isPlaying} style={{ minWidth: 'auto', padding: '0.6rem', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          {storyPhase === 'complete' ? <RotateCcw size={18} /> : <Play size={18} style={{ opacity: isPlaying ? 0.5 : 1 }} />}
        </button>
      </header>

      <main className="arch-layout">
        <div className="arch-workbench">
          <AgentChatPanel frames={frames} activeIndex={frameIndex} isPlaying={isPlaying} />
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
                fitViewOptions={{ padding: 0.16 }}
                minZoom={0.35}
                maxZoom={1.5}
                nodesDraggable={false}
                nodesConnectable={false}
                nodesFocusable
                edgesFocusable={false}
                elementsSelectable
                panOnDrag
                zoomOnScroll
                zoomOnPinch
                zoomOnDoubleClick={false}
                proOptions={{ hideAttribution: true }}
              >
                <Background color="#dbeafe" gap={28} size={1} />
                <Controls showZoom={false} showInteractive={false}>
                  <FineZoomControls />
                </Controls>
                <AutoFitViewport />
              </ReactFlow>
            </div>
          </section>
        </div>
      </main>
      <DetailPopout detail={selectedDetail} onClose={() => setSelectedDetail(null)} />
    </div>
  );
};

export default ArchitectureGraph;
