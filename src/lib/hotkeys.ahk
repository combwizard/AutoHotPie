; Pure AHK v1 hotkey helpers for chord parsing, release waiting, and Send Key sequences.
; Keep this file free of GUI/GDI dependencies so tests/ahk/run-tests.ahk can include it alone.

AHP_StripModifiers(hotkeyString, chars="+^!#")
{
	var := hotkeyString
	StringReplace, var, var, %A_Space%, _, All
	Loop, Parse, chars
		StringReplace, var, var, %A_LoopField%, , All
	return var
}

AHP_ParseChord(hotkeyString)
{
	bare := AHP_StripModifiers(hotkeyString)
	prefixLen := StrLen(hotkeyString) - StrLen(bare)
	if (prefixLen < 0)
		prefixLen := 0
	prefix := SubStr(hotkeyString, 1, prefixLen)
	return { bare: bare
		, prefix: prefix
		, win: InStr(prefix, "#") ? 1 : 0
		, shift: InStr(prefix, "+") ? 1 : 0
		, ctrl: InStr(prefix, "^") ? 1 : 0
		, alt: InStr(prefix, "!") ? 1 : 0 }
}

AHP_BuildImmediateSendKey(key)
{
	bareKey := AHP_StripModifiers(key)
	return StrReplace(key, bareKey, "{" . bareKey . "}")
}

AHP_BuildDelayedSendSequence(keys)
{
	newKeyArray := []
	for keyIndex, key in keys
	{
		bareKey := AHP_StripModifiers(key)
		startModifierString := ""
		endModifierString := ""
		If (InStr(key, "#"))
		{
			startModifierString := startModifierString . "{LWin down}"
			endModifierString := endModifierString . "{LWin up}"
		}
		If (InStr(key, "+"))
		{
			startModifierString := startModifierString . "{shift down}"
			endModifierString := endModifierString . "{shift up}"
		}
		If (InStr(key, "^"))
		{
			startModifierString := startModifierString . "{ctrl down}"
			endModifierString := endModifierString . "{ctrl up}"
		}
		If (InStr(key, "!"))
		{
			startModifierString := startModifierString . "{alt down}"
			endModifierString := endModifierString . "{alt up}"
		}
		newKeyArray.Push(startModifierString . "{" . bareKey . " down}")
		newKeyArray.Push("{" . bareKey . " up}" . endModifierString)
	}
	return newKeyArray
}

; Wait until the pie chord's bare key and its own modifiers are physically up.
; Does not synthesize {modifier up} — that would steal still-held user keys.
AHP_WaitForChordRelease(hotkeyString, timeoutMs := 5000)
{
	if (hotkeyString = "")
		return 1
	parsed := AHP_ParseChord(hotkeyString)
	startTick := A_TickCount
	Loop
	{
		stillHeld := 0
		if (parsed.bare != "" && GetKeyState(parsed.bare, "P"))
			stillHeld := 1
		if (parsed.win && (GetKeyState("LWin", "P") || GetKeyState("RWin", "P")))
			stillHeld := 1
		if (parsed.shift && (GetKeyState("LShift", "P") || GetKeyState("RShift", "P")))
			stillHeld := 1
		if (parsed.ctrl && (GetKeyState("LControl", "P") || GetKeyState("RControl", "P")))
			stillHeld := 1
		if (parsed.alt && (GetKeyState("LAlt", "P") || GetKeyState("RAlt", "P")))
			stillHeld := 1
		if (!stillHeld)
			return 1
		if ((A_TickCount - startTick) >= timeoutMs)
			return 0
		Sleep, 10
	}
}
