// ==UserScript==
// @name         Topic and Pool Helper
// @namespace    https://github.com/CommentaryRequest/booruscripts
// @description  Script that displays the name of a topic and pool in Danbooru topic and pool links (topic #xxxx and pool #xxxx)
// @author       commentary request
// @version      1
// @match        *://*.donmai.us/*
// @match        *://donmai.moe/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const forumLinks = document.getElementsByClassName("dtext-forum-topic-id-link");
    const poolLinks = document.getElementsByClassName("dtext-pool-id-link");
    const domain = window.location.origin;

    for (let i = 0; i < forumLinks.length; i++) {
        const link = forumLinks[i];
        const linkText = link.innerText;
        const topicIdString = linkText.slice(7);

        // and now we do a danbooru api request
        const apiLink = domain + "/forum_topics/" + topicIdString + ".json";
        fetch(apiLink)
            .then(resp => resp.json())
            .then(data => {
                const topicTitle = data.title || "deleted";
                link.innerText = linkText + " (" + topicTitle + ")";
            })
            .catch(err => console.error("Failed to retrieve topic title for topic " + topicIdString + ": " + err));
    }

    for (let i = 0; i < poolLinks.length; i++) {
        const link = poolLinks[i];
        const linkText = link.innerText;
        const poolIdString = linkText.slice(6);

        const apiLink = domain + "/pools/" + poolIdString + ".json";
        fetch(apiLink)
            .then(resp => resp.json())
            .then(data => {
                if (data.name) {
                    const category = data.category.charAt(0).toUpperCase() + data.category.slice(1);
                    const name = data.name.replace(/_/g, " ");
                    const trash = data.is_deleted ? "🗑️" : "";
                    link.innerText = linkText + " (" + category + ": " + name + ")" + trash;
                } else {
                    link.innerText = linkText + " (deleted)";
                }
            })
            .catch(err => console.error("Failed to retrieve pool name for pool " + poolIdString + ": " + err));
    }
})();
