#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
SMRS API Template Generator - Generate new API endpoints from templates
Usage: python generate_api.py <type> <name> [--module <module>] [--auth] [--output <path>]

Types:
    basic       - Basic CRUD endpoint
    auth        - Authentication endpoint (guest-allowed)
    paginated   - Paginated list endpoint
    document    - Single document endpoint
    action      - Custom action endpoint
"""

import argparse
import os
import sys
from pathlib import Path

# Templates directory
TEMPLATES_DIR = Path(__file__).parent / "templates"


def load_template(template_name: str) -> str:
    """Load template content from templates folder"""
    template_path = TEMPLATES_DIR / f"{template_name}.py"
    if not template_path.exists():
        raise FileNotFoundError(f"Template not found: {template_name}")
    with open(template_path, "r", encoding="utf-8") as f:
        return f.read()


def to_snake_case(name: str) -> str:
    """Convert CamelCase to snake_case"""
    import re
    s1 = re.sub('(.)([A-Z][a-z]+)', r'\1_\2', name)
    return re.sub('([a-z0-9])([A-Z])', r'\1_\2', s1).lower()


def to_module_name(name: str) -> str:
    """Convert API name to module name"""
    return to_snake_case(name).replace("_", "")


def generate_basic_api(name: str, module: str = None) -> str:
    """Generate a basic CRUD API"""
    template = load_template("basic")
    snake_name = to_snake_case(name)
    snake_name_plural = f"{snake_name}s" if not snake_name.endswith("s") else snake_name

    replacements = {
        "{{API_NAME}}": name,
        "{{SNAKE_NAME}}": snake_name,
        "{{SNAKE_NAME_PLURAL}}": snake_name_plural,
        "{{MODULE}}": module or "api",
        "{{DOC_DOCTYPE}}": "".join(word.capitalize() for word in snake_name.split("_")),
    }

    for old, new in replacements.items():
        template = template.replace(old, new)

    return template


def generate_auth_api(name: str, module: str = None) -> str:
    """Generate an authentication API (guest-allowed)"""
    template = load_template("auth")
    snake_name = to_snake_case(name)

    replacements = {
        "{{API_NAME}}": name,
        "{{SNAKE_NAME}}": snake_name,
        "{{MODULE}}": module or "auth",
        "{{ERROR_CODES}}": generate_error_codes(name),
    }

    for old, new in replacements.items():
        template = template.replace(old, new)

    return template


def generate_paginated_api(name: str, module: str = None, search_fields: str = None) -> str:
    """Generate a paginated list API"""
    template = load_template("paginated")
    snake_name = to_snake_case(name)
    snake_name_plural = f"{snake_name}s" if not snake_name.endswith("s") else snake_name

    replacements = {
        "{{API_NAME}}": name,
        "{{SNAKE_NAME}}": snake_name,
        "{{SNAKE_NAME_PLURAL}}": snake_name_plural,
        "{{MODULE}}": module or "api",
        "{{DOC_DOCTYPE}}": "".join(word.capitalize() for word in snake_name.split("_")),
        "{{SEARCH_FIELDS}}": search_fields or f'["{snake_name}_name"]',
    }

    for old, new in replacements.items():
        template = template.replace(old, new)

    return template


def generate_document_api(name: str, module: str = None) -> str:
    """Generate a single document API"""
    template = load_template("document")
    snake_name = to_snake_case(name)

    replacements = {
        "{{API_NAME}}": name,
        "{{SNAKE_NAME}}": snake_name,
        "{{MODULE}}": module or "api",
        "{{DOC_DOCTYPE}}": "".join(word.capitalize() for word in snake_name.split("_")),
    }

    for old, new in replacements.items():
        template = template.replace(old, new)

    return template


def generate_action_api(name: str, module: str = None) -> str:
    """Generate a custom action API"""
    template = load_template("action")
    snake_name = to_snake_case(name)

    replacements = {
        "{{API_NAME}}": name,
        "{{SNAKE_NAME}}": snake_name,
        "{{MODULE}}": module or "api",
        "{{DOC_DOCTYPE}}": "MyDocType",  # User should replace
    }

    for old, new in replacements.items():
        template = template.replace(old, new)

    return template


def generate_error_codes(prefix: str) -> str:
    """Generate standard error codes for an API"""
    return '''ERROR_MESSAGES = {
    "E001": "Đã xảy ra lỗi. Vui lòng thử lại.",
    "E002": "Dữ liệu đầu vào không hợp lệ.",
    "E003": "Không tìm thấy tài nguyên.",
    "E004": "Yêu cầu xác thực.",
    "E005": "Bạn không có quyền thực hiện thao tác này.",
}'''


def main():
    parser = argparse.ArgumentParser(
        description="Generate SMRS API endpoint from templates"
    )
    parser.add_argument(
        "type",
        choices=["basic", "auth", "paginated", "document", "action"],
        help="Type of API to generate",
    )
    parser.add_argument("name", help="Name of the API (e.g., MeetingRoom, Booking)")
    parser.add_argument("--module", "-m", help="Module folder (e.g., api, auth)")
    parser.add_argument("--output", "-o", help="Output file path")
    parser.add_argument("--auth", action="store_true", help="Mark as guest-allowed (for auth APIs)")
    parser.add_argument("--search-fields", "-s", help="Comma-separated search fields for paginated API")

    args = parser.parse_args()

    # Determine API type
    api_type = "auth" if args.auth else args.type

    # Generate API code
    generators = {
        "basic": generate_basic_api,
        "auth": generate_auth_api,
        "paginated": generate_paginated_api,
        "document": generate_document_api,
        "action": generate_action_api,
    }

    try:
        code = generators[api_type](args.name, args.module, args.search_fields)
    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        sys.exit(1)

    # Output
    if args.output:
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        with open(output_path, "w", encoding="utf-8") as f:
            f.write(code)
        print(f"Generated: {output_path}")
    else:
        print(code)


if __name__ == "__main__":
    main()
