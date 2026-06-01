"""
{{API_NAME}} API - Custom Action Endpoint

Generated template for custom action endpoints.
Used for operations that don't fit standard CRUD patterns.
"""

import frappe


@frappe.whitelist()
def {{SNAKE_NAME}}(**kwargs) -> dict:
    """
    Custom action description.

    Args:
        **kwargs: Action parameters

    Returns:
        dict: { success, message, ... }
    """
    try:
        # TODO: Add business logic

        # Example: Get related documents
        # doc = frappe.get_doc("{{DOC_DOCTYPE}}", kwargs.get("name"))

        # Example: Perform action
        # doc.custom_method()

        return {
            "success": True,
            "message": "Thành công",
        }

    except frappe.DoesNotExistError:
        return {"success": False, "message": "Không tìm thấy tài nguyên"}
    except frappe.ValidationError as e:
        return {"success": False, "message": str(e)}
    except Exception as e:
        frappe.log_error(f"{{SNAKE_NAME}} error: {e!r}", "SMRS {{API_NAME}} Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}
