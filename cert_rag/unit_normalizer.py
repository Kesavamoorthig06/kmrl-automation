"""
Unit normalizer — converts extracted values to standard registry units.

Deterministic, no LLM involved. Handles common unit variants that an LLM
might return (e.g. "celsius" → "degC", "millimeters" → "mm").
"""

from __future__ import annotations

import logging
from typing import List

from config import load_parameter_registry
from models import ExtractedParameter, NormalizedParameter

logger = logging.getLogger(__name__)

# ── Canonical unit aliases ────────────────────────────────────────
# Maps alternate spellings/symbols → canonical registry unit
UNIT_ALIASES = {
    # Length
    "mm": "mm", "millimeter": "mm", "millimeters": "mm", "millimetre": "mm",
    "cm": "cm", "centimeter": "cm", "centimeters": "cm",
    "m": "m", "meter": "m", "meters": "m", "metre": "m",
    "km": "km", "kilometer": "km", "kilometers": "km", "kilometre": "km",
    # Temperature
    "degc": "degC", "°c": "degC", "celsius": "degC", "c": "degC",
    "degf": "degF", "°f": "degF", "fahrenheit": "degF", "f": "degF",
    # Force
    "n": "N", "newton": "N", "newtons": "N",
    "kn": "kN", "kilonewton": "kN", "kilonewtons": "kN",
    # Electrical
    "mohm": "MOhm", "megaohm": "MOhm", "megaohms": "MOhm", "mω": "MOhm",
    "kohm": "kOhm", "kiloohm": "kOhm", "kω": "kOhm",
    "ohm": "Ohm", "ohms": "Ohm", "ω": "Ohm",
    # Time
    "ms": "ms", "millisecond": "ms", "milliseconds": "ms",
    "s": "s", "sec": "s", "second": "s", "seconds": "s",
    "min": "min", "minute": "min", "minutes": "min",
    "h": "h", "hour": "h", "hours": "h",
    # Percentage
    "pct": "pct", "%": "pct", "percent": "pct", "percentage": "pct",
    # Power
    "kw": "kW", "kilowatt": "kW", "kilowatts": "kW",
    "w": "W", "watt": "W", "watts": "W",
    # Pressure
    "bar": "bar", "bars": "bar",
    "psi": "psi",
    # Luminance
    "cd/m2": "cd_per_m2", "cd_per_m2": "cd_per_m2", "cd/m²": "cd_per_m2",
    "candelas per square meter": "cd_per_m2",
}

# ── Conversion factors to registry standard units ─────────────────
# (source_unit, target_unit) → lambda value → converted_value
CONVERSIONS = {
    # Length
    ("cm", "mm"): lambda v: v * 10,
    ("m", "mm"):  lambda v: v * 1000,
    ("km", "mm"): lambda v: v * 1_000_000,
    ("km", "m"):  lambda v: v * 1000,
    ("m", "km"):  lambda v: v / 1000,
    ("mm", "cm"): lambda v: v / 10,
    ("mm", "m"):  lambda v: v / 1000,
    ("mm", "km"): lambda v: v / 1_000_000,
    ("cm", "m"):  lambda v: v / 100,
    ("m", "cm"):  lambda v: v * 100,
    # Temperature
    ("degF", "degC"): lambda v: (v - 32) * 5 / 9,
    ("degC", "degF"): lambda v: v * 9 / 5 + 32,
    # Force
    ("kN", "N"):  lambda v: v * 1000,
    ("N", "kN"):  lambda v: v / 1000,
    # Resistance
    ("MOhm", "kOhm"): lambda v: v * 1000,
    ("MOhm", "Ohm"):  lambda v: v * 1_000_000,
    ("kOhm", "Ohm"):  lambda v: v * 1000,
    ("kOhm", "MOhm"): lambda v: v / 1000,
    ("Ohm", "MOhm"):  lambda v: v / 1_000_000,
    ("Ohm", "kOhm"):  lambda v: v / 1000,
    # Time
    ("s", "ms"):   lambda v: v * 1000,
    ("ms", "s"):   lambda v: v / 1000,
    ("min", "s"):  lambda v: v * 60,
    ("s", "min"):  lambda v: v / 60,
    ("h", "min"):  lambda v: v * 60,
    ("min", "h"):  lambda v: v / 60,
    # Power
    ("W", "kW"):  lambda v: v / 1000,
    ("kW", "W"):  lambda v: v * 1000,
    # Pressure
    ("psi", "bar"): lambda v: v * 0.0689476,
    ("bar", "psi"): lambda v: v / 0.0689476,
}


class UnitNormalizer:
    """Converts extracted parameter values to registry standard units."""

    def __init__(self):
        self._registry = load_parameter_registry()

    def normalize(self, params: List[ExtractedParameter]) -> List[NormalizedParameter]:
        """
        For each extracted parameter, convert value to the unit expected by
        the registry.  Returns NormalizedParameter list.
        """
        results = []
        for p in params:
            reg = self._registry.get(p.param_id)
            if not reg:
                logger.warning(f"No registry entry for {p.param_id}, skipping normalization")
                continue

            target_unit = reg["unit"]
            canon_source = _canonicalize_unit(p.unit)
            canon_target = _canonicalize_unit(target_unit)

            if canon_source == canon_target:
                # Already in correct unit
                results.append(NormalizedParameter(
                    param_id=p.param_id,
                    raw_value=p.value,
                    raw_unit=p.unit,
                    value=p.value,
                    unit=target_unit,
                ))
            else:
                converter = CONVERSIONS.get((canon_source, canon_target))
                if converter:
                    converted = converter(p.value)
                    logger.info(
                        f"{p.param_id}: {p.value} {p.unit} → {converted:.4f} {target_unit}"
                    )
                    results.append(NormalizedParameter(
                        param_id=p.param_id,
                        raw_value=p.value,
                        raw_unit=p.unit,
                        value=converted,
                        unit=target_unit,
                    ))
                else:
                    # No conversion available — use raw value with a warning
                    logger.warning(
                        f"No conversion {canon_source} → {canon_target} for {p.param_id}. "
                        f"Using raw value."
                    )
                    results.append(NormalizedParameter(
                        param_id=p.param_id,
                        raw_value=p.value,
                        raw_unit=p.unit,
                        value=p.value,
                        unit=target_unit,
                    ))
        return results


def _canonicalize_unit(unit: str) -> str:
    """Map a unit string to its canonical form."""
    return UNIT_ALIASES.get(unit.lower().strip(), unit)
