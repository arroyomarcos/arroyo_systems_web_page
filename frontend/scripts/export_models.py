"""STEP -> compact multi-part meshes for the website's 3D viewers (public/assets/models/).

Run with a Python that has CadQuery installed:  python scripts/export_models.py

File layout (little endian):
  uint32  headerLength            JSON header, UTF-8, zero-padded to a multiple of 4
  JSON    {"parts": [{"kind": ..., "vertices": n, "indices": m}, ...]}
  per part: float32[n*3] positions, uint16[m] indices (zero-padded to a multiple of 4)

Everything in one file shares a single frame: centred on the bounding box of all parts and scaled
so the longest dimension is 2 units, so the viewer needs no knowledge of the real size.

Part kinds -> how the viewer paints them:
  result   the finished, machined part (metal)
  bounds   the client's bounding envelope (grey, 10% opaque)
  block    the client's keep-out blocks / parallelepipeds (red, 40% opaque)
  feature  the client's slots and cylinders (blue, solid)
"""
import json
import os
import struct

import cadquery as cq
import numpy as np

SRC = r"C:\Archivos Marcos\ARROYO_SYSTEMS\WEB_IMAGENES"
DST = os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "public", "assets", "models")


def tessellate(solid, tolerance, angular):
    verts, tris = solid.tessellate(tolerance, angular)
    pos = np.array([[v.x, v.y, v.z] for v in verts], dtype=np.float64)
    idx = np.array(tris, dtype=np.int64)
    # Weld the duplicate vertices tessellation leaves on face seams.
    uniq, inverse = np.unique(np.round(pos, 4), axis=0, return_inverse=True)
    idx = inverse.reshape(-1)[idx]
    keep = (idx[:, 0] != idx[:, 1]) & (idx[:, 1] != idx[:, 2]) & (idx[:, 0] != idx[:, 2])
    return uniq, idx[keep]


def write_scene(path, parts):
    all_pos = np.vstack([p[1] for p in parts])
    lo, hi = all_pos.min(axis=0), all_pos.max(axis=0)
    centre = (lo + hi) / 2
    scale = 2.0 / (hi - lo).max()

    header = {"parts": []}
    blobs = []
    for kind, pos, idx in parts:
        assert len(pos) < 65535, kind
        p32 = ((pos - centre) * scale).astype(np.float32)
        i16 = idx.reshape(-1).astype(np.uint16)
        blob = p32.tobytes() + i16.tobytes()
        blob += b"\0" * (-len(blob) % 4)
        blobs.append(blob)
        header["parts"].append({"kind": kind, "vertices": len(p32), "indices": len(i16)})

    raw = json.dumps(header, separators=(",", ":")).encode("utf-8")
    raw += b" " * (-len(raw) % 4)
    os.makedirs(os.path.dirname(path), exist_ok=True)
    with open(path, "wb") as f:
        f.write(struct.pack("<I", len(raw)))
        f.write(raw)
        for blob in blobs:
            f.write(blob)
    print(os.path.basename(path), os.path.getsize(path), "bytes,", len(parts), "parts,",
          sum(len(p[2]) for p in parts), "triangles")


def classify(solid, index, biggest_volume):
    """The inputs file mixes three families; tell them apart by geometry, not by order."""
    faces = solid.Faces()
    cylinders = sum(1 for f in faces if f.geomType() == "CYLINDER")
    box = solid.BoundingBox()
    box_volume = box.xlen * box.ylen * box.zlen
    if solid.Volume() >= biggest_volume * 0.999:
        return "bounds"  # the single biggest box that encloses everything
    # Plates and prisms: bounded by flat faces, with at most a couple of tiny rounded edges.
    # Slots and cylinders: the cylindrical faces carry most of the shape (and a lot of the
    # bounding box stays empty, or the solid is a bare cylinder).
    flat_area = sum(f.Area() for f in faces if f.geomType() == "PLANE")
    total_area = sum(f.Area() for f in faces)
    if cylinders and flat_area < total_area * 0.9:
        return "feature"
    if cylinders and box_volume and solid.Volume() / box_volume < 0.9:
        return "feature"
    return "block"


def export_inputs():
    shape = cq.importers.importStep(os.path.join(SRC, "IME_01.step"))
    solids = shape.solids().vals()
    biggest = max(s.Volume() for s in solids)
    parts = []
    for i, solid in enumerate(solids):
        kind = classify(solid, i, biggest)
        pos, idx = tessellate(solid, 0.2, 0.15)
        parts.append((kind, pos, idx))
        print("  solid %d -> %s" % (i, kind))
    # Draw order inside the file is irrelevant to the viewer, but keep families together.
    order = {"bounds": 0, "block": 1, "feature": 2}
    parts.sort(key=lambda p: order[p[0]])
    write_scene(os.path.join(DST, "inputs.bin"), parts)


def export_result():
    solid = cq.importers.importStep(os.path.join(SRC, "AS26-001-P001-G-V1.step")).val()
    pos, idx = tessellate(solid, 0.05, 0.2)
    write_scene(os.path.join(DST, "result.bin"), [("result", pos, idx)])


if __name__ == "__main__":
    export_inputs()
    export_result()
