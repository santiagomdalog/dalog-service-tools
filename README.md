# DALOG Service Tools

Zero-install web tools for DALOG field work on Holcim cement-plant
condition-monitoring projects. One page (the **hub**) with three tools:

| Tool | What it does | Where it works |
|---|---|---|
| **Holcim IoT Link Modbus TCP-IP list** | D850 *Project Profile* (.xlsx) → Holcim *IoT Link Modbus TCP/IP Exchange List* (.xlsx) | Everywhere, even offline |
| **DAWI Sheet Updater** | Updates sensor + gateway status in the plant's Google Sheet from the DDP exports and the connectivity overview | Web page (Google sign-in) or the downloaded file (key file) |
| **DAWI Sensor Form** | Adds a newly installed DAWI sensor or gateway (with photos) to the plant sheet, on site from the phone, with or without signal | Web page only |

**Links**

- Hub (main channel): https://santiagomdalog.github.io/dalog-service-tools/
- Claude link (backup): https://claude.ai/artifact/G9f6HTZmpHHQmEUMCaS1TA — the Sheet Updater and the Sensor Form don't work there (Claude blocks Google)
- Google (Apps Script) version of the form, fallback, no photos/offline:
  https://script.google.com/macros/s/AKfycby927644EXjEUSMw2xyPPm_kRQkxxSJJVKhqhX-S0UjYQNoHzpzRCW36PnSSQFXavNelA/exec

---

## Part 1 — Using the tools

### Holcim IoT Link Modbus TCP-IP list
1. Open the tool, drop the D850 Project Profile (.xlsx).
2. Check **Read as** (Kiln / VRM-BM-RP) and pick the **Format**: 24 bit or
   16 bit. The format depends on the D850 firmware installed; it cannot be
   read from the file, so always choose it.
3. **Download Exchange List.** HAC and IP address are filled with `PENDING`
   (never in the profile — fill them in by hand). A yellow *Check the
   header* box appears when the plant name or project number had to be
   guessed. Signals the tool doesn't recognise are listed, never dropped.

### DAWI Sheet Updater
1. Sign in with Google (web page) — or, in the downloaded file, drop the
   service-account key file (it stays on your PC and is cleared after use).
2. Paste the plant's Google Sheet link.
3. Pick the mode: **Overview + DDP files**, **Overview only** or **DDP files only**,
   and drop the files (the overview .txt, the Sensor Nodes CSV, the Gateways CSV).
4. Check the columns and the list of changes, then **Write**. Only changed
   cells are written; nothing is written if the sheet moved in the meantime.

Status rules: data ≤ 2 days old = *Data Ok*; date in the future = *Wrong
time*; never sent = *Not started*; gateway missing from the Gateways CSV =
*Not started*. Rows without a real serial (blank, "N/A") are never touched.
Possible serial typos in the sheet are shown with a **Correct…** button.

> The Gateways CSV also holds WiFi passwords and connection strings. The tool
> only reads the serial and "Is Connected" columns. Don't send that file
> around.

### DAWI Sensor Form (phone)

**Install it once per phone** (so it opens with no signal):
- **iPhone (Safari):** open the hub link → Share → **Add to Home Screen**.
  Important on iPhone: without this, Safari may delete entries waiting to
  be sent after about 7 days.
- **Android (Chrome):** menu ⋮ → **Add to Home screen** / **Install app**.

The app opens straight into the form.

**Before going on site (with signal):** sign in with Google and open the
plant once. The phone keeps a copy of that plant's sheet.

**Adding a sensor or gateway:**
1. Choose the plant (or *Other sheet… paste its link* the first time).
2. Pick **Sensors** or **Gateways**.
   - Sensors: Area, Machine, Code, Serial, Position, Status on site,
     Mounting direction, Mounting type.
   - Gateways: Gateway name, Serial, IP, Location.
   Only the columns that sheet has are asked.
3. **Add photos** (camera or gallery). Several per sensor are fine.
4. Check the summary and **Save**.
   - New serial → new row (first free row after the last sensor).
   - Serial already in the sheet → only its **empty** cells are filled;
     nothing is ever overwritten.

**No signal?** A yellow banner appears and Save becomes *Save on this phone
(send later)*. Entries and photos wait in **waiting to send** and go out by
themselves when there is signal again (or tap **Send now**). If the signal
dies halfway, nothing is written twice. If Google refuses an entry (for
example a duplicate serial), it stays in the list with the reason and
**Try again** / **Delete**.

**Where the photos go** (Google Drive, next to the plant sheet):

```
<folder of the plant sheet>/
  DAWI photos - <sheet name>/
    Sensors/
      <machine>/
        Motor DE_1.jpg          ← <position>_<number>, numbering continues
        Motor NDE_1.jpg
    Gateways/
      <serial>/
        <serial>_<name>_<date>_<time>_1.jpg
```

The sensor serial is written in each photo's Drive description, so
searching the serial in Drive finds its photos.

### Access — what each engineer needs
1. Their Google account on the app's allowed list (see *Adding an engineer*).
2. The plant **sheet** shared with their email as **Editor** — a "anyone with
   the link" share is deliberately not enough.
3. For photos: the plant **folder** shared as **Editor** too (sharing only
   the sheet → rows save, photos wait on the phone with a message).

---

