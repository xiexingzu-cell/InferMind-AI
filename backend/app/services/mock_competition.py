from typing import TYPE_CHECKING

if TYPE_CHECKING:
    from app.models.competition_project import CompetitionProject


def mock_stage_output(project: "CompetitionProject", stage_id: str) -> str:
    if stage_id == "analysis":
        return f"""# 赛题分析

## 项目
{project.title}

## 问题拆解
- 识别上传数据中的数值变量与类别变量。
- 先完成描述性统计和可视化，再根据数据结构选择建模方法。
- 若数据为空或格式不匹配，需要在结果摘要中明确说明。

## 下一步
进入模型设计阶段，确定评价指标、核心变量和可执行的 Python 分析方案。
"""
    if stage_id in {"modeling", "proposal", "experiment", "planning"}:
        return """# 方案设计

## 推荐流程
- 数据读取与质量检查。
- 描述性统计与异常值识别。
- 相关性、趋势或分组对比分析。
- 使用图表解释关键结论。

## 验证方法
- 检查样本量、缺失值和变量分布。
- 对模型结果进行残差、误差或敏感性分析。
"""
    if stage_id == "coding":
        return """# 编程求解

下面的脚本会扫描 `inputs/` 中的 CSV/XLSX 数据，生成描述性统计表、相关系数表、趋势图/散点图和结果摘要。

```python
from pathlib import Path
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns

INPUT_DIR = Path("inputs")
OUTPUT_DIR = Path("output")
TABLE_DIR = OUTPUT_DIR / "tables"
FIGURE_DIR = OUTPUT_DIR / "figures"
TABLE_DIR.mkdir(parents=True, exist_ok=True)
FIGURE_DIR.mkdir(parents=True, exist_ok=True)

def load_first_dataset():
    files = sorted(list(INPUT_DIR.glob("*.csv")) + list(INPUT_DIR.glob("*.xlsx")))
    if not files:
        return None, None
    path = files[0]
    if path.suffix.lower() == ".csv":
        return path, pd.read_csv(path)
    return path, pd.read_excel(path)

path, df = load_first_dataset()
summary_lines = ["# 数据分析结果摘要", ""]

if df is None or df.empty:
    summary_lines += [
        "未发现可分析的 CSV/XLSX 数据，已生成空结果摘要。",
        "请上传至少一份包含数值列的数据表后重试。"
    ]
else:
    summary_lines += [
        f"数据文件：{path.name}",
        f"样本量：{len(df)}",
        f"字段数：{len(df.columns)}",
        ""
    ]
    numeric = df.select_dtypes(include="number")
    if numeric.empty:
        summary_lines += ["数据中没有数值列，无法生成统计图和相关性分析。"]
    else:
        stats = numeric.describe().T
        stats.to_csv(TABLE_DIR / "descriptive_stats.csv", encoding="utf-8-sig")
        summary_lines += ["已生成表 1：描述性统计表。"]

        if numeric.shape[1] >= 2:
            corr = numeric.corr()
            corr.to_csv(TABLE_DIR / "correlation_matrix.csv", encoding="utf-8-sig")
            plt.figure(figsize=(7, 5))
            sns.heatmap(corr, annot=True, cmap="Blues", fmt=".2f")
            plt.title("Correlation Heatmap")
            plt.tight_layout()
            plt.savefig(FIGURE_DIR / "correlation_heatmap.png", dpi=180)
            plt.close()
            summary_lines += ["已生成表 2：相关系数矩阵；图 1：相关性热力图。"]

        first_col = numeric.columns[0]
        plt.figure(figsize=(7, 4))
        plt.plot(range(len(numeric[first_col])), numeric[first_col], marker="o", linewidth=1)
        plt.title(f"Trend of {first_col}")
        plt.xlabel("Sample index")
        plt.ylabel(first_col)
        plt.grid(alpha=0.3)
        plt.tight_layout()
        plt.savefig(FIGURE_DIR / "trend_first_numeric_column.png", dpi=180)
        plt.close()
        summary_lines += [f"已生成图 2：{first_col} 的样本序列趋势图。"]

(OUTPUT_DIR / "results.md").write_text("\\n".join(summary_lines), encoding="utf-8")
```
"""
    if stage_id == "figures":
        return """# 图表与检验

本地测试模式会在编程阶段自动生成：
- 描述性统计表
- 相关系数表
- 相关性热力图
- 首个数值变量趋势图

论文阶段将自动把这些表格和图像插入 DOCX/PDF。
"""
    if stage_id == "paper":
        return f"""# {project.title}

## 摘要
本文基于上传数据完成描述性统计、相关性分析和基础可视化，形成可复核的数据分析报告。

## 问题重述
围绕赛题目标，首先识别数据变量和约束，再通过统计表格与图像提取规律。

## 模型与方法
本地测试版本采用描述性统计、相关矩阵和趋势分析作为基础分析方法。真实模型阶段可进一步替换为回归、分类、聚类、优化或仿真方法。

## 数据分析结果
后端会自动把 Runner 生成的 `results.md`、CSV 表格和 PNG 图像插入本文档后续章节。

## 结论
当前报告用于验证完整链路：上传数据、运行 Python、生成表格、生成图像、整合 DOCX/PDF。

## 局限性
本地 Mock 模式不调用真实大模型，结论仅用于流程测试。正式使用时应切换到真实模型并结合赛题语义重新生成。
"""
    return "# 阶段结果\n\n本地测试模式已完成该阶段。"
