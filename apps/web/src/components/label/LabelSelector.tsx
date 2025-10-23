'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { X } from 'lucide-react';

interface Label {
  id: string;
  name: string;
  color: string;
}

interface LabelSelectorProps {
  workspaceId: string;
  selectedLabelIds: string[];
  onChange: (labelIds: string[]) => void;
}

export function LabelSelector({ workspaceId, selectedLabelIds, onChange }: LabelSelectorProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Fetch labels
  const { data: labels } = useQuery<Label[]>({
    queryKey: ['labels', workspaceId],
    queryFn: async () => {
      const token = localStorage.getItem('token');
      const response = await fetch(
        `http://localhost:4000/api/workspaces/${workspaceId}/labels`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      if (!response.ok) throw new Error('Failed to fetch labels');
      const data = await response.json();
      return data.data || [];
    },
  });

  const selectedLabels = labels?.filter((label) => selectedLabelIds.includes(label.id)) || [];
  const availableLabels = labels?.filter((label) => !selectedLabelIds.includes(label.id)) || [];

  const handleAddLabel = (labelId: string) => {
    onChange([...selectedLabelIds, labelId]);
    setIsOpen(false);
  };

  const handleRemoveLabel = (labelId: string) => {
    onChange(selectedLabelIds.filter((id) => id !== labelId));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Labels</label>

      {/* Selected Labels */}
      <div className="flex flex-wrap gap-2 mb-2">
        {selectedLabels.map((label) => (
          <span
            key={label.id}
            className="inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium"
            style={{
              backgroundColor: label.color + '20',
              color: label.color,
            }}
          >
            {label.name}
            <button
              onClick={() => handleRemoveLabel(label.id)}
              className="hover:opacity-70"
              type="button"
            >
              <X className="h-3 w-3" />
            </button>
          </span>
        ))}
      </div>

      {/* Add Label Button */}
      <div className="relative">
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center rounded-md border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-700 hover:bg-gray-50"
        >
          + Add Label
        </button>

        {/* Dropdown */}
        {isOpen && (
          <>
            {/* Backdrop */}
            <div
              className="fixed inset-0 z-10"
              onClick={() => setIsOpen(false)}
            />

            {/* Dropdown Menu */}
            <div className="absolute z-20 mt-1 w-56 rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5">
              <div className="py-1 max-h-60 overflow-y-auto">
                {availableLabels.length > 0 ? (
                  availableLabels.map((label) => (
                    <button
                      key={label.id}
                      type="button"
                      onClick={() => handleAddLabel(label.id)}
                      className="w-full text-left px-4 py-2 text-sm hover:bg-gray-100 flex items-center gap-2"
                    >
                      <span
                        className="w-3 h-3 rounded"
                        style={{ backgroundColor: label.color }}
                      />
                      {label.name}
                    </button>
                  ))
                ) : (
                  <div className="px-4 py-2 text-sm text-gray-500">
                    {labels && labels.length > 0
                      ? 'All labels selected'
                      : 'No labels available'}
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
