'use client';

import { useCallback, useState } from 'react';
import {
  ReactFlow,
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

const nodeTypes = {
  // We'll use default nodes for now, can customize later
};

const initialNodes: Node[] = [
  {
    id: '1',
    type: 'input',
    data: { label: '🎯 Campaign Start' },
    position: { x: 250, y: 50 },
    style: { background: '#3B6B8F', color: 'white', border: '2px solid #2E5570', borderRadius: '8px', padding: '10px' },
  },
];

const initialEdges: Edge[] = [];

export default function WorkflowBuilder({ campaign }: { campaign: any }) {
  const [nodes, setNodes, onNodesChange] = useNodesState(
    campaign.workflow?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    campaign.workflow?.edges || initialEdges
  );
  const [selectedNodeType, setSelectedNodeType] = useState<string>('email');
  const [saving, setSaving] = useState(false);

  const onConnect = useCallback(
    (params: Connection) => {
      const edge = {
        ...params,
        type: 'smoothstep',
        animated: true,
        markerEnd: {
          type: MarkerType.ArrowClosed,
        },
      };
      setEdges((eds) => addEdge(edge, eds));
    },
    [setEdges]
  );

  const addNode = (type: string) => {
    const newNode: Node = {
      id: `node-${Date.now()}`,
      type: type === 'start' ? 'input' : type === 'end' ? 'output' : 'default',
      data: {
        label: getNodeLabel(type),
      },
      position: {
        x: Math.random() * 400 + 100,
        y: Math.random() * 400 + 100,
      },
      style: getNodeStyle(type),
    };
    setNodes((nds) => [...nds, newNode]);
  };

  const getNodeLabel = (type: string) => {
    const labels: Record<string, string> = {
      email: '📧 Send Email',
      wait: '⏰ Wait',
      condition: '❓ Condition',
      sms: '📱 Send SMS',
      voicemail: '📞 Voicemail Drop',
      linkedin: '💼 LinkedIn Message',
      goal: '🎯 Goal Check',
      end: '✅ Campaign End',
    };
    return labels[type] || type;
  };

  const getNodeStyle = (type: string) => {
    const styles: Record<string, any> = {
      email: { background: '#3B82F6', color: 'white', border: '2px solid #2563EB' },
      wait: { background: '#F59E0B', color: 'white', border: '2px solid #D97706' },
      condition: { background: '#8B5CF6', color: 'white', border: '2px solid #7C3AED' },
      sms: { background: '#10B981', color: 'white', border: '2px solid #059669' },
      voicemail: { background: '#EF4444', color: 'white', border: '2px solid #DC2626' },
      linkedin: { background: '#0A66C2', color: 'white', border: '2px solid #004182' },
      goal: { background: '#F97316', color: 'white', border: '2px solid #EA580C' },
      end: { background: '#6B7280', color: 'white', border: '2px solid #4B5563' },
    };
    return {
      ...styles[type],
      borderRadius: '8px',
      padding: '10px',
      minWidth: '150px',
      textAlign: 'center',
    };
  };

  const saveWorkflow = async () => {
    setSaving(true);
    try {
      const response = await fetch(`/api/campaigns/${campaign.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          workflow: {
            nodes,
            edges,
          },
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to save workflow');
      }

      alert('Workflow saved successfully!');
    } catch (error) {
      console.error('Error saving workflow:', error);
      alert('Failed to save workflow');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between bg-gray-50 p-4 rounded-lg border border-gray-200">
        <div className="flex items-center space-x-2">
          <span className="text-sm font-medium text-gray-700 mr-4">Add Node:</span>
          <button
            onClick={() => addNode('email')}
            className="px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            📧 Email
          </button>
          <button
            onClick={() => addNode('wait')}
            className="px-3 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors text-sm font-medium"
          >
            ⏰ Wait
          </button>
          <button
            onClick={() => addNode('condition')}
            className="px-3 py-2 bg-purple-500 text-white rounded-lg hover:bg-purple-600 transition-colors text-sm font-medium"
          >
            ❓ Condition
          </button>
          <button
            onClick={() => addNode('sms')}
            className="px-3 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors text-sm font-medium"
          >
            📱 SMS
          </button>
          <button
            onClick={() => addNode('goal')}
            className="px-3 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors text-sm font-medium"
          >
            🎯 Goal
          </button>
        </div>
        <button
          onClick={saveWorkflow}
          disabled={saving}
          className="px-6 py-2 bg-[#3B6B8F] text-white rounded-lg hover:bg-[#2E5570] transition-colors font-medium disabled:opacity-50"
        >
          {saving ? 'Saving...' : 'Save Workflow'}
        </button>
      </div>

      {/* Help Text */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <h3 className="text-sm font-semibold text-blue-900 mb-2">💡 How to Build Your Workflow:</h3>
        <ul className="text-sm text-blue-800 space-y-1">
          <li>• Click buttons above to add nodes to your workflow</li>
          <li>• Drag nodes to position them</li>
          <li>• Click and drag from one node to another to connect them</li>
          <li>• Use Email nodes to send messages, Wait nodes for delays, Conditions for branching</li>
          <li>• Add a Goal node to track when leads achieve campaign objectives</li>
          <li>• Click "Save Workflow" when done</li>
        </ul>
      </div>

      {/* Workflow Canvas */}
      <div className="border border-gray-300 rounded-lg" style={{ height: '600px' }}>
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          nodeTypes={nodeTypes}
          fitView
          attributionPosition="bottom-left"
        >
          <Background />
          <Controls />
          <MiniMap
            nodeColor={(node) => {
              if (node.type === 'input') return '#3B6B8F';
              if (node.type === 'output') return '#6B7280';
              return '#3B82F6';
            }}
            maskColor="rgba(0, 0, 0, 0.1)"
          />
        </ReactFlow>
      </div>

      {/* Node Configuration (Future Enhancement) */}
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Configuration</h3>
        <p className="text-sm text-gray-600">
          Select a node in the workflow to configure its settings (email template, wait duration, conditions, etc.)
        </p>
        <p className="text-sm text-gray-500 mt-2">
          <strong>Coming Soon:</strong> Click any node to edit its properties, select email templates, set wait times, and configure conditional logic.
        </p>
      </div>
    </div>
  );
}

