"""Guards against the website advertising a price the quote engine doesn't charge.

The prices live in two places - frontend/src/i18n/content.js (what visitors read) and
pricing.py (what quotes and Stripe charge) - and they have drifted before.
"""
from pathlib import Path

import pytest

from pricing import ENGINEERING_HOURS_RATE, PACKAGES

CONTENT_JS = Path(__file__).resolve().parent.parent / "frontend" / "src" / "i18n" / "content.js"
VAT = 0.21


def _en_money(amount: float, decimals: int = 0) -> str:
    return f"€{amount:,.{decimals}f}"


def _es_money(amount: float, decimals: int = 0) -> str:
    text = f"{amount:,.{decimals}f}".replace(",", "_").replace(".", ",").replace("_", ".")
    return f"{text} €"


@pytest.fixture(scope="module")
def content_js() -> str:
    return CONTENT_JS.read_text(encoding="utf-8")


@pytest.mark.parametrize("key", list(PACKAGES))
def test_site_advertises_the_engine_price(content_js, key):
    low, high = PACKAGES[key]["base_price"], PACKAGES[key]["max_price"]
    low_vat, high_vat = round(low * (1 + VAT), 2), round(high * (1 + VAT), 2)
    assert f'price: "{_en_money(low)} – {_en_money(high)}"' in content_js
    assert f'price: "{_es_money(low)} – {_es_money(high)}"' in content_js
    assert f'priceInclVat: "{_en_money(low_vat, 2)} – {_en_money(high_vat, 2)} incl. 21% VAT"' in content_js
    assert f'priceInclVat: "{_es_money(low_vat, 2)} – {_es_money(high_vat, 2)} con IVA del 21%"' in content_js


def test_site_does_not_publish_the_hourly_rate(content_js):
    # The hourly rate lives in the quote and contract, not in the product detail panels.
    rate = f"{ENGINEERING_HOURS_RATE:g}"
    for forbidden in (f"€{rate}/h", f"{rate} €/h", "HOURLY_RATE"):
        assert forbidden not in content_js, forbidden


def test_site_does_not_leak_internal_numbers(content_js):
    # Brief section 5: cost per hour, margin and budgeted hours stay internal. Comments are
    # stripped from the production bundle, so only the actual copy is checked.
    copy = "\n".join(line for line in content_js.splitlines() if not line.lstrip().startswith("//"))
    for forbidden in ("44,78", "44.78", "horas presupuestadas", "margin", "margen", "days, not months"):
        assert forbidden not in copy, forbidden
    for spec in PACKAGES.values():
        assert f"{spec['base_hours']} h" not in copy
        assert f"{spec['base_hours']}h" not in copy
