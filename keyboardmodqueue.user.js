// ==UserScript==
// @name         Keyboard Modqueue
// @namespace    http://tampermonkey.net/
// @version      2
// @description  Adds an entirely keyboard-based input to the moderation queue.
// @author       commentary request
// @match        *://127.0.0.1:3000/modqueue*
// @match        *://*.donmai.us/modqueue*
// @updateURL    https://github.com/CommentaryRequest/booruscripts/raw/refs/heads/main/keyboardmodqueue.user.js
// @downloadURL  https://github.com/CommentaryRequest/booruscripts/raw/refs/heads/main/keyboardmodqueue.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        GM_addStyle
// @run-at       document-idle
// ==/UserScript==

const DEBUG_MODE = false;
const BLACKLIST_TEXT_SELECTOR = 'span[x-text="blacklist.blacklistedPostCount"]';

/////////////////////////////////////////////////////////////
// Key Bindings
/////////////////////////////////////////////////////////////

const KEY_CURSOR_LEFT = "a";
const KEY_CURSOR_RIGHT = "d";
const KEY_APPROVE = "k";
const KEY_SKIP = "l";
const KEY_REJECT = "i";
const KEY_REJECT_PQ = "1";
const KEY_REJECT_BR = "2";
const KEY_REJECT_MESSAGE = "3";
const KEY_CHECK = ";";
const KEY_OPEN = "o";

/////////////////////////////////////////////////////////////
// CSS Styles
/////////////////////////////////////////////////////////////

const CSS = `
.kmq-preview-selected {
    border-color: magenta !important;
}

.mod-queue-preview {
    position: relative;
}

.kmq-preview-overlay {
    position: absolute;
    top: 0;
    right: 0;
    z-index: 10;
    background-color: rgba(30, 30, 30, 0.4);
    width: 100%;
    height: 100%;
    display: grid;
    place-items: center;
    text-shadow: 0 0 3px black;
}

.kmq-preview-overlay-content {
    padding: 1rem;
    text-align: center;
}
`;

/////////////////////////////////////////////////////////////
// Overlay Markup
/////////////////////////////////////////////////////////////

const APPROVE_OVERLAY_CONTENT = `
<h2>Approve post?</h2>
<p><b>${KEY_APPROVE.toUpperCase()}</b> Approve</p>
<p><b>${KEY_SKIP.toUpperCase()}</b> Cancel</p>
`;

const REJECT_OVERLAY_CONTENT = `
<h2>Reject post:</h2>
<p><b>${KEY_REJECT_PQ.toUpperCase()}</b> Poor Quality</p>
<p><b>${KEY_REJECT_BR.toUpperCase()}</b> Breaks Rules</p>
<p><b>${KEY_REJECT_MESSAGE.toUpperCase()}</b> Detailed Rejection</p>
<p><b>${KEY_SKIP.toUpperCase()}</b> Cancel</p>
`;

/////////////////////////////////////////////////////////////
// Global State
/////////////////////////////////////////////////////////////

let state = {
    cursorPos: 0,
    selectedPreview: null,
    isOverlayOpen: false,
    overlayCallback: null
};

/////////////////////////////////////////////////////////////
// Utility Functions
/////////////////////////////////////////////////////////////

const getAllPreviews = () => [...document.querySelectorAll(".mod-queue-preview")];
const getVisiblePreviews = () =>
    getAllPreviews()
        .filter(p =>
            !p.classList.contains("blacklisted-hidden") &&
            p.checkVisibility()
        );
const anyVisiblePreviews = () => getVisiblePreviews().length != 0;

const clamp = (value, min, max) => Math.min(Math.max(value, min), max);

function logDebug(...args) {
    if (!DEBUG_MODE) return;
    console.log("[dbg] ", ...args);
}

const getSelectedButtons = () => state.selectedPreview.querySelector(".flex-wrap.gap-1");
const getSelectedLink = () => state.selectedPreview.querySelector(".post-preview-link").href;
const getRejectMenu = () => document.querySelector(".tippy-box .popup-menu-content");

const getButtonByName = name => [...getSelectedButtons().children].filter(e => e.textContent.trim() == name)[0];
const getApproveButton = () => getButtonByName("Approve");
const getSkipButton = () => getButtonByName("Skip");
const getRejectButton = () => [...getSelectedButtons().children].find(el => el.querySelector("a")?.textContent.trim() == "Reject").children[0];
const getCheckButton = () => getButtonByName("Check");

function hidePreview()
{
    state.selectedPreview.style.display = "none";
}

/////////////////////////////////////////////////////////////
// Blacklist Toggle Handling
/////////////////////////////////////////////////////////////

function handleBlacklistToggle()
{
    logDebug("Blacklist was toggled");

    fixCursorPos();
    updateCursor();
}

/////////////////////////////////////////////////////////////
// Preview Overlay
/////////////////////////////////////////////////////////////

function openOverlay(htmlContent, callback)
{
    state.isOverlayOpen = true;
    state.overlayCallback = callback;

    const overlay = document.createElement("div");
    overlay.classList.add("kmq-preview-overlay");

    const content = document.createElement("div");
    content.classList.add("kmq-preview-overlay-content");
    content.innerHTML = htmlContent;
    overlay.appendChild(content);

    state.selectedPreview.appendChild(overlay);
    return overlay;
}

