import React from 'react';
import { X, Plus, Trash2 } from 'lucide-react';
import type { ArchitectureNodeData, ArchitectureHandle } from '../../lib/architectureData';

interface CardEditPanelProps {
  nodeId: string;
  data: ArchitectureNodeData;
  onUpdate: (id: string, updates: Partial<ArchitectureNodeData>) => void;
  onClose: () => void;
}

const CardEditPanel: React.FC<CardEditPanelProps> = ({ nodeId, data, onUpdate, onClose }) => {
  const handleInputChange = <K extends keyof ArchitectureNodeData>(field: K, value: ArchitectureNodeData[K]) => {
    onUpdate(nodeId, { [field]: value });
  };

  const updateHandle = (index: number, updates: Partial<ArchitectureHandle>) => {
    const newHandles = [...(data.handles || [])];
    newHandles[index] = { ...newHandles[index], ...updates };
    onUpdate(nodeId, { handles: newHandles });
  };

  const addHandle = () => {
    const newHandles = [...(data.handles || []), { type: 'source' as const, position: 'right' as const }];
    onUpdate(nodeId, { handles: newHandles });
  };

  const removeHandle = (index: number) => {
    const newHandles = (data.handles || []).filter((_, i) => i !== index);
    onUpdate(nodeId, { handles: newHandles });
  };

  return (
    <div className="arch-edit-panel">
      <header className="arch-edit-header">
        <h2>Edit {data.type}</h2>
        <button onClick={onClose} className="arch-close-btn">
          <X size={18} />
        </button>
      </header>

      <div className="arch-edit-content">
        <div className="arch-edit-section">
          <label>Label</label>
          <input
            type="text"
            value={data.label}
            onChange={(e) => handleInputChange('label', e.target.value)}
          />
        </div>

        <div className="arch-edit-section">
          <label className="arch-checkbox-label">
            <input
              type="checkbox"
              checked={data.showDefaultHandles !== false}
              onChange={(e) => handleInputChange('showDefaultHandles', e.target.checked)}
            />
            <span>Show default handles</span>
          </label>
        </div>

        <div className="arch-edit-section">
          <label>Subtitle</label>
          <input
            type="text"
            value={data.subtitle || ''}
            onChange={(e) => handleInputChange('subtitle', e.target.value)}
          />
        </div>

        <div className="arch-edit-section">
          <label>Description</label>
          <textarea
            value={data.description || ''}
            onChange={(e) => handleInputChange('description', e.target.value)}
          />
        </div>

        <div className="arch-edit-section">
          <div className="arch-section-header">
            <label>Handles</label>
            <button onClick={addHandle} className="arch-add-btn">
              <Plus size={14} /> Add
            </button>
          </div>
          <div className="arch-handle-list">
            {(data.handles || []).map((handle, index) => (
              <div key={index} className="arch-handle-item">
                <select
                  value={handle.type}
                  onChange={(e) => updateHandle(index, { type: e.target.value as 'source' | 'target' })}
                >
                  <option value="source">Source</option>
                  <option value="target">Target</option>
                </select>
                <select
                  value={handle.position}
                  onChange={(e) => updateHandle(index, { position: e.target.value as 'left' | 'right' })}
                >
                  <option value="left">Left</option>
                  <option value="right">Right</option>
                </select>
                <button onClick={() => removeHandle(index)} className="arch-delete-btn">
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
            {(!data.handles || data.handles.length === 0) && (
              <div className="arch-empty-text">No custom handles.</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CardEditPanel;
