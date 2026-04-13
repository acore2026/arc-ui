import type { Node } from '@xyflow/react';

export interface ArchitectureNodeData {
  label: string;
  type: 'ue' | 'app' | 'agent' | 'core' | 'registry' | 'gateway' | 'domain' | 'ran' | 'policy';
  domain?: 'Device' | 'Network' | 'App' | 'Agent' | 'ConnectionNF';
  hideTitle?: boolean;
  description?: string;
  properties?: Record<string, string>;
}

export const ARCHITECTURE_NODES: Node[] = [
  // --- DOMAIN GROUPS (Parent Nodes) ---
  {
    id: 'group-device',
    type: 'architectureNode',
    position: { x: 20, y: 20 },
    style: { width: 260, height: 180, backgroundColor: 'rgba(240, 253, 250, 0.55)', border: '2px dashed #99f6e4', borderRadius: '8px' },
    data: { label: 'DEVICE DOMAIN', type: 'domain', domain: 'Device' },
  },
  {
    id: 'group-agent',
    type: 'architectureNode',
    position: { x: 520, y: 20 },
    style: { width: 740, height: 470, backgroundColor: 'rgba(245, 243, 255, 0.38)', border: '2px dashed #ddd6fe', borderRadius: '8px' },
    data: { label: 'AGENT DOMAIN', type: 'domain', domain: 'Agent', hideTitle: true },
  },
  {
    id: 'group-connection-nf',
    type: 'architectureNode',
    position: { x: 20, y: 260 },
    style: { width: 440, height: 300, backgroundColor: 'rgba(236, 253, 245, 0.38)', border: '2px dashed #bbf7d0', borderRadius: '8px' },
    data: { label: 'CONNECTION NF DOMAIN', type: 'domain', domain: 'ConnectionNF', hideTitle: true },
  },

  // --- DEVICE DOMAIN NODES ---
  {
    id: 'ue-phone',
    parentId: 'group-device',
    type: 'architectureNode',
    position: { x: 80, y: 40 },
    extent: 'parent',
    data: { 
      label: 'Phone', 
      type: 'ue',
      domain: 'Device',
      description: 'Standard smartphone with 6G capabilities.',
      properties: { 'ID': 'SUCI_P001', 'Status': 'Active' }
    },
  },

  // --- TOP-LEFT NETWORK ACCESS NODE ---
  {
    id: 'srf',
    type: 'architectureNode',
    position: { x: 320, y: 70 },
    data: { 
      label: 'SRF', 
      type: 'core',
      domain: 'Network',
      description: 'Service Routing Function. Connects user equipment to the network intelligence layer.',
      properties: { 'Latency': '<0.5ms', 'Protocol': '6G-S' }
    },
  },

  // --- CONNECTION NF DOMAIN NODES ---
  {
    id: 'amf',
    parentId: 'group-connection-nf',
    type: 'architectureNode',
    position: { x: 40, y: 60 },
    extent: 'parent',
    data: {
      label: 'AMF',
      type: 'core',
      domain: 'ConnectionNF',
      description: 'Access and mobility function for connection session control.',
      properties: { 'Role': 'Access', 'Status': 'Ready' }
    },
  },
  {
    id: 'smf',
    parentId: 'group-connection-nf',
    type: 'architectureNode',
    position: { x: 170, y: 60 },
    extent: 'parent',
    data: {
      label: 'SMF',
      type: 'core',
      domain: 'ConnectionNF',
      description: 'Session management function for connection setup.',
      properties: { 'Role': 'Session', 'Status': 'Ready' }
    },
  },
  {
    id: 'pcf',
    parentId: 'group-connection-nf',
    type: 'architectureNode',
    position: { x: 300, y: 60 },
    extent: 'parent',
    data: {
      label: 'PCF',
      type: 'policy',
      domain: 'ConnectionNF',
      description: 'Policy control function for connection policy decisions.',
      properties: { 'Role': 'Policy', 'Status': 'Ready' }
    },
  },
  {
    id: 'db',
    parentId: 'group-connection-nf',
    type: 'architectureNode',
    position: { x: 105, y: 180 },
    extent: 'parent',
    data: {
      label: 'DB',
      type: 'registry',
      domain: 'ConnectionNF',
      description: 'Connection-state and subscriber data store.',
      properties: { 'Role': 'Store', 'Status': 'Ready' }
    },
  },
  {
    id: 'upf',
    parentId: 'group-connection-nf',
    type: 'architectureNode',
    position: { x: 235, y: 180 },
    extent: 'parent',
    data: {
      label: 'UPF',
      type: 'gateway',
      domain: 'ConnectionNF',
      description: 'User plane function for data path forwarding.',
      properties: { 'Role': 'User Plane', 'Status': 'Ready' }
    },
  },

  // --- AGENT DOMAIN NODES ---
  {
    id: 'system-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 40, y: 180 },
    extent: 'parent',
    data: { 
      label: 'System Agent', 
      type: 'agent',
      domain: 'Agent',
      description: 'The master orchestrator analyzing intent and routing to specialized skill agents.',
      properties: { 'LLM': 'Active', 'Role': 'Orchestrator' }
    },
  },
  {
    id: 'conn-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 280, y: 60 },
    extent: 'parent',
    data: { 
      label: 'ConnAgent / AAIHF', 
      type: 'agent',
      domain: 'Agent',
      description: 'Specialized agent for managing secure connectivity and subnet onboarding.',
      properties: { 'Capability': 'Networking', 'Status': 'Ready' }
    },
  },
  {
    id: 'compute-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 280, y: 180 },
    extent: 'parent',
    data: { 
      label: 'Compute Agent', 
      type: 'agent',
      domain: 'Agent',
      description: 'Agent focused on computational task offloading and resource placement.',
      properties: { 'Capability': 'Compute', 'Status': 'Ready' }
    },
  },
  {
    id: 'sense-agent',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 280, y: 300 },
    extent: 'parent',
    data: { 
      label: 'Sense Agent', 
      type: 'agent',
      domain: 'Agent',
      description: 'Agent specialized in environmental sensing and data acquisition.',
      properties: { 'Capability': 'Sensing', 'Status': 'Ready' }
    },
  },
  {
    id: 'acrf',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 560, y: 180 },
    extent: 'parent',
    data: { 
      label: 'ACRF', 
      type: 'registry',
      domain: 'Agent',
      description: 'Agent Capability Repository Function. Stores skill definitions and embeddings.',
      properties: { 'Opt1': 'LLM Thinking', 'Opt2': 'Vector Store' }
    },
  },
  {
    id: 'igw',
    parentId: 'group-agent',
    type: 'architectureNode',
    position: { x: 560, y: 320 },
    extent: 'parent',
    data: { 
      label: 'IGW', 
      type: 'gateway',
      domain: 'Agent',
      description: 'Intelligence Gateway. Registers new skills and agents into the ACRF.',
      properties: { 'Action': 'RegisterSkill', 'Auth': 'Verified' }
    },
  },
];

export const ARCHITECTURE_EDGES = [
  // UE -> SystemAgent via SRF
  { id: 'e-phone-srf', source: 'ue-phone', target: 'srf' },
];
