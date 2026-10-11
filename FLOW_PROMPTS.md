# NORDVALE: Flow prompts for the hero and the story image

Featured product (from `getHeroProduct()` in `src/data/products.ts`): **Nordic Drift, Black**: oversized boxy pullover hoodie, heavyweight black fleece (450 GSM), double-layer hood with a flat drawcord, kangaroo pocket with hidden side entry, 2×2 rib cuffs and hem, dropped shoulders, cropped boxy body.

Files to generate:

| File | Folder | Size |
|---|---|---|
| `hoodie-assembly.mp4` | `public/assets/hero/` | 1080×1080 (1:1), 5 s, no audio |
| `hoodie-static.webp` | `public/assets/hero/` | 1600×1600 (1:1) |
| `story.webp` (optional; the featured product photo is used without it) | `public/assets/images/` | 1600×2000 (4:5) |

## How to make Flow match the store's hoodie
Use the store photo as the **reference ("ingredient") image** for every hero prompt below: `incoming/nordic-drift-black.jpg` (full resolution) or `public/assets/products/nordic-drift-black.webp`. It shows the exact garment. The prompts say "ONLY the hoodie, no person", so the model in the photo is not copied. If a result keeps the person, add "Use the reference ONLY for the hoodie's design, colour and fabric" and regenerate.

Workflow that works best (3 steps, 3 prompts):
1. Generate the **assembled still** (prompt A). Save it as `hoodie-static.webp`.
2. Generate the **exploded still** (prompt B), using still A as the reference.
3. Generate the **video** (prompt C) with Flow's *Frames to video*: first frame = exploded (B), last frame = assembled (A). If your tool has no two-frame mode, use the text-only version of C with A as the reference.

## A · Static fallback: assembled hoodie (`hoodie-static.webp`)
```text
Using the attached reference image ONLY for the garment (no person): the exact same black oversized boxy pullover hoodie, heavyweight fleece, double-layer hood with flat drawcord, kangaroo pocket, 2x2 rib cuffs and hem, dropped shoulders. Ghost-mannequin product photo, front view, the hoodie complete and perfectly shaped, hood down, centred, filling about 60% of the frame height, on a plain light seamless studio background in warm off-white (#f4f2ee), soft diffused studio lighting from the front-left, very soft contact shadow, realistic matte fleece texture with visible fibre, true black without crushed detail, high-end e-commerce photography, square 1:1. No text, no logos.
Avoid: person, model, mannequin visible, hands, extra garments, text, logo, watermark, harsh shadows, coloured background, floor reflection, distorted seams.
```

## B · Exploded still: first frame
```text
Using the attached reference image ONLY for the garment: the same black oversized boxy hoodie, but dismantled into separate floating parts hovering in the air, evenly spread across the frame with space between them: the hood, the main body, the left sleeve split into a shoulder part and a forearm part, the right sleeve split the same way, the kangaroo pocket, the rib hem, and two drawcords. Every part is the same black heavyweight fleece with visible fibre and matching rib cuffs. Static locked-off camera angle, front view, all parts roughly centred and inside the frame with generous margin, plain light seamless studio background in warm off-white (#f4f2ee), soft diffused studio lighting from the front-left, soft shadows only, realistic fabric, high-end product photography, square 1:1. No text, no logos.
Avoid: person, model, hands, mannequin, extra garments, text, logo, watermark, harsh shadows, coloured background, parts cropped by the frame, melted or warped fabric.
```

## C · Assembly video (`hoodie-assembly.mp4`), 5 seconds, 1:1
Frames to video: first frame = B, last frame = A.
```text
Static locked-off camera, no zoom, no pan, no cuts. On a plain light warm off-white studio background, the separate parts of a black heavyweight hoodie (hood, body, left and right sleeves each split into shoulder and forearm parts, kangaroo pocket, hem, drawcords) float gently in the air, then glide smoothly toward the centre, turn into place and lock together one after another into one complete, perfectly shaped oversized boxy hoodie. In the last second the finished hoodie settles and rotates slowly about 30 degrees. Smooth, elegant, slow motion, soft diffused studio light, realistic matte fleece texture, the fabric keeps its exact shape and colour, quiet luxury mood, 4K, 5 seconds.
Avoid: camera movement, zoom, cuts, morphing, melting or stretching fabric, parts passing through each other, people, hands, text, logos, colour changes, flicker, extra garments.
```
Text-only variant (no two-frame mode): use the same prompt with still A as the reference image and add "Start with the hoodie already dismantled into floating parts."

### Encode for scroll scrubbing (required, one command)
```bash
ffmpeg -i hero.mp4 -vf "scale=1080:1080,fps=24" -c:v libx264 -crf 24 -g 1 -pix_fmt yuv420p -an -movflags +faststart public/assets/hero/hoodie-assembly.mp4
```
And convert the still: `ffmpeg -i still-A.png -vf "scale=1600:1600" -c:v libwebp -quality 82 public/assets/hero/hoodie-static.webp`. Then run `npm run og` to rebuild the share image.

## D · Our Story image (`story.webp`), optional
Attach the **master model** image as the reference so the face matches the store.
```text
Use the attached reference image as the model identity: the exact same man, same face, hair, skin tone and build. He stands relaxed in a plain light seamless studio in warm off-white, three-quarter view, one hand in the pocket of a black oversized heavyweight hoodie with the hood down, plain neutral trousers, looking calmly just past the camera. Soft even diffused studio lighting from the front-left, the same light tone as the rest of the Nordvale photos, quiet luxury editorial mood, generous empty space around him, natural skin texture, realistic fabric texture, high-end fashion photography, 85mm lens look, vertical 4:5 portrait, full upper body and thighs visible. No text, no logos.
Avoid: extra people, distorted hands, extra fingers, warped face, text, logos, props, harsh shadows, busy background.
```
