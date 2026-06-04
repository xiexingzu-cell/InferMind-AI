from typing import TypedDict


class StageDefinition(TypedDict):
    id: str
    name: str
    description: str


class CompetitionDefinition(TypedDict):
    id: str
    name: str
    short_name: str
    category: str
    language: str
    description: str
    stages: list[StageDefinition]


MODELING_STAGES: list[StageDefinition] = [
    {"id": "analysis", "name": "赛题分析", "description": "拆解问题、变量、约束与评价指标"},
    {"id": "modeling", "name": "模型设计", "description": "比较候选方法并形成建模方案"},
    {"id": "coding", "name": "编程求解", "description": "生成并运行 Python 分析代码"},
    {"id": "figures", "name": "图表与检验", "description": "生成科研图表并完成结果检验"},
    {"id": "paper", "name": "论文生成", "description": "汇总为可编辑论文与 PDF"},
]

COMPETITIONS: list[CompetitionDefinition] = [
    {
        "id": "cumcm",
        "name": "全国大学生数学建模竞赛",
        "short_name": "国赛 CUMCM",
        "category": "数学建模",
        "language": "中文",
        "description": "面向国赛论文结构的完整建模、求解与报告流程。",
        "stages": MODELING_STAGES,
    },
    {
        "id": "mcm-icm",
        "name": "美国大学生数学建模竞赛",
        "short_name": "美赛 MCM/ICM",
        "category": "数学建模",
        "language": "English",
        "description": "强调英文摘要、模型论证、敏感性分析与英文论文表达。",
        "stages": MODELING_STAGES,
    },
    {
        "id": "huawei-cup",
        "name": "华为杯中国研究生数学建模竞赛",
        "short_name": "华为杯",
        "category": "数学建模",
        "language": "中文",
        "description": "面向复杂工程研究问题的拆解、求解与技术论文流程。",
        "stages": MODELING_STAGES,
    },
    {
        "id": "innovation",
        "name": "中国国际大学生创新大赛",
        "short_name": "创新大赛",
        "category": "创新实践",
        "language": "中文",
        "description": "围绕问题定义、方案论证、实施计划与风险分析生成研究报告。",
        "stages": [
            {"id": "analysis", "name": "材料分析", "description": "提取需求、背景与关键约束"},
            {"id": "proposal", "name": "方案论证", "description": "形成解决方案与可行性分析"},
            {"id": "planning", "name": "实施计划", "description": "拆分里程碑、资源与风险"},
            {"id": "paper", "name": "研究报告", "description": "生成可编辑研究报告与 PDF"},
        ],
    },
    {
        "id": "physics-experiment",
        "name": "全国大学生物理实验竞赛",
        "short_name": "物理实验竞赛",
        "category": "实验研究",
        "language": "中文",
        "description": "覆盖实验设计、数据处理、拟合、误差分析与实验报告。",
        "stages": [
            {"id": "analysis", "name": "问题分析", "description": "明确实验目标、变量与器材"},
            {"id": "experiment", "name": "实验设计", "description": "生成实验步骤与数据记录方案"},
            {"id": "coding", "name": "数据处理", "description": "运行 Python 拟合与误差分析"},
            {"id": "figures", "name": "图表与检验", "description": "生成拟合图、误差图与结论"},
            {"id": "paper", "name": "实验报告", "description": "生成可编辑实验报告与 PDF"},
        ],
    },
    {
        "id": "general",
        "name": "其他大学生竞赛",
        "short_name": "通用竞赛项目",
        "category": "通用研究",
        "language": "中文",
        "description": "为尚未专项适配的赛事提供通用分析与研究报告流程。",
        "stages": [
            {"id": "analysis", "name": "材料分析", "description": "提取问题与交付要求"},
            {"id": "proposal", "name": "方案设计", "description": "生成可执行方案"},
            {"id": "paper", "name": "报告生成", "description": "整理为可编辑报告"},
        ],
    },
]


def get_competition(competition_id: str) -> CompetitionDefinition | None:
    return next((item for item in COMPETITIONS if item["id"] == competition_id), None)


def initial_stage_states(competition_id: str) -> list[dict[str, str]]:
    competition = get_competition(competition_id)
    if competition is None:
        raise ValueError("Unsupported competition type.")
    return [
        {**stage, "status": "ready" if index == 0 else "locked", "output": ""}
        for index, stage in enumerate(competition["stages"])
    ]
