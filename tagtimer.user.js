// ==UserScript==
// @name         tag timer
// @namespace    Daniel Booru
// @version      1.0
// @description  See how fast you tag your danbooru uploads!
// @author       Commentary Request
// @match        *://danbooru.donmai.us/uploads/*
// @match        *://127.0.0.1:3000/uploads/*
// @match        *://yukkuri.shiteitte.net/uploads/*
// @match        *://cos.booru.nl/uploads/*
// @match        *://cos.lycore.co/uploads/*
// @match        *://danbooru.donmai.us/posts
// @match        *://127.0.0.1:3000/posts
// @match        *://yukkuri.shiteitte.net/posts
// @match        *://cos.booru.nl/uploads/posts
// @match        *://cos.lycore.co/uploads/posts
// @match        *://danbooru.donmai.us/posts/*
// @match        *://127.0.0.1:3000/posts/*
// @match        *://yukkuri.shiteitte.net/posts/*
// @match        *://cos.booru.nl/uploads/posts/*
// @match        *://cos.lycore.co/uploads/posts/*
// @match        *://danbooru.donmai.us/profile
// @match        *://127.0.0.1:3000/profile
// @match        *://yukkuri.shiteitte.net/profile
// @match        *://cos.booru.nl/profile
// @match        *://cos.lycore.co/profile
// @match        *://danbooru.donmai.us/users/*
// @match        *://127.0.0.1:3000/users/*
// @match        *://yukkuri.shiteitte.net/users/*
// @match        *://cos.booru.nl/users/*
// @match        *://cos.lycore.co/users/*
// @downloadURL  https://github.com/CommentaryRequest/booruscripts/raw/refs/heads/main/tagtimer.user.js
// @updateURL    https://github.com/CommentaryRequest/booruscripts/raw/refs/heads/main/tagtimer.user.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        GM_addStyle
// ==/UserScript==

/* globals
  Danbooru
*/

// ===================================================
// Page Elements
// ===================================================

const TAG_FIELD = document.querySelector("#post_tag_string");
const TAG_COUNT = document.querySelector("span.text-muted[data-for='#post_tag_string'] .tag-count");
const UPLOAD_FORM = document.querySelector("#form");
const POST_MEDIA_ASSET_LINK = document.querySelector("#post-info-size a:last-child");
const IMAGE_CONTAINER = document.querySelector("section.image-container");
const SUBNAV_MY_UPLOADS = document.querySelector("#subnav-my-uploads");
const PROFILE_USER_LINK = document.querySelector("h1 a.user");

// ===================================================
// Constants
// ===================================================

const UPLOAD_PAGE_REGEX = /\/uploads\/\d+(\/assets\/\d+)?/;
const DB_NAME = "boorutagtimer";
//const DB_NAME = "pisstest";
const ENABLE_DEBUG_LOG = true;
const DESTROY_TEMP_SAVE = true; // Only leave this off for debugging
const DEFAULT_SETTINGS = {
    check1up: "true",
    minTags: 5,
    showTimer: "true",
    pauseOnUnfocus: "true"
};

// ===================================================
// Modal Window Layout
// ===================================================

