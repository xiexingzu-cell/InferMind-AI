import pytest

from app.services.sandbox_runner import MAX_CODE_BYTES, extract_python_code


def test_extract_python_code_returns_first_python_block():
    markdown = "说明\n```python\nprint('ok')\n```\n"
    assert extract_python_code(markdown) == "print('ok')"


def test_extract_python_code_ignores_non_python_markdown():
    assert extract_python_code("```text\nno code\n```") is None


def test_extract_python_code_rejects_oversized_script():
    markdown = f"```python\n{'x' * (MAX_CODE_BYTES + 1)}\n```"
    with pytest.raises(ValueError):
        extract_python_code(markdown)
