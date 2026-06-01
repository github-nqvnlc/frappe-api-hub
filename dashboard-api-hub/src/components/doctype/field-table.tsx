import { Badge } from '../ui/badge';
import { getFieldTypeDisplay, isBodyFieldType } from '../../lib/api';
import type { FieldInfo } from '../../lib/types';

interface FieldTableProps {
  fields: FieldInfo[];
}

export function FieldTable({ fields }: FieldTableProps) {
  if (!fields || fields.length === 0) {
    return (
      <div className="py-8 text-center text-sm text-zinc-500">
        No fields available for this DocType
      </div>
    );
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-zinc-200 text-left dark:border-zinc-800">
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">
              Fieldname
            </th>
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">
              Label
            </th>
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">
              Type
            </th>
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">
              Required
            </th>
            <th className="pb-2 pr-4 font-medium text-zinc-500 dark:text-zinc-400">
              In List
            </th>
            <th className="pb-2 font-medium text-zinc-500 dark:text-zinc-400">
              Description
            </th>
          </tr>
        </thead>
        <tbody>
          {fields.map((field) => (
            <tr
              key={field.fieldname}
              className="border-b border-zinc-100 dark:border-zinc-800/50"
            >
              <td className="py-2.5 pr-4">
                <code className="rounded bg-zinc-100 px-1.5 py-0.5 text-xs font-medium text-violet-600 dark:bg-zinc-800 dark:text-violet-400">
                  {field.fieldname}
                </code>
                {!isBodyFieldType(field.fieldtype) && (
                  <Badge label="N/A" variant="warning" />
                )}
              </td>
              <td className="py-2.5 pr-4 text-zinc-700 dark:text-zinc-300">
                {field.label}
              </td>
              <td className="py-2.5 pr-4">
                <span className="inline-flex items-center gap-1">
                  <Badge
                    label={field.fieldtype}
                    variant={getFieldTypeVariant(field.fieldtype)}
                  />
                  {field.options && !['Select', 'Link', 'Table', 'Table Multiselect'].includes(field.fieldtype) === false && (
                    <span className="text-xs text-zinc-400">
                      ({field.options})
                    </span>
                  )}
                </span>
              </td>
              <td className="py-2.5 pr-4">
                {field.reqd ? (
                  <Badge label="Required" variant="danger" />
                ) : (
                  <Badge label="Optional" variant="default" />
                )}
              </td>
              <td className="py-2.5 pr-4">
                {field.in_list_view ? (
                  <span className="text-emerald-500">Yes</span>
                ) : (
                  <span className="text-zinc-400">No</span>
                )}
              </td>
              <td className="py-2.5 text-zinc-500 dark:text-zinc-400">
                {field.description || '-'}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function getFieldTypeVariant(fieldtype: string): 'default' | 'info' | 'warning' {
  const textTypes = ['Data', 'Small Text', 'Text', 'Code', 'Password'];
  const linkTypes = ['Link', 'Dynamic Link'];
  const numberTypes = ['Int', 'Float', 'Currency'];
  const selectTypes = ['Select', 'Check'];
  const dateTypes = ['Date', 'Datetime'];
  const complexTypes = ['Table', 'Table Multiselect', 'JSON'];

  if (textTypes.includes(fieldtype)) return 'default';
  if (linkTypes.includes(fieldtype)) return 'info';
  if (numberTypes.includes(fieldtype)) return 'info';
  if (selectTypes.includes(fieldtype)) return 'warning';
  if (dateTypes.includes(fieldtype)) return 'warning';
  if (complexTypes.includes(fieldtype)) return 'warning';
  return 'default';
}
