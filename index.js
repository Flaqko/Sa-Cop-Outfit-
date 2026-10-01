/// <reference path="../.config/sa.d.ts" />

/*
    Cop Outfit Redux v1.0
    GTA San Andreas (Classic 1.0) + CLEO Redux

    Original mod: "Cop Outfit" v2.2
    Original author: Junior_Djjr / MixMods
    CLEO Redux port: Flaqko

    CLEO Redux JavaScript rewrite for GTA San Andreas Classic 1.0.
    The original IMPND / INTMAN script-memory patches are not used;
    Modes 2/3 use native wanted/police-ignore behavior.
*/

const INI_PATH = __dirname + "\\CopOutfitRedux.ini";
const POLICE_TORSO = "POLICETR";
const POLICE_TORSO_SLOT = 17; // Special costume slot used by the original mod.
const LOOP_MS = 90;

// Emergency/law-enforcement player skin models used by the original game's
// cop/medic/fireman ped-stat checks. This keeps skin-player support without CLEO+.
const UNIFORM_PED_MODEL_MIN = 274;
const UNIFORM_PED_MODEL_MAX = 288;

// Original police-station coordinates/radii from Junior_Djjr's v2.2 script.
const POLICE_STATIONS = [
    { name: "Los Santos", x: 1579.425, y: -1636.463, z: 14.5812, radius: 70.0, outerRadius: 75.0 },
    { name: "San Fierro", x: -1624.771, y: 679.6637, z: 8.5690, radius: 70.0, outerRadius: 75.0 },
    { name: "Las Venturas", x: 2284.592, y: 2466.838, z: 12.2306, radius: 100.0, outerRadius: 105.0 }
];

let enabled = 1;
let debug = 1;
let mode = 3;
let alwaysEnabled = 0;

function readIniInt(section, key, fallback) {
    try {
        if (typeof IniFile === "undefined") return fallback;
        const value = IniFile.ReadInt(INI_PATH, section, key);
        return (typeof value === "number") ? value : fallback;
    } catch (e) {
        return fallback;
    }
}

enabled = readIniInt("Module", "Enabled", enabled);
debug = readIniInt("Module", "Debug", debug);
mode = readIniInt("Settings", "Mode", mode);
alwaysEnabled = readIniInt("Settings", "AlwaysEnabled", alwaysEnabled);

if (mode < 1 || mode > 3) mode = 3;

function dlog(message) {
    if (debug !== 0) log("[CopOutfitRedux] " + message);
}

if (enabled === 0) {
    dlog("Disabled in INI.");
    exit();
}

function distance3D(a, b) {
    const dx = a.x - b.x;
    const dy = a.y - b.y;
    const dz = a.z - b.z;
    return Math.sqrt(dx * dx + dy * dy + dz * dz);
}

function getPlayerChar() {
    return native("GET_PLAYER_CHAR", 0);
}

function hasUniform(playerChar) {
    // Primary behavior from the original mod: CJ's police outfit.
    if (native("IS_PLAYER_WEARING", 0, POLICE_TORSO_SLOT, POLICE_TORSO)) {
        return true;
    }

    // Original also accepted cop / medic / fireman player models through CLEO+.
    // Redux rewrite uses the vanilla emergency/law ped model range instead.
    const model = native("GET_CHAR_MODEL", playerChar);
    return model >= UNIFORM_PED_MODEL_MIN && model <= UNIFORM_PED_MODEL_MAX;
}

function getNearbyStation(playerChar, useOuterRadius) {
    const pos = native("GET_CHAR_COORDINATES", playerChar);

    for (let i = 0; i < POLICE_STATIONS.length; i++) {
        const station = POLICE_STATIONS[i];
        const r = useOuterRadius ? station.outerRadius : station.radius;
        if (distance3D(pos, station) <= r) return station;
    }

    return null;
}

let policeIgnoreApplied = false;
let maxWantedOverrideApplied = false;
let savedMaxWanted = 6;
let stationContext = false;
let lastUniformState = false;
let lastStationName = "";

