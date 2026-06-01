import { useState, useCallback } from 'react';
import {
  useFrappeGetDoc,
  useFrappeGetDocList,
  useFrappeCreateDoc,
  useFrappeUpdateDoc,
  useFrappeDeleteDoc,
} from 'frappe-react-sdk';
import {
  List,
  Eye,
  Plus,
  Edit2,
  Trash2,
  Copy,
  Check,
  Loader2,
  RefreshCw,
  X,
  ChevronDown,
  ChevronRight,
} from 'lucide-react';
import type { FieldInfo } from '../../lib/types';

// ── Shared styles ─────────────────────────────────────────────────────────────
const inputCls =
  'w-full rounded-lg border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm outline-none transition focus:border-violet-400 focus:ring-2 focus:ring-violet-100 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-100 dark:focus:border-violet-500 dark:focus:ring-violet-900';
const labelCls = 'mb-1 block text-xs font-medium text-zinc-500 dark:text-zinc-400';
const btnPrimary =
  'rounded-lg bg-violet-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-violet-700 disabled:cursor-not-allowed disabled:opacity-40';
const btnSecondary =
  'rounded-lg border border-zinc-200 px-3 py-2 text-sm text-zinc-500 transition hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200';
const btnDanger =
  'rounded-lg bg-red-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-40';

// ── Types ─────────────────────────────────────────────────────────────────────
type FilterRow = { id: number; field: string; op: string; val: string };
type TabId = 'list' | 'get' | 'create' | 'update' | 'delete';

interface ApiTesterProps {
  doctype: string;
  fields: FieldInfo[];
}

// ── Copy Button ──────────────────────────────────────────────────────────────
function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <button
      onClick={handleCopy}
      className={`flex items-center gap-1.5 text-xs transition ${
        copied
          ? 'text-green-500'
          : 'text-zinc-500 hover:text-violet-600 dark:hover:text-violet-400'
      }`}
    >
      {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
      {copied ? 'Copied!' : 'Copy'}
    </button>
  );
}

// ── Badge ─────────────────────────────────────────────────────────────────────
function Badge({
  label,
  variant,
}: {
  label: string;
  variant: 'info' | 'success' | 'warning' | 'danger' | 'muted';
}) {
  const variants = {
    info: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
    success: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300',
    warning: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    danger: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    muted: 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-400',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${variants[variant]}`}
    >
      {label}
    </span>
  );
}

// ── Filter Builder ────────────────────────────────────────────────────────────
const OPS = ['=', '!=', '<', '>', '<=', '>=', 'like', 'not like', 'in', 'not in'];
let _filterId = 0;
const newFilterRow = (): FilterRow => ({ id: _filterId++, field: '', op: '=', val: '' });

function FilterBuilder({
  value,
  onChange,
}: {
  value: FilterRow[];
  onChange: (v: FilterRow[]) => void;
}) {
  const update = (id: number, patch: Partial<FilterRow>) => {
    onChange(value.map((r) => (r.id === id ? { ...r, ...patch } : r)));
  };

  return (
    <div className="space-y-2">
      {value.map((row) => (
        <div key={row.id} className="flex items-center gap-2">
          <input
            value={row.field}
            onChange={(e) => update(row.id, { field: e.target.value })}
            placeholder="field"
            className={`${inputCls} flex-1`}
          />
          <select
            value={row.op}
            onChange={(e) => update(row.id, { op: e.target.value })}
            className={`${inputCls} w-28`}
          >
            {OPS.map((o) => (
              <option key={o} value={o}>
                {o}
              </option>
            ))}
          </select>
          <input
            value={row.val}
            onChange={(e) => update(row.id, { val: e.target.value })}
            placeholder="value"
            className={`${inputCls} flex-1`}
          />
          <button
            type="button"
            onClick={() => onChange(value.filter((r) => r.id !== row.id))}
            className="rounded-md p-2 text-zinc-400 transition hover:bg-red-50 hover:text-red-500 dark:hover:bg-red-900/20"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      ))}
      <button
        type="button"
        onClick={() => onChange([...value, newFilterRow()])}
        className="flex items-center gap-1 text-xs text-violet-600 transition hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
      >
        <Plus className="h-3 w-3" /> Add Filter
      </button>
    </div>
  );
}

