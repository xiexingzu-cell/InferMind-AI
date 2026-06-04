from io import BytesIO
from pathlib import Path
from pathlib import PurePosixPath
from zipfile import BadZipFile, ZipFile

MAX_UPLOAD_BYTES = 50 * 1024 * 1024

PARSABLE_EXTENSIONS = {
    ".csv", ".docx", ".jpeg", ".jpg", ".pdf", ".png", ".txt", ".xlsx", ".zip"
}
BLOCKED_EXTENSIONS = {
    ".bat", ".cmd", ".com", ".dll", ".exe", ".js", ".msi", ".ps1", ".py", ".sh", ".vbs"
}
MAX_ZIP_FILES = 200
MAX_ZIP_UNCOMPRESSED_BYTES = 200 * 1024 * 1024
MAX_ZIP_COMPRESSION_RATIO = 100


def classify_upload(filename: str, size: int, max_bytes: int = MAX_UPLOAD_BYTES) -> str:
    if not filename or Path(filename).name != filename:
        raise ValueError("Invalid filename.")
    if size <= 0:
        raise ValueError("Uploaded file is empty.")
    if size > max_bytes:
        raise ValueError("File exceeds the upload limit.")

    extension = Path(filename).suffix.lower()
    if extension in BLOCKED_EXTENSIONS:
        return "blocked"
    if extension in PARSABLE_EXTENSIONS:
        return "parsable"
    return "stored_only"


def validate_zip(content: bytes) -> None:
    try:
        with ZipFile(BytesIO(content)) as archive:
            members = archive.infolist()
            if len(members) > MAX_ZIP_FILES:
                raise ValueError("ZIP archive contains too many files.")
            total_size = 0
            for member in members:
                normalized_name = member.filename.replace("\\", "/")
                path = PurePosixPath(normalized_name)
                if path.is_absolute() or ".." in path.parts:
                    raise ValueError("ZIP archive contains an unsafe path.")
                if Path(normalized_name).suffix.lower() == ".zip":
                    raise ValueError("Nested ZIP archives are not allowed.")
                total_size += member.file_size
                if total_size > MAX_ZIP_UNCOMPRESSED_BYTES:
                    raise ValueError("ZIP archive expands beyond the allowed size.")
                if member.file_size > 0 and member.compress_size == 0:
                    raise ValueError("ZIP archive has an unsafe compression ratio.")
                if member.compress_size and member.file_size / member.compress_size > MAX_ZIP_COMPRESSION_RATIO:
                    raise ValueError("ZIP archive has an unsafe compression ratio.")
    except BadZipFile as exc:
        raise ValueError("Invalid ZIP archive.") from exc
