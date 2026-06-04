import pytest

from app.services.competition_catalog import COMPETITIONS, get_competition, initial_stage_states


def test_catalog_contains_supported_competitions():
    competition_ids = {competition["id"] for competition in COMPETITIONS}
    assert {
        "cumcm",
        "mcm-icm",
        "huawei-cup",
        "innovation",
        "physics-experiment",
        "general",
    } <= competition_ids


def test_initial_stage_states_only_unlock_first_stage():
    stages = initial_stage_states("cumcm")
    assert stages[0]["status"] == "ready"
    assert all(stage["status"] == "locked" for stage in stages[1:])


def test_unknown_competition_returns_none():
    assert get_competition("missing") is None
    with pytest.raises(ValueError):
        initial_stage_states("missing")