// ── JSON Editor ───────────────────────────────────────────────────────────────
function JsonEditor({
  label,
  value,
  onChange,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  rows?: number;
}) {
  const [formatError, setFormatError] = useState(false);

  const handleFormat = () => {
    try {
      const parsed = JSON.parse(value);
      onChange(JSON.stringify(parsed, null, 2));
      setFormatError(false);
    } catch {
      setFormatError(true);
      setTimeout(() => setFormatError(false), 1500);
    }
  };

  return (
    <div>
      <div className="mb-1 flex items-center justify-between">
        <label className={labelCls}>{label}</label>
        <button
          type="button"
          onClick={handleFormat}
          className={`text-xs transition ${
            formatError
              ? 'text-red-500'
              : 'text-zinc-400 hover:text-violet-600 dark:hover:text-violet-400'
          }`}
        >
          {formatError ? 'Invalid JSON' : '{ } Format'}
        </button>
      </div>
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        rows={rows}
        spellCheck={false}
        className={`${inputCls} font-mono text-xs`}
      />
    </div>
  );
}

// ── Response Panel ────────────────────────────────────────────────────────────
function ResponsePanel({
  isLoading,
  error,
  data,
  onRefetch,
  curlCmd,
}: {
  isLoading: boolean;
  error: unknown;
  data: unknown;
  onRefetch?: () => void;
  curlCmd?: string;
}) {
  const errorMessage = error && typeof error === 'object' && 'message' in error
    ? String((error as { message: unknown }).message)
    : error ? String(error) : null;
  if (!data && !error && !isLoading) {
    return (
      <div className="flex h-48 items-center justify-center rounded-xl border border-dashed border-zinc-200 p-8 text-center dark:border-zinc-700">
        <div>
          <p className="text-3xl mb-2">📭</p>
          <p className="text-sm text-zinc-400">
            Execute a request to see the response
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-2 border-b border-zinc-100 px-4 py-3 dark:border-zinc-800">
        <div className="flex items-center gap-2">
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-violet-500" />}
          {onRefetch && (
            <button
              onClick={onRefetch}
              disabled={isLoading}
              className="flex items-center gap-1 text-xs text-zinc-500 transition hover:text-violet-600 disabled:opacity-50 dark:hover:text-violet-400"
            >
              <RefreshCw className={`h-3 w-3 ${isLoading ? 'animate-spin' : ''}`} />
              Refetch
            </button>
          )}
          {curlCmd && <CopyButton text={curlCmd} />}
        </div>
        <div className="flex gap-2">
          <Badge label={isLoading ? 'Loading' : 'Idle'} variant={isLoading ? 'info' : 'muted'} />
          <Badge label={error ? 'Error' : 'No Error'} variant={error ? 'danger' : 'muted'} />
          <Badge label={data ? 'Success' : 'No Data'} variant={data ? 'success' : 'muted'} />
        </div>
      </div>

      {/* Content */}
      <div className="max-h-96 overflow-auto p-4">
        {isLoading && (
          <div className="flex items-center gap-3 rounded-lg bg-blue-50 px-4 py-3 dark:bg-blue-900/20">
            <Loader2 className="h-4 w-4 animate-spin text-blue-500" />
            <span className="text-sm text-blue-600 dark:text-blue-300">Processing...</span>
          </div>
        )}
        {error && (
          <div className="rounded-lg bg-red-50 px-4 py-3 dark:bg-red-900/20">
            <p className="mb-1 text-xs font-semibold uppercase text-red-500">Error</p>
            <p className="text-sm text-red-700 dark:text-red-300">{errorMessage}</p>
          </div>
        )}
        {data && !isLoading && (
          <pre className="overflow-x-auto rounded-lg bg-zinc-950 p-4 text-xs leading-relaxed text-emerald-300 dark:bg-black">
            {JSON.stringify(data, null, 2)}
          </pre>
        )}
      </div>
    </div>
  );
}

// ── Tab Button ────────────────────────────────────────────────────────────────
function TabButton({
  id,
  active,
  onClick,
  children,
}: {
  id: TabId;
  active: boolean;
  onClick: (id: TabId) => void;
  children: React.ReactNode;
}) {
  return (
    <button
      onClick={() => onClick(id)}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
        active
          ? 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
          : 'text-zinc-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 dark:text-zinc-400'
      }`}
    >
      {children}
    </button>
  );
}

// ── Collapsible Section ──────────────────────────────────────────────────────
function CollapsibleSection({
  title,
  defaultOpen = false,
  children,
}: {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <div className="rounded-lg border border-zinc-200 dark:border-zinc-800">
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex w-full items-center justify-between px-4 py-3 text-left text-sm font-medium text-zinc-700 dark:text-zinc-200"
      >
        {title}
        {isOpen ? (
          <ChevronDown className="h-4 w-4" />
        ) : (
          <ChevronRight className="h-4 w-4" />
        )}
      </button>
      {isOpen && <div className="border-t border-zinc-200 px-4 pb-4 pt-3 dark:border-zinc-800">{children}</div>}
    </div>
  );
}

// ── API Tester ────────────────────────────────────────────────────────────────
export function ApiTester({ doctype, fields }: ApiTesterProps) {
  const [activeTab, setActiveTab] = useState<TabId>('list');

  // ── LIST State ──
  const [listFilters, setListFilters] = useState<FilterRow[]>([]);
  const [listFields, setListFields] = useState('');
  const [listLimit, setListLimit] = useState('20');
  const [listOrder, setListOrder] = useState('creation');
  const [listDir, setListDir] = useState<'asc' | 'desc'>('desc');
  const [listEnabled, setListEnabled] = useState(false);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listParams: Record<string, any> = {
    filters:
      listFilters.filter((r) => r.field.trim() && r.val.trim()).length > 0
        ? listFilters
            .filter((r) => r.field.trim() && r.val.trim())
            .map((r) => [r.field.trim(), r.op, r.val.trim()])
        : undefined,
    fields: listFields.trim() ? listFields.split(',').map((f) => f.trim()) : undefined,
    orderBy: { field: listOrder, order: listDir },
    limitPageLength: parseInt(listLimit) || 20,
  };

  const listResult = useFrappeGetDocList(doctype, listEnabled ? listParams : undefined);

  const buildListCurl = () => {
    const url = `/api/resource/${encodeURIComponent(doctype)}`;
    const params = new URLSearchParams();
    params.append('limit_page_length', listLimit);
    if (listFields.trim()) {
      params.append('fields', JSON.stringify(listFields.split(',').map((f) => f.trim())));
    }
    if (listFilters.filter((r) => r.field.trim() && r.val.trim()).length > 0) {
      params.append(
        'filters',
        JSON.stringify(
          listFilters
            .filter((r) => r.field.trim() && r.val.trim())
            .map((r) => [r.field.trim(), r.op, r.val.trim()])
        )
      );
    }
    return `curl -X GET '${url}?${params.toString()}' \\
  -H 'Authorization: token <api_key>:<api_secret>'`;
  };

  // ── GET State ──
  const [getId, setGetId] = useState('');
  const [getEnabled, setGetEnabled] = useState(false);
  const getResult = useFrappeGetDoc(doctype, getEnabled && getId ? getId : undefined);

  const buildGetCurl = () => {
    return `curl -X GET '/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(getId)}' \\
  -H 'Authorization: token <api_key>:<api_secret>'`;
  };

  // ── CREATE State ──
  const [createBody, setCreateBody] = useState('{\n  \n}');
  const createDoc = useFrappeCreateDoc();

  const buildCreateCurl = () => {
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(createBody);
    } catch {}
    return `curl -X POST '/api/resource/${encodeURIComponent(doctype)}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: token <api_key>:<api_secret>' \\
  -d '${JSON.stringify(body, null, 2)}'`;
  };

  // ── UPDATE State ──
  const [updateId, setUpdateId] = useState('');
  const [updateBody, setUpdateBody] = useState('{\n  \n}');
  const updateDoc = useFrappeUpdateDoc();

  const buildUpdateCurl = () => {
    let body: Record<string, unknown> = {};
    try {
      body = JSON.parse(updateBody);
    } catch {}
    return `curl -X PUT '/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(updateId)}' \\
  -H 'Content-Type: application/json' \\
  -H 'Authorization: token <api_key>:<api_secret>' \\
  -d '${JSON.stringify(body, null, 2)}'`;
  };

  // ── DELETE State ──
  const [deleteId, setDeleteId] = useState('');
  const deleteDoc = useFrappeDeleteDoc();

  const buildDeleteCurl = () => {
    return `curl -X DELETE '/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(deleteId)}' \\
  -H 'Authorization: token <api_key>:<api_secret>'`;
  };

  // ── Render Response Panel based on active tab ──
  const renderResponse = () => {
    switch (activeTab) {
      case 'list':
        return (
          <ResponsePanel
            isLoading={listResult.isLoading}
            error={listResult.error}
            data={listResult.data}
            onRefetch={() => listResult.mutate()}
            curlCmd={buildListCurl()}
          />
        );
      case 'get':
        return (
          <ResponsePanel
            isLoading={getResult.isLoading}
            error={getResult.error}
            data={getResult.data}
            onRefetch={() => getResult.mutate()}
            curlCmd={buildGetCurl()}
          />
        );
      case 'create':
        return (
          <ResponsePanel
            isLoading={createDoc.loading}
            error={createDoc.error}
            data={createDoc.isCompleted ? { message: 'Document created successfully' } : null}
            curlCmd={buildCreateCurl()}
          />
        );
      case 'update':
        return (
          <ResponsePanel
            isLoading={updateDoc.loading}
            error={updateDoc.error}
            data={updateDoc.isCompleted ? { message: 'Document updated successfully' } : null}
            curlCmd={buildUpdateCurl()}
          />
        );
      case 'delete':
        return (
          <ResponsePanel
            isLoading={deleteDoc.loading}
            error={deleteDoc.error}
            data={deleteDoc.isCompleted ? { message: 'ok' } : null}
            curlCmd={buildDeleteCurl()}
          />
        );
    }
  };

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
      {/* LEFT - Forms */}
      <div className="space-y-4">
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">API Tester</h3>

        {/* Tabs */}
        <div className="flex flex-wrap gap-2">
          <TabButton id="list" active={activeTab === 'list'} onClick={setActiveTab}>
            <List className="h-4 w-4" /> List
          </TabButton>
          <TabButton id="get" active={activeTab === 'get'} onClick={setActiveTab}>
            <Eye className="h-4 w-4" /> Get
          </TabButton>
          <TabButton id="create" active={activeTab === 'create'} onClick={setActiveTab}>
            <Plus className="h-4 w-4" /> Create
          </TabButton>
          <TabButton id="update" active={activeTab === 'update'} onClick={setActiveTab}>
            <Edit2 className="h-4 w-4" /> Update
          </TabButton>
          <TabButton id="delete" active={activeTab === 'delete'} onClick={setActiveTab}>
            <Trash2 className="h-4 w-4" /> Delete
          </TabButton>
        </div>

        {/* LIST Form */}
        {activeTab === 'list' && (
          <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <label className={labelCls}>Filters</label>
              <FilterBuilder value={listFilters} onChange={setListFilters} />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Fields (comma-separated)</label>
                <input
                  value={listFields}
                  onChange={(e) => setListFields(e.target.value)}
                  placeholder="name, subject"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Limit</label>
                <input
                  type="number"
                  value={listLimit}
                  onChange={(e) => setListLimit(e.target.value)}
                  className={inputCls}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className={labelCls}>Order By</label>
                <input
                  value={listOrder}
                  onChange={(e) => setListOrder(e.target.value)}
                  placeholder="creation"
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Direction</label>
                <select
                  value={listDir}
                  onChange={(e) => setListDir(e.target.value as 'asc' | 'desc')}
                  className={inputCls}
                >
                  <option value="desc">desc</option>
                  <option value="asc">asc</option>
                </select>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('list');
                  setListEnabled(true);
                }}
                className={btnPrimary}
              >
                <List className="mr-2 h-4 w-4 inline" />
                Fetch List
              </button>
              {listEnabled && (
                <button onClick={() => setListEnabled(false)} className={btnSecondary}>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* GET Form */}
        {activeTab === 'get' && (
          <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <label className={labelCls}>Document Name / ID *</label>
              <input
                value={getId}
                onChange={(e) => setGetId(e.target.value)}
                placeholder="Enter document name"
                className={inputCls}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('get');
                  setGetEnabled(true);
                }}
                disabled={!getId.trim()}
                className={btnPrimary}
              >
                <Eye className="mr-2 h-4 w-4 inline" />
                Fetch Document
              </button>
              {getEnabled && (
                <button onClick={() => setGetEnabled(false)} className={btnSecondary}>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* CREATE Form */}
        {activeTab === 'create' && (
          <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <JsonEditor
              label="Request Body (JSON)"
              value={createBody}
              onChange={setCreateBody}
              rows={6}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('create');
                  createDoc.reset();
                  let body: Record<string, unknown> = {};
                  try {
                    body = JSON.parse(createBody);
                  } catch {}
                  createDoc.createDoc(doctype, body as any).catch(() => {});
                }}
                disabled={createDoc.loading}
                className={btnPrimary}
              >
                {createDoc.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="mr-2 h-4 w-4 inline" />
                    Create Document
                  </>
                )}
              </button>
              {(createDoc.isCompleted || createDoc.error) && (
                <button onClick={createDoc.reset} className={btnSecondary}>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* UPDATE Form */}
        {activeTab === 'update' && (
          <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <label className={labelCls}>Document Name / ID *</label>
              <input
                value={updateId}
                onChange={(e) => setUpdateId(e.target.value)}
                placeholder="Enter document name"
                className={inputCls}
              />
            </div>

            <JsonEditor
              label="Request Body (JSON)"
              value={updateBody}
              onChange={setUpdateBody}
              rows={6}
            />

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('update');
                  updateDoc.reset();
                  let body: Record<string, unknown> = {};
                  try {
                    body = JSON.parse(updateBody);
                  } catch {}
                  updateDoc.updateDoc(doctype, updateId, body as any).catch(() => {});
                }}
                disabled={!updateId.trim() || updateDoc.loading}
                className={btnPrimary}
              >
                {updateDoc.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Edit2 className="mr-2 h-4 w-4 inline" />
                    Update Document
                  </>
                )}
              </button>
              {(updateDoc.isCompleted || updateDoc.error) && (
                <button onClick={updateDoc.reset} className={btnSecondary}>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* DELETE Form */}
        {activeTab === 'delete' && (
          <div className="space-y-4 rounded-xl border border-zinc-200 p-4 dark:border-zinc-800">
            <div>
              <label className={labelCls}>Document Name / ID *</label>
              <input
                value={deleteId}
                onChange={(e) => setDeleteId(e.target.value)}
                placeholder="Enter document name"
                className={inputCls}
              />
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => {
                  setActiveTab('delete');
                  deleteDoc.reset();
                  deleteDoc.deleteDoc(doctype, deleteId).catch(() => {});
                }}
                disabled={!deleteId.trim() || deleteDoc.loading}
                className={btnDanger}
              >
                {deleteDoc.loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin inline" />
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="mr-2 h-4 w-4 inline" />
                    Delete Document
                  </>
                )}
              </button>
              {(deleteDoc.isCompleted || deleteDoc.error) && (
                <button onClick={deleteDoc.reset} className={btnSecondary}>
                  Reset
                </button>
              )}
            </div>
          </div>
        )}

        {/* Quick Field Reference */}
        <CollapsibleSection title="Available Fields" defaultOpen={false}>
          <div className="space-y-1">
            {fields.map((field) => (
              <div key={field.fieldname} className="flex items-center gap-2 text-xs">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 dark:bg-zinc-800">
                  {field.fieldname}
                </code>
                <span className="text-zinc-400">({field.fieldtype})</span>
                {field.reqd && <Badge label="required" variant="danger" />}
              </div>
            ))}
          </div>
        </CollapsibleSection>
      </div>

      {/* RIGHT - Response */}
      <div>{renderResponse()}</div>
    </div>
  );
}
