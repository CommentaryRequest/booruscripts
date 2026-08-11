// ==UserScript==
// @name         Danbooru Alternative Feedback Display
// @namespace    https://github.com/CommentaryRequest/booruscripts
// @version      1.0
// @description  A different way of displaying a user's feedback on danbooru.
// @author       commentary request
// @match        *://*.donmai.us/users/*
// @match        *://*.donmai.us/profile
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const feedbackLinkRegex = /positive:\d* neutral:\d* negative:\d*/;
    const allLinks = document.querySelectorAll(".user-statistics > tbody > tr > td > a");
    allLinks.forEach(link => {
        if (link.innerText.includes("positive:")) {
            const feedbackLinkElements = link.innerText.split(" ");
            const positiveFeedbacks = feedbackLinkElements[0].split(":")[1];
            const neutralFeedbacks = feedbackLinkElements[1].split(":")[1];
            const negativeFeedbacks = feedbackLinkElements[2].split(":")[1];

            link.style.display = "none";

            const positiveText = document.createElement("span");
            positiveText.style.color = "lime";
            positiveText.innerText = positiveFeedbacks + " ";

            const neutralText = document.createElement("span");
            neutralText.style.color = "yellow";
            neutralText.innerText = neutralFeedbacks + " ";

            const negativeText = document.createElement("span");
            negativeText.style.color = "red";
            negativeText.innerText = negativeFeedbacks;

            const feedbackNewLink = document.createElement("a");
            feedbackNewLink.href = link.href;
            feedbackNewLink.appendChild(positiveText);
            feedbackNewLink.appendChild(neutralText);
            feedbackNewLink.appendChild(negativeText);
            feedbackNewLink.title = link.innerText;

            link.parentElement.appendChild(feedbackNewLink);
        }
    });
})();
