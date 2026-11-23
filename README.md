# RAGDOLL MAYHEM — 3D Physics Sandbox

**Phase 1 / Alpha 0.1** — a stylized, browser-playable 3D sandbox using Three.js for rendering and Rapier for real rigid-body physics and articulated crash-test-dummy joints.

## Included

- Bright 3D testing arena with lighting and shadows.
- Jointed crash-test dummies with head, torso, pelvis, arms and legs as separate physical bodies.
- Six spawnable objects: dummies, boxes, bouncy balls, barrels, beams, and ramps.
- Grab and drag, impulse, freeze/unfreeze, delete and reset.
- Gravity and time speed sliders; pause, orbit/zoom camera and WASD camera pan.
- Landscape-friendly touch controls and responsive UI.
- Non-graphic, toy-like physics interactions. No injuries or realistic gore.

## Run locally

This is a static site. Because it uses browser ES modules, serve the directory rather than opening `index.html` as a `file://` URL.

```sh
cd ragdoll-mayhem
python -m http.server 8000
```

Then visit `http://localhost:8000/` in a recent Chrome, Edge or Firefox browser.

**An internet connection is needed:** Three.js and Rapier are loaded from pinned JSDelivr package URLs. There is no build step and no API key.

## Controls

| Action | Control |
| ------ | ------- |
| Orbit camera | Drag blank background |
| Grab object | Grab tool + drag a prop / ragdoll part |
| Zoom | Mouse wheel / two-finger pinch |
| Pan | WASD / arrow keys |
| Spawn six object types | Keys 1–6, or sidebar |
| Switch tools | G grab, F impulse, R freeze, X remove |
| Pause | Space |
| Remove selected object | Delete |
| Clear selection | Escape |

Mobile: tap Spawn or tools in the on-screen panels. Touch-drag an object to grab; drag empty space to orbit.

## Publish with GitHub Pages

1. Create a **new public GitHub repository** named `ragdoll-mayhen` (do not use an unrelated game repository).
2. Upload the contents of this folder into the repository root. `index.html` should be at the top level.
3. In repository **Settings → Pages**, choose **Deploy from a branch**, `main`, `/(root)`, and save.
4. Once GitHub publishes the site, open `https://YOUR_USERNAME.github.io/ragdoll-mayhen/`.

## Project structure

```text
index.html
style.css
src/
  main.js        Render loop, sandbox state, interaction
  physics.js     Rapier rigid bodies, joints, forces
  ragdoll.js     Articulated dummy creation
  sandbox.js     Arena and spawnable props
  controls.js    Orbit/touch camera, raycast picking, drag
  ui.js          HUD and keyboard/button bindings
```

## Next phase

Improve joint stability, object selection feedback, more playground props, visual impact effects, save/load and performance tuning. Current demo limits ragdolls to 12 and other props to 90; performance depends on device.

## License

Original sandbox source files: MIT license (see LICENSE). Three.js and Rapier are third-party packages loaded from their CDNs, under their respective licenses.