const MODAL_LAYOUT = `
<div id="tag-timer-modal-content">
  <div id="tag-timer-modal-topbuttons">
    <a href="#" id="tag-timer-modal-settings-button">Settings</a>
    <a href="#" id="tag-timer-modal-stats-button">Stats</a>
    <span class="text-muted select-none">|</span>
    <a href="#" id="tag-timer-modal-close">Close</a>
  </div>
  <div id="tag-timer-modal-stats">
    <h1>Tag timer stats</h1>
    <div id="tag-timer-modal-stats-inner">
      <div id="summary">
        <p>Total results recorded: <span id="tag-timer-total-results" class="tag-timer-summary-value"></span></p>
        <p>Total time: <span id="tag-timer-total-time" class="tag-timer-summary-value"></span></p>
        <p>Average speed: <span id="tag-timer-avg-speed" class="tag-timer-summary-value"></span> tags per second</p>
        <p>Average time: <span id="tag-timer-avg-time" class="tag-timer-summary-value"></span></p>
        <p>Fastest time: <a id="tag-timer-fastest-time-link" class="dtext-link dtext-id-link dtext-post-id-link"></a> <span id="tag-timer-fastest-time-time" class="tag-timer-summary-value"></span> (<span id="tag-timer-fastest-time-speed" class="tag-timer-summary-value"></span> tags per second)</p>
        <p>Slowest time: <a id="tag-timer-slowest-time-link" class="dtext-link dtext-id-link dtext-post-id-link"></a> <span id="tag-timer-slowest-time-time" class="tag-timer-summary-value"></span> (<span id="tag-timer-slowest-time-speed" class="tag-timer-summary-value"></span> tags per second)</p>
      </div>
      <hr>
      <table id="tag-timer-posts-table" class="striped">
        <thead>
          <tr>
            <th data-sort-key="postId">Post ID</th>
            <th data-sort-key="tagCount">Tags</th>
            <th data-sort-key="time">Time</th>
            <th data-sort-key="speed">Speed (tags per second)</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
        </tbody>
      </table>
    </div>
    <div id="tag-timer-modal-stats-empty">
      No results recorded yet. Upload some posts to see how fast you do!
    </div>
  </div>
  <div id="tag-timer-modal-settings">
    <h1>Tag timer settings</h1>
    <label for="tag-timer-setting-check1up">Check for 1ups</label><br>
    <input id="tag-timer-setting-check1up" name="tag-timer-setting-check1up" type="checkbox" class="toggle-switch boolean">
    <span class="hint fineprint">Don't record a result if the post is a 1up (same non-meta tags as any child post).</span>
    <p></p>
    <label for="tag-timer-setting-mintags">Minimum tags</label><br>
    <input id="tag-timer-setting-mintags" name="tag-timer-setting-mintags" type="number" min="0" class="numeric integer">
    <span class="hint fineprint">Uploading with less tags than this won't record a result.</span>
    <p></p>
    <label for="tag-timer-setting-show-timer">Show timer</label><br>
    <input id="tag-timer-setting-show-timer" name="tag-timer-setting-show-timer" type="checkbox" class="toggle-switch boolean">
    <span class="hint fineprint">Show timer and tags per second on the upload page.</span>
    <p></p>
    <label for="tag-timer-setting-pause-unfocus">Pause on unfocus</label><br>
    <input id="tag-timer-setting-pause-unfocus" name="tag-timer-setting-pause-unfocus" type="checkbox" class="toggle-switch boolean">
    <span class="hint fineprint">Pause the timer if the upload tab isn't focused.</span>
    <p></p>
    <a href="#" id="tag-timer-setting-export" class="button-primary">Export data</a> <span class="hint fineprint">Download recorded results as a JSON file for data transfer and backup.</span>
    <p></p>
    <a href="#" id="tag-timer-setting-import" class="button-primary">Import data</a> <input type="file" id="tag-timer-setting-file"> <span class="hint fineprint">Importing overwrites any existing data.</span>
    <p></p>
    <a href="#" id="tag-timer-setting-reset" class="button-primary">Delete data</a> <span class="hint fineprint">Delete all recorded results. This cannot be undone.</span>
  </div>
</div>
`;

// ===================================================
// Style Sheet
// ===================================================

