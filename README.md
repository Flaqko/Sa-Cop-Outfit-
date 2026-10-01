# Cop Outfit Redux v1.0

A CLEO Redux port of **Cop Outfit v2.2** by **Junior_Djjr / MixMods** for **GTA San Andreas Classic 1.0**.

CLEO Redux port by **Flaqko**.

## Install

Copy the `CopOutfitRedux[fs]` folder into your game's `CLEO` folder:

```text
CLEO/
└─ CopOutfitRedux[fs]/
   ├─ index.js
   └─ CopOutfitRedux.ini
```

The `[fs]` suffix is required because the script reads its INI configuration.

## Default behavior

The release keeps the original mod's default behavior:

```ini
Mode=3
AlwaysEnabled=0
```

When CJ wears the police special-outfit torso (`POLICETR`, clothing slot 17), police ignore him and wanted stars are suppressed. **The police hat is not required.** Removing the outfit restores normal wanted behavior.

The script also recognizes the game's police/emergency-service player ped models for skin-player compatibility.

## Modes

- **Mode 1** — Prevents new wanted stars while the uniformed player is at a police station. This is a CLEO Redux-safe recreation of the original station-specific behavior without copying the original `IMPND` / `INTMAN` script-memory patches.
- **Mode 2** — Police ignore the uniformed player, but wanted stars may still exist.
- **Mode 3** — No wanted level while the uniform is active. This is the default.

## INI

```ini
[Module]
Enabled=1
Debug=0

[Settings]
Mode=3
AlwaysEnabled=0
```

Set `Debug=1` if troubleshooting is needed. The script writes `[CopOutfitRedux]` messages to `cleo_redux.log`.

## v1.0

- Confirmed working on GTA San Andreas Classic 1.0 + CLEO Redux.
- Police disguise activates from the `POLICETR` torso alone.
- Police hat is not required.
- Default Mode 3 suppresses wanted levels and makes police ignore CJ while disguised.
- Restores the previous maximum wanted level when the disguise is removed.
- Uses safe CLEO Redux logic instead of the original station-script memory patches.

## Credits

- Original mod: **Cop Outfit v2.2**
- Original author: **Junior_Djjr / MixMods**
- CLEO Redux port: **Flaqko**
