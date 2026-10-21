"""Product catalog and pricing rules for Arroyo Systems quotes.

Pricing model (Brief_Rediseno_Web, 2026-10-12, with the price ranges derived from the catalog
PDF's "Pricing Formula"): each engineering package starts at a minimum price that covers its
budgeted hours (hours x ENGINEERING_HOURS_RATE) and may rise, hour by hour at that same rate,
up to a published maximum that is never exceeded. The published minimum and maximum are the
formula's values rounded to the nearest 50 EUR (Development's minimum is Design + Validation),
and those rounded figures are what the engine charges, so the website, quotes and Stripe agree.
The quote fixes the final price inside that range, as a closed price for its written scope.
Anything beyond the range is billed at the same hourly rate, only with prior notice and
acceptance.

Manufacturing (coordination and technical supervision) works differently: the client contracts
and pays the supplier directly, and Arroyo Systems invoices only its supervision fee. The fee is a
percentage of the supplier's manufacturing amount (excl. VAT) that falls as the volume grows, set
per quote, with a minimum per project. It is due with the final payment, never in the advance.
"""
import os
from typing import Literal, Optional, TypedDict


ENGINEERING_HOURS_RATE = 78.0

# Minimum supervision fee per project (EUR, excl. VAT).
MIN_SUPERVISION_FEE = 60.0


def supervision_tranches() -> tuple:
    """The volume schedule for the supervision fee, as ((upper bound, percent), ...).

    It is INTERNAL and deliberately not in the code (this repository is public): it comes from the
    SUPERVISION_TRANCHES environment variable, e.g. "1000:10,5000:6,inf:2" - marginal percentages,
    each applied only to the slice of the supplier's amount (excl. VAT) inside its tranche. Empty
    or missing means no schedule is configured, and the fee % must then be entered by hand."""
    raw = os.environ.get("SUPERVISION_TRANCHES", "").strip()
    if not raw:
        return ()
    tranches, previous = [], 0.0
    for part in raw.split(","):
        bound, percent = part.strip().split(":")
        upper = float("inf") if bound.strip().lower() == "inf" else float(bound)
        if upper <= previous or not 0 < float(percent) <= 100:
            raise PricingError("SUPERVISION_TRANCHES is malformed")
        tranches.append((upper, float(percent)))
        previous = upper
    return tuple(tranches)

PackageKey = Literal["product_design", "product_validation", "product_development"]
ItemType = Literal["package", "engineering_hours", "manufacturing"]


class PackageSpec(TypedDict):
    name: str
    base_price: float
    max_price: float
    base_hours: int
    max_extra_hours: int


PACKAGES: dict[PackageKey, PackageSpec] = {
    "product_design": {
        "name": "Product Design",
        "base_price": 1500.0,
        "max_price": 1850.0,
        "base_hours": 19,
        "max_extra_hours": 5,
    },
    "product_validation": {
        "name": "Product Validation",
        "base_price": 2050.0,
        "max_price": 2400.0,
        "base_hours": 26,
        "max_extra_hours": 5,
    },
    # Design (19h) + Validation (26h). No package discount any more.
    "product_development": {
        "name": "Product Development",
        "base_price": 3550.0,
        "max_price": 4300.0,
        "base_hours": 45,
        "max_extra_hours": 10,
    },
}


class PricingError(ValueError):
    """Raised when a quote item violates a pricing rule."""


def price_package_item(product_key: PackageKey, extra_hours: float, override_confirmed: bool) -> float:
    """Price a package line: the minimum price plus the extra hours the project's complexity
    needs, never above the published maximum.

    Extra hours beyond the package's `max_extra_hours` are outside the published range, so
    they are only billable once the client has been told and has accepted, which the admin
    attests to with `override_confirmed`.
    """
    if product_key not in PACKAGES:
        raise PricingError(f"Unknown package: {product_key}")
    spec = PACKAGES[product_key]
    if extra_hours < 0:
        raise PricingError("extra_hours cannot be negative")

    if extra_hours > spec["max_extra_hours"] and not override_confirmed:
        raise PricingError(
            f"{spec['name']}: {extra_hours}h exceeds the package's max extra hours "
            f"({spec['max_extra_hours']}h). Hours beyond the published range are billed at "
            f"{ENGINEERING_HOURS_RATE:g} EUR/h and need the client's prior acceptance. "
            "Confirm the override to proceed."
        )

    price = spec["base_price"] + extra_hours * ENGINEERING_HOURS_RATE
    if extra_hours <= spec["max_extra_hours"]:
        # Within the published range: never exceed the published max price.
        price = min(price, spec["max_price"])
    return round(price, 2)


