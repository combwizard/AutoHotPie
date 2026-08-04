import { describe, expect, it } from "vitest";
const {
  buildAhkKey,
  eventToHotkeyData,
  findByAhkKey,
  hotkeyFromAhkString,
  keyCodeToVkToken,
  parseAhkModifiers,
  parseVkToken,
  shouldUseVkEncoding,
  stripAhkModifiers,
} = require("../../src/lib/hotkeys");

const table = [
  { keyCode: 6, displayKey: "Back", ahkKey: "XButton1" },
  { keyCode: 7, displayKey: "Forward", ahkKey: "Xbutton2" },
  { keyCode: 49, displayKey: "1", ahkKey: "1" },
  { keyCode: 50, displayKey: "2", ahkKey: "2" },
  { keyCode: 65, displayKey: "A", ahkKey: "a" },
  { keyCode: 67, displayKey: "C", ahkKey: "c" },
  { keyCode: 81, displayKey: "Q", ahkKey: "q" },
  { keyCode: 112, displayKey: "F1", ahkKey: "F1" },
  { keyCode: 220, displayKey: "\\", ahkKey: "\\" },
];

describe("hotkey helpers", () => {
  it("parses modifier prefixes in canonical order", () => {
    expect(parseAhkModifiers("^+c")).toEqual({
      isWin: false,
      isShift: true,
      isCtrl: true,
      isAlt: false,
      bareKey: "c",
      prefix: "^+",
    });
    expect(parseAhkModifiers("!F1").bareKey).toBe("F1");
    expect(stripAhkModifiers("#+^!xbutton1")).toBe("xbutton1");
  });

  it("builds AHK keys with Win/Shift/Ctrl/Alt order", () => {
    expect(
      buildAhkKey(
        { isWin: true, isShift: true, isCtrl: true, isAlt: true },
        "c"
      )
    ).toBe("#+^!c");
  });

  it("round-trips case-insensitive mouse button names", () => {
    const lower = hotkeyFromAhkString("xbutton1", table);
    expect(lower.keyCode).toBe(6);
    expect(lower.displayKeyNoMods).toBe("Back");
    expect(lower.ahkKey).toBe("xbutton1");

    const mixed = hotkeyFromAhkString("XButton2", table);
    expect(mixed.keyCode).toBe(7);
  });

  it("keeps QWERTY Send Key capture on letter names", () => {
    const data = eventToHotkeyData(
      {
        keyCode: 67,
        key: "c",
        code: "KeyC",
        metaKey: false,
        shiftKey: false,
        ctrlKey: true,
        altKey: false,
      },
      table,
      { captureMode: "sendKey" }
    );
    expect(data.ahkKey).toBe("^c");
    expect(data.displayKey).toBe("Ctrl+C");
    expect(shouldUseVkEncoding({ keyCode: 67, key: "c" }, table[5], "sendKey")).toBe(
      false
    );
  });

  it("encodes AZERTY glyph mismatches as virtual-key tokens for Send Key", () => {
    const uGrave = eventToHotkeyData(
      {
        keyCode: 220,
        key: "ù",
        code: "Backslash",
        metaKey: false,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
      },
      table,
      { captureMode: "sendKey" }
    );
    expect(uGrave.ahkKey).toBe("vkDC");
    expect(uGrave.displayKeyNoMods).toBe("ù");
    expect(keyCodeToVkToken(220)).toBe("vkDC");
    expect(parseVkToken("vkDC")).toBe(220);

    const ampersand = eventToHotkeyData(
      {
        keyCode: 49,
        key: "&",
        code: "Digit1",
        metaKey: false,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
      },
      table,
      { captureMode: "sendKey" }
    );
    expect(ampersand.ahkKey).toBe("vk31");
    expect(ampersand.displayKeyNoMods).toBe("&");
  });

  it("does not use vk encoding for pie-key capture mode", () => {
    const data = eventToHotkeyData(
      {
        keyCode: 220,
        key: "ù",
        code: "Backslash",
        metaKey: false,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
      },
      table,
      { captureMode: "default" }
    );
    expect(data.ahkKey).toBe("\\");
  });

  it("preserves F-keys and mouse buttons without vk rewriting", () => {
    const f1 = eventToHotkeyData(
      {
        keyCode: 112,
        key: "F1",
        code: "F1",
        metaKey: false,
        shiftKey: false,
        ctrlKey: false,
        altKey: true,
      },
      table,
      { captureMode: "sendKey" }
    );
    expect(f1.ahkKey).toBe("!F1");
    expect(f1.displayKey).toBe("Alt+F1");

    const back = eventToHotkeyData(
      {
        keyCode: 6,
        button: 3,
        code: "mousebutton",
        metaKey: false,
        shiftKey: false,
        ctrlKey: false,
        altKey: false,
      },
      table,
      { captureMode: "sendKey" }
    );
    expect(back.ahkKey).toBe("XButton1");
  });

  it("handles missing conversion entries without throwing", () => {
    expect(findByAhkKey(table, "not-a-key")).toBeNull();
    const missing = hotkeyFromAhkString("^missing", table);
    expect(missing.keyCode).toBeNull();
    expect(missing.ahkKey).toBe("^missing");
    expect(missing.displayKey).toBe("Ctrl+missing");
  });

  it("round-trips persisted vk Send Key strings", () => {
    const data = hotkeyFromAhkString("^+vk32", table);
    expect(data.keyCode).toBe(0x32);
    expect(data.isShift).toBe(true);
    expect(data.isCtrl).toBe(true);
    expect(data.ahkKey).toBe("^+vk32");
    expect(buildAhkKey(data, "vk32")).toBe("+^vk32");
  });
});
