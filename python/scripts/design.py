#!/usr/bin/env python3
"""
annotate_trains.py

Usage:
    python annotate_trains.py --input IMG.jpg --outdir annotations

What it does:
 - Detects horizontal "bands" (train views) in the input blueprint by projecting
   image brightness and finding content areas.
 - For each band, draws six semi-transparent boxes + arrows + text annotations.
 - Saves individual annotated band images and a combined annotated image.

You can pass a JSON file with per-train annotations (optional). See `example_annotations`
below for structure if you want to override defaults for each detected train.
"""
import os
import argparse
from PIL import Image
import numpy as np
import matplotlib.pyplot as plt
import matplotlib.patches as patches
import json

# -----------------------
# Helpers
# -----------------------
def horizontal_bands(img_gray, min_band_height=40, gap_thresh=0.02):
    """
    Return list of (y0,y1) bounding rows for horizontal content bands.
    img_gray: 2D numpy array [H,W] range 0..255
    Strategy: compute row-wise mean of "ink" (how far from white). Threshold and
    find contiguous regions.
    """
    H, W = img_gray.shape
    # whiteness distance (white is 255)
    ink = 255 - img_gray  # darker => larger
    row_activity = ink.mean(axis=1) / 255.0  # 0..1
    thresh = max(row_activity.mean() * 0.3, 0.005)  # adaptive threshold
    mask = row_activity > thresh

    # Merge small dips (morphological close)
    from scipy.ndimage import binary_closing, binary_opening, generate_binary_structure
    struct = generate_binary_structure(1,1)
    mask = binary_closing(mask, structure=struct, iterations=3)
    mask = binary_opening(mask, structure=struct, iterations=2)

    # Extract spans
    bands = []
    in_band = False
    start = None
    for y, v in enumerate(mask):
        if v and not in_band:
            in_band = True
            start = y
        elif not v and in_band:
            in_band = False
            end = y
            if (end - start) >= min_band_height:
                bands.append((start, end))
            start = None
    # if still open
    if in_band and start is not None:
        end = H
        if (end - start) >= min_band_height:
            bands.append((start, end))
    return bands

def default_annotations_for_band(band_w, band_h):
    """
    Returns a list of 6 annotation dicts with relative positions (x,y,w,h as fractions)
    and title/desc for each constraint. These are approximate and intended to be
    adjusted if needed.
    """
    ANN = [
        # left-front
        {"rel": (0.05, 0.12, 0.18, 0.18), "title": "Constraint 1\n(Front Bogie Clearance)", "desc": "Possible bogie clearance conflict: limited vertical space leads to rubbing."},
        # center-top
        {"rel": (0.40, 0.05, 0.20, 0.18), "title": "Constraint 2\n(Roof Equipment Height)", "desc": "HV equipment height exceeds envelope; affects tunnel/bridge clearance."},
        # right-top doors
        {"rel": (0.75, 0.10, 0.16, 0.16), "title": "Constraint 3\n(Door Threshold Gap)", "desc": "Large step/gap at doors; accessibility and safety risk."},
        # left-middle cab
        {"rel": (0.08, 0.62, 0.20, 0.16), "title": "Constraint 4\n(Driver Cab Ergonomics)", "desc": "Controls placement may cause operator strain."},
        # center-bottom seating
        {"rel": (0.42, 0.55, 0.36, 0.24), "title": "Constraint 5\n(Seating Layout / Aisle Width)", "desc": "Narrow aisle & seat pitch below standards; evacuation risk."},
        # right-bottom gangway
        {"rel": (0.78, 0.60, 0.14, 0.18), "title": "Constraint 6\n(Inter-car Connection Seal)", "desc": "Gangway seal gap may allow water/dust ingress."},
    ]
    return ANN

