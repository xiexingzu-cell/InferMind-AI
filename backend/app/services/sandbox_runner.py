import io
import re
import tarfile
from pathlib import Path, PurePosixPath
from uuid import uuid4

PYTHON_BLOCK = re.compile(r"```python\s+(.*?)```", re.DOTALL | re.IGNORECASE)
MAX_CODE_BYTES = 100_000
MAX_OUTPUT_FILES = 100
MAX_OUTPUT_BYTES = 100 * 1024 * 1024


def extract_python_code(markdown: str) -> str | None:
    match = PYTHON_BLOCK.search(markdown)
    if match is None:
        return None
    code = match.group(1).strip()
    if not code:
        return None
    if len(code.encode("utf-8")) > MAX_CODE_BYTES:
        raise ValueError("Generated Python code exceeds the execution limit.")
    return code


def _input_archive(code: str, project_dir: Path) -> bytes:
    stream = io.BytesIO()
    with tarfile.open(fileobj=stream, mode="w") as archive:
        code_bytes = code.encode("utf-8")
        info = tarfile.TarInfo("task.py")
        info.size = len(code_bytes)
        archive.addfile(info, io.BytesIO(code_bytes))
        upload_dir = project_dir / "uploads"
        source_dir = upload_dir if upload_dir.exists() else project_dir
        for path in source_dir.iterdir():
            if path.is_file() and path.name != "task.py":
                archive.add(path, arcname=f"inputs/{path.name}", recursive=False)
    return stream.getvalue()


def _extract_outputs(archive_stream: io.BytesIO, output_dir: Path) -> list[Path]:
    output_dir.mkdir(parents=True, exist_ok=True)
    extracted: list[Path] = []
    total_size = 0
    with tarfile.open(fileobj=archive_stream, mode="r:*") as archive:
        for member in archive.getmembers():
            if not member.isfile():
                continue
            relative = PurePosixPath(member.name)
            if relative.is_absolute() or ".." in relative.parts:
                continue
            if not relative.parts:
                continue
            if len(extracted) >= MAX_OUTPUT_FILES:
                raise RuntimeError("Sandbox output contains too many files.")
            total_size += member.size
            if total_size > MAX_OUTPUT_BYTES:
                raise RuntimeError("Sandbox output exceeds the size limit.")
            source = archive.extractfile(member)
            if source is None:
                continue
            destination = output_dir / Path(*relative.parts)
            destination.parent.mkdir(parents=True, exist_ok=True)
            destination.write_bytes(source.read())
            extracted.append(destination)
    return extracted


def execute_python(code: str, project_dir: Path) -> list[Path]:
    import docker
    from app.config import settings

    client = docker.from_env()
    container = client.containers.create(
        settings.competition_runner_image,
        command=["sleep", "300"],
        network_disabled=True,
        read_only=True,
        user="1001:1001",
        mem_limit="1g",
        nano_cpus=1_000_000_000,
        pids_limit=128,
        cap_drop=["ALL"],
        security_opt=["no-new-privileges"],
        tmpfs={"/workspace": "rw,size=256m,mode=1777"},
        working_dir="/workspace",
    )
    try:
        container.start()
        container.put_archive("/workspace", _input_archive(code, project_dir))
        result = container.exec_run(["python", "/runner/run.py"], workdir="/workspace")
        if result.exit_code != 0:
            raise RuntimeError("Sandboxed Python execution failed.")
        archive_bits, _ = container.get_archive("/workspace/output")
        return _extract_outputs(io.BytesIO(b"".join(archive_bits)), project_dir / "runner" / str(uuid4()))
    finally:
        container.remove(force=True)
