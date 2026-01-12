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

type WorkflowData = {
  nodes?: Node[];
  edges?: Edge[];
};

export default function WorkflowBuilder({ campaign }: { campaign: { id: string; workflow: unknown } }) {
  const workflowData = campaign.workflow as WorkflowData | null;
  const [nodes, setNodes, onNodesChange] = useNodesState(
    workflowData?.nodes || initialNodes
  );
  const [edges, setEdges, onEdgesChange] = useEdgesState(
    workflowData?.edges || initialEdges
  );
  const [saving, setSaving] = useState(false);
  const [selectedNode, setSelectedNode] = useState<Node | null>(null);
  const [nodeConfig, setNodeConfig] = useState<Record<string, string | number>>({});

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
    const styles: Record<string, Record<string, string | number>> = {
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
      textAlign: 'center' as const,
    };
  };

  const onNodeClick = useCallback((_event: React.MouseEvent, node: Node) => {
    setSelectedNode(node);
    // Load existing config from node data
    setNodeConfig({
      subject: (node.data as Record<string, string>).subject || '',
      template: (node.data as Record<string, string>).template || '',
      waitDays: (node.data as Record<string, number>).waitDays || 1,
      waitHours: (node.data as Record<string, number>).waitHours || 0,
      condition: (node.data as Record<string, string>).condition || 'opened',
      conditionValue: (node.data as Record<string, string>).conditionValue || '',
    });
  }, []);

  const updateNodeConfig = () => {
    if (!selectedNode) return;

    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === selectedNode.id) {
          return {
            ...node,
            data: {
              ...node.data,
              ...nodeConfig,
            },
          };
        }
        return node;
      })
    );
    setSelectedNode(null);
  };

  const deleteNode = () => {
    if (!selectedNode) return;
    setNodes((nds) => nds.filter((node) => node.id !== selectedNode.id));
    setEdges((eds) => eds.filter((edge) => edge.source !== selectedNode.id && edge.target !== selectedNode.id));
    setSelectedNode(null);
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
            <li>• Click &quot;Save Workflow&quot; when done</li>
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
          onNodeClick={onNodeClick}
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

      {/* Node Configuration Panel */}
      {selectedNode ? (
        <div className="bg-white border border-gray-300 rounded-lg p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Configure Node: {String(selectedNode.data.label || 'Node')}
            </h3>
            <button
              onClick={() => setSelectedNode(null)}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-4">
            {/* Email Node Configuration */}
            {selectedNode.data.label?.toString().includes('Email') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Subject
                  </label>
                  <input
                    type="text"
                    value={nodeConfig.subject || ''}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    placeholder="e.g., Introduction to OpticWise"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email Template
                  </label>
                  <select
                    value={nodeConfig.template || ''}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, template: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  >
                    <option value="">Select template...</option>
                    <option value="intro">Introduction Email</option>
                    <option value="follow-up">Follow-up Email</option>
                    <option value="book-offer">Book Offer</option>
                    <option value="audit-invitation">Audit Invitation</option>
                    <option value="conference-invite">Conference Invitation</option>
                  </select>
                </div>
              </>
            )}

            {/* Wait Node Configuration */}
            {selectedNode.data.label?.toString().includes('Wait') && (
              <>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wait Days
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={nodeConfig.waitDays || 1}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, waitDays: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Wait Hours
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="23"
                      value={nodeConfig.waitHours || 0}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, waitHours: parseInt(e.target.value) })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500">
                  Total wait time: {nodeConfig.waitDays || 1} days and {nodeConfig.waitHours || 0} hours
                </p>
              </>
            )}

            {/* Condition Node Configuration */}
            {selectedNode.data.label?.toString().includes('Condition') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Condition Type
                  </label>
                  <select
                    value={nodeConfig.condition || 'opened'}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, condition: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  >
                    <option value="opened">Email Opened</option>
                    <option value="clicked">Link Clicked</option>
                    <option value="replied">Email Replied</option>
                    <option value="score">Lead Score</option>
                    <option value="status">Lead Status</option>
                  </select>
                </div>
                {nodeConfig.condition === 'score' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Minimum Score
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={nodeConfig.conditionValue || '50'}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, conditionValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    />
                  </div>
                )}
                {nodeConfig.condition === 'status' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Required Status
                    </label>
                    <select
                      value={nodeConfig.conditionValue || 'engaged'}
                      onChange={(e) => setNodeConfig({ ...nodeConfig, conditionValue: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    >
                      <option value="contacted">Contacted</option>
                      <option value="engaged">Engaged</option>
                      <option value="qualified">Qualified</option>
                    </select>
                  </div>
                )}
              </>
            )}

            {/* SMS Node Configuration */}
            {selectedNode.data.label?.toString().includes('SMS') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    SMS Message
                  </label>
                  <textarea
                    rows={4}
                    value={nodeConfig.message || ''}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, message: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    placeholder="Enter SMS message (160 characters max)"
                    maxLength={160}
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    {(nodeConfig.message as string || '').length}/160 characters
                  </p>
                </div>
              </>
            )}

            {/* Voicemail Node Configuration */}
            {selectedNode.data.label?.toString().includes('Voicemail') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voicemail Script
                  </label>
                  <textarea
                    rows={5}
                    value={nodeConfig.script || ''}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, script: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    placeholder="Enter voicemail script (will be converted to AI voice)"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Voice Type
                  </label>
                  <select
                    value={nodeConfig.voice || 'professional'}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, voice: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  >
                    <option value="professional">Professional (Male)</option>
                    <option value="professional-female">Professional (Female)</option>
                    <option value="friendly">Friendly (Male)</option>
                    <option value="friendly-female">Friendly (Female)</option>
                  </select>
                </div>
              </>
            )}

            {/* LinkedIn Node Configuration */}
            {selectedNode.data.label?.toString().includes('LinkedIn') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Type
                  </label>
                  <select
                    value={nodeConfig.linkedinType || 'connection'}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, linkedinType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  >
                    <option value="connection">Connection Request</option>
                    <option value="message">Direct Message</option>
                    <option value="inmail">InMail</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Message Content
                  </label>
                  <textarea
                    rows={4}
                    value={nodeConfig.linkedinMessage || ''}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, linkedinMessage: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                    placeholder="Enter LinkedIn message (300 characters max for connection requests)"
                  />
                </div>
              </>
            )}

            {/* Goal Node Configuration */}
            {selectedNode.data.label?.toString().includes('Goal') && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Goal Type
                  </label>
                  <select
                    value={nodeConfig.goalType || 'demo_booked'}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, goalType: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  >
                    <option value="demo_booked">Demo Booked</option>
                    <option value="audit_requested">Audit Requested</option>
                    <option value="meeting_scheduled">Meeting Scheduled</option>
                    <option value="deal_created">Deal Created</option>
                    <option value="replied">Email Replied</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Action on Goal Achievement
                  </label>
                  <select
                    value={nodeConfig.goalAction || 'continue'}
                    onChange={(e) => setNodeConfig({ ...nodeConfig, goalAction: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#3B6B8F] focus:border-transparent"
                  >
                    <option value="continue">Continue to Next Step</option>
                    <option value="complete">Mark Campaign Complete</option>
                    <option value="notify">Notify Sales Team</option>
                  </select>
                </div>
              </>
            )}

            {/* Action Buttons */}
            <div className="flex space-x-3 pt-4 border-t border-gray-200">
              <button
                onClick={updateNodeConfig}
                className="flex-1 bg-[#3B6B8F] text-white px-4 py-2 rounded-lg hover:bg-[#2E5570] transition-colors font-medium"
              >
                Apply Changes
              </button>
              <button
                onClick={deleteNode}
                className="px-4 py-2 border border-red-300 text-red-600 rounded-lg hover:bg-red-50 transition-colors font-medium"
              >
                Delete Node
              </button>
              <button
                onClick={() => setSelectedNode(null)}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors font-medium text-gray-700"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Node Configuration</h3>
          <p className="text-sm text-gray-600">
            Click any node in the workflow above to configure its settings (email template, wait duration, conditions, etc.)
          </p>
        </div>
      )}
    </div>
  );
}

