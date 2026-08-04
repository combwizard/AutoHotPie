#Requires AutoHotkey v2.0+

/**
 * Load AHPSettings.json for the v2 runtime.
 * Mirrors v1 loadSettingsFile() path rules without mutating globals yet.
 */

LoadAhpSettings(scriptDir := A_ScriptDir) {
    loop files scriptDir "\*.json", "F" {
        text := FileRead(A_LoopFileFullPath, "UTF-8")
        settings := Jxon_Load(text) ; replace with chosen v2 JSON lib during port
        return { settings: settings, userDataFolder: scriptDir, standAlone: true, path: A_LoopFileFullPath }
    }

    userDataFolder := A_AppData "\AutoHotPie"
    settingsPath := userDataFolder "\AHPSettings.json"
    if FileExist(settingsPath) {
        text := FileRead(settingsPath, "UTF-8")
        settings := Jxon_Load(text)
        return { settings: settings, userDataFolder: userDataFolder, standAlone: false, path: settingsPath }
    }

    throw Error("No valid AHPSettings.json found", -1, settingsPath)
}
