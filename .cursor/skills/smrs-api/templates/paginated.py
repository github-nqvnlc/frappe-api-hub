"""
{{API_NAME}} API - Paginated List Endpoint

Generated template for paginated list endpoints.
Supports search, filtering, and standard pagination.
"""

from __future__ import annotations

import json

import frappe


@frappe.whitelist()
def get_{{SNAKE_NAME_PLURAL}}(
    search_text: str = "",
    page: int = 1,
    page_size: int = 10,
    filters: str | None = None,
) -> dict:
    """
    Get paginated list of {{SNAKE_NAME_PLURAL}}.

    Args:
        search_text: Search query for text fields
        page: Page number (1-indexed)
        page_size: Items per page
        filters: JSON string of additional filters

    Returns:
        dict: {
            success,
            data (list of items),
            total (total count),
            page,
            page_size,
            total_pages
        }
    """
    try:
        # Parse filters if provided as JSON string
        parsed_filters = {}
        if filters:
            if isinstance(filters, str):
                parsed_filters = json.loads(filters)
            else:
                parsed_filters = filters

        # Search fields for text search
        search_fields = {{SEARCH_FIELDS}}

        # Build or_filters for text search
        or_filters = []
        if search_text and search_fields:
            for field in search_fields:
                or_filters.append(["{{DOC_DOCTYPE}}", field, "like", f"%{search_text}%"])

        # Pagination
        page_int = max(1, int(page))
        page_size_int = max(1, int(page_size))
        limit_start = (page_int - 1) * page_size_int

        # Get total count
        if or_filters:
            total_count = len(frappe.get_all(
                "{{DOC_DOCTYPE}}",
                filters=parsed_filters,
                or_filters=or_filters,
            ))
        else:
            total_count = frappe.db.count("{{DOC_DOCTYPE}}", parsed_filters)

        # Get data
        data = frappe.get_list(
            "{{DOC_DOCTYPE}}",
            filters=parsed_filters,
            or_filters=or_filters,
            fields=["name", "creation", "modified"],
            limit_start=limit_start,
            limit_page_length=page_size_int,
            order_by="creation desc",
        )

        return {
            "success": True,
            "data": data,
            "total": total_count,
            "page": page_int,
            "page_size": page_size_int,
            "total_pages": (total_count + page_size_int - 1) // page_size_int if page_size_int > 0 else 0,
        }

    except json.JSONDecodeError:
        return {"success": False, "message": "Định dạng filters không hợp lệ"}
    except Exception as e:
        frappe.log_error(f"Get {{SNAKE_NAME_PLURAL}} error: {e!r}", "SMRS {{API_NAME}} Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}
