// ==UserScript==
// @name         Commentaries link in related section
// @namespace    http://tampermonkey.net/
// @version      1
// @description  Adds a link to view artist commentaries for a given search in the post listing
// @author       CommentaryRequest
// @match        *://*.donmai.us/posts*
// @match        *://donmai.moe/posts*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const relatedList = document.querySelector("#related-list");
    const li = document.createElement("li");
    const a = document.createElement("a");
    a.innerText = "Commentaries";
    a.href = document.location.origin + "/artist_commentaries?search[post_tags_match]=" + encodeURI(document.querySelector("#tags").value);
    li.appendChild(a);
    relatedList.appendChild(li);
})();
