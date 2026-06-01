import { useState, useMemo } from 'react';
import { List, Eye, Plus, Edit2, Trash2, Loader2, FlaskConical } from 'lucide-react';
import { Tabs } from '../ui/tabs';
import { CodeBlock } from '../ui/code-block';
import { Badge } from '../ui/badge';
import { FieldTable } from './field-table';
import { ApiTester } from './api-tester';
import { useDocTypeSchema } from '../../lib/api';
import {
  buildListUrl,
  buildGetUrl,
  buildCreateUrl,
  buildUpdateUrl,
  buildDeleteUrl,
  buildListCurl,
  buildCreateCurl,
  buildUpdateCurl,
  buildDeleteCurl,
  isBodyFieldType,
} from '../../lib/api';
import type { DocTypeSchema, FieldInfo } from '../../lib/types';

interface DoctypeDocsProps {
  doctype: string;
}

const CRUD_TABS = [
  { id: 'list', label: 'List', icon: <List className="h-4 w-4" /> },
  { id: 'get', label: 'Get', icon: <Eye className="h-4 w-4" /> },
  { id: 'create', label: 'Create', icon: <Plus className="h-4 w-4" /> },
  { id: 'update', label: 'Update', icon: <Edit2 className="h-4 w-4" /> },
  { id: 'delete', label: 'Delete', icon: <Trash2 className="h-4 w-4" /> },
  { id: 'test', label: 'Test API', icon: <FlaskConical className="h-4 w-4" /> },
];

export function DoctypeDocs({ doctype }: DoctypeDocsProps) {
  const [activeTab, setActiveTab] = useState('list');
  const [exampleName] = useState('docname123');

  const { data, isLoading, error } = useDocTypeSchema(doctype);

  const schema = data?.message;

  // Generate example body for create/update
  const exampleBody = useMemo(() => {
    if (!schema?.fields) return {};

    const body: Record<string, unknown> = {};
    (schema.fields ?? []).forEach((field) => {
      if (isBodyFieldType(field.fieldtype) && field.example !== undefined) {
        body[field.fieldname] = field.example;
      }
    });
    return body;
  }, [schema]);

  // Get required fields only
  const requiredFields = useMemo(() => {
    if (!schema?.fields) return [];
    return schema.fields.filter((f) => f.reqd && isBodyFieldType(f.fieldtype));
  }, [schema]);

  // Get body fields (for create/update)
  const bodyFields = useMemo(() => {
    if (!schema?.fields) return [];
    return schema.fields.filter((f) => isBodyFieldType(f.fieldtype));
  }, [schema]);

  if (isLoading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-violet-500" />
      </div>
    );
  }

  if (error || !schema) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm text-red-500">
          {error?.message || 'Failed to load DocType schema'}
        </p>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Header */}
      <div className="border-b border-zinc-200 p-4 dark:border-zinc-800">
        <div className="flex items-center gap-3">
          <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
            {doctype}
          </h2>
          {schema.is_submittable && (
            <Badge label="Submittable" variant="info" />
          )}
          {schema.istree && (
            <Badge label="Tree" variant="info" />
          )}
        </div>
        <p className="mt-1 text-sm text-zinc-500">
          Module: <span className="text-zinc-700 dark:text-zinc-300">{schema.module}</span>
        </p>
      </div>

      {/* Tabs */}
      <Tabs
        tabs={CRUD_TABS}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      {/* Tab Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {activeTab === 'list' && (
          <ListTabContent doctype={doctype} fields={bodyFields} />
        )}
        {activeTab === 'get' && (
          <GetTabContent doctype={doctype} exampleName={exampleName} />
        )}
        {activeTab === 'create' && (
          <CreateTabContent
            doctype={doctype}
            requiredFields={requiredFields}
            exampleBody={exampleBody}
          />
        )}
        {activeTab === 'update' && (
          <UpdateTabContent
            doctype={doctype}
            exampleName={exampleName}
            bodyFields={bodyFields}
          />
        )}
        {activeTab === 'delete' && (
          <DeleteTabContent doctype={doctype} exampleName={exampleName} />
        )}
        {activeTab === 'test' && (
          <ApiTester doctype={doctype} fields={schema.fields} />
        )}

        {/* Field Schema */}
        <div className="mt-8">
          <h3 className="mb-4 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
            Field Schema
          </h3>
          <FieldTable fields={schema.fields} />
        </div>
      </div>
    </div>
  );
}