const CSS = `
#tag-timer-display {
  margin-right: 1em;
}

#tag-timer-tps {
  margin-right: 0.8em;
}

.tag-timer-finish {
  color: var(--green-2);
}

#tag-timer-modal-container {
  display: none;
  position: fixed;
  z-index: 1;
  left: 0;
  top: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
}

#tag-timer-modal-content {
  background-color: var(--body-background-color);
  border: 1px solid var(--default-border-color);
  border-radius: 2px;
  width: 65%;
  height: 65%;
  padding: 1em;
  position: absolute;
  left: 50%;
  top: 50%;
  -webkit-transform: translate(-50%, -50%);
  transform: translate(-50%, -50%);
  overflow: auto;
}

#tag-timer-modal-topbuttons {
  font-weight: bold;
  float: right;
}

#tag-timer-modal-close:hover {
  cursor: pointer;
}

.tag-timer-summary-value {
  font-weight: bold;
}

#tag-timer-modal-stats-button, #tag-timer-modal-stats-empty, #tag-timer-modal-settings {
  display: none;
}

#tag-timer-modal-settings label {
  font-weight: bold;
}
`;

// ===================================================
// Utility Functions
// ===================================================

function dlog(...args)
{
    if (!ENABLE_DEBUG_LOG) {
        return;
    }
    console.log("[tagtimer debug]", ...args);
}

async function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

function readTagField()
{
    return TAG_FIELD.value;
}

function getTimeString(millis)
{
    const totalSeconds = Math.floor(millis / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60 + ((millis % 1000) / 1000);

    let str = "";
    if (hours) {
        str += `${hours}hr `;
    }
    if (minutes) {
        str += `${minutes}min `;
    }
    str += `${seconds.toFixed(3)}sec`;

    return str;
}

function getTagCount()
{
    if (!TAG_COUNT) {
        return NaN;
    }
    return Number.parseInt(TAG_COUNT.innerText.split(" ")[0]);
}

function calculateTagsPerSecond(timer)
{
    return getTagCount() / (timer.millis / 1000);
}

function getAssetId(link)
{
    const href = link.href;
    const splitHref = href.split("/");
    return Number.parseInt(splitHref[splitHref.length - 1]);
}

function findUploadAssetId()
{
    const links = document.querySelectorAll(".media-asset-component a");
    for (const link of links) {
        const url = new URL(link.href);
        if (url.pathname.startsWith("/media_assets")) {
            return getAssetId(link);
        }
    }
    return null;
}

function getPostId()
{
    return IMAGE_CONTAINER.dataset.id;
}

function gatherTags(category)
{
    const list = document.querySelectorAll(`ul.${category}-tag-list a.search-tag`);
    if (!list) {
        return "";
    }

    let tagString = "";
    for (const link of list) {
        tagString += link.innerText + " ";
    }
    return tagString.trimEnd();
}

function normalizeTagString(str)
{
    return new Set(str.split(" ").filter(Boolean));
}

function getNonMetaTagString()
{
    return normalizeTagString(`${gatherTags("artist")} ${gatherTags("copyright")} ${gatherTags("character")} ${gatherTags("general")}`);
}

function isOwnProfilePage()
{
    return PROFILE_USER_LINK.dataset.userId == document.body.dataset.currentUserId;
}

function fieldSum(results, field)
{
    let sum = 0;
    for (const result of results) {
        sum += result.result[field];
    }
    return sum;
}

function fieldMax(results, field)
{
    let max = 0;
    let iMax = 0;
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.result[field] > max) {
            max = result.result[field];
            iMax = i;
        }
    }
    return results[iMax];
}

function fieldMin(results, field)
{
    let min = Infinity;
    let iMin = 0;
    for (let i = 0; i < results.length; i++) {
        const result = results[i];
        if (result.result[field] < min) {
            min = result.result[field];
            iMin = i;
        }
    }
    return results[iMin];
}

function populatePostLink(link, postId)
{
    link.innerText = `post #${postId}`;
    link.href = `/posts/${postId}`;
    link.classList.add("dtext-link", "dtext-id-link", "dtext-post-id-link");
}

function createPostLink(postId)
{
    const link = document.createElement("a");
    populatePostLink(link, postId);
    return link;
}

function sortTable(table, attr, asc = true)
{
    const tbody = table.tBodies[0];
    const rows = Array.from(tbody.rows);

    rows.sort((a, b) => {
        const aVal = Number(a.dataset[attr]);
        const bVal = Number(b.dataset[attr]);
        return asc ? aVal - bVal : bVal - aVal;
    });

    tbody.append(...rows);
}

