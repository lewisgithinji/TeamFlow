'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { Cog6ToothIcon } from '@heroicons/react/24/solid';
import { ACTION_TYPES } from '@/lib/automation/constants';
import { ActionNodeData } from '@/lib/automation/types';

function ActionNode({ data, selected }: NodeProps<ActionNodeData>) {
  const actionInfo = ACTION_TYPES[data.actionType];

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 border-2 transition-all ${
        selected ? 'border-blue-300 shadow-xl scale-105' : 'border-blue-700'
      }`}
      style={{ minWidth: '200px' }}
    >
      {/* Input handle */}
      <Handle
        type="target"
        position={Position.Top}
        className="w-3 h-3 !bg-blue-300 border-2 border-blue-600"
      />

      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
          <Cog6ToothIcon className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">
          Action #{data.order + 1}
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl">{actionInfo?.icon || '⚙️'}</span>
        <div className="flex-1">
          <div className="font-semibold text-white text-sm">
            {actionInfo?.label || data.actionType}
          </div>
          <div className="text-xs text-white/70 mt-0.5">
            {actionInfo?.description || 'Perform this action'}
          </div>
        </div>
      </div>

      {/* Config preview */}
      {Object.keys(data.config).length > 0 && (
        <div className="mt-2 pt-2 border-t border-white/20">
          <div className="text-xs text-white/80 space-y-1">
            {Object.entries(data.config).slice(0, 2).map(([key, value]) => (
              <div key={key} className="truncate">
                <span className="font-medium">{key}:</span> {String(value)}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-blue-300 border-2 border-blue-600"
      />
    </div>
  );
}

export default memo(ActionNode);
