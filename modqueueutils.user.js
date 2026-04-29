// ==UserScript==
// @name         mod queue utils
// @namespace    http://tampermonkey.net/
// @version      whatever
// @description  in the modqueue
// @author       commentar reqeust
// @match        https://danbooru.donmai.us/modqueue*
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
    for (const post of resp) {
        if (post.tag_string_meta.includes("ai-generated") && !post.tag_string_meta.includes("ai-generated_background")) {
            aiGen = true;
            break;
        } else if (post.tag_string_meta.includes("ai-assisted") && !post.tag_string_meta.includes("ai-generated_background")) {
            aiAssist = true;
            break;
        }
    }

    if (aiGen) {
        Danbooru.error("AI-generated found!");
    } else if (aiAssist) {
        Danbooru.error("AI-assisted found!");
    } else {
        Danbooru.notice("ok");
    }

    if (aiGen || aiAssist) {
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
    "official_art", "game_cg"
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

//////////////////////////////////////////////////
// main
//////////////////////////////////////////////////

(function()
 {
    'use strict';

    aiCheckButton();
    moreTagsHighlight();
})();
