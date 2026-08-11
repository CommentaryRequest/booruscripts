// ==UserScript==
// @name         Danbooru Uploads Dupe Checker
// @namespace    https://example.com
// @version      3
// @description  Checks duplicates on the uploads page on danbooru
// @author       Commentary Request
// @match        *://*.donmai.us/users/*/uploads*
// @match        *://*.donmai.us/uploads/*/assets
// @match        *://yukkuri.shiteitte.net/users/*/uploads*
// @match        *://yukkuri.shiteitte.net/uploads/*/assets
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        GM_addStyle
// @grant        GM_getValue
// @grant        GM_setValue
// ==/UserScript==

//
// Stylesheet
//

const CSS = `
.dupechecker-icon {
  position: absolute;
  bottom: 2.1em;
  right: .6em;
  padding: .2em;
  border-radius: 2px;
}

.dupechecker-good {
  color: white;
  background-color: green;
}

.dupechecker-ppd {
  color: white;
  background-color: red;
}

.dupechecker-dupe {
  color: black;
  background-color: yellow;
}

.dupechecker-high {
  color: black;
  background-color: orange;
}

.dupechecker-error {
  color: white;
  background-color: blue;
}

.dupechecker-unknown {
  color: white;
  background-color: black;
}

.dupechecker-loading {
  color: black;
  background-color: lightgray;
}

#dupechecker-settings {
  color: var(--muted-text-color);
  font-size: var(--text-sm);
}

#dupechecker-settings input {
  width: 6em;
}
`;

//
// Settings UI layout
//

const SETTINGS_UI_HTML = `
Dupe Checker settings | Duplicate: <input id="dupechecker-duplicate-threshold" type="number"> High Similarity: <input id="dupechecker-high-similarity-threshold" type="number"> % similarity <button id="dupechecker-reset">Reset</button>
`;

//
// Result Type Enum
//

const ResultType = {
    OK: 1,
    PixelPerfectDuplicate: 2,
    Duplicate: 3,
    HighSimilarity: 4,
    NetworkError: 5
};

//
// Result -> Value Conversion Functions
//

function iconClassByResult(result) {
    switch (result) {
        case ResultType.OK:
            return "dupechecker-good";
        case ResultType.PixelPerfectDuplicate:
            return "dupechecker-ppd";
        case ResultType.Duplicate:
            return "dupechecker-dupe";
        case ResultType.HighSimilarity:
            return "dupechecker-high";
        case ResultType.NetworkError:
            return "dupechecker-error";
        default:
            return "dupechecker-unknown";
    }
}

function tooltipByResult(result) {
    switch (result) {
        case ResultType.OK:
            return "Good to post";
        case ResultType.PixelPerfectDuplicate:
            return "Pixel-Perfect Duplicate";
        case ResultType.Duplicate:
            return "Duplicate";
        case ResultType.HighSimilarity:
            return "High similarity";
        case ResultType.NetworkError:
            return "Network error. Please refresh the page";
        default:
            return "This should not happen";
    }
}

function letterByResult(result) {
    switch (result) {
        case ResultType.OK:
            return "G";
        case ResultType.PixelPerfectDuplicate:
            return "P";
        case ResultType.Duplicate:
            return "D";
        case ResultType.HighSimilarity:
            return "H";
        case ResultType.NetworkError:
            return "N";
        default:
            return "?";
    }
}

//
// Utility Functions
//

function isAssetsPage() {
    return window.location.href.endsWith("/assets");
}

function isMultiImageUpload(map) {
    return map.querySelector(".media-asset-image-count-icon") != undefined;
}

function isAlreadyPosted(map) {
    return map.getAttribute("data-is-posted") === "true";
}

//
// Default similarity threshold values
// See also: https://github.com/danbooru/danbooru/blob/master/app/logical/iqdb_client.rb
//

const HIGH_SIMILARITY_THRESHOLD = 65.0;
const DUPLICATE_THRESHOLD = 92.0;

//
// Settings functions
//

function normalizeThreshold(value) {
    value = Math.min(value, 100);
    value = Math.max(value, 1);
    return value;
}

function getHighSimilarityThreshold() {
    return GM_getValue("highSimilarity", HIGH_SIMILARITY_THRESHOLD);
}

function setHighSimilarityThreshold(value) {
    value = normalizeThreshold(value);
    GM_setValue("highSimilarity", value);
}

function getDuplicateThreshold() {
    return GM_getValue("duplicate", DUPLICATE_THRESHOLD);
}

function setDuplicateThreshold(value) {
    value = normalizeThreshold(value);
    GM_setValue("duplicate", value);
}

function resetSettings() {
    setHighSimilarityThreshold(HIGH_SIMILARITY_THRESHOLD);
    setDuplicateThreshold(DUPLICATE_THRESHOLD);
}

//
// Concurrency
//

const MAX_CONCURRENT = 5;
let activeChecks = 0;
const queue = [];

function enqueue(task) {
    queue.push(task);
    runNext();
}

function runNext() {
    if (activeChecks >= MAX_CONCURRENT) {
        return;
    }

    const task = queue.shift();
    if (!task) {
        return;
    }

    activeChecks++;
    task().finally(() => {
        activeChecks--;
        runNext();
    });
}

//
// Main Functions
//

function addIcon(map, resultType) {
    const icon = document.createElement("div");
    const iconText = letterByResult(resultType);
    const iconClass = iconClassByResult(resultType);
    const iconTooltip = tooltipByResult(resultType);

    icon.textContent = iconText;
    icon.title = iconTooltip;
    icon.classList.add(iconClass);
    icon.classList.add("dupechecker-icon");
    map.appendChild(icon);
}

