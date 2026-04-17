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
  description?: string;
  endpoint?: string;
  method?: string;
  parameters?: { name: string; type: string; required: boolean; description: string }[];
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
  currentMessage?: {
    role: string;
    name: string;
    text: string;
    shortText?: string;
    timestamp?: string;
    isTool: boolean;
    toolName?: string;
    toolDetails?: { key: string; value: string }[];
    isSystemAction?: boolean;
    systemIcon?: string;
    activeNodeId: string;
  };
  onInspectSkill?: (nodeId: string) => void;
  onInspectTool?: (toolId: string, nodeId: string) => void;
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
  requestY: 270,
  requestW: 240,
  requestH: 280,
  centerX: 340,
  arfY: 24,
  arfW: 660,
  arfH: 210,
  agentY: 270,
  agentW: 660,
  agentH: 500,
  trfX: 1040,
  trfY: 40,
  trfW: 270,
  trfH: 720,
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
    position: { x: 40, y: 56 },
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
    position: { x: 52, y: 192 },
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
    position: { x: 40, y: 65 },
    extent: 'parent',
    data: {
      label: 'ACN Skill',
      type: 'skill',
      domain: 'ARF',
      subtitle: 'Agent connection',
      description: 'Defines the exact workflow, tools, and shared parameters to connect a new embodied agent into a core network subnet.',
    },
  },
  {
    id: 'qos-skill',
    parentId: 'group-repositories',
    type: 'architectureNode',
    position: { x: 340, y: 65 },
    extent: 'parent',
    data: {
      label: 'QoS Assurance Skill',
      type: 'skill',
      domain: 'ARF',
      subtitle: 'Service Quality',
      description: 'Dynamic traffic treatment to guarantee strict latency constraints.',
    },
  },
  {
    id: 'planning-agent',
    parentId: 'group-agents',
    type: 'architectureNode',
    position: { x: 56, y: 82 },
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
    id: 'computing-agent',
    parentId: 'group-agents',
    type: 'architectureNode',
    position: { x: 390, y: 82 },
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
    id: 'connection-agent',
    parentId: 'group-agents',
    type: 'architectureNode',
    position: { x: 390, y: 242 },
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
          id: 'subscription-tool',
          name: 'Subscription_tool',
          purpose: 'Verify UE access status',
          input: 'ue_id, service_type',
          description: 'Checks the UDM/UDR if the specified UE is allowed to use the requested service type.',
          endpoint: 'POST /nausf-auth/v1/ue-authentications',
          parameters: [
            { name: 'ue_id', type: 'string', required: true, description: 'The SUCI or SUPI of the UE.' },
            { name: 'service_type', type: 'string', required: true, description: 'The specific network service requested (e.g. SubnetAccess).' }
          ]
        },
        {
          id: 'subnet-context-tool',
          name: 'Create_Or_Update_Subnet_Context_tool',
          purpose: 'Prepare subnet context',
          input: 'ue_id, agent_list',
          description: 'Initializes or modifies the 6G AM context for a specific subnet, associating allowed agents.',
          endpoint: 'PUT /namf-comm/v1/ue-contexts/{ue_id}',
          parameters: [
            { name: 'ue_id', type: 'string', required: true, description: 'The SUCI or SUPI of the UE.' },
            { name: 'agent_list', type: 'array', required: false, description: 'List of agent IDs allowed in this context.' },
            { name: 'subnet_specification', type: 'integer', required: false, description: 'Optional QoS or policy ID.' }
          ]
        },
      ],
    },
  },
  {
    id: 'udm-tools',
    parentId: 'group-tools',
    type: 'architectureNode',
    position: { x: 36, y: 230 },
    extent: 'parent',
    data: {
      label: '6G UDM',
      type: 'nf',
      domain: 'TRF',
      subtitle: 'Unified data',
      description: 'Identity and profile tools.',
      tools: [
        {
          id: 'issue-token-tool',
          name: 'Issue_Access_Token_tool',
          purpose: 'Issue subnet token',
          input: 'subnet_id, agent_id',
          description: 'Generates a signed token authorizing an agent to join the specific subnet.',
          endpoint: 'POST /nudm-auth/v1/tokens',
          parameters: [
            { name: 'subnet_id', type: 'string', required: true, description: 'The target subnet identifier.' },
            { name: 'agent_id', type: 'string', required: true, description: 'The identity of the embodied agent joining.' }
          ]
        },
        {
          id: 'validate-token-tool',
          name: 'Validate_Access_Token_tool',
          purpose: 'Validate token validity',
          input: 'agent_id, provided_token',
          description: 'Validates the signature, scope, and expiry of a previously issued access token.',
          endpoint: 'POST /nudm-auth/v1/tokens/validate',
          parameters: [
            { name: 'agent_id', type: 'string', required: true, description: 'The identity of the token bearer.' },
            { name: 'provided_token', type: 'object', required: true, description: 'The token object payload to validate.' }
          ]
        },
      ],
    },
  },
  {
    id: 'sm-tools',
    parentId: 'group-tools',
    type: 'architectureNode',
    position: { x: 36, y: 402 },
    extent: 'parent',
    data: {
      label: '6G SM',
      type: 'nf',
      domain: 'TRF',
      subtitle: 'Session Management',
      description: 'Session and PDU tools.',
      tools: [
        {
          id: 'create-pdu-tool',
          name: 'Create_Subnet_PDUSession_tool',
          purpose: 'Establish PDU session',
          input: 'agent_id, subnet_id',
          description: 'Triggers the Session Management function to establish the actual network path and allocate IP resources for the agent in the specified subnet.',
          endpoint: 'POST /nsmf-pdusession/v1/sm-contexts',
          parameters: [
            { name: 'agent_id', type: 'string', required: true, description: 'The identity of the embodied agent.' },
            { name: 'subnet_id', type: 'string', required: true, description: 'The identifier of the subnet context.' }
          ]
        },
      ],
    },
  },
  {
    id: 'up-tools',
    parentId: 'group-tools',
    type: 'architectureNode',
    position: { x: 36, y: 532 },
    extent: 'parent',
    data: {
      label: '6G UP',
      type: 'nf',
      domain: 'TRF',
      subtitle: 'User plane',
      description: 'Path and forwarding tools.',
      tools: [
        {
          id: 'forwarding-rule-tool',
          name: 'Install_Forwarding_Rule_tool',
          purpose: 'Install forwarding path',
          input: 'agent_id, pdu_session_id, subnet_id',
          description: 'Programs the user-plane forwarding rule that carries agent traffic through the selected subnet path.',
          endpoint: 'POST /nupf-forwarding/v1/rules',
          parameters: [
            { name: 'agent_id', type: 'string', required: true, description: 'The identity of the embodied agent.' },
            { name: 'pdu_session_id', type: 'string', required: true, description: 'The PDU session bound to the subnet.' },
            { name: 'subnet_id', type: 'string', required: true, description: 'The target subnet identifier.' }
          ]
        },
      ],
    },
  }
];

export const ARCHITECTURE_EDGES: Edge<ArchitectureEdgeData>[] = [];
