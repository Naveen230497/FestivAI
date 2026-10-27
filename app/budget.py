"""Budget allocation and affordability rating."""
from .knowledge import ADJUSTMENTS, BUDGET_SPLIT, MIN_PER_HEAD_INR
from .models import BudgetLine

MIN_SHARE = 0.01


def allocate(
    event_type: str,
    total: float,
    preferences: tuple[str, ...] | list[str],
) -> list[BudgetLine]:
    """Split `total` across categories; preferences shift shares, then re-normalise."""
    shares = dict(BUDGET_SPLIT[event_type])
    for pref in preferences:
        for category, delta in ADJUSTMENTS.get(pref, {}).items():
            if category in shares:
                shares[category] = max(MIN_SHARE, shares[category] + delta)
    norm = sum(shares.values())
    lines = [
        BudgetLine(category=c, share=round(s / norm, 4), amount=round(total * s / norm, 2))
        for c, s in shares.items()
    ]
    # Rounding drift is absorbed by contingency so lines sum exactly to the total.
    drift = round(total - sum(line.amount for line in lines), 2)
    contingency = next(line for line in lines if line.category == 'contingency')
    contingency.amount = round(contingency.amount + drift, 2)
    return lines


def feasibility(event_type: str, per_head: float, currency: str) -> str:
    """Rate per-guest spend against a rough INR floor; other currencies are not rated."""
    if currency != 'INR':
        return 'not rated'
    ratio = per_head / MIN_PER_HEAD_INR[event_type]
    if ratio < 1:
        return 'tight'
    return 'moderate' if ratio < 2 else 'comfortable'
