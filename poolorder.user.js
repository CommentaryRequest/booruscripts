// ==UserScript==
// @name         pool order on post page
// @namespace    https://github.com/CommentaryRequest/booruscripts
// @version      1
// @description  puts an order link on the post page if it has pools
// @author       commentary request
// @match        https://*.donmai.us/posts/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const pools = document.querySelectorAll(".post-notice .pool-navbar");
    pools.forEach(pool => {
        const poolName = pool.querySelector(".pool-name");
        const poolId = poolName.querySelector("a").href.match(/https:\/\/[^/]+\/.*?(\d+)/)[1];
        const a = document.createElement("a");
        a.style.fontStyle = "italic";
        a.innerText = "(order)";
        a.href = "/pools/" + poolId + "/order/edit";
        poolName.appendChild(a);
    });
})();
