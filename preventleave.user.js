// ==UserScript==
// @name         Danbooru: prevent leaving page with tags on upload
// @namespace    Daniel Booru
// @version      2026-02-15
// @description  Prevents leaving the upload page if you have entered some tags.
// @author       CommentaryRequest
// @match        *://*.donmai.us/uploads/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

function readTagField()
{
    return document.querySelector("#post_tag_string").value;
}

async function sleep(ms)
{
    return new Promise(resolve => setTimeout(resolve, ms));
}

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

function prevent(e) {
    e.preventDefault();
    e.returnValue = "";
}

(function() {
    new TagFieldListener().waitInput(() => {
        window.addEventListener("beforeunload", prevent);
        document.querySelector("#form").addEventListener("submit", () => {
            window.removeEventListener("beforeunload", prevent);
        });
    });
})();
