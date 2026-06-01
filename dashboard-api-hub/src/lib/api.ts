import { useFrappeAuth, useFrappeGetCall } from 'frappe-react-sdk';
import type {
  ModuleInfo,
  DocTypeSchema,
  FilterOperator,
  DocTypeBasic,
} from './types';

/**
 * Get all modules with their DocTypes
 */
export function useModules() {
  const result = useFrappeGetCall<{ message: ModuleInfo[] }>(
    'api_hub.api.get_modules',
    null,
    'api_hub.api.get_modules'  // Unique cache key
  );

  // Safely normalize the data
  const normalizedData = result.data?.message?.map(module => ({
    ...module,
    doctypes: module.doctypes ?? [],
  })) ?? [];

  return {
    ...result,
    data: result.data ? { ...result.data, message: normalizedData } : undefined,
  };
}

/**
 * Get DocTypes, optionally filtered by module
 */
export function useDocTypes(module?: string) {
  return useFrappeGetCall<{ message: DocTypeBasic[] }>(
    'api_hub.api.get_doctypes',
    module ? { module } : null,
    'api_hub.api'
  );
}

/**
 * Get full field schema for a DocType
 */
export function useDocTypeSchema(doctype: string | null) {
  if (!doctype) {
    return { data: undefined, isLoading: false, error: null };
  }
  const result = useFrappeGetCall<{ message: DocTypeSchema }>(
    'api_hub.api.get_doctype_schema',
    { doctype },
    `api_hub.api.get_doctype_schema.${doctype}`  // Unique cache key per doctype
  );

  // Safely normalize the schema
  if (result.data?.message) {
    const normalizedSchema = {
      ...result.data.message,
      fields: result.data.message.fields ?? [],
    };
    return {
      ...result,
      data: { ...result.data, message: normalizedSchema },
    };
  }

  return result;
}

/**
 * Get available filter operators
 */
export function useFilterOperators() {
  return useFrappeGetCall<{ message: FilterOperator[] }>(
    'api_hub.api.get_filter_operators',
    null,
    'api_hub.api'
  );
}

/**
 * Get flat list of all DocTypes
 */
export function useAllDocTypesFlat() {
  return useFrappeGetCall<{ message: DocTypeBasic[] }>(
    'api_hub.api.get_all_doctypes_flat',
    null,
    'api_hub.api'
  );
}

/**
 * Build example URL for list endpoint
 */
export function buildListUrl(doctype: string, baseUrl?: string): string {
  const base = baseUrl || '';
  return `${base}/api/resource/${encodeURIComponent(doctype)}`;
}

/**
 * Build example URL for get endpoint
 */
export function buildGetUrl(doctype: string, name: string, baseUrl?: string): string {
  const base = baseUrl || '';
  return `${base}/api/resource/${encodeURIComponent(doctype)}/${encodeURIComponent(name)}`;
}

/**
 * Build example URL for create endpoint
 */
export function buildCreateUrl(doctype: string, baseUrl?: string): string {
  return buildListUrl(doctype, baseUrl);
}

/**
 * Build example URL for update endpoint
 */
export function buildUpdateUrl(doctype: string, name: string, baseUrl?: string): string {
  return buildGetUrl(doctype, name, baseUrl);
}

/**
 * Build example URL for delete endpoint
 */
export function buildDeleteUrl(doctype: string, name: string, baseUrl?: string): string {
  return buildGetUrl(doctype, name, baseUrl);
}

/**
 * Generate cURL command for list request
 */
export function buildListCurl(
  doctype: string,
  params?: Record<string, unknown>,
  baseUrl?: string
): string {
  const url = buildListUrl(doctype, baseUrl);
  const lines = [
    `curl -X GET '${url}' \\`,
    `  -H 'Authorization: token api_key:api_secret' \\`,
    `  -H 'Accept: application/json'`,
  ];

  if (params && Object.keys(params).length > 0) {
    const queryString = new URLSearchParams(
      Object.entries(params).map(([k, v]) => [k, JSON.stringify(v)])
    ).toString();
    lines[0] = lines[0].replace(`'${url}'`, `'${url}?${queryString}'`);
  }

  return lines.join('\n');
}

/**
 * Generate cURL command for create request
 */
export function buildCreateCurl(
  doctype: string,
  body: Record<string, unknown>,
  baseUrl?: string
): string {
  const url = buildCreateUrl(doctype, baseUrl);
  return [
    `curl -X POST '${url}' \\`,
    `  -H 'Authorization: token api_key:api_secret' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Accept: application/json' \\`,
    `  -d '${JSON.stringify(body, null, 2)}'`,
  ].join('\n');
}

/**
 * Generate cURL command for update request
 */
export function buildUpdateCurl(
  doctype: string,
  name: string,
  body: Record<string, unknown>,
  baseUrl?: string
): string {
  const url = buildUpdateUrl(doctype, name, baseUrl);
  return [
    `curl -X PUT '${url}' \\`,
    `  -H 'Authorization: token api_key:api_secret' \\`,
    `  -H 'Content-Type: application/json' \\`,
    `  -H 'Accept: application/json' \\`,
    `  -d '${JSON.stringify(body, null, 2)}'`,
  ].join('\n');
}

/**
 * Generate cURL command for delete request
 */
export function buildDeleteCurl(
  doctype: string,
  name: string,
  baseUrl?: string
): string {
  const url = buildDeleteUrl(doctype, name, baseUrl);
  return [
    `curl -X DELETE '${url}' \\`,
    `  -H 'Authorization: token api_key:api_secret' \\`,
    `  -H 'Accept: application/json'`,
  ].join('\n');
}

/**
 * Get Frappe field type display name
 */
export function getFieldTypeDisplay(fieldtype: string): string {
  const displayNames: Record<string, string> = {
    'Data': 'String',
    'Link': 'String (Link)',
    'Select': 'String',
    'Int': 'Integer',
    'Float': 'Number',
    'Currency': 'Number',
    'Check': 'Boolean',
    'Date': 'String (ISO Date)',
    'Datetime': 'String (ISO DateTime)',
    'Text': 'String',
    'Small Text': 'String',
    'Code': 'String',
    'JSON': 'Object',
    'File': 'String',
    'Attach': 'String',
    'Attach Image': 'String',
    'Table': 'Array',
    'Table Multiselect': 'Array',
    'Dynamic Link': 'String',
    'Password': 'String',
  };
  return displayNames[fieldtype] || fieldtype;
}

/**
 * Check if field type accepts a body value
 */
export function isBodyFieldType(fieldtype: string): boolean {
  // Fields that cannot be set via API
  const excluded = ['Column Break', 'Section Break', 'HTML', 'Button', 'Heading'];
  return !excluded.includes(fieldtype);
}
