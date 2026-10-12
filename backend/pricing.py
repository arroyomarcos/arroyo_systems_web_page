"""Product catalog and pricing rules for Arroyo Systems quotes.

Pricing model (Brief_Rediseno_Web, 2026-10-12): every engineering package has a single
closed price, equal to its budgeted hours x ENGINEERING_HOURS_RATE. Anything outside the
written scope is billed at that same hourly rate, only with prior notice and acceptance.
Manufacturing is not a fixed-price package: it is the workshop's cost plus Arroyo Systems'
manufacturing-management fee, both entered per quote.
"""
from typing import Literal, Optional, TypedDict


ENGINEERING_HOURS_RATE = 78.0

PackageKey = Literal["product_design", "product_validation", "product_development"]
ItemType = Literal["package", "engineering_hours", "manufacturing"]


class PackageSpec(TypedDict):
    name: str
    base_price: float
    base_hours: int


PACKAGES: dict[PackageKey, PackageSpec] = {
    "product_design": {
        "name": "Product Design",
        "base_price": 1482.0,
        "base_hours": 19,
    },
    "product_validation": {
        "name": "Product Validation",
        "base_price": 2028.0,
        "base_hours": 26,
    },
    # Design (19h) + Validation (26h). No package discount any more.
    "product_development": {
        "name": "Product Development",
        "base_price": 3510.0,
        "base_hours": 45,
    },
}


class PricingError(ValueError):
    """Raised when a quote item violates a pricing rule."""


def price_package_item(product_key: PackageKey, extra_hours: float, override_confirmed: bool) -> float:
    """Price a package line: the closed price plus any out-of-scope hours.

    Out-of-scope hours are only billable once the client has been told and has accepted,
    which the admin attests to with `override_confirmed`.
    """
    if product_key not in PACKAGES:
        raise PricingError(f"Unknown package: {product_key}")
    spec = PACKAGES[product_key]
    if extra_hours < 0:
        raise PricingError("extra_hours cannot be negative")

    if extra_hours > 0 and not override_confirmed:
        raise PricingError(
            f"{spec['name']}: {extra_hours}h outside the written scope are billed at "
            f"{ENGINEERING_HOURS_RATE:g} EUR/h and need the client's prior acceptance. "
            "Confirm it to proceed."
        )

    return round(spec["base_price"] + extra_hours * ENGINEERING_HOURS_RATE, 2)


def price_engineering_hours_item(quantity: float) -> float:
    if quantity < 0:
        raise PricingError("Engineering Hours quantity cannot be negative")
    return round(quantity * ENGINEERING_HOURS_RATE, 2)


def price_manufacturing_item(workshop_cost: float, management_fee: float) -> float:
    """Manufacturing line: workshop cost (as quoted by the workshop, excl. VAT) plus the
    manufacturing-management fee. Both are entered per quote - there is no catalog price."""
    if workshop_cost <= 0:
        raise PricingError("Manufacturing needs the workshop cost (greater than 0)")
    if management_fee < 0:
        raise PricingError("Manufacturing management fee cannot be negative")
    return round(workshop_cost + management_fee, 2)


class ComputedItem(TypedDict):
    id: str
    type: ItemType
    product_key: Optional[str]
    description: str
    quantity: float
    unit_price: float
    extra_hours: float
    workshop_cost: float
    management_fee: float
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

    The advance paid up front is made of:
      * 50% of every package item (incl. VAT) - secures the engineering work, and
      * 100% of the workshop cost of every manufacturing item (incl. VAT) - the workshop
        is paid before the order is placed. The management fee is NOT advanced.
    Engineering Hours (and anything else added later, e.g. when requesting the final
    payment) always fall entirely into the remaining/second payment.
    """
    if vat_rate < 0 or vat_rate > 1:
        raise PricingError("vat_rate must be between 0 and 1 (e.g. 0.21 for 21%)")

    subtotal = round(sum(item["total"] for item in items), 2)
    vat_amount = round(subtotal * vat_rate, 2)
    total = round(subtotal + vat_amount, 2)

    package_subtotal = round(sum(item["total"] for item in items if item.get("type") == "package"), 2)
    workshop_subtotal = round(
        sum(item.get("workshop_cost", 0) for item in items if item.get("type") == "manufacturing"), 2
    )
    deposit_amount = round(package_subtotal * (1 + vat_rate) / 2 + workshop_subtotal * (1 + vat_rate), 2)
    remaining_amount = round(total - deposit_amount, 2)
    return {
        "subtotal": subtotal,
        "vat_rate": vat_rate,
        "vat_amount": vat_amount,
        "total": total,
        "deposit_amount": deposit_amount,
        "remaining_amount": remaining_amount,
    }
