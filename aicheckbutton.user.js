// ==UserScript==
// @name         ai check button
// @namespace    http://tampermonkey.net/
// @version      2026-04-24
// @description  in the modqueue
// @author       commentar reqeust
// @match        https://danbooru.donmai.us/modqueue*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

/* globals
 $
 Danbooru
*/

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

function check(e, preview)
{
    e.target.setAttribute("disabled", "disabled");
    e.target.innerText = "oke wait";

    const postId = preview.dataset.id;
    $.ajax({
        url: `/posts/${postId}.json`,
        method: "GET",
        success: resp => {
            const arttag = resp.tag_string_artist;
            $.ajax({
                url: `/posts.json?tags=${arttag}`,
                method: "GET",
                success: resp => {
                    let aiGen = false;
                    let aiAssist = false;
                    for (const post of resp) {
                        if (post.tag_string_meta.includes("ai-generated")) {
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

(function()
 {
    'use strict';

    const previews = document.querySelectorAll(".mod-queue-preview");
    previews.forEach(p => {
        const d = p.querySelector("div.flex-col div.gap-1");
        const button = document.createElement("a");
        button.classList.add("button-primary", "button-xs", "chip-yellow");
        button.innerText = "Check";
        button.addEventListener("click", e => check(e, p));
        d.appendChild(button);
    });
})();
