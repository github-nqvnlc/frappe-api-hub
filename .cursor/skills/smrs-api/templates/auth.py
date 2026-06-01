"""
{{API_NAME}} API - Authentication Endpoint

Generated template for authentication endpoints.
Guest-allowed for public access flows.
"""

import frappe

{{ERROR_CODES}}


@frappe.whitelist(allow_guest=True)  # nosemgrep
def {{SNAKE_NAME}}(**kwargs) -> dict:
    """
    {{API_NAME}} endpoint description.

    Args:
        **kwargs: Required parameters

    Returns:
        dict: { success, message, ... }
    """
    try:
        # TODO: Add parameter validation
        required_fields = []  # Add required field names
        for field in required_fields:
            if not kwargs.get(field):
                return {"success": False, "message": f"Vui lòng cung cấp {field}"}

        # TODO: Add business logic here

        return {
            "success": True,
            "message": "Thành công",
            # Add additional response fields here
        }

    except Exception as e:
        frappe.log_error(f"{{SNAKE_NAME}} error: {e!r}", "SMRS {{API_NAME}} Error")
        return {"success": False, "message": ERROR_MESSAGES.get("E001", "Đã xảy ra lỗi. Vui lòng thử lại.")}


def helper_function(param: str) -> str:
    """
    Helper function for {{SNAKE_NAME}} API.

    Args:
        param: Description

    Returns:
        str: Result
    """
    # TODO: Implement helper logic
    return param
