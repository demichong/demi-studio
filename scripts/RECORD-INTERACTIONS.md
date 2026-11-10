# Record collection and tonearm

The current local trial uses narrow project spines. Hover or focus a spine, tap it, or use the previous/next buttons to unfold its cover. Left/Right and Home/End work when the collection has focus. The raised disc can be pulled upward to open its case study; both the disc and the cover also work as normal links. Class placeholders remain labelled as slots.

`public/assets/records.js` controls selection and pulling. `public/assets/records.css` keeps the original three-cover layout as a no-JavaScript fallback, then applies the packed-sleeve layout when enhanced. It honours reduced-motion preferences.

The Three.js model is in `src/tonearm.js`. Run `npm run build:tonearm` after editing it; this writes the self-contained module and its licence notice to `public/assets/`. No external 3D model or CDN is needed. The model uses a tube along a curve, cylinders for the pivot/counterweight, and a cartridge with finger lift and stylus. A class observer follows the existing record-flip/drag state. It renders only while moving or resizing. If WebGL is unavailable or its context is lost, the original SVG drawing remains available.

These changes have not been published. Deployment remains a separate step.

## 3D vinyl and covers

`src/records-3d.js` is included by the same Three.js bundle. It creates double-sided records with a thin cylindrical rim, textured grooves and separate paper labels. The hero follows the existing spin angle and receives `vinyl-flip` events from `studio.js`; its flip is rendered as geometry, rather than turning a flat canvas. The professional photo slot still comes from the HTML; replacing it with the documented image also updates the 3D label.

Opened project sleeves use a shallow box with a paper edge and top opening, with another 3D vinyl behind it. The existing links provide the hit areas and keyboard controls; the canvas receives no pointer events. Sleeve artwork is drawn from the existing project titles and edition labels. Covers tilt slightly with mouse movement, and the disc follows the existing pull offset. Collapsed spines keep their compact CSS depth treatment. Sleeve renderers are created only as each sleeve is opened, and redraw only while something changes. A shared draw helper avoids rendering hidden scenes. Reduced motion removes pointer tilting and easing. HTML artwork remains the fallback when WebGL is unavailable.

Build both the arm and records with `npm run build:tonearm`. The name is retained for compatibility; the output now contains all homepage 3D objects.
