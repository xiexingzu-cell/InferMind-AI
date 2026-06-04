import base64
from pathlib import Path


SAMPLE_CHART_PNG = base64.b64decode(
    "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+/p9sAAAAASUVORK5CYII="
)


def write_mock_analysis_assets(project_dir: Path) -> list[Path]:
    output_dir = project_dir / "runner" / "local-mock"
    table_dir = output_dir / "tables"
    figure_dir = output_dir / "figures"
    table_dir.mkdir(parents=True, exist_ok=True)
    figure_dir.mkdir(parents=True, exist_ok=True)

    stats_path = table_dir / "descriptive_stats.csv"
    stats_path.write_text(
        "metric,value\nsample_count,12\nfeature_count,3\nmean_score,78.5\nstd_score,6.2\n",
        encoding="utf-8-sig",
    )

    corr_path = table_dir / "correlation_matrix.csv"
    corr_path.write_text(
        "variable,x1,x2,x3\nx1,1.00,0.72,0.31\nx2,0.72,1.00,0.44\nx3,0.31,0.44,1.00\n",
        encoding="utf-8-sig",
    )

    figure_path = figure_dir / "trend_first_numeric_column.png"
    figure_path.write_bytes(SAMPLE_CHART_PNG)

    results_path = output_dir / "results.md"
    results_path.write_text(
        "# 数据分析结果摘要\n\n"
        "- 已生成描述性统计表，用于展示样本量、变量数量、均值与标准差。\n"
        "- 已生成相关系数矩阵，用于观察变量间线性关系。\n"
        "- 已生成趋势图，用于验证论文插图链路。\n\n"
        "本地 Mock 模式用于验证上传、阶段执行、表格、图像、DOCX/PDF 整合流程。",
        encoding="utf-8",
    )

    return [stats_path, corr_path, figure_path, results_path]