// ===================================================
// Classes
// ===================================================

// I don't know of a better way to check for changes in the textarea (input event doesn't seem to work when clicking related/favorite tags), so this'll have to do.
class TagFieldListener
{
    async waitInput(callback)
    {
        let tags = readTagField();
        while (true) {
            if (readTagField() != tags) {
                break;
            }
            await sleep(100);
        }
        callback();
    }
}

class Timer
{
    constructor()
    {
        this.millis = 0;
        this.running = false;
        this.intervalId = null;
        this.lastResumeTime = 0;
        this.focused = true;
    }

    run(callback)
    {
        if (this.running) {
            return;
        }

        this.running = true;
        this.millis = 0;
        this.lastResumeTime = performance.now();
        this.intervalId = setInterval(() => {
            const now = performance.now();
            if (!this.focused) {
                this.lastResumeTime = now;
                return;
            }
            this.millis += now - this.lastResumeTime;
            this.lastResumeTime = now;
            callback(this);
        }, 16);
    }

    stop()
    {
        if (!this.running) {
            return;
        }

        this.running = false;
        clearInterval(this.intervalId);
        this.intervalId = null;
    }

    getTimeString()
    {
        return getTimeString(this.millis);
    }

    unfocus()
    {
        this.focused = false;
    }

    focus()
    {
        this.focused = true;
    }

    pauseOnUnfocus()
    {
        dlog("Setting up pause on unfocus");
        window.addEventListener("visibilitychange", () => {
            dlog("Window changed visibility: hidden=", document.hidden);
            if (document.hidden) {
                this.unfocus();
            } else {
                this.focus();
            }
        });
        window.addEventListener("blur", () => {
            dlog("Blur event caught, pausing");
            this.unfocus();
        });
        window.addEventListener("focus", () => {
            dlog("Focus event caught, unpausing");
            this.focus();
        });
    }
}

class ResultsStorage
{
    constructor()
    {
        this.db = null;
    }

    async init()
    {
        dlog("Initializing results storage");
        return new Promise((resolve, reject) => {
            const request = indexedDB.open(DB_NAME, 1);

            request.onupgradeneeded = e => {
                const db = e.target.result;
                if (!db.objectStoreNames.contains("results")) {
                    db.createObjectStore("results", {
                        keyPath: "postId"
                    });
                }
            }

            request.onsuccess = e => {
                this.db = e.target.result;
                dlog("Results storage initialized");
                resolve();
            }

            request.onerror = e => {
                console.error("Error initializing results storage:", e);
                reject(event.target.error)
            }
        });
    }

    writeResult(postId, result)
    {
        dlog("Write result for post", postId, "=", result);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("results", "readwrite");
            const store = tx.objectStore("results");
            store.put({
                postId: postId,
                result: result
            });
            tx.oncomplete = () => resolve();
            tx.onerror = () => {
                console.error("Write transaction error:", tx.error);
                reject(tx.error);
            }
            tx.onabort = () => {
                console.error("Write transaction aborted:", tx.error);
                reject(tx.error);
            }
        });
    }

    readResult(postId)
    {
        dlog("Read result for post", postId);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("results", "readonly");
            const store = tx.objectStore("results");
            const request = store.get(postId.toString());
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => {
                console.error("Read transaction error:", e.target.error);
                reject(e.target.error);
            }
        });
    }

    listResults()
    {
        dlog("List all results");
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("results", "readonly");
            const store = tx.objectStore("results");

            const allItems = [];
            const cursorRequest = store.openCursor();
            cursorRequest.onsuccess = e => {
                const cursor = e.target.result;
                if (cursor) {
                    allItems.push(cursor.value);
                    cursor.continue();
                } else {
                    resolve(allItems);
                }
            }
            cursorRequest.onerror = () => {
                console.error("Open cursor error:", cursorRequest.error);
                reject(cursorRequest.error);
            }
        });
    }

    removeResult(postId)
    {
        dlog("Remove result for post", postId);
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("results", "readwrite");
            const store = tx.objectStore("results");
            const request = store.delete(postId.toString());
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => {
                console.error("Delete transaction error:", e.target.error);
                reject(e.target.error);
            };
            request.onabort = e => {
                console.error("Delete transaction aborted:", e.target.error);
                reject(e.target.error);
            };
        });
    }

    reset()
    {
        dlog("Reset all data");
        return new Promise((resolve, reject) => {
            const tx = this.db.transaction("results", "readwrite");
            const store = tx.objectStore("results");
            const request = store.clear();
            request.onsuccess = e => resolve(e.target.result);
            request.onerror = e => {
                console.error("Clear transaction error:", e.target.error);
                reject(e.target.error);
            };
            request.onabort = e => {
                console.error("Clear transaction aborted:", e.target.error);
                reject(e.target.error);
            };
        });
    }
}

