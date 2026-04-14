import type { Edge, Node } from '@xyflow/react';

export type ArchitectureNodeType = 'srf' | 'agent' | 'registry' | 'gateway' | 'nf' | 'domain';
export type ArchitectureDomain = 'Ingress' | 'Agent Runtime' | 'Discovery' | 'NF Tool Domain';
export type EdgeKind = 'ingress' | 'handoff' | 'discovery' | 'tool-call';

export interface ArchitectureTool {
  id: string;
  label: string;
}

export interface ArchitectureSkill {
  id: string;
  label: string;
}

export interface ArchitectureHandle {
  id?: string;
  type: 'source' | 'target';
  position: 'top' | 'bottom' | 'left' | 'right';
}

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  type: ArchitectureNodeType;
  domain?: ArchitectureDomain;
  subtitle?: string;
  description?: string;
  skills?: ArchitectureSkill[];
  tools?: ArchitectureTool[];
  handles?: ArchitectureHandle[];
  showDefaultHandles?: boolean;
}

export interface ArchitectureEdgeData extends Record<string, unknown> {
  kind: EdgeKind;
}

const groupStyle = (width: number, height: number, border: string, background: string) => ({
  width,
  height,
  border,
  background,
  borderRadius: 8,
});

export const ARCHITECTURE_NODES: Node<ArchitectureNodeData>[] = [
  {
    id: 'group-agent',
    type: 'architectureNode',
    position: { x: 260, y: 70 },
    style: groupStyle(820, 390, '1px solid rgba(168, 85, 247, 0.28)', 'rgba(250, 245, 255, 0.46)'),
    data: { label: 'Agent Runtime', type: 'domain', domain: 'Agent Runtime', subtitle: 'Decision layer' },
  },
  {
    id: 'group-nf',
    type: 'architectureNode',
    position: { x: 1150, y: 70 },
    style: groupStyle(300, 620, '1px solid rgba(14, 165, 233, 0.28)', 'rgba(240, 249, 255, 0.5)'),
    data: { label: 'NF Tool Domain', type: 'domain', domain: 'NF Tool Domain', subtitle: 'Callable tool providers' },
  },
  {
    id: 'srf',
    type: 'architectureNode',
    position: { x: 80, y: 250 },
    data: {
      label: 'SRF',
      type: 'srf',
      domain: 'Ingress',
      subtitle: 'Request normalizer',
      description: 'Normalizes the user request before it enters the agent runtime.',
      showDefaultHandles: true,
    },
  },
  {
    id: 'acrf',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 520, y: 46 },
    extent: 'parent',
    data: {
      label: 'ACRF',
      type: 'registry',
      domain: 'Agent Runtime',
      subtitle: 'Capability registry',
      description: 'Indexes capabilities and returns matching skills. It is not an executor.',
      showDefaultHandles: true,
      skills: [
        { id: 'network-prepare', label: 'network.prepare-session' },
        { id: 'sensing-context', label: 'sensing.execute-with-context' },
        { id: 'compute-reserve', label: 'compute.reserve' },
        { id: 'policy-match', label: 'policy.match' },
      ],
    },
  },
  {
    id: 'system-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 42, y: 180 },
    extent: 'parent',
    data: {
      label: 'System Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Dispatcher',
      description: 'Classifies the task and routes work to specialized agents.',
      showDefaultHandles: true,
    },
  },
  {
    id: 'connection-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 250, y: 168 },
    extent: 'parent',
    data: {
      label: 'Connection Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Connectivity prep',
      description: 'Handles connectivity preparation before the sensing service runs.',
      showDefaultHandles: true,
    },
  },
  {
    id: 'compute-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 250, y: 48 },
    extent: 'parent',
    data: {
      label: 'Compute Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Compute support',
      description: 'Represents compute support when a service needs placement or resources.',
      showDefaultHandles: true,
    },
  },
  {
    id: 'sense-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 250, y: 288 },
    extent: 'parent',
    data: {
      label: 'Sense Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Sensing workflow',
      description: 'Handles the sensing-specific part of the request.',
      showDefaultHandles: true,
    },
  },
  {
    id: 'igw',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 548, y: 288 },
    extent: 'parent',
    data: {
      label: 'IGW',
      type: 'gateway',
      domain: 'Agent Runtime',
      subtitle: 'Invocation bridge',
      description: 'Bridges selected capability calls into concrete tool invocation.',
      showDefaultHandles: true,
    },
  },
  {
    id: 'am',
    parentId: 'group-nf',
    type: 'architectureNode',
    position: { x: 32, y: 46 },
    extent: 'parent',
    data: {
      label: 'AM',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Access',
      description: 'Provides access and session-admission tools.',
      showDefaultHandles: true,
      tools: [
        { id: 'prepare-access', label: 'prepareAccess' },
        { id: 'admit-device', label: 'admitDevice' },
      ],
    },
  },
  {
    id: 'sm',
    parentId: 'group-nf',
    type: 'architectureNode',
    position: { x: 32, y: 164 },
    extent: 'parent',
    data: {
      label: 'SM',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Session',
      description: 'Provides session context and setup tools.',
      showDefaultHandles: true,
      tools: [
        { id: 'setup-session', label: 'setupSession' },
        { id: 'bind-context', label: 'bindContext' },
      ],
    },
  },
  {
    id: 'policy',
    parentId: 'group-nf',
    type: 'architectureNode',
    position: { x: 32, y: 282 },
    extent: 'parent',
    data: {
      label: 'Policy',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Decision',
      description: 'Provides policy and resource decision tools.',
      showDefaultHandles: true,
      tools: [
        { id: 'evaluate-policy', label: 'evaluatePolicy' },
        { id: 'select-profile', label: 'selectProfile' },
      ],
    },
  },
  {
    id: 'db',
    parentId: 'group-nf',
    type: 'architectureNode',
    position: { x: 32, y: 400 },
    extent: 'parent',
    data: {
      label: 'DB',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'State lookup',
      description: 'Provides profile and context lookup tools.',
      showDefaultHandles: true,
      tools: [
        { id: 'lookup-profile', label: 'lookupProfile' },
      ],
    },
  },
  {
    id: 'up',
    parentId: 'group-nf',
    type: 'architectureNode',
    position: { x: 32, y: 500 },
    extent: 'parent',
    data: {
      label: 'UP',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Forwarding',
      description: 'Provides execution and forwarding-related tools.',
      showDefaultHandles: true,
      tools: [
        { id: 'prepare-forwarding', label: 'prepareForwarding' },
        { id: 'execute-sensing', label: 'executeSensingTask' },
      ],
    },
  },
];

