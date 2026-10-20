# Equipment / cleaning

- Click an equipment code to expand its schedule and cleaning history within the equipment list. Click again or use × to collapse it.
- Printed QR codes keep their existing `/e/<id>` URLs. Opening one on mobile enables cleaning entry for that equipment. PC and ordinary web access show history without a cleaning entry form. The server also checks the mobile QR session when accepting a cleaning record. Sessions expire after eight hours or a server restart; scan the printed QR again if needed.
- Set the cleaning cycle in the **Product** header, once for all equipment in that category/Product group. New units inherit this cycle. `0` disables scheduling. Individual editing no longer changes the Product cycle.
- Next cleaning = most recent recorded cleaning date + cycle. If there is no cleaning history, installation date is the starting point. Backdated records do not replace a newer cleaning as the starting point.
- Status uses the Bangkok calendar: overdue, due today, within the next seven days, or scheduled later. Summary cards filter the list; category and line filters can be combined with cleaning status.
- Saving a mobile QR cleaning record updates the next due date immediately. Existing cleaning history stays intact when the Product cycle is changed or disabled.
- Product names support Korean, Thai, spaces, parentheses, slashes, periods and other printable text up to 60 characters. Line breaks and `< >` are rejected.
- Existing equal individual cycles migrate to one Product cycle. Conflicting legacy cycles show **Review cycle** and remain unscheduled until a Product cycle is saved. The original per-equipment intervals are retained in migration metadata and the subsequent change audit.
- No. is optional in the equipment table. A blank number prints just the product code (for example, `U202`); a numbered entry prints `U202-01`. Equipment codes remain unique. Editing the number preserves the QR identity and cleaning history.
- Line and cleaning schedule are web information and are not added to printed nameplates. Label size is chosen for the entire print job.

## Deployment

Upload `index.html`, `nameplates.js`, `nameplates.css` and the updated `Server/nameplates.py` to their existing locations. Restart the Python server to enable the cleaning-cycle API. Existing data is read compatibly without a separate migration command.

## Verification

From the project root: `node .validation/nameplate-cycle-check.cjs`.
From `Server/`, with the server dependencies available: `python -m unittest discover -s tests -p test_nameplates.py -v`.
