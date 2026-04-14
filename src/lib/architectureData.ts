import type { Edge, Node } from '@xyflow/react';

export type ArchitectureNodeType = 'request' | 'srf' | 'agent' | 'skill' | 'nf' | 'domain';
export type ArchitectureDomain = 'Request / Intent' | 'Agent Layer' | 'ARF' | 'TRF';
export type EdgeKind = 'ingress' | 'discovery' | 'delegation' | 'tool-call' | 'ownership';

export interface ArchitectureTool {
  id: string;
  name: string;
  purpose: string;
  input?: string;
  output?: string;
}

export interface ArchitectureCapability {
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
  nodeId?: string;
  domain?: ArchitectureDomain;
  subtitle?: string;
  description?: string;
  emphasis?: 'primary' | 'supporting';
  capabilities?: ArchitectureCapability[];
  tools?: ArchitectureTool[];
  handles?: ArchitectureHandle[];
  showDefaultHandles?: boolean;
  animationState?: 'dimmed' | 'glow' | 'owner' | 'active-tool';
  animationStage?: 'idle' | 'intent-intake' | 'agent-dispatch' | 'skill-selection' | 'delegation' | 'tool-call' | 'ownership';
  storyPhase?: string;
  completedArtifacts?: string[];
  activeTools?: string[];
}

export interface ArchitectureEdgeData extends Record<string, unknown> {
  kind: EdgeKind;
  label?: string;
}

const groupStyle = (width: number, height: number) => ({
  width,
  height,
  borderRadius: 8,
});

const layout = {
  requestX: 40,
  requestY: 230,
  requestW: 240,
  requestH: 330,
  centerX: 340,
  arfY: 24,
  arfW: 610,
  arfH: 150,
  agentY: 220,
  agentW: 610,
  agentH: 560,
  trfX: 1000,
  trfY: 70,
  trfW: 270,
  trfH: 650,
};

