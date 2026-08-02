// ==UserScript==
// @name         mod queue utils
// @namespace    http://tampermonkey.net/
// @version      20
// @description  in the modqueue
// @author       commentar reqeust
// @match        *://*.donmai.us/modqueue*
// @match        *://*.donmai.us/posts*
// @match        *://*.donmai.us/
// @match        *://127.0.0.1:3000/modqueue*
// @match        *://127.0.0.1:3000/posts*
// @match        *://127.0.0.1:3000/
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @updateURL    https://github.com/CommentaryRequest/booruscripts/raw/refs/heads/main/modqueueutils.user.js
// @downloadURL  https://github.com/CommentaryRequest/booruscripts/raw/refs/heads/main/modqueueutils.user.js
// @grant        none
// ==/UserScript==

/* globals
 $
 Danbooru
*/

//////////////////////////////////////////////////
// util
//////////////////////////////////////////////////

function iterate(callback)
{
    const previews = document.querySelectorAll("article.mod-queue-preview");
    previews.forEach(p => callback(p));
}

function isPostsPage()
{
    return Array.from(document.body.classList).includes("c-posts");
}

function createQueueBadge(className, tag)
{
    const span = document.createElement("span");
    span.innerText = humanizeTagName(tag);
    span.classList.add(className, "inline-block", "rounded", "px-2", "mb-1", "text-inverse");
    return span;
}

function getBadgeContainer(p)
{
    return p.querySelector("div.flex-col div.text-center");
}

function getViewMode()
{
    return localStorage.getItem("mqu_view") || "gallery";
}

//////////////////////////////////////////////////
// safe queue link
//////////////////////////////////////////////////

function safeQueueLink()
{
    const link = document.createElement("a");
    link.href = "/modqueue?search[tags]=is%3Asfw&mode=" + getViewMode();
    link.classList.add("py-1.5", "px-3");
    link.innerText = "[sfw]";
    document.querySelector("#subnav-modqueue").after(link);
}

//////////////////////////////////////////////////
// ai check button
//////////////////////////////////////////////////

function resetButton(button)
{
    button.removeAttribute("disabled");
    button.innerText = "Check";
}

function handleError(xhr, status, error)
{
    console.error(xhr, status, error);
    Danbooru.error("Network error");
}

function checkPost(resp, approveButton)
{
    let aiGen = false;
    let aiAssist = false;
    let hasActive = false;
    for (const post of resp) {
        if (post.tag_string_meta.includes("ai-generated") && !post.tag_string_meta.includes("ai-generated_background")) {
            aiGen = true;
            break;
        } else if (post.tag_string_meta.includes("ai-assisted") && !post.tag_string_meta.includes("ai-generated_background")) {
            aiAssist = true;
            break;
        }
        if (!post.is_pending && !post.is_flagged && !post.is_deleted) {
            hasActive = true;
        }
    }

    if (aiGen) {
        Danbooru.error("AI-generated found!");
    } else if (aiAssist) {
        Danbooru.error("AI-assisted found!");
    } else if (!hasActive) {
        Danbooru.error("No active posts. Check artist profile.");
    } else {
        Danbooru.notice("ok");
    }

    if (aiGen || aiAssist || !hasActive) {
        approveButton.setAttribute("disabled", "disabled");
    }
}

function clickCheck(e, postId, approveButton)
{
    e.target.setAttribute("disabled", "disabled");
    e.target.innerText = "oke wait";

    $.ajax({
        url: `/posts/${postId}.json`,
        method: "GET",
        success: resp => {
            const arttag = resp.tag_string_artist;
            if (!arttag) {
                Danbooru.error("No artist tag!");
                resetButton(e.target);
                return;
            }
            $.ajax({
                url: `/posts.json?tags=${arttag}`,
                method: "GET",
                success: resp => {
                    checkPost(resp, approveButton);
                    resetButton(e.target);
                },
                error: (xhr, status, error) => {
                    handleError(xhr, status, error);
                    resetButton(e.target);
                }
            });
        },
        error: (xhr, status, error) => {
            handleError(xhr, status, error);
            resetButton(e.target);
        }
    });
}

function addCheckButton(container, postId)
{
    const button = document.createElement("a");
    button.classList.add("button-primary", "button-xs");
    button.innerText = "Check";
    button.addEventListener("click", e => clickCheck(e, postId, container.children[0]));
    container.appendChild(button);
}

function aiCheckButtonQueue()
{
    iterate(p => {
        const d = p.querySelector("div.flex-col div.gap-1");
        addCheckButton(d, p.dataset.id);
    });
}

function aiCheckButtonPost()
{
    const container = document.querySelector(".post-notice div.gap-1");
    if (container) {
        addCheckButton(container, document.body.dataset.postId);
    }
}

//////////////////////////////////////////////////
// more tags highlight
//////////////////////////////////////////////////

// highlight in red
const WARN_TAGS = [
    "third-party_source", "cropped", "pixel-perfect_duplicate", "self-upload", "koikatsu_(medium)", "lowres"
];

// blue
const OK_TAGS = [
    "official_art", "game_asset", "self-datamine", "commissioner_upload", "second-party_source", "scan", "self-scan"
];

function humanizeTagName(tag)
{
    const tagSplit = tag.split("_");
    let parts = [];
    tagSplit.forEach(s => {
        parts.push(s.charAt(0).toUpperCase() + s.slice(1));
    });
    return parts.join(" ");
}

