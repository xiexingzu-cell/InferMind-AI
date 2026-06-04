"""Server-only registry for vetted competition workflow resources.

The registry is intentionally never returned by a public API. Each resource
must be reviewed and pinned before its templates are copied into the worker
image.
"""

PRIVATE_SKILLS = {
    "math-modeling": {
        "source": "https://github.com/Lupynow/math-modeling-skills",
        "license": "MIT",
        "visibility": "server_only",
        "capabilities": ["problem-analysis", "model-selection", "python-templates", "paper-outline"],
    },
    "science-plots": {
        "source": "https://github.com/garrettj403/SciencePlots",
        "license": "BSD-3-Clause",
        "visibility": "server_only",
        "capabilities": ["publication-figures"],
    },
}
