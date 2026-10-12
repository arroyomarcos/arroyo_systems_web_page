import pytest

from pricing import (
    ENGINEERING_HOURS_RATE,
    PACKAGES,
    PricingError,
    compute_quote_totals,
    price_engineering_hours_item,
    price_manufacturing_item,
    price_package_item,
)


def test_hourly_rate_is_78():
    assert ENGINEERING_HOURS_RATE == 78.0


@pytest.mark.parametrize(
    "key,min_price,max_price,base_hours,max_extra_hours",
    [
        ("product_design", 1482.0, 1872.0, 19, 5),
        ("product_validation", 2028.0, 2418.0, 26, 5),
        ("product_development", 3510.0, 4290.0, 45, 10),
    ],
)
def test_package_price_range_follows_the_hourly_formula(key, min_price, max_price, base_hours, max_extra_hours):
    spec = PACKAGES[key]
    assert spec["base_hours"] == base_hours
    assert spec["max_extra_hours"] == max_extra_hours
    # Minimum covers the budgeted hours; the maximum is that plus the allowed extra hours.
    assert spec["base_price"] == min_price == base_hours * ENGINEERING_HOURS_RATE
    assert spec["max_price"] == max_price == min_price + max_extra_hours * ENGINEERING_HOURS_RATE
    assert price_package_item(key, extra_hours=0, override_confirmed=False) == min_price
    assert price_package_item(key, extra_hours=max_extra_hours, override_confirmed=False) == max_price


def test_development_is_design_plus_validation_without_discount():
    assert (
        PACKAGES["product_development"]["base_price"]
        == PACKAGES["product_design"]["base_price"] + PACKAGES["product_validation"]["base_price"]
    )


def test_price_scales_linearly_with_extra_hours_inside_the_range():
    assert price_package_item("product_design", extra_hours=3, override_confirmed=False) == 1482.0 + 3 * 78.0


def test_hours_beyond_the_published_range_need_prior_acceptance():
    with pytest.raises(PricingError):
        price_package_item("product_design", extra_hours=6, override_confirmed=False)


def test_hours_beyond_the_range_are_billed_at_the_hourly_rate_once_accepted():
    assert price_package_item("product_design", extra_hours=6, override_confirmed=True) == 1482.0 + 6 * 78.0


def test_package_negative_hours_rejected():
    with pytest.raises(PricingError):
        price_package_item("product_design", extra_hours=-1, override_confirmed=True)


def test_unknown_package_rejected():
    with pytest.raises(PricingError):
        price_package_item("unknown_package", extra_hours=0, override_confirmed=False)


def test_old_package_keys_are_gone():
    for old in ("rapid_design", "validated_design", "performance_design"):
        with pytest.raises(PricingError):
            price_package_item(old, extra_hours=0, override_confirmed=False)


def test_engineering_hours_pricing():
    assert price_engineering_hours_item(5) == 390.0
    assert price_engineering_hours_item(0) == 0.0


def test_engineering_hours_negative_rejected():
    with pytest.raises(PricingError):
        price_engineering_hours_item(-1)


def test_manufacturing_is_workshop_cost_plus_management_fee():
    assert price_manufacturing_item(workshop_cost=800.0, management_fee=290.0) == 1090.0


def test_manufacturing_requires_workshop_cost():
    with pytest.raises(PricingError):
        price_manufacturing_item(workshop_cost=0, management_fee=290.0)


def test_manufacturing_negative_fee_rejected():
    with pytest.raises(PricingError):
        price_manufacturing_item(workshop_cost=800.0, management_fee=-1)


def test_compute_quote_totals_deposit_is_package_only():
    # Product Development (3510, package) + Engineering Hours 5h (390, not package).
    # Subtotal/VAT/total cover everything, but the 50% deposit is based on the package
    # alone - Engineering Hours always land entirely in the remaining/second payment.
    items = [
        {"type": "package", "total": 3510.0},
        {"type": "engineering_hours", "total": 390.0},
    ]
    totals = compute_quote_totals(items, vat_rate=0.21)
    assert totals["subtotal"] == 3900.0
    assert totals["vat_amount"] == 819.0
    assert totals["total"] == 4719.0
    assert totals["deposit_amount"] == 2123.55  # 3510 * 1.21 / 2
    assert totals["remaining_amount"] == 2595.45  # 4719.0 - 2123.55
    assert totals["deposit_amount"] + totals["remaining_amount"] == totals["total"]


def test_compute_quote_totals_package_only_splits_evenly():
    items = [{"type": "package", "total": 1482.0}]
    totals = compute_quote_totals(items, vat_rate=0.0)
    assert totals["deposit_amount"] == 741.0
    assert totals["remaining_amount"] == 741.0


def test_compute_quote_totals_manufacturing_advances_the_workshop_cost_not_the_fee():
    # Workshop cost 800 + management fee 290: the workshop is paid (with VAT) before the
    # order is placed; the management fee is settled at delivery with the remaining balance.
    items = [{"type": "manufacturing", "total": 1090.0, "workshop_cost": 800.0}]
    totals = compute_quote_totals(items, vat_rate=0.21)
    assert totals["total"] == 1318.9
    assert totals["deposit_amount"] == 968.0  # 800 * 1.21
    assert totals["remaining_amount"] == 350.9  # 290 * 1.21
    assert totals["deposit_amount"] + totals["remaining_amount"] == totals["total"]


def test_compute_quote_totals_mixed_design_and_manufacturing():
    items = [
        {"type": "package", "total": 2028.0},
        {"type": "manufacturing", "total": 1090.0, "workshop_cost": 800.0},
    ]
    totals = compute_quote_totals(items, vat_rate=0.21)
    assert totals["deposit_amount"] == round(2028.0 * 1.21 / 2 + 800.0 * 1.21, 2)
    assert totals["deposit_amount"] + totals["remaining_amount"] == pytest.approx(totals["total"])


def test_compute_quote_totals_engineering_hours_only_has_no_deposit():
    # No package item at all -> nothing to secure with a deposit; everything is due later.
    items = [{"type": "engineering_hours", "total": 390.0}]
    totals = compute_quote_totals(items, vat_rate=0.21)
    assert totals["deposit_amount"] == 0.0
    assert totals["remaining_amount"] == totals["total"]


def test_compute_quote_totals_rejects_invalid_vat_rate():
    with pytest.raises(PricingError):
        compute_quote_totals([{"type": "package", "total": 100.0}], vat_rate=1.5)