function addLoadingIcon(map) {
    const icon = document.createElement("div");

    icon.textContent = "...";
    icon.title = "Checking for duplicates...";
    icon.classList.add("dupechecker-loading");
    icon.classList.add("dupechecker-icon");
    map.appendChild(icon);
}

function parseIQDBResponse(response, pixelHash) {
    for (const match of response) {
        const score = match.score || 0;
        if (match.post?.media_asset?.pixel_hash == pixelHash) {
            return ResultType.PixelPerfectDuplicate;
        } else if (score >= getDuplicateThreshold()) {
            return ResultType.Duplicate;
        } else if (score >= getHighSimilarityThreshold()) {
            return ResultType.HighSimilarity;
        }
    }
    return ResultType.OK;
}

async function runDupeCheck(map) {
    const uploadId = Number.parseInt(map.getAttribute("data-id"));
    const assetInfo = await getAssetInfo(uploadId);
    if (assetInfo == null) { // failed to fetch the info
        addIcon(map, ResultType.NetworkError);
        return;
    }

    const result = await queryIQDB(assetInfo.id, assetInfo.pixelHash);
    addIcon(map, result);
    map.querySelector(".dupechecker-loading")?.remove();
}

//
// Network Functions
//

async function queryIQDB(assetId, pixelHash) {
    const url = `${window.location.origin}/iqdb_queries.json?search[media_asset_id]=${assetId}`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`dupe checker: url='${url}' iqdb query http ${response.status}`);
            return ResultType.NetworkError;
        }
        const data = await response.json();
        return parseIQDBResponse(data, pixelHash);
    } catch (err) {
        console.error(`dupe checker: url='${url}' iqdb query network error ${err}`);
        return ResultType.NetworkError;
    }
}

async function getPixelHash(assetId) {
    const url = `${window.location.origin}/media_assets/${assetId}.json`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`dupe checker: url='${url}' asset pixel hash lookup http ${response.status}`);
            return null;
        }
        const data = await response.json();
        return data.pixel_hash;
    } catch (err) {
        console.error(`dupe checker: url='${url}' asset pixel hash lookup network error ${err}`);
        return null;
    };
}

async function getAssetInfo(uploadId) {
    const url = isAssetsPage() ? `${window.location.origin}/upload_media_assets/${uploadId}.json` : `${window.location.origin}/uploads/${uploadId}.json`;
    try {
        const response = await fetch(url);
        if (!response.ok) {
            console.error(`dupe checker: url='${url}' upload lookup http ${response.status}`);
            return null;
        }
        const data = await response.json();
        if (isAssetsPage()) {
            const id = data.media_asset_id;
            const pixelHash = await getPixelHash(id);
            if (pixelHash == null) {
                return null;
            }
            return {
                id: id,
                pixelHash: pixelHash
            };
        } else {
            const mediaAsset = data.upload_media_assets[0].media_asset;
            return {
                id: mediaAsset.id,
                pixelHash: mediaAsset.pixel_hash
            };
        }
    } catch (err) {
        console.error(`dupe checker: url='${url}' upload lookup network error ${err}`);
        return null;
    }
}

//
// Settings UI
//

function getResetButton() {
    return document.querySelector("#dupechecker-reset");
}

function getDuplicateInput() {
    return document.querySelector("#dupechecker-duplicate-threshold");
}

function getHighSimilarityInput() {
    return document.querySelector("#dupechecker-high-similarity-threshold");
}

function updateInputValues() {
    getDuplicateInput().value = getDuplicateThreshold();
    getHighSimilarityInput().value = getHighSimilarityThreshold();
}

function resetButtonHandler() {
    resetSettings();
    updateInputValues();
    Danbooru.notice("Dupe Checker settings reset");
}

function duplicateInputHandler(event) {
    setDuplicateThreshold(event.currentTarget.value);
}

function highSimilarityInputHandler(event) {
    setHighSimilarityThreshold(event.currentTarget.value);
}

function buildSettingsUI() {
    const tabPanelComponent = document.querySelector(".tab-panel-component");
    const paddingElement = tabPanelComponent.querySelector("span.flex-1");

    const settingsDiv = document.createElement("div");
    settingsDiv.innerHTML = SETTINGS_UI_HTML;
    settingsDiv.id = "dupechecker-settings";
    paddingElement.after(settingsDiv);

    updateInputValues();

    // set up event handlers
    getResetButton().addEventListener("click", resetButtonHandler);
    getDuplicateInput().addEventListener("change", duplicateInputHandler);
    getHighSimilarityInput().addEventListener("change", highSimilarityInputHandler);
}

(function() {
    'use strict';

    GM_addStyle(CSS);
    buildSettingsUI();

    // short for Media Asset Preview
    const maps = document.querySelectorAll(".media-asset-preview");

    const observer = new IntersectionObserver(entries => {
        for (const entry of entries) {
            if (entry.isIntersecting) {
                const map = entry.target;
                observer.unobserve(map);

                enqueue(async () => {
                    await runDupeCheck(map);
                });
            }
        }
    }, {
        root: null,
        rootMargin: "500px",
        threshold: 0.1
    });

    maps.forEach(map => {
        if (isMultiImageUpload(map) || isAlreadyPosted(map)) {
            return;
        }
        map.style.position = "relative";
        addLoadingIcon(map);
        observer.observe(map);
    });
})();
