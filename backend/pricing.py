"""Product catalog and pricing rules for Arroyo Systems quotes.

Source of truth for prices: Arroyo_Systems_Engineering_Solutions_Catalog.pdf
(base_price + max_extra_hours * ENGINEERING_HOURS_RATE == max_price for every package).
"""
from typing import Literal, Optional, TypedDict


ENGINEERING_HOURS_RATE = 50.0

PackageKey = Literal["rapid_design", "validated_design", "performance_design"]
ItemType = Literal["package", "engineering_hours"]


class PackageSpec(TypedDict):
    name: str
    base_price: float
    max_price: float
    base_hours: int
    max_extra_hours: int


PACKAGES: dict[PackageKey, PackageSpec] = {
    "rapid_design": {
        "name": "Rapid Design",
        "base_price": 1300.0,
        "max_price": 1550.0,
        "base_hours": 15,
        "max_extra_hours": 5,
    },
    "validated_design": {
        "name": "Validated Design",
        "base_price": 3000.0,
        "max_price": 3500.0,
        "base_hours": 35,
        "max_extra_hours": 10,
    },
    "performance_design": {
        "name": "Performance Design",
        "base_price": 5000.0,
        "max_price": 5750.0,
        "base_hours": 60,
        "max_extra_hours": 15,
    },
}


class PricingError(ValueError):
    """Raised when a quote item violates a pricing rule and needs admin confirmation."""


def price_package_item(product_key: PackageKey, extra_hours: float, override_confirmed: bool) -> float:
    """Price a package line item, including its own extra-hours allowance.

    Extra hours beyond the package's max_extra_hours are only allowed if the admin has
    explicitly confirmed the override (manual/special case per catalog rules).
    """
    if product_key not in PACKAGES:
        raise PricingError(f"Unknown package: {product_key}")
    spec = PACKAGES[product_key]
    if extra_hours < 0:
        raise PricingError("extra_hours cannot be negative")

    if extra_hours > spec["max_extra_hours"] and not override_confirmed:
        raise PricingError(
            f"{spec['name']}: {extra_hours}h exceeds the package's max extra hours "
            f"({spec['max_extra_hours']}h). Confirm the override to proceed."
        )

    price = spec["base_price"] + extra_hours * ENGINEERING_HOURS_RATE
    if extra_hours <= spec["max_extra_hours"]:
        # Within the catalog range: never exceed the published max price.
        price = min(price, spec["max_price"])
    return round(price, 2)


def price_engineering_hours_item(quantity: float) -> float:
    if quantity < 0:
        raise PricingError("Engineering Hours quantity cannot be negative")
    return round(quantity * ENGINEERING_HOURS_RATE, 2)


class ComputedItem(TypedDict):
    id: str
    type: ItemType
    product_key: Optional[str]
    description: str
    quantity: float
    unit_price: float
    extra_hours: float
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

    The 50% deposit is calculated from package items only. Engineering Hours (and any other
    non-package addition, whenever added - at quote creation or later when requesting the
    final payment) always fall entirely into the remaining/second payment. This matches
    Arroyo Systems' billing policy: the deposit secures the contracted package; extra hours
    for delays or scope changes are settled at delivery, not split in half.
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
