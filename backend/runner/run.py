from pathlib import Path
import subprocess
import sys


def ensure_output_dirs(workspace: Path) -> Path:
    output_dir = workspace / "output"
    output_dir.mkdir(exist_ok=True)
    (output_dir / "tables").mkdir(exist_ok=True)
    (output_dir / "figures").mkdir(exist_ok=True)
    return output_dir


def main() -> int:
    workspace = Path("/workspace")
    script = workspace / "task.py"
    output_dir = ensure_output_dirs(workspace)
    if not script.is_file():
        (output_dir / "runner-error.txt").write_text("task.py is missing.", encoding="utf-8")
        return 1

    try:
        result = subprocess.run(
            [sys.executable, "-I", str(script)],
            cwd=workspace,
            capture_output=True,
            text=True,
            timeout=90,
        )
    except subprocess.TimeoutExpired:
        (output_dir / "runner-error.txt").write_text(
            "Python execution exceeded the 90 second limit.", encoding="utf-8"
        )
        return 1

    # Generated code may remove or replace output/. Recreate the contract
    # directories before collecting logs and artifacts.
    output_dir = ensure_output_dirs(workspace)
    log_content = f"exit_code={result.returncode}\n\n## stdout\n{result.stdout}\n\n## stderr\n{result.stderr}"
    (output_dir / "runner.log").write_text(log_content, encoding="utf-8")
    results_path = output_dir / "results.md"
    if not results_path.exists():
        results_path.write_text(
            "# Python 数据分析运行摘要\n\n"
            f"退出码：{result.returncode}\n\n"
            "## 标准输出\n\n"
            f"```\n{result.stdout or '无'}\n```\n\n"
            "## 错误输出\n\n"
            f"```\n{result.stderr or '无'}\n```\n",
            encoding="utf-8",
        )
    return result.returncode


if __name__ == "__main__":
    raise SystemExit(main())
