'use client';

import { AutomationRule } from '@/types/automation';
import { useState } from 'react';
import { TRIGGER_METADATA } from './TriggerConfigBuilder';

interface AutomationRuleListProps {
  rules: AutomationRule[];
  onRuleClick: (ruleId: string) => void;
}

export default function AutomationRuleList({
  rules,
  onRuleClick,
}: AutomationRuleListProps) {
  const [filterActive, setFilterActive] = useState<'all' | 'active' | 'inactive'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const filteredRules = rules.filter((rule) => {
    // Filter by active status
    if (filterActive === 'active' && !rule.isActive) return false;
    if (filterActive === 'inactive' && rule.isActive) return false;

    // Filter by search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      return (
        rule.name.toLowerCase().includes(search) ||
        rule.description?.toLowerCase().includes(search)
      );
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    }).format(date);
  };

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="flex items-center justify-between gap-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setFilterActive('all')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filterActive === 'all'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            All ({rules.length})
          </button>
          <button
            onClick={() => setFilterActive('active')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filterActive === 'active'
                ? 'bg-green-100 text-green-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Active ({rules.filter((r) => r.isActive).length})
          </button>
          <button
            onClick={() => setFilterActive('inactive')}
            className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
              filterActive === 'inactive'
                ? 'bg-gray-100 text-gray-700'
                : 'text-gray-600 hover:bg-gray-100'
            }`}
          >
            Inactive ({rules.filter((r) => !r.isActive).length})
          </button>
        </div>

        <div className="flex-1 max-w-md">
          <input
            type="text"
            placeholder="Search rules..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full rounded-md border border-gray-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Table */}
      {filteredRules.length === 0 ? (
        <div className="text-center py-12 border border-gray-200 rounded-lg bg-gray-50">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            {searchTerm || filterActive !== 'all' ? 'No rules found' : 'No automation rules yet'}
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {searchTerm || filterActive !== 'all'
              ? 'Try adjusting your filters'
              : 'Get started by creating your first automation rule'}
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Trigger
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created By
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Created
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredRules.map((rule) => (
                <tr
                  key={rule.id}
                  onClick={() => onRuleClick(rule.id)}
                  className="hover:bg-gray-50 cursor-pointer transition-colors"
                >
                  <td className="px-6 py-4">
                    <div>
                      <div className="text-sm font-medium text-gray-900">
                        {rule.name}
                      </div>
                      {rule.description && (
                        <div className="text-sm text-gray-500 truncate max-w-md">
                          {rule.description}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                      {TRIGGER_METADATA[rule.triggerType]?.label || rule.triggerType}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.actions?.length || 0} action{rule.actions?.length !== 1 ? 's' : ''}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {rule.isActive ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-green-400" />
                        Active
                      </span>
                    ) : (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                        <span className="mr-1.5 h-2 w-2 rounded-full bg-gray-400" />
                        Inactive
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {rule.createdBy?.name || 'Unknown'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(rule.createdAt)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