def annotate_band(pil_img, band_bbox, annotations_rel, label_footer=None, save_path=None, dpi=150):
    """
    Draw annotations on the provided band of the image.
    - pil_img: whole PIL.Image (RGB)
    - band_bbox: (x0,y0,x1,y1) in pixels (we'll crop)
    - annotations_rel: list of dicts with keys:
        'rel': (rx,ry,rw,rh) fractions relative to band width/height,
        'title': str, 'desc': str
    - save_path: if provided, save PNG to path
    Returns: PIL.Image of annotated band.
    """
    x0,y0,x1,y1 = band_bbox
    band = pil_img.crop((x0,y0,x1,y1))
    bw, bh = band.size

    fig, ax = plt.subplots(figsize=(bw/100, bh/100), dpi=100)
    ax.imshow(band)
    ax.axis('off')

    for a in annotations_rel:
        rx,ry,rw,rh = a["rel"]
        x = x0 + rx * bw - x0  # coordinate relative to crop (so simpler: x = rx*bw)
        y = ry * bh
        w = rw * bw
        h = rh * bh

        # semi-transparent rectangle
        rect = patches.Rectangle((x, y), w, h, linewidth=2, fill=True, alpha=0.08, edgecolor='black')
        ax.add_patch(rect)

        # center of rect
        cx = x + w/2
        cy = y + h/2

        # choose label location based on cx
        if cx < bw * 0.35:
            lx, ly = x + w + 0.02*bw, y + h/2
            ha = 'left'
        elif cx > bw * 0.7:
            lx, ly = x - 0.02*bw, y + h/2
            ha = 'right'
        else:
            lx, ly = x + w/2, y - 0.06*bh
            ha = 'center'

        # arrow
        ax.annotate("", xy=(cx, cy), xytext=(lx, ly), arrowprops=dict(arrowstyle="->", linewidth=1.2))

        # textbox
        textbox = f"{a.get('title','')}\n{a.get('desc','')}"
        bbox_props = dict(boxstyle="round,pad=0.4", fc="white", ec="black", lw=0.8)
        ax.text(lx, ly, textbox, fontsize=8, va='center', ha=ha, bbox=bbox_props)

    # optional footer in the crop
    if label_footer:
        ax.text(bw*0.5, bh*0.94, label_footer, fontsize=7, ha='center', va='bottom', bbox=dict(boxstyle="square,pad=0.2", fc="white", ec="none", alpha=0.8))

    # Save to PIL Image
    fig.canvas.draw()
    annotated = Image.frombytes('RGB', fig.canvas.get_width_height(), fig.canvas.buffer_rgba())
    plt.close(fig)
    if save_path:
        annotated.save(save_path)
    return annotated