export const ARCHITECTURE_NODES: Node<ArchitectureNodeData>[] = [
  {
    id: 'group-request',
    type: 'architectureNode',
    position: { x: layout.requestX, y: layout.requestY },
    style: groupStyle(layout.requestW, layout.requestH),
    data: {
      label: 'Request / Intent',
      type: 'domain',
      domain: 'Request / Intent',
      subtitle: 'Arrival and routing',
    },
  },
  {
    id: 'group-agents',
    type: 'architectureNode',
    position: { x: layout.centerX, y: layout.agentY },
    style: groupStyle(layout.agentW, layout.agentH),
    data: {
      label: 'Agent Layer',
      type: 'domain',
      domain: 'Agent Layer',
      subtitle: 'Reasoning and coordination',
    },
  },
  {
    id: 'group-repositories',
    type: 'architectureNode',
    position: { x: layout.centerX, y: layout.arfY },
    style: groupStyle(layout.arfW, layout.arfH),
    data: {
      label: 'ARF',
      type: 'domain',
      domain: 'ARF',
      subtitle: 'Agent skill repository',
    },
  },
  {
    id: 'group-tools',
    type: 'architectureNode',
    position: { x: layout.trfX, y: layout.trfY },
    style: groupStyle(layout.trfW, layout.trfH),
    data: {
      label: 'TRF',
      type: 'domain',
      domain: 'TRF',
      subtitle: 'NF tool catalog',
    },
  },
  {
    id: 'ue-request',
    parentId: 'group-request',
    type: 'architectureNode',
    position: { x: 28, y: 48 },
    extent: 'parent',
    data: {
      label: 'Intent',
      type: 'request',
      domain: 'Request / Intent',
      subtitle: 'Current UE intent',
      description: 'Dynamic intent list lands here later.',
    },
  },
  {
    id: 'srf',
    parentId: 'group-request',
    type: 'architectureNode',
    position: { x: 28, y: 224 },
    extent: 'parent',
    data: {
      label: 'SRF',
      type: 'srf',
      domain: 'Request / Intent',
      subtitle: 'Routes to NW-Agent',
      description: 'Request dispatcher.',
    },
  },
  {
    id: 'connection-skill',
    parentId: 'group-repositories',
    type: 'architectureNode',
    position: { x: 36, y: 58 },
    extent: 'parent',
    data: {
      label: 'Connection Skill',
      type: 'skill',
      domain: 'ARF',
      subtitle: 'Connection assurance',
      description: 'Maps intent to connection tools.',
    },
  },
  {
    id: 'data-skill',
    parentId: 'group-repositories',
    type: 'architectureNode',
    position: { x: 230, y: 58 },
    extent: 'parent',
    data: {
      label: 'Data Skill',
      type: 'skill',
      domain: 'ARF',
      subtitle: 'Data preparation',
      description: 'Maps intent to data tasks.',
    },
  },
  {
    id: 'compute-skill',
    parentId: 'group-repositories',
    type: 'architectureNode',
    position: { x: 424, y: 58 },
    extent: 'parent',
    data: {
      label: 'Compute Skill',
      type: 'skill',
      domain: 'ARF',
      subtitle: 'Compute placement',
      description: 'Maps intent to compute tasks.',
    },
  },
  {
    id: 'planning-agent',
    parentId: 'group-agents',
    type: 'architectureNode',
    position: { x: 56, y: 160 },
    extent: 'parent',
    data: {
      label: 'Planning Agent',
      type: 'agent',
      domain: 'Agent Layer',
      subtitle: 'NW-Agent orchestrator',
      description: 'Plans tasks and tool use.',
      emphasis: 'primary',
    },
  },
  {
    id: 'connection-agent',
    parentId: 'group-agents',
    type: 'architectureNode',
    position: { x: 400, y: 30 },
    extent: 'parent',
    data: {
      label: 'Connection Agent',
      type: 'agent',
      domain: 'Agent Layer',
      subtitle: 'Connectivity domain',
      description: 'Connection and QoS tasks.',
    },
  },
  {
    id: 'data-agent',
    parentId: 'group-agents',
    type: 'architectureNode',
    position: { x: 400, y: 340 },
    extent: 'parent',
    data: {
      label: 'Data Agent',
      type: 'agent',
      domain: 'Agent Layer',
      subtitle: 'Data domain',
      description: 'Data tasks.',
    },
  },
  {
    id: 'computing-agent',
    parentId: 'group-agents',
    type: 'architectureNode',
    position: { x: 400, y: 450 },
    extent: 'parent',
    data: {
      label: 'Computing Agent',
      type: 'agent',
      domain: 'Agent Layer',
      subtitle: 'Compute domain',
      description: 'Compute tasks.',
    },
  },
  {
    id: 'am-tools',
    parentId: 'group-tools',
    type: 'architectureNode',
    position: { x: 36, y: 58 },
    extent: 'parent',
    data: {
      label: '6G AM',
      type: 'nf',
      domain: 'TRF',
      subtitle: 'Access / mobility',
      description: 'Access tools.',
      tools: [
        {
          id: 'authentication',
          name: 'Authentication Tool',
          purpose: 'Verify UE access',
          input: 'UE identity context',
          output: 'access decision',
        },
        {
          id: 'mobility',
          name: 'Mobility Management Tool',
          purpose: 'Prepare mobility',
          input: 'location and policy context',
          output: 'mobility action',
        },
      ],
    },
  },
  {
    id: 'sm-tools',
    parentId: 'group-tools',
    type: 'architectureNode',
    position: { x: 36, y: 204 },
    extent: 'parent',
    data: {
      label: '6G SM',
      type: 'nf',
      domain: 'TRF',
      subtitle: 'Session',
      description: 'Session tools.',
      tools: [
        {
          id: 'sm-characteristics',
          name: 'SM Characteristics Tool',
          purpose: 'Set session profile',
          input: 'service requirements',
          output: 'session profile',
        },
        {
          id: 'up-config',
          name: 'UP Configuration Tool',
          purpose: 'Prepare UP config',
          input: 'selected session profile',
          output: 'UP configuration',
        },
      ],
    },
  },
  {
    id: 'pcf-tools',
    parentId: 'group-tools',
    type: 'architectureNode',
    position: { x: 36, y: 350 },
    extent: 'parent',
    data: {
      label: '6G PCF',
      type: 'nf',
      domain: 'TRF',
      subtitle: 'Policy',
      description: 'Policy tools.',
      tools: [
        {
          id: 'traffic-treatment',
          name: 'Traffic Treatment Tool',
          purpose: 'Select treatment',
          input: 'intent constraints',
          output: 'policy decision',
        },
      ],
    },
  },
  {
    id: 'up-tools',
    parentId: 'group-tools',
    type: 'architectureNode',
    position: { x: 36, y: 482 },
    extent: 'parent',
    data: {
      label: '6G UP',
      type: 'nf',
      domain: 'TRF',
      subtitle: 'User plane',
      description: 'Forwarding tools.',
      tools: [
        {
          id: 'reachability',
          name: 'Reachability Tool',
          purpose: 'Check reachability',
          input: 'target service and UP state',
          output: 'reachability result',
        },
        {
          id: 'forwarding',
          name: 'Forwarding Setup Tool',
          purpose: 'Apply forwarding',
          input: 'UP configuration',
          output: 'forwarding state',
        },
      ],
    },
  },
];

export const ARCHITECTURE_EDGES: Edge<ArchitectureEdgeData>[] = [];
