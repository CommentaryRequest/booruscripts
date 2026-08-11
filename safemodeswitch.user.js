// ==UserScript==
// @name         Danbooru Safe Mode Switch
// @namespace    https://github.com/CommentaryRequest/booruscripts
// @version      1.0
// @description  button to switch to/from safe mode quickly
// @author       commentary request
// @match        *://*.donmai.us/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        GM_addStyle
// ==/UserScript==

(function() {
    'use strict';

    GM_addStyle(`
#safemodebutton {
    position: fixed;
    bottom: 0px;
    right: 0px;
    background-color: #111;
    color: gray;
}
    `);

    const safeModeButton = document.createElement("button");
    safeModeButton.id = "safemodebutton";
    safeModeButton.innerText = "Safe mode " + (Danbooru.CurrentUser.data("enable-safe-mode") ? "on" : "off");
    document.body.appendChild(safeModeButton);

    safeModeButton.onclick = function() {
        Danbooru.CurrentUser.update({enable_safe_mode:!Danbooru.CurrentUser.data('enable-safe-mode')}).then(()=>{window.location=window.location;});
    }
})();
