import type { Edge, Node } from '@xyflow/react';

export type ArchitectureNodeType = 'phone' | 'srf' | 'agent' | 'registry' | 'gateway' | 'nf' | 'domain';
export type ArchitectureDomain = 'Device' | 'Ingress' | 'Agent Runtime' | 'Discovery' | 'NF Tool Domain';
export type EdgeKind = 'ingress' | 'handoff' | 'discovery' | 'tool-call';

export interface ArchitectureTool {
  id: string;
  label: string;
}

export interface ArchitectureSkill {
  id: string;
  label: string;
}

export interface ArchitectureNodeData extends Record<string, unknown> {
  label: string;
  type: ArchitectureNodeType;
  domain?: ArchitectureDomain;
  subtitle?: string;
  description?: string;
  skills?: ArchitectureSkill[];
  tools?: ArchitectureTool[];
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
    id: 'group-device',
    type: 'architectureNode',
    position: { x: 20, y: 220 },
    style: groupStyle(190, 170, '1px solid rgba(45, 212, 191, 0.36)', 'rgba(240, 253, 250, 0.64)'),
    data: { label: 'Device', type: 'domain', domain: 'Device', subtitle: 'Request origin' },
  },
  {
    id: 'group-agent',
    type: 'architectureNode',
    position: { x: 460, y: 120 },
    style: groupStyle(620, 360, '1px solid rgba(168, 85, 247, 0.28)', 'rgba(250, 245, 255, 0.46)'),
    data: { label: 'Agent Runtime', type: 'domain', domain: 'Agent Runtime', subtitle: 'Decision layer' },
  },
  {
    id: 'group-discovery',
    type: 'architectureNode',
    position: { x: 1120, y: 168 },
    style: groupStyle(260, 260, '1px solid rgba(245, 158, 11, 0.34)', 'rgba(255, 251, 235, 0.6)'),
    data: { label: 'Discovery', type: 'domain', domain: 'Discovery', subtitle: 'Skill registry' },
  },
  {
    id: 'group-nf',
    type: 'architectureNode',
    position: { x: 1420, y: 70 },
    style: groupStyle(300, 600, '1px solid rgba(14, 165, 233, 0.28)', 'rgba(240, 249, 255, 0.5)'),
    data: { label: 'NF Tool Domain', type: 'domain', domain: 'NF Tool Domain', subtitle: 'Callable tool providers' },
  },
  {
    id: 'phone',
    parentId: 'group-device',
    type: 'architectureNode',
    position: { x: 38, y: 58 },
    extent: 'parent',
    data: {
      label: 'Phone',
      type: 'phone',
      domain: 'Device',
      subtitle: 'Sensing request',
      description: 'Originates the service request and receives the final response.',
    },
  },
  {
    id: 'srf',
    type: 'architectureNode',
    position: { x: 250, y: 266 },
    data: {
      label: 'SRF',
      type: 'srf',
      domain: 'Ingress',
      subtitle: 'Request normalizer',
      description: 'Normalizes the user request before it enters the agent runtime.',
    },
  },
  {
    id: 'system-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 42, y: 136 },
    extent: 'parent',
    data: {
      label: 'System Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Dispatcher',
      description: 'Classifies the task and routes work to specialized agents.',
    },
  },
  {
    id: 'connection-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 250, y: 66 },
    extent: 'parent',
    data: {
      label: 'Connection Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Connectivity prep',
      description: 'Handles connectivity preparation before the sensing service runs.',
    },
  },
  {
    id: 'compute-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 442, y: 66 },
    extent: 'parent',
    data: {
      label: 'Compute Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Compute support',
      description: 'Represents compute support when a service needs placement or resources.',
    },
  },
  {
    id: 'sense-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 250, y: 234 },
    extent: 'parent',
    data: {
      label: 'Sense Agent',
      type: 'agent',
      domain: 'Agent Runtime',
      subtitle: 'Sensing workflow',
      description: 'Handles the sensing-specific part of the request.',
    },
  },
  {
    id: 'igw',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 442, y: 234 },
    extent: 'parent',
    data: {
      label: 'IGW',
      type: 'gateway',
      domain: 'Agent Runtime',
      subtitle: 'Invocation bridge',
      description: 'Bridges selected capability calls into concrete tool invocation.',
    },
  },
  {
    id: 'acrf',
    parentId: 'group-discovery',
    type: 'architectureNode',
    position: { x: 42, y: 38 },
    extent: 'parent',
    data: {
      label: 'ACRF',
      type: 'registry',
      domain: 'Discovery',
      subtitle: 'Capability registry',
      description: 'Indexes capabilities and returns matching skills. It is not an executor.',
      skills: [
        { id: 'network-prepare', label: 'network.prepare-session' },
        { id: 'sensing-context', label: 'sensing.execute-with-context' },
        { id: 'compute-reserve', label: 'compute.reserve' },
        { id: 'policy-match', label: 'policy.match' },
      ],
    },
  },
  {
    id: 'am',
    parentId: 'group-nf',
    type: 'architectureNode',
    position: { x: 34, y: 44 },
    extent: 'parent',
    data: {
      label: 'AM',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Access',
      description: 'Provides access and session-admission tools.',
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
    position: { x: 34, y: 146 },
    extent: 'parent',
    data: {
      label: 'SM',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Session',
      description: 'Provides session context and setup tools.',
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
    position: { x: 34, y: 248 },
    extent: 'parent',
    data: {
      label: 'Policy',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Decision',
      description: 'Provides policy and resource decision tools.',
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
    position: { x: 34, y: 350 },
    extent: 'parent',
    data: {
      label: 'DB',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'State lookup',
      description: 'Provides profile and context lookup tools.',
      tools: [
        { id: 'lookup-profile', label: 'lookupProfile' },
      ],
    },
  },
  {
    id: 'up',
    parentId: 'group-nf',
    type: 'architectureNode',
    position: { x: 34, y: 452 },
    extent: 'parent',
    data: {
      label: 'UP',
      type: 'nf',
      domain: 'NF Tool Domain',
      subtitle: 'Forwarding',
      description: 'Provides execution and forwarding-related tools.',
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
  type: 'smoothstep',
  data: { kind },
});

export const ARCHITECTURE_EDGES: Edge<ArchitectureEdgeData>[] = [
  edge('phone-srf', 'phone', 'srf', 'ingress'),
  edge('srf-system', 'srf', 'system-agent', 'ingress'),
  edge('system-connection', 'system-agent', 'connection-agent', 'handoff'),
  edge('system-sense', 'system-agent', 'sense-agent', 'handoff'),
  edge('sense-igw', 'sense-agent', 'igw', 'handoff'),
  edge('connection-acrf', 'connection-agent', 'acrf', 'discovery'),
  edge('compute-acrf', 'compute-agent', 'acrf', 'discovery'),
  edge('sense-acrf', 'sense-agent', 'acrf', 'discovery'),
  edge('connection-am-prepare', 'connection-agent', 'am', 'tool-call', 'tool-prepare-access', 'tool-source'),
  edge('connection-sm-setup', 'connection-agent', 'sm', 'tool-call', 'tool-setup-session', 'tool-source'),
  edge('connection-policy-evaluate', 'connection-agent', 'policy', 'tool-call', 'tool-evaluate-policy', 'tool-source'),
  edge('connection-db-profile', 'connection-agent', 'db', 'tool-call', 'tool-lookup-profile', 'tool-source'),
  edge('connection-up-forwarding', 'connection-agent', 'up', 'tool-call', 'tool-prepare-forwarding', 'tool-source'),
  edge('igw-up-sensing', 'igw', 'up', 'tool-call', 'tool-execute-sensing', 'tool-source'),
];