function createTagElement(tag)
{
    return WARN_TAGS.includes(tag) ? createQueueBadge("bg:error-color", tag) : createQueueBadge("bg:primary-color", tag);
}

function getHighlightedTags(p)
{
    const tagString = p.dataset.tags;
    const tags = tagString.split(" ");
    let h = [];
    tags.forEach(tag => {
        if (WARN_TAGS.includes(tag) || OK_TAGS.includes(tag)) {
            h.push(tag);
        }
    });
    return h;
}

function moreTagsHighlight()
{
    iterate(p => {
        const d = getBadgeContainer(p);
        const highlightedTags = getHighlightedTags(p);
        highlightedTags.forEach(tag => {
            d.appendChild(createTagElement(tag));
            d.appendChild(document.createTextNode(" "));
        });
    });
}

function totalCount()
{
    const badge = document.createElement("span");
    const h1 = document.querySelector("#top-content h1");

    const pendingPosts = Number.parseInt(document.querySelector("#sidebar > ul:nth-child(6) > li:nth-child(1) > span:nth-child(2)").innerText);
    const flaggedPosts = Number.parseInt(document.querySelector("#sidebar > ul:nth-child(6) > li:nth-child(2) > span:nth-child(2)").innerText);
    const appealedPosts = Number.parseInt(document.querySelector("#sidebar > ul:nth-child(6) > li:nth-child(3) > span:nth-child(2)").innerText);

    badge.classList.add("badge-blue");
    badge.innerText = pendingPosts + flaggedPosts + appealedPosts;
    h1.appendChild(document.createTextNode(" "));
    h1.appendChild(badge);
}

//////////////////////////////////////////////////
// q search shortcut
//////////////////////////////////////////////////

function searchShortcut()
{
    document.querySelector("#search_tags").dataset.shortcut = "q";
    Danbooru.Shortcuts.initialize();
}

//////////////////////////////////////////////////
// m queue shortcut
//////////////////////////////////////////////////

function modqueueShortcut()
{
    document.querySelector("#subnav-modqueue").dataset.shortcut = "m";
    Danbooru.Shortcuts.initialize();
}

//////////////////////////////////////////////////
// move the search box to the top of the queu on phone
//////////////////////////////////////////////////
function mobileSearchMove()
{
    if (window.matchMedia("(max-width: 768px)").matches) {
        // move search bar
        const topContent = document.querySelector("#top-content");
        topContent.appendChild(document.querySelector("#sidebar h2"));
        topContent.appendChild(document.querySelector(".search-form"));

        // move the rest of the sidebar into an expand block

        const expandContainer = document.createElement("div");
        expandContainer.classList.add("prose");
        const expand = document.createElement("details");
        const summary = document.createElement("summary");
        summary.innerText = "Sidebar";
        expand.appendChild(summary);
        expand.appendChild(document.querySelector("#sidebar"));
        expandContainer.appendChild(expand);
        topContent.appendChild(expandContainer);
    }
}

//////////////////////////////////////////////////
// ai resolution warning
//////////////////////////////////////////////////

// for each [A, B] checks AxB and BxA
const RESOLUTIONS = [
    [832, 1216],
    [896, 1152],
    [768, 1344],
    [640, 1536]
];

const RESOLUTION_REGEX = /.*, (\d+)x(\d+)/;
function resolutionMatches(p)
{
    const assetLink = p.querySelector(".gap-2 > div > a:nth-child(2)");
    const matches = assetLink.innerText.match(RESOLUTION_REGEX);
    if (!matches) {
        return false;
    }
    const width = matches[1];
    const height = matches[2];
    for (const resolution of RESOLUTIONS) {
        if ((width == resolution[0] && height == resolution[1]) || (width == resolution[1] && height == resolution[0])) {
            return true;
        }
    }
    return false;
}

function resolutionWarning()
{
    iterate(p => {
        if (resolutionMatches(p)) {
            const d = getBadgeContainer(p);
            d.appendChild(createQueueBadge("bg:error-color", "sus_resolution"));
            d.appendChild(document.createTextNode(" "));
        }
    });
}

//////////////////////////////////////////////////
// toggle list/grid queue
//////////////////////////////////////////////////

function viewToggleModify()
{
    document.querySelector("#subnav-modqueue").href = "/modqueue?mode=" + getViewMode();
}

function viewToggleChange(ev)
{
    localStorage.setItem("mqu_view", ev.target.value);
}

function viewToggleShow()
{
    const sidebar = document.querySelector("#sidebar");

    const container = document.createElement("div");
    container.classList.add("card", "p-2");
    container.appendChild(document.createTextNode("Default mode: "));

    const select = document.createElement("select");
    select.add(new Option("List", "list"));
    select.add(new Option("Grid", "gallery"));
    select.value = getViewMode();
    select.addEventListener("change", viewToggleChange);
    container.appendChild(select);

    sidebar.appendChild(container);
}

//////////////////////////////////////////////////
// main
//////////////////////////////////////////////////

(function()
 {
    'use strict';

    if (isPostsPage()) {
        safeQueueLink();
        modqueueShortcut();
        viewToggleModify();
        aiCheckButtonPost();
    } else {
        totalCount();
        aiCheckButtonQueue();
        moreTagsHighlight();
        searchShortcut();
        mobileSearchMove();
        resolutionWarning();
        viewToggleShow();
    }
})();
