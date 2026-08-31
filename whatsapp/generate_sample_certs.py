"""
Generate 3 sample certificate PDFs for KMRL train T-001.

Each PDF is formatted as an official-looking certificate document with
parameter values that PASS the registry rules, so the RAG pipeline can
extract them correctly.

Domains:
  1. Rolling Stock Certificate  (RS-001 .. RS-012)
  2. Signalling Certificate     (SIG-001 .. SIG-007)
  3. Safety Certificate         (SAF-001 .. SAF-010)
"""

from fpdf import FPDF
import os
from datetime import datetime

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sample_certs")
os.makedirs(OUTPUT_DIR, exist_ok=True)

TRAIN_ID = "T-001"
CERT_DATE = "2026-02-19"
INSPECTOR = "R. Kumar"
DEPOT = "Muttom Depot"


def make_header(pdf: FPDF, title: str, cert_number: str):
    """Add official-looking certificate header."""
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "KOCHI METRO RAIL LIMITED", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, "ISO 9001:2015 Certified | CIN: U60100KL2011SGC028710", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, title, new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"Certificate No: {cert_number}", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.cell(0, 6, f"Date of Inspection: {CERT_DATE}", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(6)

    # Train info box
    pdf.set_fill_color(230, 240, 250)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(45, 8, "  Train ID:", fill=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 8, f"  {TRAIN_ID}", fill=True)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(45, 8, "  Inspector:", fill=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 8, f"  {INSPECTOR}", fill=True, new_x="LMARGIN", new_y="NEXT")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(45, 8, "  Depot:", fill=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 8, f"  {DEPOT}", fill=True)
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(45, 8, "  Valid Until:", fill=True)
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(50, 8, "  2026-08-19", fill=True, new_x="LMARGIN", new_y="NEXT")
    pdf.ln(8)


def make_table(pdf: FPDF, headers: list, rows: list):
    """Create a parameter measurement table."""
    col_widths = [22, 55, 18, 40, 35]
    # Table header
    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(40, 80, 140)
    pdf.set_text_color(255, 255, 255)
    for i, h in enumerate(headers):
        pdf.cell(col_widths[i], 8, f" {h}", border=1, fill=True)
    pdf.ln()

    # Table rows
    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 9)
    for ridx, row in enumerate(rows):
        fill = ridx % 2 == 0
        if fill:
            pdf.set_fill_color(245, 248, 255)
        for i, cell in enumerate(row):
            pdf.cell(col_widths[i], 7, f" {cell}", border=1, fill=fill)
        pdf.ln()


def make_footer(pdf: FPDF, cert_type: str):
    """Add signature block and footer."""
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, f"This {cert_type} has been conducted in accordance with KMRL/QA/CERT/2024 standards.",
             new_x="LMARGIN", new_y="NEXT")
    pdf.cell(0, 6, "All measurements taken using calibrated instruments (NABL accredited).",
             new_x="LMARGIN", new_y="NEXT")
    pdf.ln(12)

    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(90, 6, "Inspecting Officer:", new_x="RIGHT")
    pdf.cell(90, 6, "Authorized Signatory:", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(90, 6, f"{INSPECTOR}", new_x="RIGHT")
    pdf.cell(90, 6, "S. Menon, Chief Engineer", new_x="LMARGIN", new_y="NEXT")
    pdf.cell(90, 6, "Sr. Rolling Stock Inspector", new_x="RIGHT")
    pdf.cell(90, 6, "KMRL Operations", new_x="LMARGIN", new_y="NEXT")


# ═══════════════════════════════════════════════════════════════
#  Certificate 1: Rolling Stock
# ═══════════════════════════════════════════════════════════════

def generate_rolling_stock():
    pdf = FPDF()
    pdf.add_page()
    make_header(pdf, "ROLLING STOCK FITNESS CERTIFICATE", "KMRL/RS/2026/00142")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "INSPECTION RESULTS - ROLLING STOCK PARAMETERS", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(3)

    headers = ["Param ID", "Parameter Name", "Unit", "Measured Value", "Acceptance Range"]

    # Values that PASS all registry conditions
    rows = [
        ["RS-001", "Wheel Diameter",              "mm",     "850.2",    "840 - 860"],
        ["RS-002", "Brake Pad Thickness",          "mm",     "18.5",     ">= 15"],
        ["RS-003", "Bogie Frame Crack Length",     "mm",     "0.1",      "<= 0.5"],
        ["RS-004", "Axle Bearing Temperature",     "deg C",  "58.3",     "<= 70"],
        ["RS-005", "Traction Motor Insulation R",  "MOhm",   "4.2",      ">= 2"],
        ["RS-006", "Pantograph Contact Force",     "N",      "92.5",     "70 - 120"],
        ["RS-007", "Coupler Height",               "mm",     "1050.0",   "1040 - 1060"],
        ["RS-008", "Suspension Spring Deflection", "mm",     "18.7",     "<= 25"],
        ["RS-009", "Door Opening Force",           "N",      "72.0",     "<= 100"],
        ["RS-010", "HVAC Cooling Capacity",        "kW",     "38.5",     ">= 35"],
        ["RS-011", "Wheel Flange Thickness",       "mm",     "27.8",     "22 - 33"],
        ["RS-012", "Air Spring Pressure",          "bar",    "4.8",      "3.5 - 6.0"],
    ]

    make_table(pdf, headers, rows)
    make_footer(pdf, "rolling stock inspection")

    path = os.path.join(OUTPUT_DIR, "rolling_stock_certificate_T001.pdf")
    pdf.output(path)
    print(f"  Created: {path}")
    return path


# ═══════════════════════════════════════════════════════════════
#  Certificate 2: Signalling
# ═══════════════════════════════════════════════════════════════

def generate_signalling():
    pdf = FPDF()
    pdf.add_page()
    make_header(pdf, "SIGNALLING SYSTEM FITNESS CERTIFICATE", "KMRL/SIG/2026/00089")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "INSPECTION RESULTS - SIGNALLING PARAMETERS", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(3)

    headers = ["Param ID", "Parameter Name", "Unit", "Measured Value", "Acceptance Range"]

    rows = [
        ["SIG-001", "ATP Response Time",            "ms",      "320",      "<= 500"],
        ["SIG-002", "Balise Read Accuracy",          "%",       "99.82",    ">= 99.5"],
        ["SIG-003", "Odometer Drift",                "%",       "0.28",     "<= 0.5"],
        ["SIG-004", "Cab Signal Display Brightness", "cd/m2",   "285",      ">= 200"],
        ["SIG-005", "Train-Wayside Comm Latency",    "ms",      "62",       "<= 100"],
        ["SIG-006", "Axle Counter Reset Accuracy",   "%",       "99.97",    ">= 99.9"],
        ["SIG-007", "Speed Sensor Accuracy",         "%",       "99.45",    ">= 99.0"],
    ]

    make_table(pdf, headers, rows)

    # Additional narrative paragraph for LLM context
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5,
        "Summary: All signalling parameters for Train T-001 measured on 2026-02-19 at Muttom Depot "
        "are within KMRL acceptance criteria. The ATP system demonstrated a response time of 320 ms, "
        "well within the 500 ms threshold. Balise read accuracy recorded at 99.82%, exceeding the "
        "99.5% minimum. Odometer drift measured at 0.28% over 10 km calibration. Cab signal DMI "
        "brightness at 285 cd/m2 under direct sunlight. CBTC radio round-trip latency at 62 ms. "
        "Axle counter reset accuracy at 99.97%. Speed sensor accuracy at 99.45% across full range."
    )

    make_footer(pdf, "signalling system inspection")

    path = os.path.join(OUTPUT_DIR, "signalling_certificate_T001.pdf")
    pdf.output(path)
    print(f"  Created: {path}")
    return path


