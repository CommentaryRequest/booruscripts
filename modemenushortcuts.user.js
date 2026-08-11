// ==UserScript==
// @name         Mode Menu Shortcuts
// @namespace    a
// @version      1.0
// @description  Shortcuts for the danbooru mode menu
// @author       Commentary Request
// @match        *://*.donmai.us/posts*
// @match        *://*.donmai.us
// @match        *://yukkuri.shiteitte.net/posts*
// @match        *://yukkuri.shiteitte.net
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        GM.setValue
// @grant        GM.getValue
// @grant        GM_addStyle
// ==/UserScript==

const css = `
#modeMenuShortcutsConfigDialog {
  position: absolute;
  background-color: black;
  width: 30%;
  height: 30%;
  border-radius: 5px;
  border: 1px solid white;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  padding: 1em;
}

#modeMenuShortcutsConfigDialogButtonContainer {
  position: absolute;
  left: 1em;
  bottom: 1em;
}

.modeMenuShortcutsConfigDialogButton {
  margin-right: 0.5em;
  font-weight: bold;
}

#modeMenuShortcutsShowConfigButton {
  margin-top: 0.38em;
}
`;

const defaultShortcutView = "z";
const defaultShortcutEdit = "x";
const defaultShortcutTagScript = "c";
const defaultShortcutFavorite = "v";
const defaultShortcutUnfavorite = "b";

const formElements = ["INPUT", "TEXTAREA", "SELECT", "OPTION"];

let shortcutView = "";
let shortcutEdit = "";
let shortcutTagScript = "";
let shortcutFavorite = "";
let shortcutUnfavorite = "";

let modeMenu = null;
let tagScriptField = null;

let configDialog = null;
let configDialogView = null;
let configDialogEdit = null;
let configDialogTagScript = null;
let configDialogFavorite = null;
let configDialogUnfavorite = null;
let configDialogButtonContainer = null;
let configDialogSaveButton = null;
let configDialogResetButton = null;

function setMenuState(state) {
    if (!modeMenu) {
        return;
    }

    modeMenu.value = state;
    modeMenu.dispatchEvent(new Event("change"));
}

function doShortcut(e) {
    if (!modeMenu) {
        return;
    }

    const key = e.key;
    let setTagScript = true;
    if (!formElements.includes(e.target.tagName)) {
        switch (key) {
            case shortcutView:
                setMenuState("view");
                break;
            case shortcutEdit:
                setMenuState("edit");
                break;
            case shortcutTagScript:
                setMenuState("tag-script");
                break;
            case shortcutFavorite:
                setMenuState("add-fav");
                break;
            case shortcutUnfavorite:
                setMenuState("remove-fav");
                break;
            default:
                setTagScript = false;
                break;
        }
    } else {
        setTagScript = false;
    }

    if (setTagScript) {
        const tagScriptText = tagScriptField.value;
        console.log(tagScriptText);
        setTimeout(() => {
            tagScriptField.value = tagScriptText;
        }, 3);
    }
}

async function loadShortcuts() {
    shortcutView = (await GM.getValue("shortcutView", defaultShortcutView));
    shortcutEdit = (await GM.getValue("shortcutEdit", defaultShortcutEdit));
    shortcutTagScript = (await GM.getValue("shortcutTagScript", defaultShortcutTagScript));
    shortcutFavorite = (await GM.getValue("shortcutFavorite", defaultShortcutFavorite));
    shortcutUnfavorite = (await GM.getValue("shortcutUnfavorite", defaultShortcutUnfavorite));
    console.log(`Loaded shortcuts: view=${shortcutView}, edit=${shortcutEdit}, tagscript=${shortcutTagScript}, favorite=${shortcutFavorite}, unfavorite=${shortcutUnfavorite}`);
}

function getElements() {
    modeMenu = document.querySelector("#mode-box form select");
    tagScriptField = document.querySelector("#tag-script-field");
}

function createText(text) {
    const span = document.createElement("span");
    span.innerText = text;
    return span;
}

async function saveShortcuts() {
    await GM.setValue("shortcutView", shortcutView);
    await GM.setValue("shortcutEdit", shortcutEdit);
    await GM.setValue("shortcutTagScript", shortcutTagScript);
    await GM.setValue("shortcutFavorite", shortcutFavorite);
    await GM.setValue("shortcutUnfavorite", shortcutUnfavorite);
    configDialog.style.display = "none";
}

