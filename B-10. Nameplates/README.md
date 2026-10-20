# Equipment / cleaning

- Click an equipment code to expand cleaning entry, cleaning cycle and history in the equipment list. Click again or use × to collapse it.
- Existing QR URLs (`?id=...`) open the matching equipment inline.
- Set the cleaning cycle in days, either in the expanded row or the equipment editing table. `0` disables scheduling; existing equipment defaults to `0`.
- Next cleaning = most recent recorded cleaning date + cycle. If there is no cleaning history, installation date is the starting point. Backdated records do not replace a newer cleaning as the starting point.
- Status uses the Bangkok calendar: overdue, due today, within the next seven days, or scheduled later. Summary cards filter the list; category and line filters can be combined with cleaning status.
- Saving a cleaning updates the next due date immediately. Existing cleaning history stays intact when a cycle is changed or disabled.
- No. is optional in the equipment table. A blank number prints just the product code (for example, `U202`); a numbered entry prints `U202-01`. Equipment codes remain unique. Editing the number preserves the QR identity and cleaning history.
- Line and cleaning schedule are web information and are not added to printed nameplates. Label size is chosen for the entire print job.

## Deployment

Upload `index.html`, `nameplates.js`, `nameplates.css` and the updated `Server/nameplates.py` to their existing locations. Restart the Python server to enable the cleaning-cycle API. Existing data is read compatibly without a separate migration command.

## Verification

From the project root: `node .validation/nameplate-cycle-check.cjs`.
From `Server/`, with the server dependencies available: `python -m unittest discover -s tests -p test_nameplates.py -v`.
