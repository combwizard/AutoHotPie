#Requires AutoHotKey v1.1.34.04+
#NoEnv
#SingleInstance force
SetBatchLines -1

#Include %A_ScriptDir%\..\..\src\lib\geometry.ahk
#Include %A_ScriptDir%\..\..\src\lib\hotkeys.ahk
#Include %A_ScriptDir%\..\..\src\lib\JSON.ahk
#Include %A_ScriptDir%\..\..\src\lib\diagnostics.ahk

global Failures := 0

AssertEqual(actual, expected, name)
{
	if (actual != expected)
	{
		Failures += 1
		FileAppend, FAIL %name%: expected %expected% got %actual%`n, *
	}
	else
	{
		FileAppend, PASS %name%`n, *
	}
}

; geometry parity with tests/fixtures/js-ahk-parity.json / shared/geometry.js
AssertEqual(Round(calcAngle(0, 0, 1, 0)), 0, "calcAngle east")
AssertEqual(Round(calcAngle(0, 0, 0, -1)), 270, "calcAngle north")
AssertEqual(Round(calcAngle(0, 0, -1, 0)), 180, "calcAngle west")
AssertEqual(cycleRange(370, 360), 10, "cycleRange 370")
AssertEqual(cycleRange(-10, 360), 350, "cycleRange -10")
AssertEqual(cycleRange(360, 360), 0, "cycleRange 360")

ext := extendAlongAngle([100, 100], 0, 10)
AssertEqual(ext[1], 100, "extendAlongAngle x")
AssertEqual(ext[2], 90, "extendAlongAngle y")

; settings fixture load
fixturePath := A_ScriptDir . "\..\fixtures\settings\minimal-default.json"
FileRead, fixtureText, %fixturePath%
settings := Json.Load(fixtureText)
AssertEqual(settings.schemaVersion, 1, "fixture schemaVersion")
AssertEqual(settings.appProfiles[1].name, "Default Profile", "fixture default profile")

customPath := A_ScriptDir . "\..\fixtures\settings\custom-function.json"
FileRead, customText, %customPath%
customSettings := Json.Load(customText)
AssertEqual(customSettings.global.functionConfig.custom[1].name, "Hello Box", "custom function preserved")

AHP_DiagInit(false, "")
AHP_Diag("should not throw when disabled", "test")
AssertEqual(AHP_DiagEnabled, 0, "diagnostics disabled by default after false init")

; hotkey chord parsing / Send Key sequence builders
altF1 := AHP_ParseChord("!F1")
AssertEqual(altF1.bare, "F1", "parse !F1 bare")
AssertEqual(altF1.alt, 1, "parse !F1 alt")
AssertEqual(altF1.ctrl, 0, "parse !F1 ctrl")

chord := AHP_ParseChord("^+c")
AssertEqual(chord.bare, "c", "parse ^+c bare")
AssertEqual(chord.shift, 1, "parse ^+c shift")
AssertEqual(chord.ctrl, 1, "parse ^+c ctrl")

mouseChord := AHP_ParseChord("xbutton1")
AssertEqual(mouseChord.bare, "xbutton1", "parse xbutton1 bare")
AssertEqual(mouseChord.alt, 0, "parse xbutton1 alt")

vkChord := AHP_ParseChord("^+vk32")
AssertEqual(vkChord.bare, "vk32", "parse vk bare")
AssertEqual(vkChord.shift, 1, "parse vk shift")
AssertEqual(vkChord.ctrl, 1, "parse vk ctrl")

AssertEqual(AHP_BuildImmediateSendKey("^c"), "^{c}", "immediate send ^c")
AssertEqual(AHP_BuildImmediateSendKey("!F1"), "!{F1}", "immediate send !F1")
AssertEqual(AHP_BuildImmediateSendKey("vkDC"), "{vkDC}", "immediate send vkDC")

delayedKeys := []
delayedKeys.Push("^+c")
delayedKeys.Push("!F1")
delayedSeq := AHP_BuildDelayedSendSequence(delayedKeys)
AssertEqual(delayedSeq[1], "{shift down}{ctrl down}{c down}", "delayed ^+c down")
AssertEqual(delayedSeq[2], "{c up}{shift up}{ctrl up}", "delayed ^+c up")
AssertEqual(delayedSeq[3], "{alt down}{F1 down}", "delayed !F1 down")
AssertEqual(delayedSeq[4], "{F1 up}{alt up}", "delayed !F1 up")

modFixturePath := A_ScriptDir . "\..\fixtures\settings\modifier-chord-pie-key.json"
FileRead, modFixtureText, %modFixturePath%
modSettings := Json.Load(modFixtureText)
AssertEqual(modSettings.appProfiles[1].pieKeys[1].hotkey, "!F1", "modifier fixture !F1")
AssertEqual(modSettings.appProfiles[1].pieKeys[2].hotkey, "^+c", "modifier fixture ^+c")

nqPath := A_ScriptDir . "\..\fixtures\settings\non-qwerty-sendkey.json"
FileRead, nqText, %nqPath%
nqSettings := Json.Load(nqText)
AssertEqual(nqSettings.appProfiles[1].pieKeys[1].pieMenus[1].functions[2].params.keys[1], "vkDC", "non-qwerty fixture vkDC")

if (Failures > 0)
{
	FileAppend, %Failures% AHK test(s) failed`n, *
	ExitApp, 1
}
FileAppend, All AHK tests passed`n, *
ExitApp, 0
