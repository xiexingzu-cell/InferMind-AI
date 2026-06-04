import pytest
from io import BytesIO
from zipfile import ZIP_DEFLATED, ZipFile

from app.services.file_policy import MAX_UPLOAD_BYTES, classify_upload, validate_zip


@pytest.mark.parametrize("filename", ["problem.pdf", "data.csv", "notes.DOCX", "bundle.zip"])
def test_supported_files_are_parsable(filename):
    assert classify_upload(filename, 42) == "parsable"


@pytest.mark.parametrize("filename", ["solve.py", "run.ps1", "payload.exe", "setup.sh"])
def test_scripts_and_executables_are_blocked(filename):
    assert classify_upload(filename, 42) == "blocked"


def test_unknown_files_are_stored_without_parsing():
    assert classify_upload("reference.mat", 42) == "stored_only"


@pytest.mark.parametrize(
    ("filename", "size"),
    [("../problem.pdf", 42), ("", 42), ("problem.pdf", 0), ("problem.pdf", MAX_UPLOAD_BYTES + 1)],
)
def test_invalid_uploads_are_rejected(filename, size):
    with pytest.raises(ValueError):
        classify_upload(filename, size)


def _zip_with_file(filename: str, content: str = "data") -> bytes:
    buffer = BytesIO()
    with ZipFile(buffer, "w", ZIP_DEFLATED) as archive:
        archive.writestr(filename, content)
    return buffer.getvalue()


def test_zip_validation_accepts_normal_data_bundle():
    validate_zip(_zip_with_file("data/sample.csv"))


@pytest.mark.parametrize("filename", ["../escape.csv", "nested/data.zip"])
def test_zip_validation_rejects_unsafe_entries(filename):
    with pytest.raises(ValueError):
        validate_zip(_zip_with_file(filename))
