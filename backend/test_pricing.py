import pytest

from pricing import (
    PACKAGES,
    PricingError,
    compute_quote_totals,
    price_engineering_hours_item,
    price_package_item,
)


@pytest.mark.parametrize(
    "key,expected_base,expected_max",
    [
        ("rapid_design", 1300.0, 1550.0),
        ("validated_design", 3000.0, 3500.0),
        ("performance_design", 5000.0, 5750.0),
    ],
)
def test_package_base_and_max_price(key, expected_base, expected_max):
    assert price_package_item(key, extra_hours=0, override_confirmed=False) == expected_base
    spec = PACKAGES[key]
    assert price_package_item(key, extra_hours=spec["max_extra_hours"], override_confirmed=False) == expected_max


def test_package_price_scales_linearly_with_extra_hours():
    # Validated Design: 3000 base + 4h * 50 = 3200, within the 3000-3500 range.
    assert price_package_item("validated_design", extra_hours=4, override_confirmed=False) == 3200.0


def test_package_extra_hours_beyond_max_requires_override():
    with pytest.raises(PricingError):
        price_package_item("rapid_design", extra_hours=6, override_confirmed=False)

    # With override confirmed, it's allowed and priced past the catalog max.
    price = price_package_item("rapid_design", extra_hours=6, override_confirmed=True)
    assert price == 1300.0 + 6 * 50.0


def test_package_negative_hours_rejected():
    with pytest.raises(PricingError):
        price_package_item("rapid_design", extra_hours=-1, override_confirmed=True)


def test_unknown_package_rejected():
    with pytest.raises(PricingError):
        price_package_item("unknown_package", extra_hours=0, override_confirmed=False)


def test_engineering_hours_pricing():
    assert price_engineering_hours_item(5) == 250.0
    assert price_engineering_hours_item(0) == 0.0


def test_engineering_hours_negative_rejected():
    with pytest.raises(PricingError):
        price_engineering_hours_item(-1)


def test_compute_quote_totals_matches_prompt_example():
    # Validated Design (3000) + Engineering Hours 5h (250) = 3250 subtotal, 21% VAT.
    items = [
        {"total": 3000.0},
        {"total": 250.0},
    ]
    totals = compute_quote_totals(items, vat_rate=0.21)
    assert totals["subtotal"] == 3250.0
    assert totals["vat_amount"] == 682.5
    assert totals["total"] == 3932.5
    assert totals["deposit_amount"] == 1966.25
    assert totals["remaining_amount"] == 1966.25


def test_compute_quote_totals_zero_vat_default():
    items = [{"total": 1300.0}]
    totals = compute_quote_totals(items, vat_rate=0.0)
    assert totals["vat_amount"] == 0.0
    assert totals["total"] == 1300.0
    assert totals["deposit_amount"] == 650.0
    assert totals["remaining_amount"] == 650.0


def test_compute_quote_totals_rejects_invalid_vat_rate():
    with pytest.raises(PricingError):
        compute_quote_totals([{"total": 100.0}], vat_rate=1.5)