# -----------------------
# Main CLI
# -----------------------
def main():
    parser = argparse.ArgumentParser(description="Annotate train blueprint images with 6 constraint overlays per train band.")
    parser.add_argument('--input', required=True, help="Input blueprint image path")
    parser.add_argument('--outdir', default='annotations', help="Output directory")
    parser.add_argument('--min-band-height', type=int, default=60, help="Minimum height to treat as a band")
    parser.add_argument('--annotations-json', default=None, help="Optional JSON file with per-band annotations")
    parser.add_argument('--keep-combined', action='store_true', help="Also save a combined annotated image of the full blueprint")
    args = parser.parse_args()

    os.makedirs(args.outdir, exist_ok=True)

    im = Image.open(args.input).convert('RGB')
    W, H = im.size

    # Convert to grayscale numpy
    gray = np.array(im.convert('L'))

    # Try to find horizontal bands
    try:
        bands = horizontal_bands(gray, min_band_height=args.min_band_height)
    except Exception as e:
        # If scipy missing, fallback to a simple threshold segmentation
        print("Warning: scipy not available or failed; using simple projection fallback. Install scipy for better results.")
        row_activity = (255 - gray).mean(axis=1) / 255.0
        mask = row_activity > (row_activity.mean() * 0.3)
        bands = []
        in_band = False
        start = None
        for y,v in enumerate(mask):
            if v and not in_band:
                in_band = True; start = y
            elif not v and in_band:
                end = y
                if (end - start) >= args.min_band_height:
                    bands.append((start, end))
                in_band = False
        if in_band and start is not None:
            bands.append((start, H))

    if len(bands) == 0:
        # fallback: treat full image as single band
        bands = [(0, H)]

    # Load optional per-band annotations file
    per_band_annotations = None
    if args.annotations_json:
        with open(args.annotations_json, 'r') as f:
            per_band_annotations = json.load(f)
        # Expect per_band_annotations to be a list aligned to bands with each element a list of annotation dicts
        # Validate lightly
        if not isinstance(per_band_annotations, list):
            print("annotations-json should be a list (per band). Ignoring file.")
            per_band_annotations = None

    saved_paths = []
    for i, (y0, y1) in enumerate(bands, start=1):
        # expand a bit vertically for context
        pad = int(0.02 * H)
        y0p = max(0, y0 - pad)
        y1p = min(H, y1 + pad)
        band_bbox = (0, y0p, W, y1p)  # full width crop (most blueprints are full width)
        bw = W
        bh = y1p - y0p

        if per_band_annotations and i-1 < len(per_band_annotations):
            ann_rel = per_band_annotations[i-1]
        else:
            # use defaults scaled to band size
            ann_rel = default_annotations_for_band(bw, bh)

        out_path = os.path.join(args.outdir, f"annotated_band_{i}.png")
        footer = f"Train band #{i} — annotations applied"
        annotated = annotate_band(im, band_bbox, ann_rel, label_footer=footer, save_path=out_path)
        print("Saved:", out_path)
        saved_paths.append(out_path)

    # Optionally produce full annotated image: paint rectangles/annotations on full image in their band positions
    if args.keep_combined:
        fig, ax = plt.subplots(figsize=(W/100, H/100), dpi=100)
        ax.imshow(im)
        ax.axis('off')
        for i, (y0, y1) in enumerate(bands, start=1):
            pad = int(0.02 * H)
            y0p = max(0, y0 - pad)
            y1p = min(H, y1 + pad)
            bw = W
            bh = y1p - y0p

            if per_band_annotations and i-1 < len(per_band_annotations):
                ann_rel = per_band_annotations[i-1]
            else:
                ann_rel = default_annotations_for_band(bw, bh)

            # draw annotations but offset by y0p (since we're on full image)
            for a in ann_rel:
                rx,ry,rw,rh = a["rel"]
                x = rx * bw
                y = y0p + ry * bh
                w = rw * bw
                h = rh * bh
                rect = patches.Rectangle((x,y), w, h, linewidth=2, fill=True, alpha=0.06, edgecolor='black')
                ax.add_patch(rect)
                cx = x + w/2
                cy = y + h/2
                if cx < W * 0.35:
                    lx, ly = x + w + 0.02*W, y + h/2
                    ha = 'left'
                elif cx > W * 0.7:
                    lx, ly = x - 0.02*W, y + h/2
                    ha = 'right'
                else:
                    lx, ly = x + w/2, y - 0.06*H
                    ha = 'center'
                ax.annotate("", xy=(cx, cy), xytext=(lx, ly), arrowprops=dict(arrowstyle="->", linewidth=1.2))
                textbox = f"{a.get('title','')}\n{a.get('desc','')}"
                ax.text(lx, ly, textbox, fontsize=8, va='center', ha=ha, bbox=dict(boxstyle="round,pad=0.4", fc="white", ec="black", lw=0.8))

        combined_path = os.path.join(args.outdir, "annotated_combined.png")
        plt.savefig(combined_path, bbox_inches='tight', dpi=150)
        plt.close(fig)
        print("Saved combined annotated image:", combined_path)
        saved_paths.append(combined_path)

    print("All done. Files saved to:", args.outdir)
    for p in saved_paths:
        print(" -", p)


if __name__ == "__main__":
    main()