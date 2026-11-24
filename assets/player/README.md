# Player atlas

`atlas.png` contains 116 RGBA frames in 96 × 112 cells, ten columns, anchored at (48,108). `manifest.json` indexes the full reference library. The Stilt Village renderer maps the existing gameplay states to selected frames, retaining a procedural fallback for image-load failure. Some source frames have extraction defects; the current mapping skips the most obvious damaged frames and crops ladder rails. Unused action art is reserved for future mechanics. Browser visual review is still required before release.
