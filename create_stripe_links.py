#!/usr/bin/env python3
"""
Create the 12 Stripe Payment Links for the Lone Star Healing donation card.

WHAT IT DOES
  - Creates one "Donation — Lone Star Healing" product.
  - Creates 12 prices: $25/$50/$100/$250/$500 as one-time AND monthly,
    plus two "choose your amount" prices (one-time + monthly).
  - Creates a Payment Link for each, with a tax-deductible confirmation
    message (EIN 42-2470842) shown after checkout.
  - Writes payment-links.json — that's what gets wired into script.js next.

SAFETY
  - Reads your Stripe secret key from the STRIPE_SECRET_KEY environment
    variable. The key is never printed, written to disk, or committed.
  - Use your TEST key (sk_test_...) first. The script refuses a live key
    unless you deliberately set ALLOW_LIVE=1.

USAGE
  export STRIPE_SECRET_KEY=sk_test_xxxxxxxxxxxx
  python3 create_stripe_links.py
"""

import json
import os
import sys
import urllib.error
import urllib.parse
import urllib.request

KEY = os.environ.get("STRIPE_SECRET_KEY", "").strip()
if not KEY:
    sys.exit("error: set STRIPE_SECRET_KEY first (use your sk_test_... key).")
if KEY.startswith(("sk_live", "rk_live")) and os.environ.get("ALLOW_LIVE") != "1":
    sys.exit("refusing to use a LIVE key. Test first; for live, re-run with ALLOW_LIVE=1.")

API = "https://api.stripe.com/v1/"
EIN = "42-2470842"
CONFIRM = (
    "Thank you for supporting Lone Star Healing, a 501(c)(3) public charity "
    f"(EIN {EIN}). No goods or services were provided in exchange for this "
    "contribution, which is tax-deductible to the extent allowed by law."
)

ONCE_AMOUNTS = [25, 50, 100, 250, 500]
# $1,000 replaces "Other" on the recurring tab (Stripe can't do a custom recurring amount).
MONTHLY_AMOUNTS = [25, 50, 100, 250, 500, 1000]
links = {"once": {}, "monthly": {}}
errors = []


def call(path, data):
    body = urllib.parse.urlencode(data, doseq=True).encode()
    req = urllib.request.Request(
        API + path, data=body, headers={"Authorization": "Bearer " + KEY}
    )
    with urllib.request.urlopen(req) as resp:
        return json.loads(resp.read())


def make(nickname, price_fields):
    """Create a price + its payment link; return the URL ('' on failure)."""
    try:
        price = call(
            "prices",
            {"product": PID, "currency": "usd", "nickname": nickname, **price_fields},
        )
        link = call(
            "payment_links",
            {
                "line_items[0][price]": price["id"],
                "line_items[0][quantity]": 1,
                "after_completion[type]": "hosted_confirmation",
                "after_completion[hosted_confirmation][custom_message]": CONFIRM,
            },
        )
        return link["url"]
    except urllib.error.HTTPError as exc:
        errors.append(f"{nickname}: {exc.read().decode()[:300]}")
        return ""


print("creating product…")
PID = call("products", {"name": "Donation — Lone Star Healing"})["id"]

for amt in ONCE_AMOUNTS:
    print(f"  ${amt} one-time…")
    links["once"][str(amt)] = make(f"${amt} one-time", {"unit_amount": amt * 100})

for amt in MONTHLY_AMOUNTS:
    print(f"  ${amt} monthly…")
    links["monthly"][str(amt)] = make(
        f"${amt} monthly", {"unit_amount": amt * 100, "recurring[interval]": "month"}
    )

print("  custom (choose your amount, one-time only)…")
links["once"]["custom"] = make(
    "Custom one-time",
    {"custom_unit_amount[enabled]": "true", "custom_unit_amount[minimum]": 100},
)
# Stripe rejects custom_unit_amount + recurring together, so there's no custom
# MONTHLY gift — the recurring tab offers the fixed $1,000 tier (above) instead.

with open("payment-links.json", "w") as fh:
    json.dump(links, fh, indent=2)

print("\nwrote payment-links.json:")
print(json.dumps(links, indent=2))

if errors:
    print("\nSome links could not be created:")
    for err in errors:
        print("  - " + err)
    print("\nFix the cause (or share this output) and re-run.")
else:
    print("\nDone — all 12 links created. Hand payment-links.json back to wire it in.")
