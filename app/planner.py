"""Orchestration: turns a validated request into a complete plan."""
from datetime import date

from .budget import allocate, feasibility
from .ideas import IdeaFn, generate_ideas
from .knowledge import CHECKLISTS
from .llm import suggest_ideas
from .models import Plan, PlanRequest, VendorItem
from .timeline import book_by, build_timeline, lead_scale

LARGE_COMMUNITY_GUESTS = 200
LARGE_WEDDING_GUESTS = 500


def _warnings(req: PlanRequest, scale: float, rating: str, days_left: int) -> list[str]:
    notes = []
    if scale < 1.0:
        notes.append(f'Only {days_left} days left: the timeline is compressed. Book venue and catering first.')
    if rating == 'tight':
        notes.append('Budget per guest is tight: consider fewer guests or a simpler venue.')
    if req.event_type == 'community' and req.guest_count > LARGE_COMMUNITY_GUESTS:
        where = f' with the {req.city} authorities' if req.city else ''
        notes.append(f'Large public gathering: confirm permits{where}, crowd limits and first-aid cover.')
    if req.event_type == 'wedding' and req.guest_count > LARGE_WEDDING_GUESTS:
        notes.append('Very large wedding: confirm venue capacity, parking and fire-safety limits.')
    return notes


def build_plan(req: PlanRequest, today: date | None = None, llm_fn: IdeaFn = suggest_ideas) -> Plan:
    today = today or date.today()
    scale = lead_scale(req.event_type, req.event_date, today)
    budget = allocate(req.event_type, req.budget, req.preferences)
    per_head = round(req.budget / req.guest_count, 2)
    rating = feasibility(req.event_type, per_head, req.currency)
    ideas, ai_generated = generate_ideas(req, llm_fn)

    vendors = sorted(
        (
            VendorItem(
                category=line.category,
                book_by=book_by(req.event_type, line.category, req.event_date, scale),
                budget_cap=line.amount,
                checklist=CHECKLISTS[line.category],
            )
            for line in budget
            if line.category in CHECKLISTS
        ),
        key=lambda vendor: vendor.book_by,
    )
    place = f' in {req.city}' if req.city else ''
    return Plan(
        summary=(
            f'{req.event_type.title()}{place} for {req.guest_count} guests on '
            f'{req.event_date:%d %b %Y}: {req.currency} {per_head:,.0f} per guest.'
        ),
        per_head=per_head,
        feasibility=rating,
        budget=budget,
        timeline=build_timeline(req.event_type, req.event_date, scale),
        vendors=vendors,
        ideas=ideas,
        warnings=_warnings(req, scale, rating, (req.event_date - today).days),
        ai_generated=ai_generated,
    )