function updateConfigDialog() {
    configDialogView.innerText = shortcutView;
    configDialogEdit.innerText = shortcutEdit;
    configDialogTagScript.innerText = shortcutTagScript;
    configDialogFavorite.innerText = shortcutFavorite;
    configDialogUnfavorite.innerText = shortcutUnfavorite;
}

function resetShortcuts() {
    shortcutView = defaultShortcutView;
    shortcutEdit = defaultShortcutEdit;
    shortcutTagScript = defaultShortcutTagScript;
    shortcutFavorite = defaultShortcutFavorite;
    shortcutUnfavorite = defaultShortcutUnfavorite;
    updateConfigDialog();
}

function shortcutPrompt(keyName) {
    const key = prompt(`Enter what key should be used for ${keyName} option:`);
    return key;
}

function createConfigDialog() {
    configDialog = document.createElement("div");

    const heading = document.createElement("h2");
    heading.innerText = "Mode Menu Shortcuts Config";
    configDialog.appendChild(heading);

    configDialog.appendChild(createText("View: "));
    configDialogView = document.createElement("button");
    configDialogView.onclick = function() {
        shortcutView = shortcutPrompt("view");
        updateConfigDialog();
    }
    configDialog.appendChild(configDialogView);

    configDialog.appendChild(document.createElement("p"));
    configDialog.appendChild(createText("Edit: "));
    configDialogEdit = document.createElement("button");
    configDialogEdit.onclick = function() {
        shortcutEdit = shortcutPrompt("edit");
        updateConfigDialog();
    };
    configDialog.appendChild(configDialogEdit);

    configDialog.appendChild(document.createElement("p"));
    configDialog.appendChild(createText("Tag script: "));
    configDialogTagScript = document.createElement("button");
    configDialogTagScript.onclick = function() {
        shortcutTagScript = shortcutPrompt("tag script");
        updateConfigDialog();
    }
    configDialog.appendChild(configDialogTagScript);

    configDialog.appendChild(document.createElement("p"));
    configDialog.appendChild(createText("Favorite: "));
    configDialogFavorite = document.createElement("button");
    configDialogFavorite.onclick = function() {
        shortcutFavorite = shortcutPrompt("favorite");
        updateConfigDialog();
    }
    configDialog.appendChild(configDialogFavorite);

    configDialog.appendChild(document.createElement("p"));
    configDialog.appendChild(createText("Unfavorite: "));
    configDialogUnfavorite = document.createElement("button");
    configDialogUnfavorite.onclick = function() {
        shortcutUnfavorite = shortcutPrompt("unfavorite");
        updateConfigDialog();
    }
    configDialog.appendChild(configDialogUnfavorite);

    updateConfigDialog();

    configDialogButtonContainer = document.createElement("div");
    configDialogButtonContainer.id = "modeMenuShortcutsConfigDialogButtonContainer";
    configDialog.appendChild(configDialogButtonContainer);

    configDialogSaveButton = document.createElement("button");
    configDialogSaveButton.innerText = "Save";
    configDialogSaveButton.classList.add("modeMenuShortcutsConfigDialogButton");
    configDialogSaveButton.onclick = saveShortcuts;
    configDialogButtonContainer.appendChild(configDialogSaveButton);

    configDialogResetButton = document.createElement("button");
    configDialogResetButton.innerText = "Reset";
    configDialogResetButton.classList.add("modeMenuShortcutsConfigDialogButton");
    configDialogResetButton.onclick = resetShortcuts;
    configDialogButtonContainer.appendChild(configDialogResetButton);

    configDialog.id = "modeMenuShortcutsConfigDialog";
    configDialog.style.display = "none";
    document.body.appendChild(configDialog);
}

function showConfigDialog() {
    configDialog.style.display = "block";
}

function createConfigShowButton() {
    const modeBox = document.querySelector("#mode-box");
    const configShowButton = document.createElement("button");
    configShowButton.innerText = "Shortcuts";
    configShowButton.id = "modeMenuShortcutsShowConfigButton";
    configShowButton.onclick = showConfigDialog;
    modeBox.appendChild(configShowButton);
}

(async function() {
    'use strict';

    // Return if the user does not have the mode menu.
    // This is the case when logged out and for Member level users.
    if (!document.querySelector("#mode-box")) {
        return;
    }

    GM_addStyle(css);

    await loadShortcuts();
    getElements();
    createConfigDialog();
    createConfigShowButton();

    document.addEventListener("keydown", doShortcut);
})();
