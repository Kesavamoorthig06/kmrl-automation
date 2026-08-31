"""Patch ~/whatsapp/main.py on EC2 to include ML API router."""
import re

MAIN = "/home/ec2-user/whatsapp/main.py"

with open(MAIN) as f:
    src = f.read()

# 1. Add sys.path for ML after the 'from bridge_router import bridge_router' line
if "sys.path.insert" not in src:
    src = src.replace(
        "from bridge_router import bridge_router\n",
        "from bridge_router import bridge_router\n"
        "\n"
        "# ── ML Pipeline API ──────────────────────────────────────────────\n"
        "import sys\n"
        "sys.path.insert(0, '/home/ec2-user/ml')\n"
        "from ml_api import router as ml_router  # noqa: E402\n",
    )
    print("✓ Added ML imports")

# 2. Add app.include_router(ml_router) after bridge_router include
if "ml_router" not in src or "app.include_router(ml_router)" not in src:
    src = src.replace(
        "app.include_router(bridge_router)\n",
        "app.include_router(bridge_router)\n"
        "\n"
        "# Mount the ML pipeline API router\n"
        "app.include_router(ml_router)\n",
    )
    print("✓ Added ML router mount")

# 3. Update version to 7.0.0
src = src.replace('version="6.0.0"', 'version="7.0.0"')
src = src.replace('"version": "6.0.0"', '"version": "7.0.0"')
print("✓ Updated version to 7.0.0")

# 4. Add ml_pipeline to health endpoint
if '"ml_pipeline"' not in src:
    src = src.replace(
        '        "rag_forwarding": True,\n    }',
        '        "rag_forwarding": True,\n'
        '        "ml_pipeline": True,\n    }',
    )
    print("✓ Added ml_pipeline to health")

# 5. Add ML endpoints to root response
if '"ml_endpoints"' not in src:
    src = src.replace(
        '        "feature_endpoints": [',
        '        "ml_endpoints": [\n'
        '            "/ml/health",\n'
        '            "/ml/scores",\n'
        '            "/ml/deploy-next",\n'
        '            "/ml/run (POST)",\n'
        '            "/ml/retrain (POST)",\n'
        '            "/ml/weights",\n'
        '        ],\n'
        '        "feature_endpoints": [',
    )
    print("✓ Added ML endpoints to root")

with open(MAIN, "w") as f:
    f.write(src)

print("\nDone – main.py patched.")
