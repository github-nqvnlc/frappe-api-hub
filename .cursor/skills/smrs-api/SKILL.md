# SMRS API Development Guide

Comprehensive guide for building Frappe REST APIs in the SMRS (Smart Meeting Room System) app. Covers authentication patterns, API conventions, DocType controllers, session management, and best practices.

## Prerequisites

This skill assumes familiarity with:
- Frappe Framework (v15+)
- Python type annotations
- REST API design patterns

---

## API Architecture Overview

### Directory Structure

```
smrs/smrs/
├── api/                    # REST API endpoints
│   ├── __init__.py
│   ├── utils.py           # Shared utilities
│   ├── organization.py    # Organization APIs
│   └── auth/             # Authentication APIs
│       ├── __init__.py
│       ├── login.py       # Login endpoint
│       ├── logout.py      # Logout endpoint
│       ├── verify_code.py # OTP verification
│       ├── forgot_password.py
│       ├── reset_password.py
│       └── session.py     # Session management
├── hooks.py               # App hooks & session handlers
├── user_hooks.py         # User lifecycle hooks
└── session_handler.py     # Session management
```

---

## API Response Format

### Standard Success Response

```python
{
    "success": True,
    "message": "Operation completed successfully",
    "data": { ... }  # Optional
}
```

### Standard Error Response

```python
{
    "success": False,
    "message": "Error description in Vietnamese"
}
```

### Error Codes Convention

Use consistent error codes prefixed with `E` followed by 3 digits:

| Code | Message | Usage |
|------|---------|-------|
| `E001` | Generic error | Default fallback |
| `E002` | Invalid input | Validation failures |
| `E003` | Not found | Resource missing |
| `E004` | Unauthorized | Auth required |
| `E005` | Forbidden | Insufficient permissions |
| `E006` | Missing required field | Empty/missing params |
| `E007` | Invalid code | Verification codes |
| `E008` | Expired token | Time-sensitive tokens |

---

## Authentication Patterns

### Guest-Allowed Endpoints

For endpoints that need to be accessible without authentication (login, forgot password):

```python
@frappe.whitelist(allow_guest=True)  # nosemgrep
def my_endpoint(email: str, code: str):
    # Public endpoint logic
    pass
```

**Security Note:** Always validate tokens server-side even for guest endpoints.

### Authenticated Endpoints

For protected endpoints, Frappe handles auth automatically:

```python
@frappe.whitelist()
def get_user_profile():
    # Frappe validates session automatically
    user = frappe.session.user
    # ... implementation
```

### Session Management

SMRS uses Frappe's session with custom session tracking:

**On Login (hooks.py):**
```python
on_session_creation = [
    "smrs.session_handler.on_session_creation",
]
```

**On Logout (hooks.py):**
```python
on_logout = [
    "smrs.session_handler.on_logout",
]
```

---

## Login Flow Implementation

### Step 1: Login Endpoint (`auth/login.py`)

```python
import frappe
from frappe.auth import LoginManager

@frappe.whitelist(allow_guest=True)  # nosemgrep
def login(usr: str, pwd: str):
    """
    API Đăng nhập - Dùng Frappe built-in login + tạo User Session
    
    Returns:
        dict: { success, message, sid, user }
    """
    try:
        if not usr or not pwd:
            return {"success": False, "message": "Vui lòng nhập tên đăng nhập và mật khẩu"}

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
```

### Step 2: User Info Extraction

```python
def get_user_info(user: str) -> dict:
    """Lấy thông tin user để trả về frontend"""
    user_doc = frappe.get_doc("User", user)

    employee = None
    department = None
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
```

---

## Password Reset Flow

### Step 1: Forgot Password (Send Code)