// ===================================================
// Globals
// ===================================================

let gTimerDisplay = null;
let gTPSDisplay = null;
let gModal = null;
const gDB = new ResultsStorage();

// ===================================================
// Saving and Loading: Temporary Save
// ===================================================

// Write a temporary save of the tag time and tags per second. This data lives between submitting the upload form and being processed in the posts page, where it gets saved
// and associated with the post ID.
function writeTempSave(finishTime, tagsPerSecond)
{
    const assetId = findUploadAssetId();
    sessionStorage.setItem(`ttmr_temp_${assetId}`, JSON.stringify({
        finishTime: finishTime,
        tagsPerSecond: tagsPerSecond,
        tags: readTagField()
    }));
}

function readTempSave(assetId)
{
    return JSON.parse(sessionStorage.getItem(`ttmr_temp_${assetId}`)) || null;
}

function destroyTempSave(assetId)
{
    sessionStorage.removeItem(`ttmr_temp_${assetId}`);
}

// ===================================================
// Saving and Loading: Settings
// ===================================================

function readSetting(setting)
{
    return localStorage.getItem(`ttmr_setting_${setting}`) || DEFAULT_SETTINGS[setting];
}

function writeSetting(setting, value)
{
    dlog(`setting ${setting}=${value}`);
    localStorage.setItem(`ttmr_setting_${setting}`, value);
}

// ===================================================
// Main Program: Upload Page
// ===================================================

function buildUploadUI()
{
    dlog("Building upload page UI");

    gTimerDisplay = document.createElement("span");
    gTimerDisplay.innerText = "waiting for input";
    gTimerDisplay.id = "tag-timer-display";
    TAG_COUNT.before(gTimerDisplay);

    gTPSDisplay = document.createElement("span");
    gTPSDisplay.id = "tag-timer-tps";
    gTimerDisplay.before(gTPSDisplay);
}

function onFormSubmit(timer, e)
{
    e.preventDefault(); // Prevent it from submitting until I say so.

    if (getTagCount() >= Number.parseInt(readSetting("minTags"))) {
        timer.stop();
        gTimerDisplay.classList.add("tag-timer-finish");
        gTPSDisplay.classList.add("tag-timer-finish");

        const finishTime = timer.millis;
        const tagsPerSecond = calculateTagsPerSecond(timer);

        writeTempSave(finishTime, tagsPerSecond);
    }

    e.target.submit();
}

function updateTimerDisplay(timer)
{
    if (!gTimerDisplay || !gTPSDisplay || readSetting("showTimer") === "false") {
        return;
    }

    const tagsPerSecond = calculateTagsPerSecond(timer);

    gTimerDisplay.innerText = timer.getTimeString();
    gTPSDisplay.innerText = `${tagsPerSecond.toFixed(2)} tags/s`;
}

