// ==UserScript==
// @name         Danbooru Active Uploads
// @namespace    https://github.com/CommentaryRequest/booruscripts
// @version      1.3
// @description  show active uploads in user profiles
// @author       commentary request
// @match        *://*.donmai.us/profile
// @match        *://*.donmai.us/users/*
// @icon         https://www.google.com/s2/favicons?sz=64&domain=donmai.us
// @grant        none
// ==/UserScript==

async function getNumberOfPendingUploads(userLink) {
    const userName = userLink.getAttribute("data-user-name");
    const pendingUploadsQuery = "user:" + userName + "+status:modqueue";
    console.log(pendingUploadsQuery);

    try {
        const response = await fetch("https://danbooru.donmai.us/counts/posts.json?tags=" + pendingUploadsQuery);

        if (response.ok) {
            const data = await response.json();
            return data.counts.posts;
        } else {
            throw new Error("Network response was not ok.");
        }
    } catch (error) {
        console.error("[Active Uploads] Fetch error fetching number of pending posts");
        console.error(error);
    }
}

(async function() {
    'use strict';

    // Get the table
    const statsTable = document.querySelector(".user-statistics");
    const statsTbody = statsTable.children[0];

    // Determine index of the total uploads row
    let totalUploadsIndex;
    if (statsTbody.children[2].children[0].innerText == "Email Address" || statsTbody.children[3].children[0].innerText == "Ban reason" || statsTbody.children[2].children[0].innerText == "Promoter") {
        totalUploadsIndex = 5;
    } else {
        totalUploadsIndex = 4;
    }

    // Get the elements from the table
    const statsTotalUploads = statsTbody.children[totalUploadsIndex];
    const statsDeletedUploads = statsTbody.children[totalUploadsIndex + 1];
    const userLink = document.querySelector(".user");

    // Calculate the active uploads
    const totalUploads = Number.parseInt(statsTotalUploads.children[1].children[0].innerText);
    const deletedUploads = Number.parseInt(statsDeletedUploads.children[1].children[0].innerText);

    // Use await to properly handle the asynchronous nature of getNumberOfPendingUploads
    const pendingUploads = await getNumberOfPendingUploads(userLink); // Make sure to await this
    console.log(pendingUploads);

    const activeUploads = totalUploads - deletedUploads - pendingUploads;

    // Create Active Uploads table row
    const statsActiveUploads = document.createElement("tr");

    // Create Active Uploads <th>
    const statsActiveUploadsTh = document.createElement("th");
    statsActiveUploadsTh.innerText = "Active Posts";
    statsActiveUploads.appendChild(statsActiveUploadsTh);

    // Create Active Uploads <td>
    const statsActiveUploadsTd = document.createElement("td");
    statsActiveUploads.appendChild(statsActiveUploadsTd);

    // Create Active Uploads link
    const statsActiveUploadsLink = document.createElement("a");
    statsActiveUploadsLink.rel = "nofollow";
    statsActiveUploadsLink.href = "/posts?tags=user:" + userLink.getAttribute("data-user-name") + "+status:active";
    statsActiveUploadsLink.innerText = activeUploads;
    statsActiveUploadsTd.appendChild(statsActiveUploadsLink);

    // Create Deletion Ratio text
    const deletionRatio = (deletedUploads / totalUploads) * 100;
    if (!Number.isNaN(deletionRatio)) {
        const statsDeletionRatio = document.createElement("span");
        statsDeletionRatio.innerText = "(" + deletionRatio.toFixed(2) + "%)";
        statsDeletedUploads.children[1].appendChild(statsDeletionRatio);

        statsDeletionRatio.addEventListener("mouseover", () => {
            statsDeletionRatio.innerText = "(" + deletionRatio.toFixed(5) + "%)";
        });
        statsDeletionRatio.addEventListener("mouseleave", () => {
            statsDeletionRatio.innerText = "(" + deletionRatio.toFixed(2) + "%)";
        });
    }

    // Add Active Uploads row into the table after Total Uploads
    statsTotalUploads.insertAdjacentElement("afterend", statsActiveUploads);
})();