// List Tab Content
function ListTabContent({
  doctype,
  fields,
}: {
  doctype: string;
  fields: FieldInfo[] | undefined;
}) {
  const safeFields = fields ?? [];
  const listUrl = buildListUrl(doctype);

  const listParams = {
    filters: [['enabled', '=', 1]],
    fields: safeFields.slice(0, 3).map((f) => f.fieldname),
    order_by: 'creation desc',
    limit_start: 0,
    limit_page_length: 20,
  };

  const exampleResponse = {
    data: [
      { name: 'doc1', ...Object.fromEntries(safeFields.slice(0, 3).map((f) => [f.fieldname, f.example || ''])) },
      { name: 'doc2', ...Object.fromEntries(safeFields.slice(0, 3).map((f) => [f.fieldname, f.example || ''])) },
    ],
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Endpoint
        </h3>
        <div className="flex items-center gap-2">
          <Badge label="GET" variant="info" />
          <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
            {listUrl}
          </code>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Query Parameters
        </h3>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-zinc-500">
                <th className="pb-2 pr-4 font-medium">Parameter</th>
                <th className="pb-2 pr-4 font-medium">Type</th>
                <th className="pb-2 font-medium">Description</th>
              </tr>
            </thead>
            <tbody className="text-zinc-600 dark:text-zinc-400">
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">filters</code></td>
                <td className="py-2 pr-4">Array</td>
                <td className="py-2">Array of filters: [["field", "operator", "value"]...]</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">fields</code></td>
                <td className="py-2 pr-4">Array</td>
                <td className="py-2">Fields to fetch: ["field1", "field2"]</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">order_by</code></td>
                <td className="py-2 pr-4">String</td>
                <td className="py-2">Sort order: "fieldname asc" or "fieldname desc"</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">limit_start</code></td>
                <td className="py-2 pr-4">Integer</td>
                <td className="py-2">Starting offset (default: 0)</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">limit_page_length</code></td>
                <td className="py-2 pr-4">Integer</td>
                <td className="py-2">Number of records (default: 20)</td>
              </tr>
              <tr className="border-t border-zinc-100 dark:border-zinc-800">
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">as_dict</code></td>
                <td className="py-2 pr-4">Boolean</td>
                <td className="py-2">Return as dict (default: true)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Request
        </h3>
        <CodeBlock
          language="curl"
          code={buildListCurl(doctype, listParams)}
          title="cURL"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Response
        </h3>
        <CodeBlock
          language="json"
          code={JSON.stringify(exampleResponse, null, 2)}
          title="Response"
        />
      </div>
    </div>
  );
}