function destroyOverlay()
{
    state.selectedPreview.querySelector(".kmq-preview-overlay")?.remove();
    state.isOverlayOpen = false;
    state.overlayCallback = null;
}

/////////////////////////////////////////////////////////////
// Actions
/////////////////////////////////////////////////////////////

function skipSelected()
{
    const skipButton = getSkipButton();
    skipButton.click();
    hidePreview();
    fixCursorPos();
    updateCursor();
}

function confirmApprove()
{
    openOverlay(APPROVE_OVERLAY_CONTENT, handleKeyApprove);
}

function approveSelected()
{
    const approveButton = getApproveButton();
    approveButton.click();
    hidePreview();
    fixCursorPos();
    updateCursor();
}

function checkSelected()
{
    const checkButton = getCheckButton();
    if (checkButton) checkButton.click();
}

function openSelected()
{
    window.open(getSelectedLink(), "_blank")?.focus();
}

function confirmReject()
{
    openOverlay(REJECT_OVERLAY_CONTENT, handleKeyReject);
}

function openRejectMenu()
{
    if (getRejectMenu()) return;
    getRejectButton().click();
}

function rejectSelected(i)
{
    openRejectMenu();
    getRejectMenu().children[i].children[0].click();
    hidePreview();
    fixCursorPos();
    updateCursor();
}

function rejectPoorQuality()
{
    rejectSelected(0);
}

function rejectBreaksRules()
{
    rejectSelected(1);
}

function rejectMessage()
{
    rejectSelected(2);
}

/////////////////////////////////////////////////////////////
// Cursor Handling
/////////////////////////////////////////////////////////////

function fixCursorPos()
{
    const previews = getVisiblePreviews();
    const pos = previews.indexOf(state.selectedPreview);

    if (pos != -1) {
        state.cursorPos = pos;
    }
    logDebug("new cursor pos=", state.cursorPos);
}

function updateCursor()
{
    const previews = getVisiblePreviews();
    const allPreviews = getAllPreviews();

    allPreviews.forEach(p => {
        p.classList.toggle("kmq-preview-selected", false);
    });

    state.cursorPos = clamp(state.cursorPos, 0, previews.length - 1);
    state.selectedPreview = previews[state.cursorPos];

    state.selectedPreview?.classList.toggle("kmq-preview-selected", true);

    previews[state.cursorPos]?.scrollIntoView({
        block: "nearest",
        behavior: "instant"
    });

    logDebug(
        "Updated cursor, new pos=",
        state.cursorPos,
        "preview=",
        state.selectedPreview
    );
}

function moveCursor(delta)
{
    state.cursorPos += delta;
    updateCursor();
}

/////////////////////////////////////////////////////////////
// Keyboard Handling
/////////////////////////////////////////////////////////////

function handleKeyApprove(key)
{
    switch (key) {
        case KEY_APPROVE:
            approveSelected();
            destroyOverlay();
            break;
        case KEY_SKIP:
            destroyOverlay();
            break;
    }
}

function handleKeyReject(key)
{
    switch (key) {
        case KEY_REJECT_PQ:
            rejectPoorQuality();
            destroyOverlay();
            break;
        case KEY_REJECT_BR:
            rejectBreaksRules();
            destroyOverlay();
            break;
        case KEY_REJECT_MESSAGE:
            rejectMessage();
            destroyOverlay();
            break;
        case KEY_SKIP:
            destroyOverlay();
            break;
    }
}

function handleKeyAction(key)
{
    switch (key) {
        case KEY_CURSOR_LEFT:
            moveCursor(-1);
            break;
        case KEY_CURSOR_RIGHT:
            moveCursor(1);
            break;
        case KEY_SKIP:
            skipSelected();
            break;
        case KEY_APPROVE:
            confirmApprove();
            break;
        case KEY_REJECT:
            confirmReject();
            break;
        case KEY_CHECK:
            checkSelected();
            break;
        case KEY_OPEN:
            openSelected();
            break;
    }
}

function handleKey(event)
{
    if (!anyVisiblePreviews()) return; // Prevent accidental actions on blacklisted/hidden posts
    if (state.isOverlayOpen && state.overlayCallback) state.overlayCallback(event.key);
    else handleKeyAction(event.key);
}

/////////////////////////////////////////////////////////////
// Initialization
/////////////////////////////////////////////////////////////

function unbindShortcuts()
{
    // Unbind pagination shortcuts. They interfere with A/D keys.
    document.querySelector(".paginator-prev").removeAttribute("data-shortcut");
    document.querySelector(".paginator-next").removeAttribute("data-shortcut");
}

function initKeyboard()
{
    document.addEventListener("keydown", event => {
        const tag = event.target?.tagName?.toLowerCase();
        if (tag == "textarea" || tag == "input") return;
        if (event.repeat || event.ctrlKey || event.altKey || event.metaKey) return;

        handleKey(event);
    });
}

function initBlacklistEvent()
{
    const element = document.querySelector(BLACKLIST_TEXT_SELECTOR);
    const observer = new MutationObserver(handleBlacklistToggle);
    observer.observe(element, {childList: true});
}

/////////////////////////////////////////////////////////////
// Main
/////////////////////////////////////////////////////////////

(function()
{
    'use strict';
    GM_addStyle(CSS);
    unbindShortcuts();
    initKeyboard();
    initBlacklistEvent();
    updateCursor();
})();
