"""ProofOps Evidence Gate CLI."""
import argparse
import os
import sys
from rich.console import Console
from rich.panel import Panel
from rich.table import Table

from gate.verifier import EvidenceGate, EvidenceGateError

console = Console()


def main():
    parser = argparse.ArgumentParser(description="ProofOps Evidence Gate CLI")
    subparsers = parser.add_subparsers(dest="command", required=True)

    verify_p = subparsers.add_parser("verify", help="Run evidence gate verification")
    verify_p.add_argument("--incident", required=True, help="Incident identifier (e.g. INC-4021)")
    verify_p.add_argument("--service-dir", default="services/checkout-api", help="Path to target service")
    verify_p.add_argument("--repro-script", default="repro_script.py", help="Reproduction script filename")
    verify_p.add_argument("--diff-file", required=True, help="Path to patch diff file")
    verify_p.add_argument("--output", default="evidence-bundle.json", help="Path to save bundle")

    args = parser.parse_args()

    if args.command == "verify":
        console.print(f"[bold cyan]🔍 ProofOps Evidence Gate:[/bold cyan] Inspecting incident [yellow]{args.incident}[/yellow]...")

        if not os.path.exists(args.diff_file):
            console.print(f"[bold red]❌ Error:[/bold red] Diff file not found: {args.diff_file}")
            sys.exit(1)

        with open(args.diff_file, "r") as f:
            patch_diff = f.read()

        gate = EvidenceGate(
            incident_id=args.incident,
            service_name="checkout-api",
            service_dir=os.path.abspath(args.service_dir),
            python_bin=sys.executable,
        )

        try:
            bundle = gate.verify_evidence(
                repro_script_path=args.repro_script,
                patch_diff=patch_diff,
            )
            with open(args.output, "w") as f:
                f.write(bundle.to_json())

            table = Table(title="🛡️ Evidence Gate Verdict: PASS", border_style="green")
            table.add_column("Metric", style="bold white")
            table.add_column("Value", style="cyan")

            table.add_row("Incident ID", bundle.incident_id)
            table.add_row("Gate Verdict", f"[bold green]{bundle.gate_verdict}[/bold green]")
            table.add_row("Patch SHA-256", bundle.patch_sha256[:16] + "...")
            table.add_row("Test Suite Exit Code", str(bundle.test_suite_exit_code))
            table.add_row("Evidence Artifact", args.output)

            console.print(table)
            console.print(Panel(
                "[bold green]✅ EVIDENCE VERIFIED:[/bold green] All regression tests passed and patch integrity confirmed.\n"
                "Incident closure is now authorized in Switch.",
                border_style="green"
            ))
            sys.exit(0)

        except EvidenceGateError as e:
            console.print(Panel(
                f"[bold red]⛔ EVIDENCE GATE BLOCKED RESOLUTION:[/bold red]\n{str(e)}",
                border_style="red"
            ))
            sys.exit(2)


if __name__ == "__main__":
    main()