function startTimer()
{
    const timer = new Timer();
    timer.run(updateTimerDisplay);
    if (readSetting("showTimer") === "false") {
        gTimerDisplay.style.display = "none";
        gTPSDisplay.style.display = "none";
    }
    if (readSetting("pauseOnUnfocus") === "true") {
        timer.pauseOnUnfocus();
    }
    UPLOAD_FORM.addEventListener("submit", e => onFormSubmit(timer, e));
}

function mainUploadPage()
{
    buildUploadUI();

    // Start the timer when the tag field is updated.
    const listener = new TagFieldListener();
    listener.waitInput(startTimer);
}

// ===================================================
// Main Program: Post Page
// ===================================================

// It's considered a 1up if all tags other than the meta tags on the current post and any child post are the same.
// If it has no children, it can't be a 1up. (unless the posts being 1upped aren't parented, which is not my problem)
// Runs the query parent:postId. If they have the same general tags as the current post, then the current post is a 1up, disregard it.
async function is1up()
{
    if (!document.querySelector("#has-children-relationship-preview")) {
        return false;
    }

    dlog("Checking if this post is a 1up");

    const postId = getPostId();

    const res = await fetch(`/posts.json?tags=parent:${postId}&limit=50`); // i forgot what the max number of children is
    if (!res.ok) {
        throw new Error("failed to check if post is 1up");
    }
    const data = await res.json();
    const parentTags = getNonMetaTagString();

    for (const post of data) {
        const childId = post.id;
        if (childId === postId) {
            continue; // for some reason it adds the parent post too
        }
        dlog("Checking against post ", childId);
        const childTags = normalizeTagString(`${post.tag_string_artist} ${post.tag_string_copyright} ${post.tag_string_character} ${post.tag_string_general}`);
        console.log("parent", parentTags, "child", childTags);
        if (childTags.size == parentTags.size && [...childTags].every(t => parentTags.has(t))) {
            dlog("Post is a 1up");
            return true;
        }
    }
    return false;
}

async function processResults()
{
    dlog("Processing results");

    const assetId = getAssetId(POST_MEDIA_ASSET_LINK);
    const tempSave = readTempSave(assetId);
    if (!tempSave) {
        dlog("No temporary save found");
        return;
    }
    if (readSetting("check1up") === "true" && await is1up()) {
        return;
    }

    dlog("Asset id =", assetId, "; temp save=", tempSave);

    await gDB.init();
    if (await gDB.readResult(getPostId())) {
        dlog("Result for this post already exists");
        return;
    }
    await gDB.writeResult(getPostId(), tempSave);
    Danbooru.notice(`Finished in ${getTimeString(tempSave.finishTime)}, ${tempSave.tagsPerSecond.toFixed(3)} tags/second`);
    if (DESTROY_TEMP_SAVE) {
        destroyTempSave(assetId);
    }
}

async function mainPostPage()
{
    // Check if we're referred by the upload page.
    if (!document.referrer) {
        return;
    }
    const referrer = new URL(document.referrer);
    if (UPLOAD_PAGE_REGEX.test(referrer.pathname)) {
        await processResults();
    }
}

// ===================================================
// Main Program: Profile Page
// ===================================================

function hideModal()
{
    gModal.style.display = "none";
}

function showModal()
{
    gModal.style.display = "block";
}

function switchToSettings()
{
    document.querySelector("#tag-timer-modal-settings-button").style.display = "none";
    document.querySelector("#tag-timer-modal-stats-button").style.display = "inline";
    document.querySelector("#tag-timer-modal-stats").style.display = "none";
    document.querySelector("#tag-timer-modal-settings").style.display = "inline";
}

function switchToStats()
{
    document.querySelector("#tag-timer-modal-settings-button").style.display = "inline";
    document.querySelector("#tag-timer-modal-stats-button").style.display = "none";
    document.querySelector("#tag-timer-modal-stats").style.display = "inline";
    document.querySelector("#tag-timer-modal-settings").style.display = "none";
}

