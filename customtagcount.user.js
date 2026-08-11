// ==UserScript==
// @name         custom tag count
// @namespace    http://tampermonkey.net/
// @version      1
// @description  adds a custom colored tag count above the tag list
// @author       commentary request
// @match        https://danbooru.donmai.us/posts/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    const arttagsCount = document.querySelectorAll(".artist-tag-list a.search-tag").length;
    const copytagsCount = document.querySelectorAll(".copyright-tag-list a.search-tag").length;
    const chartagsCount = document.querySelectorAll(".character-tag-list a.search-tag").length;
    const gentagsCount = document.querySelectorAll(".general-tag-list a.search-tag").length;
    const metatagsCount = document.querySelectorAll(".meta-tag-list a.search-tag").length;
    const total = arttagsCount + copytagsCount + chartagsCount + gentagsCount + metatagsCount;

    const tagList = document.querySelector("#tag-list");

    const totalCounter = document.createElement("span");
    totalCounter.innerText = total;

    const arttagsCounter = document.createElement("span");
    arttagsCounter.innerText = arttagsCount;
    arttagsCounter.style.color = "var(--artist-tag-color)";

    const copytagsCounter = document.createElement("span");
    copytagsCounter.innerText = copytagsCount;
    copytagsCounter.style.color = "var(--copyright-tag-color)";

    const chartagsCounter = document.createElement("span");
    chartagsCounter.innerText = chartagsCount;
    chartagsCounter.style.color = "var(--character-tag-color)";

    const gentagsCounter = document.createElement("span");
    gentagsCounter.innerText = gentagsCount;
    gentagsCounter.style.color = "var(--general-tag-color)";

    const metatagsCounter = document.createElement("span");
    metatagsCounter.innerText = metatagsCount;
    metatagsCounter.style.color = "var(--meta-tag-color)";

    const container = document.createElement("div");
    container.style.paddingBottom = "0.3em";
    container.style.color = "gray";

    container.appendChild(totalCounter);
    container.appendChild(document.createTextNode(" tags ("));
    container.appendChild(arttagsCounter);
    container.appendChild(document.createTextNode(" "));
    container.appendChild(copytagsCounter);
    container.appendChild(document.createTextNode(" "));
    container.appendChild(chartagsCounter);
    container.appendChild(document.createTextNode(" "));
    container.appendChild(gentagsCounter);
    container.appendChild(document.createTextNode(" "));
    container.appendChild(metatagsCounter);
    container.appendChild(document.createTextNode(")"));

    tagList.prepend(container);
})();
