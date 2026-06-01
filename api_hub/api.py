import frappe
from frappe import _


@frappe.whitelist()
def get_modules():
    """Get all modules with their DocTypes."""
    modules = frappe.get_all(
        "Module Def",
        filters={"module_name": ["not like", "frappe.%"]},
        fields=["name", "module_name", "app_name"],
        order_by="module_name",
    )

    result = []
    for module in modules:
        doctypes = frappe.get_all(
            "DocType",
            filters={"module": module.name, "istable": 0, "custom": 0},
            fields=["name", "module", "description"],
            order_by="name",
        )

        result.append({
            "name": module.name,
            "module_name": module.module_name,
            "app_name": module.app_name,
            "doctypes": [{"name": dt.name, "description": dt.description or ""} for dt in doctypes],
        })

    return result


@frappe.whitelist()
def get_doctypes(module: str = None):
    """Get DocTypes, optionally filtered by module."""
    filters = {"istable": 0, "custom": 0}
    if module:
        filters["module"] = module

    doctypes = frappe.get_all(
        "DocType",
        filters=filters,
        fields=["name", "module", "description", "author"],
        order_by="name",
    )

    return doctypes


@frappe.whitelist()
def get_doctype_schema(doctype: str):
    """Get full field schema for a DocType."""
    if not frappe.has_permission(doctype, "read"):
        frappe.throw(_("You don't have permission to read {0}").format(doctype), frappe.PermissionError)

    meta = frappe.get_meta(doctype)
    fields = []

    for field in meta.fields:
        # Skip standard fields that are auto-generated
        if field.fieldname in ("creation", "modified", "modified_by", "owner", "idx", "docstatus"):
            continue

        field_info = {
            "fieldname": field.fieldname,
            "fieldtype": field.fieldtype,
            "label": field.label or field.fieldname,
            "reqd": bool(field.reqd),
            "in_list_view": bool(field.in_list_view),
            "in_standard_filter": bool(field.in_standard_filter),
            "description": field.description or "",
            "options": field.options or "",
            "default": field.default or "",
        }

        # Add type-specific info
        if field.fieldtype in ("Int", "Float", "Currency"):
            field_info["example"] = 0
        elif field.fieldtype == "Check":
            field_info["example"] = 1
        elif field.fieldtype == "Date":
            field_info["example"] = "2024-01-15"
        elif field.fieldtype == "Datetime":
            field_info["example"] = "2024-01-15 14:30:00"
        elif field.fieldtype in ("Data", "Small Text"):
            field_info["example"] = "Sample text"
        elif field.fieldtype == "Text":
            field_info["example"] = "Longer text content..."
        elif field.fieldtype == "Code":
            field_info["example"] = "console.log('hello')"
        elif field.fieldtype == "JSON":
            field_info["example"] = '{"key": "value"}'
        elif field.fieldtype == "Link":
            field_info["example"] = field.options or "DocType"
            field_info["link_doctype"] = field.options
        elif field.fieldtype == "Select":
            options = (field.options or "").split("\n")
            field_info["example"] = options[0] if options else ""
            field_info["options"] = options
        elif field.fieldtype in ("Table", "Table Multiselect"):
            field_info["example"] = [{"name": "docname1"}, {"name": "docname2"}]
            field_info["child_doctype"] = field.options

        fields.append(field_info)

    return {
        "doctype": doctype,
        "module": meta.module,
        "is_submittable": meta.is_submittable,
        "istree": meta.is_tree,
        "fields": fields,
    }


@frappe.whitelist()
def get_filter_operators():
    """Get list of available filter operators."""
    return [
        {"value": "=", "label": "Equals"},
        {"value": "!=", "label": "Not Equals"},
        {"value": ">", "label": "Greater Than"},
        {"value": "<", "label": "Less Than"},
        {"value": ">=", "label": "Greater Than or Equals"},
        {"value": "<=", "label": "Less Than or Equals"},
        {"value": "like", "label": "Like (pattern matching)"},
        {"value": "not like", "label": "Not Like"},
        {"value": "in", "label": "In"},
        {"value": "not in", "label": "Not In"},
        {"value": "is", "label": "Is"},
    ]


@frappe.whitelist()
def get_all_doctypes_flat():
    """Get a flat list of all DocTypes for quick search."""
    doctypes = frappe.get_all(
        "DocType",
        filters={"istable": 0, "custom": 0},
        fields=["name", "module", "description"],
        order_by="name",
    )
    return doctypes
