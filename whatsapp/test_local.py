"""Quick test: verify local PDF processing pipeline."""
import sys
sys.path.insert(0, ".")

from cert_client import _extract_pdf_text, _parse_parameters, _validate_and_score, _detect_domain

for name, fname in [
    ("Rolling Stock", "sample_certs/rolling_stock_certificate_T001.pdf"),
    ("Signalling",    "sample_certs/signalling_certificate_T001.pdf"),
    ("Safety",        "sample_certs/safety_certificate_T001.pdf"),
]:
    print(f"\n{'='*60}")
    print(f"  {name} Certificate")
    print(f"{'='*60}")

    with open(fname, "rb") as f:
        text = _extract_pdf_text(f.read())

    print(f"Text length: {len(text)} chars")

    params = _parse_parameters(text)
    print(f"Parsed {len(params)} parameters: {sorted(params.keys())}")

    domain = _detect_domain(text)
    print(f"Domain detected: {domain}")

    result = _validate_and_score(params, domain)
    print(f"Score: {result['final_score']}")
    print(f"Critical fail: {result['critical_fail']}")
    print(f"Extracted: {result['extracted_count']}/{result['total_registry_count']}")

    for p in result["parameters"]:
        if p["value"] is not None:
            status = "PASS" if p["passed"] else "FAIL"
            print(f"  {p['param_id']} {p['name']}: {p['value']} -> {status}")
        else:
            print(f"  {p['param_id']} {p['name']}: MISSING")

print("\nDone!")
