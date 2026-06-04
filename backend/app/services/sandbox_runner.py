import re
import shutil
import socket
from pathlib import Path
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


def _copy_inputs(project_dir: Path, workspace_dir: Path) -> None:
    input_dir = workspace_dir / "inputs"
    input_dir.mkdir(parents=True, exist_ok=True)
    upload_dir = project_dir / "uploads"
    source_dir = upload_dir if upload_dir.exists() else project_dir
    for path in source_dir.iterdir():
        if path.is_file() and path.name != "task.py":
            shutil.copy2(path, input_dir / path.name)


def _prepare_workspace(code: str, project_dir: Path) -> Path:
    workspace_dir = project_dir / "runner" / str(uuid4()) / "workspace"
    workspace_dir.mkdir(parents=True, exist_ok=True)
    (workspace_dir / "task.py").write_text(code, encoding="utf-8")
    _copy_inputs(project_dir, workspace_dir)
    return workspace_dir


def _worker_storage_mount(client, storage_path: str) -> Path:
    container = client.containers.get(socket.gethostname())
    for mount in container.attrs.get("Mounts", []):
        if mount.get("Destination") == storage_path:
            return Path(mount["Source"])
    raise RuntimeError("Competition storage volume is not mounted in the worker container.")


def _host_workspace_path(client, workspace_dir: Path, storage_path: str) -> Path:
    storage_dir = Path(storage_path)
    relative = workspace_dir.relative_to(storage_dir)
    return _worker_storage_mount(client, storage_path) / relative


def _collect_output_paths(output_dir: Path) -> list[Path]:
    if not output_dir.exists():
        return []

    paths: list[Path] = []
    total_size = 0
    for path in sorted(output_dir.rglob("*"), key=lambda item: item.as_posix()):
        if not path.is_file():
            continue
        relative = path.relative_to(output_dir)
        if ".." in relative.parts:
            continue
        if len(paths) >= MAX_OUTPUT_FILES:
            raise RuntimeError("Sandbox output contains too many files.")
        total_size += path.stat().st_size
        if total_size > MAX_OUTPUT_BYTES:
            raise RuntimeError("Sandbox output exceeds the size limit.")
        paths.append(path)
    return paths


def _write_runner_diagnostics(workspace_dir: Path, exit_code: int, output: bytes | str | None) -> list[Path]:
    output_dir = workspace_dir / "output"
    output_dir.mkdir(parents=True, exist_ok=True)
    if isinstance(output, bytes):
        decoded_output = output.decode("utf-8", errors="replace")
    else:
        decoded_output = output or ""

    log_path = output_dir / "runner.log"
    results_path = output_dir / "results.md"
    log_path.write_text(
        "Runner output directory was not produced.\n\n"
        f"exit_code={exit_code}\n\n"
        f"## exec output\n{decoded_output}",
        encoding="utf-8",
    )
    results_path.write_text(
        "# Python Runner Diagnostic\n\n"
        "The sandbox finished without a readable output directory.\n\n"
        f"Exit code: {exit_code}\n\n"
        "## Execution Output\n\n"
        f"```\n{decoded_output or 'None'}\n```\n",
        encoding="utf-8",
    )
    return [log_path, results_path]


def execute_python(code: str, project_dir: Path) -> list[Path]:
    import docker
    from app.config import settings

    client = docker.from_env()
    workspace_dir = _prepare_workspace(code, project_dir)
    host_workspace_dir = _host_workspace_path(
        client, workspace_dir, settings.competition_storage_path
    )
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
        tmpfs={"/tmp": "rw,size=128m,mode=1777"},
        volumes={str(host_workspace_dir): {"bind": "/workspace", "mode": "rw"}},
        environment={"MPLCONFIGDIR": "/workspace/.matplotlib"},
        working_dir="/workspace",
    )
    try:
        container.start()
        result = container.exec_run(["python", "/runner/run.py"], workdir="/workspace")
        output_paths = _collect_output_paths(workspace_dir / "output")
        if not output_paths:
            output_paths = _write_runner_diagnostics(workspace_dir, result.exit_code, result.output)
        if result.exit_code != 0:
            log_path = next((path for path in output_paths if path.name in {"runner.log", "runner-error.txt"}), None)
            if log_path is not None:
                detail = log_path.read_text(encoding="utf-8", errors="replace")[:2000]
                raise RuntimeError(f"Sandboxed Python execution failed.\n{detail}")
            raise RuntimeError("Sandboxed Python execution failed.")
        return output_paths
    finally:
        container.remove(force=True)
