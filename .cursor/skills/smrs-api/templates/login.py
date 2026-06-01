"""
Login API - User Authentication

Generated template for login endpoint.
Uses Frappe's LoginManager for authentication.
"""

import frappe
from frappe.auth import LoginManager


@frappe.whitelist(allow_guest=True)  # nosemgrep
def login(usr: str, pwd: str) -> dict:
    """
    API Đăng nhập - Dùng Frappe built-in login + tạo User Session

    Args:
        usr: Username or email
        pwd: Password

    Returns:
        dict: { success, message, sid, user }
    """
    try:
        # Validate input
        if not usr or not pwd:
            return {"success": False, "message": "Vui lòng nhập tên đăng nhập và mật khẩu"}

        # Authenticate using Frappe LoginManager
        login_manager = LoginManager()
        login_manager.authenticate(usr, pwd)

        if not login_manager.user:
            return {"success": False, "message": "Thông tin đăng nhập không chính xác"}

        # Check if user is enabled
        user_enabled = frappe.db.get_value("User", login_manager.user, "enabled")
        if not user_enabled:
            return {"success": False, "message": "Tài khoản đã bị khóa"}

        # Create session
        login_manager.login()

        # Get user info
        user_info = get_user_info(login_manager.user)

        return {
            "success": True,
            "message": "Đăng nhập thành công",
            "sid": frappe.session.sid,
            "user": user_info,
        }

    except frappe.AuthenticationError:
        return {"success": False, "message": "Thông tin đăng nhập không chính xác"}
    except Exception as e:
        frappe.log_error(f"Login error: {e!r}", "SMRS Login Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}


def get_user_info(user: str) -> dict:
    """
    Lấy thông tin user để trả về frontend.

    Args:
        user: Username

    Returns:
        dict: User information
    """
    user_doc = frappe.get_doc("User", user)

    employee = None
    department = None

    # Get employee info if linked
    if user_doc.get("smrs_employee"):
        try:
            emp_doc = frappe.get_doc("Employee", user_doc.smrs_employee)
            employee = {
                "name": emp_doc.name,
                "employee_name": emp_doc.employee_name,
                "employee_code": emp_doc.get("employee_code", ""),
                "designation": emp_doc.get("designation", ""),
                "department": emp_doc.get("department", ""),
            }
        except Exception:
            pass

    # Get department
    if user_doc.get("smrs_department"):
        department = user_doc.smrs_department

    return {
        "name": user_doc.name,
        "username": user_doc.username,
        "full_name": user_doc.full_name,
        "email": user_doc.email,
        "user_image": user_doc.user_image,
        "employee": employee,
        "department": department,
        "roles": [r.role for r in user_doc.get("roles", [])],
    }