// Get Tab Content
function GetTabContent({ doctype, exampleName }: { doctype: string; exampleName: string }) {
  const getUrl = buildGetUrl(doctype, exampleName);

  const exampleResponse = {
    data: {
      name: exampleName,
      owner: 'Administrator',
      creation: '2024-01-15 10:30:00',
      modified: '2024-01-15 10:30:00',
      modified_by: 'Administrator',
      docstatus: 0,
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Endpoint
        </h3>
        <div className="flex items-center gap-2">
          <Badge label="GET" variant="info" />
          <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
            {getUrl}
          </code>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Path Parameters
        </h3>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <table className="w-full text-sm">
            <tbody className="text-zinc-600 dark:text-zinc-400">
              <tr>
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">name</code></td>
                <td className="py-2">Document name (primary key)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Query Parameters
        </h3>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <table className="w-full text-sm">
            <tbody className="text-zinc-600 dark:text-zinc-400">
              <tr>
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">expand_links</code></td>
                <td className="py-2">Boolean - Expand linked documents (default: false)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Request
        </h3>
        <CodeBlock
          language="curl"
          code={buildListCurl(doctype)}
          title="cURL"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Response
        </h3>
        <CodeBlock
          language="json"
          code={JSON.stringify(exampleResponse, null, 2)}
          title="Response"
        />
      </div>
    </div>
  );
}

// Create Tab Content
function CreateTabContent({
  doctype,
  requiredFields,
  exampleBody,
}: {
  doctype: string;
  requiredFields: FieldInfo[] | undefined;
  exampleBody: Record<string, unknown> | undefined;
}) {
  const safeRequiredFields = requiredFields ?? [];
  const createUrl = buildCreateUrl(doctype);

  const exampleResponse = {
    data: {
      name: 'newdoc123',
      ...(exampleBody ?? {}),
      owner: 'Administrator',
      creation: '2024-01-15 10:30:00',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Endpoint
        </h3>
        <div className="flex items-center gap-2">
          <Badge label="POST" variant="success" />
          <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
            {createUrl}
          </code>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Required Fields
        </h3>
        <div className="flex flex-wrap gap-2">
          {(requiredFields?.length ?? 0) > 0 ? (
            requiredFields.map((field) => (
              <Badge key={field.fieldname} label={`${field.fieldname} (${field.fieldtype})`} variant="danger" />
            ))
          ) : (
            <span className="text-sm text-zinc-500">No required fields</span>
          )}
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Request Body
        </h3>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-2 text-sm text-zinc-500">
            Send as JSON in the request body. Only include fields you want to set.
          </p>
          <CodeBlock
            language="json"
            code={JSON.stringify(exampleBody, null, 2)}
            title="Body"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Request
        </h3>
        <CodeBlock
          language="curl"
          code={buildCreateCurl(doctype, exampleBody)}
          title="cURL"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Response
        </h3>
        <CodeBlock
          language="json"
          code={JSON.stringify(exampleResponse, null, 2)}
          title="Response"
        />
      </div>
    </div>
  );
}

// Update Tab Content
function UpdateTabContent({
  doctype,
  exampleName,
  bodyFields,
}: {
  doctype: string;
  exampleName: string;
  bodyFields: FieldInfo[] | undefined;
}) {
  const safeBodyFields = bodyFields ?? [];
  const updateUrl = buildUpdateUrl(doctype, exampleName);

  // Only show first 3 fields in example
  const updateBody = Object.fromEntries(
    safeBodyFields.slice(0, 2).map((f) => [f.fieldname, f.example || ''])
  );

  const exampleResponse = {
    data: {
      name: exampleName,
      ...updateBody,
      modified: '2024-01-15 11:00:00',
    },
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Endpoint
        </h3>
        <div className="flex items-center gap-2">
          <Badge label="PUT" variant="warning" />
          <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
            {updateUrl}
          </code>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Path Parameters
        </h3>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <table className="w-full text-sm">
            <tbody className="text-zinc-600 dark:text-zinc-400">
              <tr>
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">name</code></td>
                <td className="py-2">Document name (primary key)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Request Body
        </h3>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <p className="mb-2 text-sm text-zinc-500">
            Partial updates are supported. Only include fields you want to change.
          </p>
          <CodeBlock
            language="json"
            code={JSON.stringify(updateBody, null, 2)}
            title="Body"
          />
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Request
        </h3>
        <CodeBlock
          language="curl"
          code={buildUpdateCurl(doctype, exampleName, updateBody)}
          title="cURL"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Response
        </h3>
        <CodeBlock
          language="json"
          code={JSON.stringify(exampleResponse, null, 2)}
          title="Response"
        />
      </div>
    </div>
  );
}

// Delete Tab Content
function DeleteTabContent({ doctype, exampleName }: { doctype: string; exampleName: string }) {
  const deleteUrl = buildDeleteUrl(doctype, exampleName);

  const exampleResponse = {
    message: 'ok',
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Endpoint
        </h3>
        <div className="flex items-center gap-2">
          <Badge label="DELETE" variant="danger" />
          <code className="rounded bg-zinc-100 px-2 py-1 text-sm dark:bg-zinc-800">
            {deleteUrl}
          </code>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Path Parameters
        </h3>
        <div className="rounded-lg border border-zinc-200 p-4 dark:border-zinc-800">
          <table className="w-full text-sm">
            <tbody className="text-zinc-600 dark:text-zinc-400">
              <tr>
                <td className="py-2 pr-4"><code className="text-violet-600 dark:text-violet-400">name</code></td>
                <td className="py-2">Document name (primary key)</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Request
        </h3>
        <CodeBlock
          language="curl"
          code={buildDeleteCurl(doctype, exampleName)}
          title="cURL"
        />
      </div>

      <div>
        <h3 className="mb-2 text-sm font-semibold text-zinc-900 dark:text-zinc-100">
          Example Response
        </h3>
        <CodeBlock
          language="json"
          code={JSON.stringify(exampleResponse, null, 2)}
          title="Response"
        />
      </div>

      <div className="rounded-lg border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/50 dark:bg-amber-950/20">
        <p className="text-sm text-amber-700 dark:text-amber-400">
          <strong>Warning:</strong> Delete operations are permanent and cannot be undone.
          Consider using a "disabled" or "deleted" flag instead if you need soft delete.
        </p>
      </div>
    </div>
  );
}
