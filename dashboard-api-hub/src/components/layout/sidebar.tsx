import { useState, useMemo } from 'react';
import { Search, ChevronDown, ChevronRight, Loader2 } from 'lucide-react';
import { useModules } from '../../lib/api';
import type { ModuleInfo } from '../../lib/types';

interface SidebarProps {
  selectedDoctype: string | null;
  onSelectDoctype: (doctype: string) => void;
}

export function Sidebar({ selectedDoctype, onSelectDoctype }: SidebarProps) {
  const { data, isLoading, error } = useModules();
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  const modules: ModuleInfo[] = data?.message ?? [];

  // Filter modules and doctypes based on search
  const filteredModules = useMemo(() => {
    if (!modules?.length) return [];
    if (!searchQuery.trim()) return modules;

    const query = searchQuery.toLowerCase();
    return modules
      .map((module) => ({
        ...module,
        doctypes: (module.doctypes || []).filter(
          (dt) =>
            dt.name.toLowerCase().includes(query) ||
            dt.description?.toLowerCase().includes(query)
        ),
      }))
      .filter(
        (module) =>
          module.doctypes.length > 0 ||
          module.module_name.toLowerCase().includes(query)
      );
  }, [modules, searchQuery]);

  const toggleModule = (moduleName: string) => {
    const newExpanded = new Set(expandedModules);
    if (newExpanded.has(moduleName)) {
      newExpanded.delete(moduleName);
    } else {
      newExpanded.add(moduleName);
    }
    setExpandedModules(newExpanded);
  };

  if (isLoading) {
    return (
      <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-1 items-center justify-center">
          <Loader2 className="h-6 w-6 animate-spin text-zinc-400" />
        </div>
      </aside>
    );
  }

  if (error) {
    return (
      <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
        <div className="flex flex-1 items-center justify-center p-4">
          <p className="text-sm text-red-500">Failed to load modules</p>
        </div>
      </aside>
    );
  }

  return (
    <aside className="flex h-full w-72 flex-col border-r border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950">
      {/* Search */}
      <div className="border-b border-zinc-200 p-3 dark:border-zinc-800">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
          <input
            type="text"
            placeholder="Search DocTypes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="h-9 w-full rounded-lg border border-zinc-200 bg-white pl-9 pr-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100"
          />
        </div>
      </div>

      {/* Module List */}
      <div className="flex-1 overflow-y-auto p-2">
        {filteredModules.length === 0 ? (
          <p className="p-4 text-center text-sm text-zinc-500">
            No modules found
          </p>
        ) : (
          filteredModules.map((module) => (
            <ModuleItem
              key={module.name}
              module={module}
              isExpanded={expandedModules.has(module.name)}
              onToggle={() => toggleModule(module.name)}
              selectedDoctype={selectedDoctype}
              onSelectDoctype={onSelectDoctype}
            />
          ))
        )}
      </div>

      {/* Footer */}
      <div className="border-t border-zinc-200 p-3 dark:border-zinc-800">
        <p className="text-xs text-zinc-400">
          {(modules ?? []).reduce((acc, m) => acc + (m.doctypes?.length || 0), 0)} DocTypes
        </p>
      </div>
    </aside>
  );
}

interface ModuleItemProps {
  module: ModuleInfo;
  isExpanded: boolean;
  onToggle: () => void;
  selectedDoctype: string | null;
  onSelectDoctype: (doctype: string) => void;
}

function ModuleItem({
  module,
  isExpanded,
  onToggle,
  selectedDoctype,
  onSelectDoctype,
}: ModuleItemProps) {
  const doctypes = module?.doctypes || [];
  const hasDoctypes = doctypes.length > 0;

  const handleToggle = () => {
    onToggle();
  };

  const handleSelectDoctype = (name: string) => {
    onSelectDoctype(name);
  };

  return (
    <div className="mb-1">
      <button
        onClick={handleToggle}
        className="flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-left text-sm font-medium text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        {isExpanded ? (
          <ChevronDown className="h-4 w-4 flex-shrink-0 text-zinc-400" />
        ) : (
          <ChevronRight className="h-4 w-4 flex-shrink-0 text-zinc-400" />
        )}
        <span className="truncate">{module?.module_name}</span>
        <span className="ml-auto rounded bg-zinc-200 px-1.5 py-0.5 text-xs text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400">
          {doctypes.length}
        </span>
      </button>

      {isExpanded && hasDoctypes && (
        <div className="ml-4 mt-1 space-y-0.5">
          {doctypes.map((doctype) => (
            <button
              key={doctype?.name}
              onClick={() => handleSelectDoctype(doctype?.name)}
              className={`w-full rounded-lg px-3 py-1.5 text-left text-sm transition-colors ${
                selectedDoctype === doctype?.name
                  ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800'
              }`}
              title={doctype?.description || doctype?.name}
            >
              <span className="block truncate">{doctype?.name}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
