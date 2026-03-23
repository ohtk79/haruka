// =============================================================================
// AHK TapHoldManager テンプレート — THM クラス定義のインライン埋め込み用
// =============================================================================
// Depends on: (none)
// Tested by: tests/unit/ahk-generator.test.ts
// Called from: services/ahk-generator.ts

// TapHoldManager v2.0 ヘッダコメント（ライセンス + 感謝文）
export const THM_HEADER_COMMENT: readonly string[] = [
	'; This script uses TapHoldManager v2.0 (MIT License)',
	'; by evilC (Clive Galway) - https://github.com/evilC/TapHoldManager',
	'; Thanks to evilC for creating TapHoldManager.'
];

// TapHoldManager v2.0 クラス定義（#Requires ストリップ済み）
// Original source: https://github.com/evilC/TapHoldManager/blob/master/AHK%20v2/Lib/TapHoldManager.ahk
// License: MIT — Copyright (c) evilC (Clive Galway)
export const THM_CLASS_SOURCE = `\
; --- TapHoldManager class (inline embed, MIT License) ---
class TapHoldManager {
\tBindings := Map()

\t__New(tapTime?, holdTime?, maxTaps := "", prefixes := "$", window := ""){
\t\tthis.tapTime := tapTime ?? 150
\t\tthis.holdTime := holdTime ?? this.tapTime
\t\tthis.maxTaps := maxTaps
\t\tthis.prefixes := prefixes
\t\tthis.window := window
\t}

\t; Add a key
\tAdd(keyName, callback, tapTime?, holdTime?, maxTaps?, prefixes?, window?){
\t\tif this.Bindings.Has(keyName)
\t\t\tthis.RemoveHotkey(keyName)
\t\tthis.Bindings[keyName] := TapHoldManager.KeyManager(this, keyName, callback, tapTime ?? this.tapTime, holdTime ?? this.holdTime, maxTaps?? this.maxTaps, prefixes?, window?)
\t}

\t; Remove a key
\tRemoveHotkey(keyName){
\t\tthis.Bindings.Delete(keyName).SetState(0)
\t}

\t; Pause a key
\tPauseHotkey(keyName){
\t\tthis.Bindings[keyName].SetState(0)
\t}

\t; Unpause a key
\tResumeHotkey(keyName){
\t\tthis.Bindings[keyName].SetState(1)
\t}

\tclass KeyManager {
\t\t; AutoHotInterception mod does not use prefixes or window, so these parameters must be optional
\t\t__New(manager, keyName, callback, tapTime, holdTime, maxTaps, prefixes?, window?){
\t\t\tthis.state := 0\t\t\t\t\t; Current state of the key
\t\t\tthis.sequence := 0\t\t\t\t; Number of taps so far
\t\t\t
\t\t\tthis.holdWatcherState := 0\t\t; Are we potentially in a hold state?
\t\t\tthis.tapWatcherState := 0\t\t; Has a tap release occurred and another could possibly happen?
\t\t\t
\t\t\tthis.holdActive := 0\t\t\t\t; A hold was activated and we are waiting for the release
\t
\t\t\tthis.manager := manager
\t\t\tthis.keyName := keyName
\t\t\tthis.callback := callback
\t\t\tthis.tapTime := tapTime
\t\t\tthis.holdTime := holdTime
\t\t\tthis.maxTaps := maxTaps
\t\t\tthis.prefixes := prefixes ?? manager.prefixes
\t\t\tthis.window := window ?? manager.window

\t\t\tthis.HoldWatcherFn := this.HoldWatcher.Bind(this)
\t\t\tthis.TapWatcherFn := this.TapWatcher.Bind(this)
\t\t\tthis.JoyReleaseFn := this.JoyButtonRelease.Bind(this)
\t\t\tthis.DeclareHotkeys()
\t\t}

\t\t; Internal use only - declares hotkeys
\t\tDeclareHotkeys(){
\t\t\tif (this.window)
\t\t\t\tHotIfWinactive this.window ; sets the hotkey window context if window option is passed-in

\t\t\tHotkey this.prefixes this.keyName, this.KeyEvent.Bind(this, 1), "On" ; On option is important in case hotkey previously defined and turned off.
\t\t\tif (this.keyName ~= "i)^\\d*Joy"){
\t\t\t\tHotkey this.keyName " up", (*) => SetTimer(this.JoyReleaseFn, 10), "On"
\t\t\t} else {
\t\t\t\tHotkey this.prefixes this.keyName " up", this.KeyEvent.Bind(this, 0), "On"
\t\t\t}

\t\t\tif (this.window)
\t\t\t\tHotIfWinactive ; restores hotkey window context to default
\t\t}

\t\t; Turns On/Off hotkeys (should be previously declared) // state is either "1: On" or "0: Off"
\t\tSetState(state){ 
\t\t\t; "state" under this method context refers to whether the hotkey will be turned on or off, while in other methods context "state" refers to the current activity on the hotkey (whether it's pressed or released (after a tap or hold))
\t\t\tif (this.window)
\t\t\t\tHotIfWinactive this.window

\t\t\tstate := (state ? "On" : "Off")
\t\t\tHotkey this.prefixes this.keyName, state
\t\t\tif (this.keyName ~= "i)^\\d*Joy"){
\t\t\t\tHotkey this.keyName " up", state
\t\t\t} else {
\t\t\t\tHotkey this.prefixes this.keyName " up", state
\t\t\t}

\t\t\tif (this.window)
\t\t\t\tHotIfWinactive
\t\t}

\t\t; For correcting a bug in AHK
\t\t; A joystick button hotkey such as "1Joy1 up::" will fire on button down, and not on release up
\t\t; So when the button is pressed, we start a timer which checks the actual state of the button using GetKeyState...
\t\t; ... and when it is actually released, we fire the up event
\t\tJoyButtonRelease(){
\t\t\tif (GetKeyState(this.keyName))
\t\t\t\treturn
\t\t\tSetTimer this.JoyReleaseFn, 0
\t\t\tthis.KeyEvent(0)
\t\t}

\t\t; Called when key events (down / up) occur
\t\tKeyEvent(state, *){
\t\t\tif (state == this.state)
\t\t\t\treturn\t; Suppress Repeats
\t\t\tthis.state := state
\t\t\tif (state){
\t\t\t\t; Key went down
\t\t\t\tthis.sequence++
\t\t\t\tthis.SetHoldWatcherState(1)
\t\t\t} else {
\t\t\t\t; Key went up
\t\t\t\tthis.SetHoldWatcherState(0)
\t\t\t\tif (this.holdActive){
\t\t\t\t\tthis.holdActive := 0
\t\t\t\t\tSetTimer this.FireCallback.Bind(this, this.sequence, 0), -1
\t\t\t\t\tthis.ResetSequence()
\t\t\t\t\treturn
\t\t\t\t} else {
\t\t\t\t\tif (this.maxTaps && this.Sequence == this.maxTaps){
\t\t\t\t\t\tSetTimer this.FireCallback.Bind(this, this.sequence, -1), -1
\t\t\t\t\t\tthis.ResetSequence()
\t\t\t\t\t} else {
\t\t\t\t\t\tthis.SetTapWatcherState(1)
\t\t\t\t\t}
\t\t\t\t}
\t\t\t}
\t\t}

\t\t; Resets everything once a sequence completes
\t\tResetSequence(){
\t\t\tthis.SetHoldWatcherState(0)
\t\t\tthis.SetTapWatcherState(0)
\t\t\tthis.sequence := 0
\t\t\tthis.holdActive := 0
\t\t}

\t\t; When a key is pressed, if it is not released within tapTime, then it is considered a hold
\t\tSetHoldWatcherState(state){
\t\t\tthis.holdWatcherState := state
\t\t\tSetTimer this.HoldWatcherFn, (state ? "-" this.holdTime : 0)
\t\t}
\t\t
\t\t; When a key is released, if it is re-pressed within tapTime, the sequence increments
\t\tSetTapWatcherState(state){
\t\t\tthis.tapWatcherState := state
\t\t\t; SetTimer this.TapWatcherFn, (state ? "-" this.tapTime : 0)
\t\t\tSetTimer this.TapWatcherFn, (state ? "-" this.tapTime : 0)
\t\t}
\t\t
\t\t; If this function fires, a key was held for longer than the tap timeout, so engage hold mode
\t\tHoldWatcher(){
\t\t\tif (this.sequence > 0 && this.state == 1){
\t\t\t\t; Got to end of tapTime after first press, and still held.
\t\t\t\t; HOLD PRESS
\t\t\t\tSetTimer this.FireCallback.Bind(this, this.sequence, 1), -1
\t\t\t\tthis.holdActive := 1
\t\t\t}
\t\t}

\t\t; If this function fires, a key was released and we got to the end of the tap timeout, but no press was seen
\t\tTapWatcher(){
\t\t\tif (this.sequence > 0 && this.state == 0){
\t\t\t\t; TAP
\t\t\t\tSetTimer this.FireCallback.Bind(this, this.sequence), -1
\t\t\t\tthis.ResetSequence()
\t\t\t}
\t\t}

\t\t; Fires the user-defined callback
\t\tFireCallback(seq, state := -1){
\t\t\tthis.Callback.Call(state != -1, seq, state)
\t\t}
\t}
}`;