async function exportData()
{
    Danbooru.notice("Exporting data...");

    const data = await gDB.listResults();
    const blob = new Blob([JSON.stringify(data)], {type: "application/json"});
    const url = URL.createObjectURL(blob);

    const link = document.createElement("a");
    link.style.display = "none";
    link.href = url;
    link.download = "TagTimerExport.json";

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
    Danbooru.notice("Data exported.");
}

async function importData()
{
    const fileInput = document.querySelector("#tag-timer-setting-file");
    if (!fileInput.files.length) {
        Danbooru.error("Select a file to import.");
        return;
    }

    Danbooru.notice("Importing data...");

    const file = fileInput.files[0];
    if (!file) {
        Danbooru.error("Bad file provided.");
        return;
    }
    const reader = new FileReader();
    reader.onload = async e => {
        const content = e.target.result;
        let data;
        try {
            data = JSON.parse(content);
        } catch (err) {
            Danbooru.error("Error reading JSON data.");
            console.error("json parse error", err);
        }
        await gDB.reset();
        data.forEach(jResult => {
            const postId = jResult.postId;
            const result = jResult.result;
            gDB.writeResult(postId, result);
        });

        Danbooru.notice("Data imported.");
    };
    reader.readAsText(file);
}

async function resetData()
{
    if (confirm("Are you sure you want to delete all recorded results? This action cannot be undone.")) {
        await gDB.reset();
        Danbooru.notice("Data reset.");
    }
}

function buildModal()
{
    const link = document.createElement("a");
    link.innerText = "Tag Timer";
    link.classList.add("py-1.5");
    link.classList.add("px-3");
    link.href = "#";
    link.addEventListener("click", showModal);
    SUBNAV_MY_UPLOADS.after(link);

    const modalContainer = document.createElement("div");
    modalContainer.id = "tag-timer-modal-container";
    modalContainer.innerHTML = MODAL_LAYOUT;
    document.body.appendChild(modalContainer);
    gModal = modalContainer;

    // Adding events to modal's UI elements.
    const table = document.querySelector("#tag-timer-posts-table");
    modalContainer.querySelector("#tag-timer-modal-close").addEventListener("click", hideModal);
    document.querySelector("#tag-timer-modal-settings-button").addEventListener("click", switchToSettings);
    document.querySelector("#tag-timer-modal-stats-button").addEventListener("click", switchToStats);
    document.querySelector("#tag-timer-setting-check1up").addEventListener("change", e => writeSetting("check1up", e.target.checked));
    document.querySelector("#tag-timer-setting-mintags").addEventListener("input", e => writeSetting("minTags", e.target.value));
    document.querySelector("#tag-timer-setting-show-timer").addEventListener("change", e => writeSetting("showTimer", e.target.checked));
    document.querySelector("#tag-timer-setting-pause-unfocus").addEventListener("change", e => writeSetting("pauseOnUnfocus", e.target.checked));
    document.querySelector("#tag-timer-setting-export").addEventListener("click", exportData);
    document.querySelector("#tag-timer-setting-import").addEventListener("click", importData);
    document.querySelector("#tag-timer-setting-reset").addEventListener("click", resetData);
    table.querySelectorAll("th[data-sort-key]").forEach(th => {
        let asc = true;
        th.addEventListener("click", () => {
            sortTable(table, th.dataset.sortKey, asc);
            asc = !asc;
        });
    });
}

