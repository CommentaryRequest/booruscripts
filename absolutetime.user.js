// ==UserScript==
// @name         Absolute Time
// @namespace    http://tampermonkey.net/
// @version      2
// @description  Danbooru userscript for displaying absolute time in places where it's relative.
// @author       commentary request
// @match        *://*.donmai.us/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const times = document.querySelectorAll("time");
    times.forEach(time => {
        if (time.innerText.endsWith("ago")) {
            const date = time.title;
            time.innerText += " (" + date + ")";
        }
    });
})();
