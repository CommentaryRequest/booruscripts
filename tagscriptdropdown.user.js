// ==UserScript==
// @name         tag script dropdown
// @namespace    http://tampermonkey.net/
// @version      2025-06-18
// @description  adds a dropdown to switch tag scripts (for mobile use)
// @author       commentary request
// @match        https://danbooru.donmai.us/posts*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// @run-at       document-idle
// ==/UserScript==

(function() {
    'use strict';

    const modeBox = document.querySelector("#mode-box");
    const dropdown = document.createElement("select");
    ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"].forEach(value => {
        const item = document.createElement("option");
        item.innerText = value;
        item.value = value;
        dropdown.appendChild(item);
    });
    modeBox.appendChild(dropdown);
    dropdown.addEventListener("change", () => {
        Danbooru.PostModeMenu.change_tag_script({
            which: dropdown.selectedIndex + 48
        });
    });
})();
