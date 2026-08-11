// ==UserScript==
// @name         favorite on upload page
// @namespace    http://tampermonkey.net/
// @version      1
// @description  add fav:ur_username on ulpoad page
// @author       commentary request
// @match        https://danbooru.donmai.us/uploads/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const uname = document.body.getAttribute("data-current-user-name");
    if (uname == "RommentaryCequest") {
        return;
    }
    document.querySelector("#post_tag_string").value += "fav:" + uname + " ";
})();
