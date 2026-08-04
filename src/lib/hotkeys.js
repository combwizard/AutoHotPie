/**
 * Pure hotkey conversion helpers shared by the editor Hotkey class and Vitest.
 * Browser: globalThis.AHPHotkeys. Node: module.exports.
 */
(function (root, factory) {
  "use strict";
  var api = factory();
  if (typeof module === "object" && module.exports) {
    module.exports = api;
  }
  root.AHPHotkeys = api;
})(typeof globalThis !== "undefined" ? globalThis : this, function () {
  "use strict";

  var MOD_ORDER = [
    { flag: "isWin", symbol: "#", label: "Win+" },
    { flag: "isShift", symbol: "+", label: "Shift+" },
    { flag: "isCtrl", symbol: "^", label: "Ctrl+" },
    { flag: "isAlt", symbol: "!", label: "Alt+" },
  ];

  function emptyMods() {
    return { isWin: false, isShift: false, isCtrl: false, isAlt: false };
  }

  function stripAhkModifiers(ahkKey) {
    return String(ahkKey || "").replace(/[+#^!]/g, "");
  }

  function parseAhkModifiers(ahkKey) {
    var raw = String(ahkKey || "");
    var bareKey = stripAhkModifiers(raw);
    var head = raw.slice(0, Math.max(0, raw.length - bareKey.length));
    return {
      isWin: head.indexOf("#") !== -1,
      isShift: head.indexOf("+") !== -1,
      isCtrl: head.indexOf("^") !== -1,
      isAlt: head.indexOf("!") !== -1,
      bareKey: bareKey,
      prefix: head,
    };
  }

  function buildModifierPrefix(mods) {
    var prefix = "";
    for (var i = 0; i < MOD_ORDER.length; i++) {
      if (mods[MOD_ORDER[i].flag]) {
        prefix += MOD_ORDER[i].symbol;
      }
    }
    return prefix;
  }

  function buildDisplayModifiers(mods) {
    var label = "";
    for (var i = 0; i < MOD_ORDER.length; i++) {
      if (mods[MOD_ORDER[i].flag]) {
        label += MOD_ORDER[i].label;
      }
    }
    return label;
  }

  function buildAhkKey(mods, bareKey) {
    return buildModifierPrefix(mods || emptyMods()) + stripAhkModifiers(bareKey);
  }

  function keyCodeToVkToken(keyCode) {
    var hex = Number(keyCode).toString(16).toUpperCase();
    if (hex.length < 2) {
      hex = "0" + hex;
    }
    return "vk" + hex;
  }

  function parseVkToken(bareKey) {
    var match = /^vk([0-9A-Fa-f]{2,})$/i.exec(String(bareKey || ""));
    if (!match) {
      return null;
    }
    return parseInt(match[1], 16);
  }

  function findByKeyCode(table, keyCode) {
    if (!Array.isArray(table)) {
      return null;
    }
    for (var i = 0; i < table.length; i++) {
      if (table[i] && table[i].keyCode === keyCode) {
        return table[i];
      }
    }
    return null;
  }

  function findByAhkKey(table, ahkBareKey) {
    if (!Array.isArray(table)) {
      return null;
    }
    var needle = String(ahkBareKey || "").toLowerCase();
    for (var i = 0; i < table.length; i++) {
      var entry = table[i];
      if (entry && String(entry.ahkKey || "").toLowerCase() === needle) {
        return entry;
      }
    }
    return null;
  }

  function isPrintableEventKey(key) {
    return typeof key === "string" && key.length === 1;
  }

  function shouldUseVkEncoding(event, tableEntry, captureMode) {
    if (captureMode !== "sendKey") {
      return false;
    }
    if (!event || typeof event !== "object") {
      return false;
    }
    // Mouse / synthetic special-key menu entries have no layout-sensitive glyph.
    if (event.code === "mousebutton" || event.keyCode <= 7) {
      return false;
    }
    if (!isPrintableEventKey(event.key)) {
      return false;
    }
    if (!tableEntry || !tableEntry.ahkKey) {
      return true;
    }
    var expected = stripAhkModifiers(tableEntry.ahkKey).toLowerCase();
    return expected !== String(event.key).toLowerCase();
  }

  function resolveKeyCodeFromEvent(event) {
    if (!event) {
      return null;
    }
    if (event.code === "Enter") {
      return 1;
    }
    return event.keyCode;
  }

  function eventToHotkeyData(event, table, options) {
    options = options || {};
    var allowModifiers = options.allowModifiers !== false;
    var captureMode = options.captureMode || "default";
    var mods = emptyMods();
    if (allowModifiers && event) {
      mods.isWin = !!event.metaKey;
      mods.isShift = !!event.shiftKey;
      mods.isCtrl = !!event.ctrlKey;
      mods.isAlt = !!event.altKey;
    }

    var keyCode = resolveKeyCodeFromEvent(event);
    var tableEntry = findByKeyCode(table, keyCode);
    var useVk = shouldUseVkEncoding(event, tableEntry, captureMode);
    var bareAhkKey;
    var displayKeyNoMods;

    if (useVk) {
      bareAhkKey = keyCodeToVkToken(keyCode);
      displayKeyNoMods = String(event.key);
    } else if (tableEntry) {
      bareAhkKey = stripAhkModifiers(tableEntry.ahkKey);
      displayKeyNoMods = tableEntry.displayKey || bareAhkKey;
    } else if (keyCode != null) {
      bareAhkKey = keyCodeToVkToken(keyCode);
      displayKeyNoMods = isPrintableEventKey(event && event.key)
        ? String(event.key)
        : bareAhkKey;
    } else {
      return {
        isWin: mods.isWin,
        isShift: mods.isShift,
        isCtrl: mods.isCtrl,
        isAlt: mods.isAlt,
        keyCode: null,
        displayKeyNoMods: null,
        displayKey: null,
        ahkKey: null,
      };
    }

    return {
      isWin: mods.isWin,
      isShift: mods.isShift,
      isCtrl: mods.isCtrl,
      isAlt: mods.isAlt,
      keyCode: keyCode,
      displayKeyNoMods: displayKeyNoMods,
      displayKey: buildDisplayModifiers(mods) + displayKeyNoMods,
      ahkKey: buildAhkKey(mods, bareAhkKey),
    };
  }

  function hotkeyFromAhkString(ahkKey, table, options) {
    options = options || {};
    var allowModifiers = options.allowModifiers !== false;
    var parsed = parseAhkModifiers(ahkKey);
    var mods = allowModifiers
      ? {
          isWin: parsed.isWin,
          isShift: parsed.isShift,
          isCtrl: parsed.isCtrl,
          isAlt: parsed.isAlt,
        }
      : emptyMods();

    var vkCode = parseVkToken(parsed.bareKey);
    var tableEntry =
      vkCode != null
        ? findByKeyCode(table, vkCode)
        : findByAhkKey(table, parsed.bareKey);

    var keyCode =
      vkCode != null
        ? vkCode
        : tableEntry
          ? tableEntry.keyCode
          : null;

    var displayKeyNoMods;
    if (vkCode != null) {
      // Persistable strings only store vk tokens; surface a stable label.
      displayKeyNoMods =
        (tableEntry && tableEntry.displayKey) || String(parsed.bareKey).toUpperCase();
    } else if (tableEntry) {
      displayKeyNoMods = tableEntry.displayKey || parsed.bareKey;
    } else {
      displayKeyNoMods = parsed.bareKey || "";
    }

    var bareAhkKey =
      vkCode != null
        ? keyCodeToVkToken(vkCode)
        : tableEntry
          ? stripAhkModifiers(tableEntry.ahkKey)
          : parsed.bareKey;

    return {
      isWin: mods.isWin,
      isShift: mods.isShift,
      isCtrl: mods.isCtrl,
      isAlt: mods.isAlt,
      keyCode: keyCode,
      displayKeyNoMods: displayKeyNoMods,
      displayKey: buildDisplayModifiers(mods) + displayKeyNoMods,
      // Preserve the caller's encoding/case; only normalize when rebuilding via refresh.
      ahkKey: String(ahkKey || ""),
      bareKey: bareAhkKey || parsed.bareKey,
    };
  }

  function refreshFromParts(parts, table) {
    parts = parts || {};
    var mods = {
      isWin: !!parts.isWin,
      isShift: !!parts.isShift,
      isCtrl: !!parts.isCtrl,
      isAlt: !!parts.isAlt,
    };
    var keyCode = parts.keyCode;
    var existingBare = stripAhkModifiers(parts.ahkKey || parts.bareKey || "");
    var vkCode = parseVkToken(existingBare);
    var tableEntry = findByKeyCode(table, keyCode);
    var bareAhkKey;
    var displayKeyNoMods;

    if (vkCode != null) {
      bareAhkKey = keyCodeToVkToken(vkCode);
      displayKeyNoMods =
        parts.displayKeyNoMods ||
        (tableEntry && tableEntry.displayKey) ||
        bareAhkKey.toUpperCase();
    } else if (tableEntry) {
      bareAhkKey = stripAhkModifiers(tableEntry.ahkKey);
      displayKeyNoMods = tableEntry.displayKey || bareAhkKey;
    } else if (existingBare) {
      bareAhkKey = existingBare;
      displayKeyNoMods = parts.displayKeyNoMods || existingBare;
    } else {
      return {
        isWin: mods.isWin,
        isShift: mods.isShift,
        isCtrl: mods.isCtrl,
        isAlt: mods.isAlt,
        keyCode: keyCode,
        displayKeyNoMods: null,
        displayKey: null,
        ahkKey: null,
      };
    }

    return {
      isWin: mods.isWin,
      isShift: mods.isShift,
      isCtrl: mods.isCtrl,
      isAlt: mods.isAlt,
      keyCode: keyCode,
      displayKeyNoMods: displayKeyNoMods,
      displayKey: buildDisplayModifiers(mods) + displayKeyNoMods,
      ahkKey: buildAhkKey(mods, bareAhkKey),
    };
  }

  return {
    emptyMods: emptyMods,
    stripAhkModifiers: stripAhkModifiers,
    parseAhkModifiers: parseAhkModifiers,
    buildModifierPrefix: buildModifierPrefix,
    buildDisplayModifiers: buildDisplayModifiers,
    buildAhkKey: buildAhkKey,
    keyCodeToVkToken: keyCodeToVkToken,
    parseVkToken: parseVkToken,
    findByKeyCode: findByKeyCode,
    findByAhkKey: findByAhkKey,
    shouldUseVkEncoding: shouldUseVkEncoding,
    eventToHotkeyData: eventToHotkeyData,
    hotkeyFromAhkString: hotkeyFromAhkString,
    refreshFromParts: refreshFromParts,
  };
});
