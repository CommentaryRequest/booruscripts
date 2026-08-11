// ==UserScript==
// @name         animated gif thumbnails
// @namespace    http://example.com
// @version      1
// @description  show gif animations directly from the thumbnails
// @author       commentary request
// @match        https://danbooru.donmai.us/posts*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    const observer = new IntersectionObserver((entries) => {
        entries.forEach(async (entry) => {
            if (entry.isIntersecting) {
                if (!entry.target.title.includes("animated_gif")) {
                    return;
                }
                const id = entry.target.getAttribute("alt").substring(6);
                try {
                    const res = await fetch(`https://danbooru.donmai.us/posts/${id}.json`);
                    if (!res.ok) {
                        throw res;
                    }
                    const data = await res.json();
                    const variants = data.media_asset.variants;
                    let originalImage = "";
                    variants.forEach(variant => {
                        if (variant.type == "original") {
                            originalImage = variant.url;
                        }
                    });
                    console.log(originalImage);
                    entry.target.src = originalImage;
                    const source = entry.target.parentNode.querySelector("source");
                    source.srcset = originalImage;
                    source.type = "image/gif";
                } catch (err) {
                    console.log(`fail to fetch gif file for post #${id}: ${err}`);
                }
            }
        });
    });

    document.querySelectorAll(".post-preview-image").forEach(ppi => {
        observer.observe(ppi);
    });
})();