## Part 2 — Running and maintaining it (Santiago)

### Adding an engineer
1. Google Cloud console → project **DALOG Service Tools** → Google Auth
   Platform → **Audience** → Test users → add their Gmail/Google email.
2. Share the plant sheets **and** their folders with that email as Editor.
3. Send them the hub link and the install steps above.

### New plant
```
python tools/templates/make_plant_template.py "Nobsa"
python tools/templates/test_template.py "build/templates/Nobsa - DAWI Commissioning.xlsx"
```
Upload the .xlsx to Drive → open it → **File › Save as Google Sheets** (the
tools only work on real Google Sheets). Don't rename the column headers.

### Changing a tool: build → test → publish → upload
No node on this PC; everything runs with Python + headless Edge.

**1. Build everything**
```
python tools/hub/assemble.py
python tools/sensor-form/assemble.py
```
Outputs in `build/`:
- `DALOG-Service-Tools.html` — the hub (downloaded-file version)
- `github/` — what goes to GitHub: `index.html`, `sw.js`,
  `manifest.webmanifest`, `icon-192.png`, `icon-512.png`
- `sensor-form/Code.gs`, `sensor-form/Form.html` — the Apps Script version
- `converter.html`, `sheets-updater.html` — single tools

**2. Run all tests (all must say ALL PASS)**
```
python tools/converter/test/run_converter_tests.py
python tools/sheets-updater/test/run_tests.py
cd tools/sheets-updater/test; python run_ui_tests.py; cd ../../..
python tools/sensor-form/test/run_tests.py
python tools/sensor-form/test/run_gateway_tests.py
python tools/sensor-form/test/run_ui_tests.py
python tools/hub/test/run_hub_tests.py
python tools/hub/test/run_google_tests.py
python tools/templates/test_template.py "build/templates/Nobsa - DAWI Commissioning.xlsx"
```
The tests use the real plant files (in `EXAMPLE OF DAWI LIST`, `necessary
FILES FOR COLLEGUE CODES`, `tools/converter/test/fixtures`) against fake
Google services. Nothing real is written.

**3. Publish**
- Claude link: republish `build/DALOG-Service-Tools.html` to
  G9f6HTZmpHHQmEUMCaS1TA (done by Claude after the tests pass).
- GitHub: repo `santiagomdalog/dalog-service-tools` → Add file → Upload
  files → `build/github/index.html` → Commit. The other 4 files only when
  they changed. Phones pick up the new version the next time they open it
  with signal (Ctrl+F5 on a PC).
- Apps Script (only if that version is still used): paste `Code.gs` and
  `Form.html` → Deploy → Manage deployments → edit → **New version** (keeps
  the same link).
- The downloaded file: resend `build/DALOG-Service-Tools.html`.

### Project layout
```
tools/
  hub/            menu page, Google sign-in, offline files (pwa/), links.json, build
  converter/      tool 1: converter.js (logic), index.html (page), vendor/ (ExcelJS, template)
  sheets-updater/ tool 2: updater.js (logic), google.js, rs256.js, index.html
  sensor-form/    tool 3: sensorform.js (logic), Form.html (page), server.gs.js (Apps Script),
                  webbackend.js (same functions over Google REST), fieldkit.js (photos + offline)
  templates/      new-plant sheet generator
  theme/          shared "field" look (colours, fonts) for every page
build/            generated files — don't edit by hand; build/final.html = frozen converter v15 baseline
reference/        original Python scripts the tools were ported from
CLAUDE.md         detailed decisions and history (for Claude)
```

### Google setup (already done)
- Google Cloud project **DALOG Service Tools**: Sheets API + Drive API
  enabled; consent screen *External / Testing*; test users = allowed list.
- OAuth Web client with origin `https://santiagomdalog.github.io`. Its
  client ID is in `tools/hub/links.json` — it is public, not a secret.
- Permissions the app asks for: Sheets, Drive (photo folders next to the
  sheet), Drive app data (each engineer's plant list), sharing lists
  (read-only), email.

### Safety rules
- **Never** put the service-account key (.json), passwords or API keys in
  any file under `tools/`, and never upload them anywhere.
- Upload **only** the files in `build/github/` to the GitHub repo — it is
  public. Never the project folder, plant sheets, CSVs or keys.
- The Gateways CSV is sensitive (WiFi passwords, SSH keys, Azure strings).
- The project folder lives in OneDrive, which backs it up and keeps
  previous versions.

### Troubleshooting

| Message / symptom | Cause → fix |
|---|---|
| Google says **"Access blocked"** | Email not on the Test users list → add it (see *Adding an engineer*). |
| **"Setup problem: a Google API is not switched on…"** | Enable the named API in the Google Cloud project. |
| **"You are not on the sharing list…"** | Share the sheet with that email as Editor (a link share is not enough). |
| **"You can't add photos to the folder…"** | Share the plant **folder** as Editor. Photos wait on the phone meanwhile. |
| **"This phone has no copy of … yet"** | Open that plant once with signal. |
| Form says it only works on the web page | You're in the downloaded file or the Claude link → use the GitHub link. |
| Old version still showing | Close and reopen the app with signal; Ctrl+F5 on a PC. |
| New Home-Screen icon not showing (iPhone) | Remove and re-add the app — first make sure *waiting to send* is empty. |