# ═══════════════════════════════════════════════════════════════
#  Certificate 3: Safety
# ═══════════════════════════════════════════════════════════════

def generate_safety():
    pdf = FPDF()
    pdf.add_page()
    make_header(pdf, "SAFETY SYSTEMS FITNESS CERTIFICATE", "KMRL/SAF/2026/00067")

    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "INSPECTION RESULTS - SAFETY PARAMETERS", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(3)

    headers = ["Param ID", "Parameter Name", "Unit", "Measured Value", "Acceptance Range"]

    rows = [
        ["SAF-001", "Fire Detection Response Time",  "s",    "18.5",    "<= 30"],
        ["SAF-002", "Emergency Brake Distance",       "m",    "128.0",   "<= 150"],
        ["SAF-003", "Door Interlock Holding Force",   "N",    "620.0",   ">= 500"],
        ["SAF-004", "Emergency Lighting Duration",    "min",  "105.0",   ">= 90"],
        ["SAF-005", "Smoke Obscuration",              "%",    "6.2",     "<= 10"],
        ["SAF-006", "Deadman Device Response Time",   "s",    "2.1",     "<= 3"],
        ["SAF-007", "Crashworthiness Long. Force",    "kN",   "1720.0",  ">= 1500"],
        ["SAF-008", "Earthing Resistance",            "Ohm",  "0.45",    "<= 1"],
        ["SAF-009", "Emergency Egress Door Width",    "mm",   "720.0",   ">= 650"],
        ["SAF-010", "PSD-Train Door Alignment Tol.",  "mm",   "32.0",    "<= 50"],
    ]

    make_table(pdf, headers, rows)

    # Additional narrative
    pdf.ln(8)
    pdf.set_font("Helvetica", "", 10)
    pdf.multi_cell(0, 5,
        "Summary: All safety system parameters for Train T-001 have been tested and are within "
        "acceptable limits as per KMRL safety standards and EN 45545 / EN 15227 requirements. "
        "Fire detection system activated in 18.5 seconds (threshold: 30s). Emergency braking "
        "distance from 80 km/h measured at 128.0 m on level dry rail (limit: 150m). Door interlock "
        "force at 620 N, well above the 500 N minimum. Emergency lighting sustained for 105 minutes "
        "on battery. Smoke obscuration at 6.2% per metre. Deadman response at 2.1 seconds. "
        "Crashworthiness longitudinal force capacity at 1720 kN. Earthing resistance at 0.45 Ohm. "
        "Emergency egress door width at 720 mm. PSD alignment tolerance at 32 mm."
    )

    make_footer(pdf, "safety systems inspection")

    path = os.path.join(OUTPUT_DIR, "safety_certificate_T001.pdf")
    pdf.output(path)
    print(f"  Created: {path}")
    return path


# ═══════════════════════════════════════════════════════════════

if __name__ == "__main__":
    print(f"\nGenerating 3 certificate PDFs for Train {TRAIN_ID}...\n")
    p1 = generate_rolling_stock()
    p2 = generate_signalling()
    p3 = generate_safety()
    print(f"\nAll 3 PDFs generated in: {OUTPUT_DIR}")
    print(f"\nUpload order on WhatsApp:")
    print(f"  1. {os.path.basename(p1)} (Rolling Stock)")
    print(f"  2. {os.path.basename(p2)} (Signalling)")
    print(f"  3. {os.path.basename(p3)} (Safety)")