```python
from datetime import timedelta
import frappe
from frappe.utils import now_datetime, random_string, get_datetime

@frappe.whitelist(allow_guest=True)  # nosemgrep
def forgot_password(email: str):
    """Send verification code to email"""
    try:
        # Validate email exists
        user = frappe.db.get_value("User", {"email": email, "enabled": 1}, "name")
        if not user:
            return {"success": False, "message": "Email không tồn tại trong hệ thống"}

        # Generate 6-digit code
        code = random_string(6).upper()
        expires_at = now_datetime() + timedelta(minutes=10)

        # Store in Password Reset Token
        frappe.get_doc({
            "doctype": "Password Reset Token",
            "email": email,
            "token": code,
            "is_used": 0,
            "created_at": now_datetime(),
            "expires_at": expires_at,
        }).insert(ignore_permissions=True)
        frappe.db.commit()

        # Send email (implement email sending)
        send_password_reset_email(email, code)

        return {"success": True, "message": "Mã xác thực đã được gửi đến email của bạn"}

    except Exception as e:
        frappe.log_error(f"Forgot password error: {e!r}", "SMRS Forgot Password Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}
```

### Step 2: Verify Code

```python
ERROR_MESSAGES = {
    "E006": "Vui lòng nhập mã xác thực.",
    "E007": "Mã xác thực không hợp lệ.",
    "E008": "Mã xác thực đã hết hạn. Vui lòng gửi lại mã mới.",
}

@frappe.whitelist(allow_guest=True)  # nosemgrep
def verify_reset_code(email: str, code: str):
    """Verify the reset code and return a new token"""
    try:
        if not code or not code.strip():
            return {"success": False, "message": ERROR_MESSAGES["E006"]}

        code = code.strip()

        token_doc = frappe.db.get_value(
            "Password Reset Token",
            {"email": email, "is_used": 0},
            ["name", "token", "expires_at"],
            as_dict=True,
        )

        if not token_doc:
            return {"success": False, "message": ERROR_MESSAGES["E008"]}

        if now_datetime() > get_datetime(token_doc.expires_at):
            return {"success": False, "message": ERROR_MESSAGES["E008"]}

        if token_doc.token != code:
            return {"success": False, "message": ERROR_MESSAGES["E007"]}

        # Generate new reset token for password change
        reset_token = generate_verification_code(32)

        # Mark old token as used
        frappe.db.set_value("Password Reset Token", token_doc.name, "is_used", 1)

        # Create new token for password change
        frappe.get_doc({
            "doctype": "Password Reset Token",
            "email": email,
            "token": reset_token,
            "is_used": 0,
            "created_at": now_datetime(),
            "expires_at": now_datetime() + timedelta(minutes=10),
        }).insert(ignore_permissions=True)
        frappe.db.commit()

        return {"success": True, "message": "Xác thực thành công.", "token": reset_token}

    except Exception as e:
        frappe.log_error(f"Verify reset code error: {e!r}", "SMRS Verify Code Error")
        return {"success": False, "message": "Đã xảy ra lỗi. Vui lòng thử lại."}
```

---

## API Parameter Patterns

### Type Annotations Required

All `@frappe.whitelist()` methods must have type annotations:

```python
# GOOD
@frappe.whitelist()
def get_meeting(room: str, date: str) -> dict:
    pass

# BAD - Missing type annotations
@frappe.whitelist()
def get_meeting(room, date):
    pass
```

### JSON String Parameters

When receiving JSON strings from frontend:

```python
from __future__ import annotations
import json

@frappe.whitelist()
def create_booking(
    room: str,
    date: str,
    attendees_json: str,  # JSON string from frontend
) -> dict:
    # Parse JSON string
    if isinstance(attendees_json, str):
        attendees = json.loads(attendees_json)
    else:
        attendees = attendees_json
    # ... rest of implementation
```

### Optional Parameters with Defaults

```python
@frappe.whitelist()
def get_bookings(
    room: str | None = None,
    date: str = "",
    status: str = "Confirmed",
    page: int = 1,
    page_size: int = 10,
) -> dict:
    # Implementation
```

---

## Generic Pagination Pattern

Use the shared utility for consistent pagination:

```python
@frappe.whitelist()
def get_rooms(search_text: str = "", page: int = 1, page_size: int = 10) -> dict:
    return get_paginated_list(
        doctype="Meeting Room",
        page=page,
        page_size=page_size,
        search_fields=["room_name", "location"],
        search_text=search_text,
    )
```