const edge = (
  id: string,
  source: string,
  target: string,
  kind: EdgeKind,
  targetHandle?: string,
  sourceHandle?: string,
): Edge<ArchitectureEdgeData> => ({
  id,
  source,
  target,
  sourceHandle,
  targetHandle,
  type: 'default',
  data: { kind },
});

export const ARCHITECTURE_EDGES: Edge<ArchitectureEdgeData>[] = [
  edge('srf-system', 'srf', 'system-agent', 'ingress'),
  edge('system-compute', 'system-agent', 'compute-agent', 'handoff'),
  edge('system-connection', 'system-agent', 'connection-agent', 'handoff'),
  edge('system-sense', 'system-agent', 'sense-agent', 'handoff'),
  edge('sense-igw', 'sense-agent', 'igw', 'handoff'),
  edge('connection-acrf', 'connection-agent', 'acrf', 'discovery'),
  edge('compute-acrf', 'compute-agent', 'acrf', 'discovery'),
  edge('sense-acrf', 'sense-agent', 'acrf', 'discovery'),
  edge('connection-am-prepare', 'connection-agent', 'am', 'tool-call', 'tool-prepare-access'),
  edge('connection-sm-setup', 'connection-agent', 'sm', 'tool-call', 'tool-setup-session'),
  edge('connection-policy-evaluate', 'connection-agent', 'policy', 'tool-call', 'tool-evaluate-policy'),
  edge('connection-db-profile', 'connection-agent', 'db', 'tool-call', 'tool-lookup-profile'),
  edge('connection-up-forwarding', 'connection-agent', 'up', 'tool-call', 'tool-prepare-forwarding'),
  edge('igw-up-sensing', 'igw', 'up', 'tool-call', 'tool-execute-sensing'),
];
