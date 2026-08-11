// ==UserScript==
// @name         expand post counts
// @namespace    http://tampermonkey.net/
// @version      1
// @description  show full post count of tags
// @author       commentary request
// @match        https://danbooru.donmai.us/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    document.querySelectorAll(".post-count").forEach(p => {
        if (!p.title)return;
        p.innerText = Number.parseInt(p.title).toLocaleString("en-US");
    });
})();