function setPoliceIgnore(state) {
    if (state && !policeIgnoreApplied) {
        native("SET_POLICE_IGNORE_PLAYER", 0, true);
        policeIgnoreApplied = true;
        dlog("Police ignore enabled.");
    } else if (!state && policeIgnoreApplied) {
        native("SET_POLICE_IGNORE_PLAYER", 0, false);
        policeIgnoreApplied = false;
        dlog("Police ignore disabled.");
    }
}

function beginMaxWantedOverride(targetLevel) {
    if (!maxWantedOverrideApplied) {
        savedMaxWanted = native("GET_MAX_WANTED_LEVEL");
        if (savedMaxWanted < 0 || savedMaxWanted > 6) savedMaxWanted = 6;
        maxWantedOverrideApplied = true;
        dlog("Saved max wanted level: " + savedMaxWanted);
    }

    native("SET_MAX_WANTED_LEVEL", targetLevel);
}

function endMaxWantedOverride() {
    if (!maxWantedOverrideApplied) return;

    native("SET_MAX_WANTED_LEVEL", savedMaxWanted);
    maxWantedOverrideApplied = false;
    dlog("Restored max wanted level: " + savedMaxWanted);
}

function updateMode1(playerChar, uniformActive) {
    // Mode 1 in the Classic mod depended on patching the running INTMAN script.
    // In Redux we safely emulate the intended result: while a uniformed player is
    // at a police station, the wanted cap is held at the level already present
    // when protection is active, preventing the station itself from adding stars.
    // The station context stays latched through the police-station interior.

    const areaVisible = native("GET_AREA_VISIBLE");
    const station = getNearbyStation(playerChar, stationContext);

    if (!uniformActive) {
        stationContext = false;
        lastStationName = "";
        endMaxWantedOverride();
        return;
    }

    if (areaVisible === 0) {
        if (station) {
            if (!stationContext) {
                stationContext = true;
                lastStationName = station.name;
                dlog("Police-station protection entered: " + station.name);
            }
        } else if (stationContext) {
            stationContext = false;
            dlog("Police-station protection left" + (lastStationName ? ": " + lastStationName : "."));
            lastStationName = "";
        }
    }

    if (stationContext) {
        const wantedNow = native("STORE_WANTED_LEVEL", 0);
        beginMaxWantedOverride(wantedNow);
    } else {
        endMaxWantedOverride();
    }
}

function updateMode2(uniformActive) {
    endMaxWantedOverride();
    stationContext = false;
    setPoliceIgnore(uniformActive);
}

function updateMode3(uniformActive) {
    stationContext = false;

    if (uniformActive) {
        setPoliceIgnore(true);
        beginMaxWantedOverride(0);

        // Immediately enforce the intended "no wanted level" state.
        if (native("STORE_WANTED_LEVEL", 0) > 0) {
            native("CLEAR_WANTED_LEVEL", 0);
        }
    } else {
        setPoliceIgnore(false);
        endMaxWantedOverride();
    }
}

dlog("v1.0 loaded. Mode=" + mode + " AlwaysEnabled=" + alwaysEnabled + " | police torso POLICETR only; hat NOT required.");
if (typeof IniFile === "undefined") {
    dlog("IniFiles plugin not detected; using built-in defaults (Mode 3, outfit required).");
}

while (true) {
    wait(LOOP_MS);

    if (!native("IS_PLAYER_PLAYING", 0)) {
        setPoliceIgnore(false);
        endMaxWantedOverride();
        stationContext = false;
        continue;
    }

    const playerChar = getPlayerChar();
    const uniformActive = (alwaysEnabled !== 0) || hasUniform(playerChar);

    if (uniformActive !== lastUniformState) {
        dlog(uniformActive ? "Cop/emergency outfit detected (POLICETR torso is enough; hat not required)." : "Cop/emergency outfit no longer active.");
        lastUniformState = uniformActive;
    }

    if (mode === 1) {
        setPoliceIgnore(false);
        updateMode1(playerChar, uniformActive);
    } else if (mode === 2) {
        updateMode2(uniformActive);
    } else {
        updateMode3(uniformActive);
    }
}