def price_engineering_hours_item(quantity: float) -> float:
    if quantity < 0:
        raise PricingError("Engineering Hours quantity cannot be negative")
    return round(quantity * ENGINEERING_HOURS_RATE, 2)


def supervision_fee_by_volume(supplier_amount: float) -> float:
    """Fee from the internal marginal schedule (see supervision_tranches), before the minimum."""
    tranches = supervision_tranches()
    if not tranches:
        raise PricingError("No volume schedule is configured: enter the supervision fee % by hand")
    fee, lower = 0.0, 0.0
    for upper, percent in tranches:
        if supplier_amount > lower:
            fee += (min(supplier_amount, upper) - lower) * percent / 100
        lower = upper
    return fee


def price_manufacturing_item(supplier_amount: float, fee_rate: float = 0.0) -> float:
    """Supervision fee for a Product Manufacturing line, never below MIN_SUPERVISION_FEE.

    By default it follows the internal volume schedule. A `fee_rate` greater than 0 overrides it
    with a flat percentage for a special case. The supplier's amount is only the base of the
    calculation: the supplier invoices it to the client directly, Arroyo Systems does not."""
    if supplier_amount <= 0:
        raise PricingError("Manufacturing needs the supplier's manufacturing amount (greater than 0)")
    if fee_rate < 0 or fee_rate > 100:
        raise PricingError("The supervision fee rate must be a percentage between 0 and 100")
    raw = supplier_amount * fee_rate / 100 if fee_rate > 0 else supervision_fee_by_volume(supplier_amount)
    return round(max(MIN_SUPERVISION_FEE, raw), 2)


class ComputedItem(TypedDict):
    id: str
    type: ItemType
    product_key: Optional[str]
    description: str
    quantity: float
    unit_price: float
    extra_hours: float
    supplier_amount: float
    fee_rate: float
    total: float


class QuoteTotals(TypedDict):
    subtotal: float
    vat_rate: float
    vat_amount: float
    total: float
    deposit_amount: float
    remaining_amount: float


def compute_quote_totals(items: list[dict], vat_rate: float) -> QuoteTotals:
    """Single source of truth for quote totals - used by the create/edit endpoint, the PDF,
    and the Stripe checkout amount, so the three can never disagree.

    The advance paid up front is 50% of every package item (incl. VAT): it secures the
    engineering work. Engineering Hours and the manufacturing supervision fee (and anything
    else added later, e.g. when requesting the final payment) always fall entirely into the
    remaining/second payment. The supplier's manufacturing is not part of any payment to Arroyo
    Systems: the client pays the supplier directly.
    """
    if vat_rate < 0 or vat_rate > 1:
        raise PricingError("vat_rate must be between 0 and 1 (e.g. 0.21 for 21%)")

    subtotal = round(sum(item["total"] for item in items), 2)
    vat_amount = round(subtotal * vat_rate, 2)
    total = round(subtotal + vat_amount, 2)

    package_subtotal = round(sum(item["total"] for item in items if item.get("type") == "package"), 2)
    deposit_amount = round(package_subtotal * (1 + vat_rate) / 2, 2)
    remaining_amount = round(total - deposit_amount, 2)
    return {
        "subtotal": subtotal,
        "vat_rate": vat_rate,
        "vat_amount": vat_amount,
        "total": total,
        "deposit_amount": deposit_amount,
        "remaining_amount": remaining_amount,
    }
