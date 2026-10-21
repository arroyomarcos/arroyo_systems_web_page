"""Guards the website's catalog copy: the published prices are the agreed ones, and nothing that
must stay internal (hourly rate, budgeted hours, the supervision-fee tranches) appears in it.

The prices live in frontend/src/i18n/content.js (what visitors read). Budgets and quotes are
now prepared in the Excel templates, so this test is the single place that pins the figures
the site is allowed to advertise (excl. VAT; each quote fixes one closed price in the range).
"""
import re
from pathlib import Path

import pytest

CONTENT_JS = Path(__file__).resolve().parent.parent / "frontend" / "src" / "i18n" / "content.js"
VAT = 0.21

PUBLISHED_PRICES = {
    "Product Design": (1500, 1850),
    "Product Validation": (2050, 2400),
    "Product Development": (3550, 4300),
}


def _en_money(amount: float, decimals: int = 0) -> str:
    return f"€{amount:,.{decimals}f}"


def _es_money(amount: float, decimals: int = 0) -> str:
    text = f"{amount:,.{decimals}f}".replace(",", "_").replace(".", ",").replace("_", ".")
    return f"{text} €"


@pytest.fixture(scope="module")
def content_js() -> str:
    return CONTENT_JS.read_text(encoding="utf-8")


@pytest.fixture(scope="module")
def copy(content_js) -> str:
    # Comments are stripped from the production bundle, so only the actual copy is checked.
    return "\n".join(line for line in content_js.splitlines() if not line.lstrip().startswith("//"))


@pytest.mark.parametrize("name", list(PUBLISHED_PRICES))
def test_site_advertises_the_agreed_price(content_js, name):
    low, high = PUBLISHED_PRICES[name]
    low_vat, high_vat = round(low * (1 + VAT), 2), round(high * (1 + VAT), 2)
    assert f'price: "{_en_money(low)} – {_en_money(high)}"' in content_js
    assert f'price: "{_es_money(low)} – {_es_money(high)}"' in content_js
    assert f'priceInclVat: "{_en_money(low_vat, 2)} – {_en_money(high_vat, 2)} incl. 21% VAT"' in content_js
    assert f'priceInclVat: "{_es_money(low_vat, 2)} – {_es_money(high_vat, 2)} con IVA del 21%"' in content_js


def test_site_does_not_publish_the_hourly_rate(content_js):
    # The hourly rate lives in the quote and the contract, not in the product panels.
    for forbidden in ("€78/h", "78 €/h", "HOURLY_RATE"):
        assert forbidden not in content_js, forbidden


def test_site_does_not_leak_internal_numbers(copy):
    # Brief section 5: cost per hour, margin and budgeted hours stay internal.
    for forbidden in ("44,78", "44.78", "horas presupuestadas", "margin", "margen", "days, not months"):
        assert forbidden not in copy, forbidden


def test_site_does_not_publish_the_supervision_fee_tranches(copy):
    # Product Manufacturing says the fee is a percentage that falls with volume, never the figures.
    assert not re.search(r"(?<![\d.,])(15|8|5|3)\s?%", copy)
    assert "Precio según volumen" in copy


def test_site_states_that_the_visado_is_included_in_the_price(copy):
    assert "visado incluido en el precio" in copy
    assert "endorsement cost included in the price" in copy
    for forbidden in ("visado aparte", "a coste", "37 €", "€37"):
        assert forbidden not in copy, forbidden