function populateStats(results)
{
    if (results.length == 0) {
        document.querySelector("#tag-timer-modal-stats-inner").style.display = "none";
        document.querySelector("#tag-timer-modal-stats-empty").style.display = "block";
        return;
    }

    const finishTimeSum = fieldSum(results, "finishTime");
    const fastestResult = fieldMin(results, "finishTime");
    const slowestResult = fieldMax(results, "finishTime");

    document.querySelector("#tag-timer-total-results").innerText = results.length;
    document.querySelector("#tag-timer-total-time").innerText = getTimeString(finishTimeSum);
    document.querySelector("#tag-timer-avg-speed").innerText = (fieldSum(results, "tagsPerSecond") / results.length).toFixed(3);
    document.querySelector("#tag-timer-avg-time").innerText = getTimeString(finishTimeSum / results.length);
    document.querySelector("#tag-timer-fastest-time-time").innerText = getTimeString(fastestResult.result.finishTime);
    document.querySelector("#tag-timer-fastest-time-speed").innerText = fastestResult.result.tagsPerSecond.toFixed(3);
    document.querySelector("#tag-timer-slowest-time-time").innerText = getTimeString(slowestResult.result.finishTime);
    document.querySelector("#tag-timer-slowest-time-speed").innerText = slowestResult.result.tagsPerSecond.toFixed(3);

    populatePostLink(document.querySelector("#tag-timer-fastest-time-link"), fastestResult.postId);
    populatePostLink(document.querySelector("#tag-timer-slowest-time-link"), slowestResult.postId);

    const table = document.querySelector("#tag-timer-posts-table");
    const tbody = table.tBodies[0];
    for (const dbResult of results) {
        const postId = dbResult.postId;
        const result = dbResult.result;

        // Create post link
        const postLink = createPostLink(postId);

        // Create table row
        const tr = document.createElement("tr");
        const tdPostLink = document.createElement("td");
        const tdTags = document.createElement("td");
        const tdTime = document.createElement("td");
        const tdSpeed = document.createElement("td");
        const tdActions = document.createElement("td");

        // Create remove link
        const removeLink = document.createElement("a");
        removeLink.innerText = "Remove";
        removeLink.href = "#";
        removeLink.addEventListener("click", () => {
            if (confirm(`Remove result for post #${postId}?`)) {
                gDB.removeResult(postId);
                tr.remove();
                Danbooru.notice("Result removed");
            }
        });

        const tagCount = result.tags.split(" ").length;

        // Populate table row
        tdPostLink.appendChild(postLink);
        tdTags.innerText = tagCount;
        tdTags.title = result.tags;
        tdTime.innerText = getTimeString(result.finishTime);
        tdSpeed.innerText = result.tagsPerSecond.toFixed(3);
        tdActions.appendChild(removeLink);

        // Attributes for sorting
        tr.dataset.postId = postId;
        tr.dataset.tagCount = tagCount;
        tr.dataset.time = result.finishTime;
        tr.dataset.speed = result.tagsPerSecond;

        // Add table row to table
        tr.appendChild(tdPostLink);
        tr.appendChild(tdTags);
        tr.appendChild(tdTime);
        tr.appendChild(tdSpeed);
        tr.appendChild(tdActions);
        tbody.appendChild(tr);
    }

    sortTable(table, "postId", false);

    Danbooru.Post.initialize_links();
}

function populateSettings()
{
    document.querySelector("#tag-timer-setting-check1up").checked = readSetting("check1up") === "true"; // fuck javascript
    document.querySelector("#tag-timer-setting-mintags").value = readSetting("minTags");
    document.querySelector("#tag-timer-setting-show-timer").checked = readSetting("showTimer") === "true";
    document.querySelector("#tag-timer-setting-pause-unfocus").checked = readSetting("pauseOnUnfocus") === "true";
}

function populateModal(results)
{
    populateStats(results);
    populateSettings();
}

async function mainProfilePage()
{
    buildModal();
    await gDB.init();
    const results = await gDB.listResults();
    populateModal(results);
}

// ===================================================

GM_addStyle(CSS);

// Branching based on the current page.

if (document.querySelector(".upload-form")) { // Upload page
    dlog("Upload page detected");
    mainUploadPage();
} else if (document.location.pathname.startsWith("/posts/") && document.querySelector("#image")) { // Post page
    dlog("Posts page detected");
    await mainPostPage();
} else if ((document.location.pathname.startsWith("/profile") || document.location.pathname.startsWith("/users/")) && isOwnProfilePage()) { // Profile page
    dlog("Own profile page detected");
    await mainProfilePage();
} else {
    dlog(`Unknown page (pathname=${document.location.pathname})`);
}
