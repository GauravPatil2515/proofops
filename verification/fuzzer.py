"""Anti-Overfitting & Property-Based Input Perturbation Harness.

Evaluates candidate patches against perturbed inputs to ensure that the fixer agent
has fixed the underlying logic flaw rather than special-casing the specific repro input.
"""
from __future__ import annotations

import random
import string
from typing import Any, Callable, Dict, List, Tuple


class InputPerturbationEngine:
    """Generates perturbed inputs to stress-test candidate hotfixes."""

    def __init__(self, iterations: int = 50):
        self.iterations = iterations

    def generate_coupon_variants(self) -> List[str]:
        """Generates random coupon code variants covering all lengths and character sets."""
        variants: List[str] = [
            "SAVE20",       # Target repro code
            "",             # Empty string
            "A",            # Single char
            "PROMO",        # 5 chars
            "SUMMER",       # 6 chars (the original divisor zero condition: len("SUMMER") - 6 = 0)
            "WINTER2026",   # 10 chars
            "SPECIAL-50%",  # Punctuation & symbols
            "DISCOUNT_100", # Underscores
            "000000",       # Numbers
            "🎁BONUS",      # Unicode emoji
            "A" * 64,       # Long string
        ]

        # Generate additional random variations
        for _ in range(self.iterations - len(variants)):
            length = random.randint(1, 20)
            charset = string.ascii_letters + string.digits + "-_!@"
            variants.append("".join(random.choice(charset) for _ in range(length)))

        return variants

    def run_perturbation_test(
        self,
        calculate_discount_fn: Callable[[int, str], int],
    ) -> Tuple[bool, Dict[str, Any]]:
        """Executes the calculation function against all perturbed variants."""
        variants = self.generate_coupon_variants()
        passed_count = 0
        failures: List[Dict[str, Any]] = []

        subtotals = [0, 500, 2000, 10000, 99999]

        for code in variants:
            for subtotal in subtotals:
                try:
                    discount = calculate_discount_fn(subtotal, code)
                    # Property invariant 1: Discount cannot exceed subtotal
                    assert discount <= subtotal, f"Discount {discount} exceeded subtotal {subtotal}"
                    # Property invariant 2: Discount cannot be negative
                    assert discount >= 0, f"Discount {discount} was negative"
                    passed_count += 1
                except Exception as e:
                    failures.append({
                        "code": code,
                        "subtotal": subtotal,
                        "error": type(e).__name__,
                        "message": str(e),
                    })

        total_runs = len(variants) * len(subtotals)
        passed = len(failures) == 0

        return passed, {
            "total_runs": total_runs,
            "passed_runs": passed_count,
            "failures_count": len(failures),
            "failures": failures[:5],
            "verdict": "PASSED" if passed else "FAILED",
        }
