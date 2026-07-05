# Task Tracker

Task Tracker is a local macOS desktop app for tracking daily work in a structured Excel workbook named `DailyTracker.xlsx`.

The app is built with Electron, React, TypeScript, Vite, and ExcelJS. It runs as a desktop UI, while the Excel workbook remains the local source of truth.

## Features

- Weekly Monday-Sunday calendar navigation.
- Today is highlighted in the week view.
- Click a weekday to view that day's rows.
- Add, edit, and delete tracker rows from the app.
- Automatically saves changes into `DailyTracker.xlsx`.
- Auto-calculates `Total Time Spend` from `Check-In` and `Check-Out`.
- Supports open tasks with an empty `Check-Out`.
- Builds to a local macOS `.dmg` and `.zip`.

## Requirements

- macOS.
- Node.js and npm.
- No Rust, Python, database, or external server is required.

The current project was verified with:

```bash
node --version
npm --version
```

## Project Structure

```text
TaskTracker/
  build/                 App icon and build assets
  release/               Generated macOS build artifacts
  src/
    domain/              Shared task/date types and business rules
    main/                Electron main process and app security setup
    preload/             Secure Electron preload API
    renderer/            React UI
      components/        UI components
      hooks/             Renderer state and task loading logic
    storage/             Excel workbook read/write logic
  tests/                 Unit, storage, and renderer tests
```

## Install Dependencies

Run this once after cloning or after dependency changes:

```bash
npm install
```

## Run the Development App

Start Vite and Electron together:

```bash
npm run dev
```

This opens the desktop app in an Electron window. The local renderer server runs at:

```text
http://127.0.0.1:5173/
```

For development with Electron DevTools opening automatically:

```bash
npm run dev:debug
```

Stop the dev app with `Ctrl+C` in the terminal where it is running.

## Verify the Project

Run type checking:

```bash
npm run typecheck
```

Run tests:

```bash
npm run test
```

Run the complete production build check:

```bash
npm run build
```

Run dependency security audit:

```bash
npm audit --audit-level=moderate
```

Expected result:

```text
found 0 vulnerabilities
```

## Build the macOS App

Create local macOS install artifacts:

```bash
npm run dist:mac
```

This command runs the full build first, then packages the desktop app with electron-builder.

Generated files are written to `release/`, including:

```text
release/Task Tracker-0.1.0-arm64.dmg
release/Task Tracker-0.1.0-arm64-mac.zip
```

This build is configured for local installation without Apple signing or notarization.

## Install the App on macOS

1. Run:

   ```bash
   npm run dist:mac
   ```

2. Open:

   ```text
   release/Task Tracker-0.1.0-arm64.dmg
   ```

3. Drag `Task Tracker.app` into the `Applications` folder.

4. If an older version already exists in Applications, replace it.

5. Launch `Task Tracker` from Applications.

If macOS blocks the app because it is unsigned, open it from Finder with right click, then choose `Open`. This is expected for a local build without Apple notarization.

## Important Build Note

Always install from the latest `.dmg` after rebuilding.

Do not keep using an older app already copied to Applications. Rebuilding the project updates files in `release/`, but it does not automatically replace the app inside `/Applications`.

## Workbook Location

The app stores `DailyTracker.xlsx` in Electron's writable Application Support directory:

```text
~/Library/Application Support/task-tracker/DailyTracker.xlsx
```

The workbook is app-managed so it remains writable after the app is installed.

## Workbook Schema

The workbook contains one worksheet named:

```text
DailyTracker
```

Columns:

- `ID`
- `Date`
- `Check-In`
- `Check-Out`
- `Total Time Spend`
- `Task`
- `Still to Do`

The app expects this header row to remain unchanged. If the header row is manually changed in Excel, the app will show an error instead of silently overwriting workbook data.

## Time Tracking Rules

- `Date` uses local date format internally as `YYYY-MM-DD`.
- `Check-In` and `Check-Out` use 24-hour `HH:mm`.
- `Check-Out` can be empty for tasks still in progress.
- `Total Time Spend` is calculated only when both times are present.
- `Check-Out` must be later than `Check-In` for the same date.

## Common Commands

```bash
npm install        # install dependencies
npm run dev        # run local development app
npm run dev:debug  # run development app with DevTools
npm run typecheck  # TypeScript validation
npm run test       # run tests
npm run build      # full production build check
npm run dist:mac   # build macOS dmg/zip artifacts
```

## Troubleshooting

### Installed App Is Blank

Rebuild and reinstall from the latest DMG:

```bash
npm run dist:mac
```

Then open the new file in `release/` and replace the existing app in Applications.

### Dev App Works but Installed App Does Not

Make sure the installed app was copied from the latest generated DMG. The development app runs from Vite, while the installed app runs from packaged files inside Electron.

### Workbook Error About Unexpected Headers

The Excel header row was changed manually. Restore the original headers listed in this README, or move the workbook aside and let the app create a fresh one.

### Changes Do Not Show After Rebuild

Rebuilding creates new artifacts in `release/`. It does not update an already installed copy in `/Applications`. Replace the installed app with the newly built app from the DMG.

## Production Notes

- Electron renderer runs with sandboxing enabled.
- Node integration is disabled in the renderer.
- Renderer access to native functionality goes through the typed preload API.
- Excel writes are queued to avoid concurrent write races.
- The project is currently configured for local installation, not App Store distribution or Apple notarization.
