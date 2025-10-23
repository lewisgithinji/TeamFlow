'use client';

import { memo } from 'react';
import { Handle, Position, NodeProps } from 'reactflow';
import { BoltIcon } from '@heroicons/react/24/solid';
import { TRIGGER_TYPES } from '@/lib/automation/constants';
import { TriggerNodeData } from '@/lib/automation/types';

function TriggerNode({ data, selected }: NodeProps<TriggerNodeData>) {
  const triggerInfo = TRIGGER_TYPES[data.triggerType];

  return (
    <div
      className={`px-4 py-3 shadow-lg rounded-lg bg-gradient-to-br from-purple-500 to-purple-600 border-2 transition-all ${
        selected ? 'border-purple-300 shadow-xl scale-105' : 'border-purple-700'
      }`}
      style={{ minWidth: '200px' }}
    >
      <div className="flex items-center gap-2 mb-2">
        <div className="flex items-center justify-center w-8 h-8 rounded-full bg-white/20">
          <BoltIcon className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs font-semibold text-white/80 uppercase tracking-wide">
          Trigger
        </div>
      </div>

      <div className="flex items-center gap-2">
        <span className="text-2xl">{triggerInfo?.icon || '🎯'}</span>
        <div className="flex-1">
          <div className="font-semibold text-white text-sm">
            {triggerInfo?.label || data.triggerType}
          </div>
          <div className="text-xs text-white/70 mt-0.5">
            {triggerInfo?.description || 'When this event occurs'}
          </div>
        </div>
      </div>

      {/* Output handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        className="w-3 h-3 !bg-purple-300 border-2 border-purple-600"
      />
    </div>
  );
}

export default memo(TriggerNode);
