"""Idea generation: LLM first, deterministic fallback always available."""
from collections.abc import Callable

from .knowledge import FALLBACK_IDEAS, PREFERENCE_IDEAS
from .llm import suggest_ideas
from .models import PlanRequest

IdeaFn = Callable[[PlanRequest], list[str] | None]
MAX_FALLBACK_IDEAS = 6


def fallback_ideas(req: PlanRequest) -> list[str]:
    theme = req.theme or 'chosen'
    base = [text.format(theme=theme) for text in FALLBACK_IDEAS[req.event_type]]
    extra = [PREFERENCE_IDEAS[p] for p in req.preferences if p in PREFERENCE_IDEAS]
    if req.city:
        extra.append(f'Ask venues in {req.city} about seasonal availability and local licence rules.')
    return (extra + base)[:MAX_FALLBACK_IDEAS]


def generate_ideas(req: PlanRequest, llm_fn: IdeaFn = suggest_ideas) -> tuple[list[str], bool]:
    """Return (ideas, ai_generated). The LLM function is injectable for tests."""
    ideas = llm_fn(req)
    if ideas:
        return ideas, True
    return fallback_ideas(req), False