---

## DocType Controller Patterns

### Standard Controller Structure

```python
# smrs/smrs/controllers/meeting_room_controller.py
import frappe
from frappe.model.document import Document

class MeetingRoomController(Document):
    def validate(self):
        """Validate meeting room data"""
        if not self.capacity or self.capacity < 1:
            frappe.throw("Sức chứa phải lớn hơn 0")

    def before_save(self):
        """Pre-save operations"""
        self.full_name = f"{self.room_name} - {self.location}"
```

### Client Script Example

```javascript
// meeting_room_list.js
frappe.listview_settings['Meeting Room'] = {
    onload: function(listview) {
        listview.page.add_action_item(__("Book Room"), function() {
            // Open booking dialog
        });
    }
};
```

---

## Session Handler Pattern

### On Session Creation

```python
# session_handler.py
import frappe

def on_session_creation(user: str):
    """Called when user logs in via frappe.auth"""
    if user and user != "Guest":
        # Create User Session tracking
        create_user_session(user)
        # Log session event
        frappe.logger().info(f"User {user} logged in")

def create_user_session(user: str):
    """Create or update user session record"""
    # Implementation depends on User.active_sessions
    pass
```

### On Logout

```python
# session_handler.py
def on_logout(user: str, reason: str = None):
    """Called when user logs out"""
    if user and user != "Guest":
        # Clean up session tracking
        cleanup_user_session(user)
        frappe.logger().info(f"User {user} logged out: {reason}")
```

---

## User Validation Hook

### Document Event Hook

In `hooks.py`:
```python
doc_events = {
    "User": {
        "validate": "smrs.user_hooks.validate",
    }
}
```

### Hook Implementation

```python
# user_hooks.py
import frappe

def validate(doc: "User", method: str = None):
    """Validate User document and sync access scope"""
    if doc.get("smrs_employee"):
        # Validate employee exists
        if not frappe.db.exists("Employee", doc.smrs_employee):
            frappe.throw(f"Nhân viên {doc.smrs_employee} không tồn tại")

    # Sync department access
    if doc.get("smrs_department"):
        # Ensure department is valid
        pass
```

---

## API Testing Checklist

Before deploying new APIs, verify:

- [ ] Type annotations on all parameters
- [ ] `@frappe.whitelist()` decorator present
- [ ] Guest endpoints marked with `allow_guest=True`
- [ ] Error messages in Vietnamese
- [ ] Error logging with descriptive titles
- [ ] Input validation before processing
- [ ] Database transactions committed when needed
- [ ] Session handling for auth-protected endpoints

---

## Error Logging Best Practices

Always include context in error logs:

```python
# Good - Descriptive title with context
frappe.log_error(f"Booking error for room {room}: {e!r}", "SMRS Booking Error")

# Bad - Generic message
frappe.log_error(str(e), "Error")
```

---

## API Naming Conventions

| Pattern | Example | Usage |
|---------|---------|-------|
| `get_*` | `get_meeting_rooms` | Fetch data |
| `create_*` | `create_booking` | Create records |
| `update_*` | `update_profile` | Modify records |
| `delete_*` | `delete_booking` | Remove records |
| `verify_*` | `verify_code` | Validate tokens/codes |

---

## Quick Reference

### Frappe Session Info

```python
frappe.session.user        # Current user
frappe.session.sid         # Session ID
frappe.session.data        # Session data dict
```

### Common Frappe DB Operations

```python
# Get single value
value = frappe.db.get_value("Doctype", filters, "field")

# Get as dict
doc = frappe.db.get_value("Doctype", filters, ["field1", "field2"], as_dict=True)

# Check exists
if frappe.db.exists("Doctype", {"field": value}):
    pass

# Get doc
doc = frappe.get_doc("Doctype", name)

# Get list
docs = frappe.get_list("Doctype", filters={}, fields=["name", "field"])
```

### Required Imports

```python
import frappe
from frappe.auth import LoginManager
from frappe.utils import now_datetime, today, add_days
from datetime import timedelta
```
