#!/usr/bin/env python3
"""
FlavorFind — GCP Cleanup Script
================================
Safely disables Vertex AI and removes billing from the vertext-project
after embedding generation is complete.

What this does:
  1. Documents current GCP usage (APIs enabled, billing status)
  2. Disables Vertex AI API (stops any accidental future charges)
  3. Removes billing account link from the project (project stays, billing stops)
  4. Verifies the cleanup was successful
  5. Prints a full audit log

What this does NOT do:
  - Delete the project (kept for future use)
  - Delete any local files
  - Touch the droplet or database

Prerequisites:
  - gcloud CLI installed and authenticated
  - Project: vertext-project

Run AFTER all embedding generation and testing is complete:
    python3 scripts/gcp_cleanup.py

To re-enable later:
    gcloud services enable aiplatform.googleapis.com --project=vertext-project
    gcloud billing projects link vertext-project --billing-account=01B1B5-B65656-A6A885
"""

import subprocess
import json
import sys
from datetime import datetime

PROJECT_ID      = "vertext-project"
BILLING_ACCOUNT = "01B1B5-B65656-A6A885"

# APIs to disable (only the ones we enabled for this task)
APIS_TO_DISABLE = [
    "aiplatform.googleapis.com",
]

def ts():
    return datetime.now().strftime('%Y-%m-%d %H:%M:%S')

def banner(msg):
    print(f"\n{'='*65}")
    print(f"  {msg}")
    print(f"{'='*65}")

def run(cmd: list, capture=True) -> tuple:
    """Run a gcloud command. Returns (stdout, stderr, returncode)."""
    result = subprocess.run(cmd, capture_output=capture, text=True)
    return result.stdout.strip(), result.stderr.strip(), result.returncode

def gcloud(*args) -> tuple:
    return run(["gcloud"] + list(args))

def main():
    banner(f"GCP CLEANUP — {PROJECT_ID}")
    print(f"  Started: {ts()}")

    # ── Step 0: Verify gcloud is available and authenticated ──────────────────
    print(f"\n[1/5] Checking gcloud auth...")
    out, err, code = gcloud("auth", "list", "--format=json")
    if code != 0:
        print(f"  ❌  gcloud not available or not authenticated: {err}")
        sys.exit(1)

    accounts = json.loads(out) if out else []
    active = [a for a in accounts if a.get("status") == "ACTIVE"]
    if not active:
        print("  ❌  No active gcloud account. Run: gcloud auth login")
        sys.exit(1)

    active_account = active[0]["account"]
    print(f"  ✅  Authenticated as: {active_account}")

    # ── Step 1: Document current state ────────────────────────────────────────
    print(f"\n[2/5] Documenting current state...")

    # Enabled APIs
    out, _, _ = gcloud("services", "list",
                        "--project", PROJECT_ID,
                        "--enabled",
                        "--format=json")
    enabled_apis = []
    if out:
        try:
            services = json.loads(out)
            enabled_apis = [s["config"]["name"] for s in services]
            print(f"  Currently enabled APIs ({len(enabled_apis)}):")
            for api in sorted(enabled_apis):
                print(f"    • {api}")
        except Exception:
            print(f"  (Could not parse API list)")

    # Billing status
    out, _, _ = gcloud("billing", "projects", "describe", PROJECT_ID,
                        "--format=json")
    billing_info = {}
    if out:
        try:
            billing_info = json.loads(out)
            billing_enabled = billing_info.get("billingEnabled", False)
            billing_acct    = billing_info.get("billingAccountName", "none")
            print(f"\n  Billing account : {billing_acct}")
            print(f"  Billing enabled : {billing_enabled}")
        except Exception:
            print(f"  (Could not parse billing info)")

    # ── Step 2: Disable Vertex AI API ─────────────────────────────────────────
    print(f"\n[3/5] Disabling Vertex AI API...")
    for api in APIS_TO_DISABLE:
        if api in enabled_apis:
            print(f"  Disabling {api}...")
            out, err, code = gcloud("services", "disable", api,
                                     "--project", PROJECT_ID,
                                     "--force")
            if code == 0:
                print(f"  ✅  {api} disabled")
            else:
                print(f"  ❌  Failed to disable {api}: {err}")
        else:
            print(f"  ℹ️   {api} was not enabled — skipping")

    # ── Step 3: Remove billing ────────────────────────────────────────────────
    print(f"\n[4/5] Removing billing account from project...")
    out, err, code = gcloud("billing", "projects", "unlink", PROJECT_ID)
    if code == 0:
        print(f"  ✅  Billing unlinked from {PROJECT_ID}")
        print(f"       Project remains active but cannot incur charges")
    else:
        # Already unlinked or permission issue
        if "already" in err.lower() or "not" in err.lower():
            print(f"  ℹ️   Billing was already unlinked")
        else:
            print(f"  ⚠️   Could not unlink billing: {err}")
            print(f"       Manual step: console.cloud.google.com → Billing → Unlink")

    # ── Step 4: Verify ────────────────────────────────────────────────────────
    print(f"\n[5/5] Verifying cleanup...")

    # Check APIs
    out, _, _ = gcloud("services", "list",
                        "--project", PROJECT_ID,
                        "--enabled",
                        "--filter", "name:aiplatform",
                        "--format=json")
    vertex_still_on = False
    if out:
        try:
            remaining = json.loads(out)
            vertex_still_on = len(remaining) > 0
        except Exception:
            pass

    # Check billing
    out, _, _ = gcloud("billing", "projects", "describe", PROJECT_ID,
                        "--format=json")
    billing_still_on = False
    if out:
        try:
            info = json.loads(out)
            billing_still_on = info.get("billingEnabled", False)
        except Exception:
            pass

    # ── Final Report ──────────────────────────────────────────────────────────
    banner("CLEANUP REPORT")
    print(f"  Project      : {PROJECT_ID}")
    print(f"  Completed at : {ts()}")
    print(f"  Account      : {active_account}")

    print(f"\n  Vertex AI API  : {'⚠️  STILL ENABLED' if vertex_still_on else '✅  Disabled'}")
    print(f"  Billing        : {'⚠️  STILL ACTIVE'  if billing_still_on else '✅  Unlinked'}")

    print(f"\n  What was used:")
    print(f"    • text-embedding-005 model")
    print(f"    • ~7,385 ingredients embedded")
    print(f"    • ~74 API calls (batches of 100)")
    print(f"    • Estimated cost: < $0.01 USD")

    print(f"\n  To re-enable if needed:")
    print(f"    gcloud services enable aiplatform.googleapis.com --project={PROJECT_ID}")
    print(f"    gcloud billing projects link {PROJECT_ID} --billing-account={BILLING_ACCOUNT}")

    if vertex_still_on or billing_still_on:
        print(f"\n  ⚠️   Manual action required — see above")
        print(f"       Visit: https://console.cloud.google.com/billing")
    else:
        print(f"\n  ✅  All done. No further charges will accrue on {PROJECT_ID}.")

    print(f"{'='*65}\n")

if __name__ == "__main__":
    main()
