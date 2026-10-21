# Equipment / cleaning

- Click an equipment code to expand its schedule and cleaning history within the equipment list. Click again or use × to collapse it.
- Printed QR codes keep their existing `/e/<id>` URLs. Opening one on mobile shows that equipment’s information (Product, category, Line, installation date and selected fields). Cleaning registration and history are shown only when its label fields include **Last cleaned** (`fieldId=cleaned`); the server rejects cleaning writes otherwise. Removing this option preserves past cleaning records; selecting it again restores registration and history. No catalog, management menu, label printing or cycle editor is shown. PC access keeps the management catalog and history without a cleaning entry form. A mobile visit without a valid equipment QR session shows a scan-again prompt. The server checks the mobile QR session for loading the equipment and saving its cleaning record. Mobile responses contain one equipment record, and mobile requests to management APIs are rejected. Equipment addition, category/list management, deletion, line changes, logo upload and cycle settings are PC-only operations. Sessions expire after eight hours or a server restart; scan the printed QR again if needed.
- Each Product header has a **Select all** checkbox to select/deselect every unit in that category + Product, including rows hidden by filters. A partial selection shows an indeterminate checkbox. Select multiple Products, then use the top **Print preview** button to print them together.
- Click **+ Product** to create a Product inline: select its category, enter its name, set the shared cleaning cycle and add equipment rows in the same table. No creation dialog opens. Save all or Save & Print stores the complete new Product atomically; duplicate Products are rejected. Cancel discards the draft.
- Click **Settings** in a Product header to edit the complete Product list inline. No individual equipment editor is opened. The table includes No., Line, installation date and the two label fields; numbers can be blank.
- Set the Product cleaning cycle at the top of the same table. New units inherit it; `0` disables scheduling. **Save all** stores all rows and the cycle together, atomically.
- Expand **Apply the same setting to all rows** to apply one Line, installation date or label field selection to all rows. Add new equipment with **Add row**. Existing equipment is deleted through the normal password-protected deletion flow.
- The complete Product list is loaded for settings even when dashboard filters show only some units. Number exchanges between rows are supported. Validation or storage failures leave the original Product unchanged.
- S/M label preview is available below the table. **Save & Print** saves the whole Product before opening print options.
- Category and line/field tools are grouped under the main **Settings** menu. Equipment rows expand only their cleaning history; the redundant QR-entry notice and individual edit button have been removed.
- Next cleaning = most recent recorded cleaning date + cycle. If there is no cleaning history, installation date is the starting point. Backdated records do not replace a newer cleaning as the starting point.
- Status uses the Bangkok calendar: overdue, due today, within the next seven days, or scheduled later. Summary cards filter the list; category and line filters can be combined with cleaning status.
- Saving a mobile QR cleaning record updates the next due date immediately. Existing cleaning history stays intact when the Product cycle is changed or disabled.
- Product names support Korean, Thai, spaces, parentheses, slashes, periods and other printable text up to 60 characters. Line breaks and `< >` are rejected.
- Existing equal individual cycles migrate to one Product cycle. Conflicting legacy cycles show **Review cycle** and remain unscheduled until a Product cycle is saved. The original per-equipment intervals are retained in migration metadata and the subsequent change audit.
- No. is optional in the equipment table. A blank number prints just the product code (for example, `U202`); a numbered entry prints `U202-01`. Equipment codes remain unique. Editing the number preserves the QR identity and cleaning history.
- Line and cleaning schedule are web information and are not added to printed nameplates. Label size is chosen for the entire print job.

## Product images and default size

- Printing and previews start with **M (80 × 40 mm)**. S remains available for each print job.
- In the inline Product settings, expand **Product photos & information**. Upload one representative photo and up to 20 supporting images (manual pages, equipment information), with descriptions up to 300 characters. Supporting images can be reordered or removed. **Save all** commits these changes together with the equipment rows and cycle; Cancel leaves the saved Product unchanged.
- Accepted images: JPG, PNG, WEBP, up to 8 MB and 20 megapixels per source. The server applies orientation, resizes to at most 2400 pixels on the longest side, and stores WEBP images. Images are shared by category + Product and appear on every matching equipment QR page, including equipment without Last cleaned. Tap an image to enlarge it in an overlay on the same page. Pinch or use +/− to zoom (100–500%), drag to pan, and use Reset or Close. Swipe left/right (or use the previous/next buttons and arrow keys) to browse the representative photo followed by supporting images in their saved order. The counter shows the current image. At higher zoom levels dragging pans the photo; swiping outward from its edge changes images. Changing images resets zoom, and the first/last images stop at the gallery boundary. Closing preserves the page position and any unsaved cleaning inputs. Management and uploads remain PC-only.
- Product metadata is stored in `nameplates/data.json`; image files are stored in `nameplates/images/` under the configured server storage directory. Back up both together. Uploads are staged until Save all; unreferenced files are retained to avoid breaking recovery/history. Removing an image from a Product does not erase its stored file.

## Deployment

Upload `index.html`, `nameplates.js`, `nameplates.css` and the updated `Server/nameplates.py` to their existing locations. Restart the Python server to enable the cleaning-cycle API. Existing data is read compatibly without a separate migration command.

## Verification

From the project root: `node .validation/nameplate-cycle-check.cjs`.
From `Server/`, with the server dependencies available: `python -m unittest discover -s tests -p test_nameplates.py -v`.
