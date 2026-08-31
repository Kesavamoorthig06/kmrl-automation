"""Generate a sample branding contract PDF for testing."""

from fpdf import FPDF
import os

OUTPUT_DIR = os.path.join(os.path.dirname(__file__), "sample_certs")
os.makedirs(OUTPUT_DIR, exist_ok=True)


def generate_branding_contract():
    pdf = FPDF()
    pdf.add_page()

    # Header
    pdf.set_font("Helvetica", "B", 18)
    pdf.cell(0, 12, "KOCHI METRO RAIL LIMITED", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.set_font("Helvetica", "", 11)
    pdf.cell(0, 7, "Branding & Advertising Division", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(4)

    pdf.set_font("Helvetica", "B", 14)
    pdf.cell(0, 10, "TRAIN BRANDING CONTRACT", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    pdf.cell(0, 6, "Contract ID: WRAP001", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.cell(0, 6, "Date of Issue: 15/01/2026", new_x="LMARGIN", new_y="NEXT", align="C")
    pdf.ln(8)

    # Contract details
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "CONTRACT DETAILS", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    details = [
        ("Campaign Name:", "Coca-Cola Summer Splash 2026"),
        ("Brand / Client Name:", "Coca-Cola India Pvt. Ltd."),
        ("Advertisement Type:", "Exterior Wrap"),
        ("Placement Type:", "Full Body"),
        ("Start Date:", "01/02/2026"),
        ("End Date:", "31/07/2026"),
        ("Contract Value:", "Rs. 1,80,000"),
    ]

    pdf.set_font("Helvetica", "", 10)
    for label, value in details:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(60, 7, f"  {label}")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # Exposure requirements
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "EXPOSURE REQUIREMENTS", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    exposure = [
        ("Daily Required Hours:", "8.5"),
        ("Monthly Required Hours:", "255"),
        ("Required Trainsets:", "5"),
    ]

    for label, value in exposure:
        pdf.set_font("Helvetica", "B", 10)
        pdf.cell(60, 7, f"  {label}")
        pdf.set_font("Helvetica", "", 10)
        pdf.cell(0, 7, value, new_x="LMARGIN", new_y="NEXT")

    pdf.ln(6)

    # Assigned trains
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "ASSIGNED TRAIN FLEET", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 10)
    trains = ["R-001", "R-004", "R-006", "R-010", "R-016"]
    col_w = [22, 60, 50, 40]
    headers = ["Train ID", "Current Route", "Wrap Status", "Visibility Score"]

    pdf.set_font("Helvetica", "B", 9)
    pdf.set_fill_color(40, 80, 140)
    pdf.set_text_color(255, 255, 255)
    for i, h in enumerate(headers):
        pdf.cell(col_w[i], 8, f" {h}", border=1, fill=True)
    pdf.ln()

    pdf.set_text_color(0, 0, 0)
    pdf.set_font("Helvetica", "", 9)
    routes = ["Aluva - Petta", "Edapally - Maharajas",
              "Kalamassery - Thykoodam", "Aluva - Petta", "Edapally - Maharajas"]
    statuses = ["Applied", "Applied", "Pending", "Applied", "Scheduled"]
    scores = ["95%", "98%", "N/A", "96%", "N/A"]

    for idx, tid in enumerate(trains):
        fill = idx % 2 == 0
        if fill:
            pdf.set_fill_color(245, 248, 255)
        pdf.cell(col_w[0], 7, f" {tid}", border=1, fill=fill)
        pdf.cell(col_w[1], 7, f" {routes[idx]}", border=1, fill=fill)
        pdf.cell(col_w[2], 7, f" {statuses[idx]}", border=1, fill=fill)
        pdf.cell(col_w[3], 7, f" {scores[idx]}", border=1, fill=fill)
        pdf.ln()

    pdf.ln(8)

    # Terms
    pdf.set_font("Helvetica", "B", 11)
    pdf.cell(0, 8, "TERMS AND CONDITIONS", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(2)

    pdf.set_font("Helvetica", "", 9)
    terms = (
        "1. The branded wraps must maintain minimum 90% visibility score throughout the "
        "contract period. 2. KMRL reserves the right to temporarily remove wraps for "
        "maintenance purposes without penalty. 3. Daily exposure hours are calculated "
        "based on operational schedules and actual revenue service hours. "
        "4. Monthly exposure shortfall exceeding 10% will result in proportional contract "
        "extension at no additional cost. 5. The advertiser must provide wrap materials "
        "meeting KMRL quality specifications within 7 days of contract signing."
    )
    pdf.multi_cell(0, 5, terms)

    pdf.ln(10)

    # Signatures
    pdf.set_font("Helvetica", "B", 10)
    pdf.cell(90, 6, "For KMRL:", new_x="RIGHT")
    pdf.cell(90, 6, "For Coca-Cola India:", new_x="LMARGIN", new_y="NEXT")
    pdf.ln(10)
    pdf.set_font("Helvetica", "", 10)
    pdf.cell(90, 6, "V. Prasad, Marketing Head", new_x="RIGHT")
    pdf.cell(90, 6, "A. Sharma, Regional Director", new_x="LMARGIN", new_y="NEXT")

    path = os.path.join(OUTPUT_DIR, "branding_contract_WRAP001.pdf")
    pdf.output(path)
    print(f"  Created: {path}")
    return path


if __name__ == "__main__":
    print("\nGenerating sample branding contract PDF...\n")
    p = generate_branding_contract()
    print(f"\nDone! Upload on WhatsApp as a MARKETING officer.")
