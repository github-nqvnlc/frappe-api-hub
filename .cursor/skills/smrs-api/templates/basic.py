"""
{{API_NAME}} API - Basic CRUD Operations

Generated template for {{SNAKE_NAME}} endpoints.
Update doctype name and fields as needed.
"""

import frappe


@frappe.whitelist()
def get_{{SNAKE_NAME}}(name: str) -> dict:
    """
    Get single {{SNAKE_NAME}} by name.

    Args:
        name: Document name

    Returns:
        dict: { success, message, data }
    """
    try:
        if not name:
            return {"success": False, "message": "Thiếu tham số name"}

        doc = frappe.get_doc("{{DOC_DOCTYPE}}", name)
        return {
            "success": True,
            "message": "Lấy thông tin thành công",
            "data": doc.as_dict(),
        }

    except frappe.DoesNotExistError:
        return {"success": False, "message": "Không tìm thấy {{SNAKE_NAME}}"}
    except Exception as e:
        frappe.log_error(f"Get {{SNAKE_NAME}} error: {e!r}", "SMRS {{API_NAME}} Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}


@frappe.whitelist()
def create_{{SNAKE_NAME}}(**kwargs) -> dict:
    """
    Create new {{SNAKE_NAME}}.

    Returns:
        dict: { success, message, data }
    """
    try:
        doc = frappe.get_doc({
            "doctype": "{{DOC_DOCTYPE}}",
            **kwargs,
        })
        doc.insert()
        frappe.db.commit()

        return {
            "success": True,
            "message": "Tạo {{SNAKE_NAME}} thành công",
            "data": doc.as_dict(),
        }

    except frappe.ValidationError as e:
        return {"success": False, "message": str(e)}
    except Exception as e:
        frappe.log_error(f"Create {{SNAKE_NAME}} error: {e!r}", "SMRS {{API_NAME}} Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}


@frappe.whitelist()
def update_{{SNAKE_NAME}}(name: str, **kwargs) -> dict:
    """
    Update existing {{SNAKE_NAME}}.

    Args:
        name: Document name
        **kwargs: Fields to update

    Returns:
        dict: { success, message, data }
    """
    try:
        if not name:
            return {"success": False, "message": "Thiếu tham số name"}

        doc = frappe.get_doc("{{DOC_DOCTYPE}}", name)

        for field, value in kwargs.items():
            if hasattr(doc, field):
                doc.set(field, value)

        doc.save()
        frappe.db.commit()

        return {
            "success": True,
            "message": "Cập nhật thành công",
            "data": doc.as_dict(),
        }

    except frappe.DoesNotExistError:
        return {"success": False, "message": "Không tìm thấy {{SNAKE_NAME}}"}
    except frappe.ValidationError as e:
        return {"success": False, "message": str(e)}
    except Exception as e:
        frappe.log_error(f"Update {{SNAKE_NAME}} error: {e!r}", "SMRS {{API_NAME}} Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}


@frappe.whitelist()
def delete_{{SNAKE_NAME}}(name: str) -> dict:
    """
    Delete {{SNAKE_NAME}}.

    Args:
        name: Document name

    Returns:
        dict: { success, message }
    """
    try:
        if not name:
            return {"success": False, "message": "Thiếu tham số name"}

        frappe.delete_doc("{{DOC_DOCTYPE}}", name)
        frappe.db.commit()

        return {
            "success": True,
            "message": "Xóa thành công",
        }

    except frappe.DoesNotExistError:
        return {"success": False, "message": "Không tìm thấy {{SNAKE_NAME}}"}
    except Exception as e:
        frappe.log_error(f"Delete {{SNAKE_NAME}} error: {e!r}", "SMRS {{API_NAME}} Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}
