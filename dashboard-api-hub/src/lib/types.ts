// API Hub TypeScript Interfaces

export interface ModuleInfo {
  name: string;
  module_name: string;
  app_name: string;
  doctypes: DocTypeBasic[];
}

export interface DocTypeBasic {
  name: string;
  description?: string;
}

export interface DocTypeSchema {
  doctype: string;
  module: string;
  is_submittable: boolean;
  istree: boolean;
  fields: FieldInfo[];
}

export interface FieldInfo {
  fieldname: string;
  fieldtype: string;
  label: string;
  reqd: boolean;
  in_list_view: boolean;
  in_standard_filter: boolean;
  description: string;
  options: string;
  default: string;
  example?: string | number | boolean | Array<{ name: string }>;
  // Type-specific
  link_doctype?: string;
  options_list?: string[];
  child_doctype?: string;
}

export interface FilterOperator {
  value: string;
  label: string;
}

export interface ListParams {
  filters?: FilterTuple[];
  fields?: string[];
  order_by?: string;
  limit_start?: number;
  limit_page_length?: number;
  as_dict?: boolean;
  debug?: boolean;
}

export interface FilterTuple {
  0: string; // fieldname
  1: string; // operator
  2: string | number | boolean | string[]; // value
}

export interface CreateUpdateBody {
  [key: string]: string | number | boolean | null | object;
}

// API Response types
export interface ApiResponse<T> {
  data?: T;
  message?: string;
  exc?: string;
  exc_type?: string;
}

// CRUD Examples
export interface ListExample {
  method: 'GET';
  endpoint: string;
  params: ListParams;
}

export interface GetExample {
  method: 'GET';
  endpoint: string;
  params?: {
    expand_links?: boolean;
  };
}

export interface CreateExample {
  method: 'POST';
  endpoint: string;
  body: Record<string, unknown>;
}

export interface UpdateExample {
  method: 'PUT';
  endpoint: string;
  body: Record<string, unknown>;
}

export interface DeleteExample {
  method: 'DELETE';
  endpoint: string;
}
