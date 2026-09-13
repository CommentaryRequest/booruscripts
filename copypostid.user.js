// ==UserScript==
// @name         Copy Post ID
// @namespace    http://tampermonkey.net/
// @version      1
// @description  adds a link to copy post id
// @author       Commentary request
// @match        https://danbooru.donmai.us/posts/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const link = document.createElement("a");
    link.innerText = "Copy";
    link.style.cursor = "pointer"; // setting href="#" makes it jump to top of the page for some reason
    link.addEventListener("click", async () => {
        await navigator.clipboard.writeText(document.querySelector("meta[name=post-id]").content);
        Danbooru.notice("Copied");
    });

    const postInfoId = document.querySelector("#post-info-id");
    postInfoId.appendChild(document.createTextNode(" "));
    postInfoId.appendChild(link);
})();
