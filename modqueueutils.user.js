// ==UserScript==
// @name         mod queue utils
// @namespace    http://tampermonkey.net/
// @version      whatever
// @description  in the modqueue
// @author       commentar reqeust
// @match        *://*.donmai.us/modqueue*
// @match        *://*.donmai.us/posts*
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
    const previews = document.querySelectorAll(".mod-queue-preview");
    previews.forEach(p => callback(p));
}

function isPostsPage()
{
    return window.location.pathname.startsWith("/posts");
}

//////////////////////////////////////////////////
// safe queue link
//////////////////////////////////////////////////

function safeQueueLink()
{
    const link = document.createElement("a");
    link.href = "/modqueue?search[tags]=is%3Asfw";
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
        Danbooru.error("No active posts. Check artist profile to see if they're legit.");
    } else {
        Danbooru.notice("ok");
    }

    if (aiGen || aiAssist || !hasActive) {
        approveButton.setAttribute("disabled", "disabled");
    }
}

function clickCheck(e, preview, approveButton)
{
    e.target.setAttribute("disabled", "disabled");
    e.target.innerText = "oke wait";

    const postId = preview.dataset.id;
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

function aiCheckButton()
{
    iterate(p => {
        const d = p.querySelector("div.flex-col div.gap-1");
        const button = document.createElement("a");
        button.classList.add("button-primary", "button-xs");
        button.innerText = "Check";
        button.addEventListener("click", e => clickCheck(e, p, d.children[0]));
        d.appendChild(button);
    });
}

//////////////////////////////////////////////////
// more tags highlight
//////////////////////////////////////////////////

// highlight in red
const WARN_TAGS = [
    "third-party_source", "cropped"
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
    const span = document.createElement("span");
    span.innerText = humanizeTagName(tag);
    const classname = WARN_TAGS.includes(tag) ? "bg:error-color" : "bg:primary-color";
    span.classList.add(classname, "inline-block", "rounded", "px-2", "mb-1", "text-inverse");
    return span;
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
        const d = p.querySelector("div.flex-col div.text-center");
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
// main
//////////////////////////////////////////////////

(function()
 {
    'use strict';

    if (isPostsPage()) {
        safeQueueLink();
    } else {
        totalCount();
        aiCheckButton();
        moreTagsHighlight();
        searchShortcut();
    }
})();
