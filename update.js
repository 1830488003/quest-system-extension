// A simplified and adapted update utility based on research of other extensions.

import { getRequestHeaders } from '/scripts/script.js';
import { extension_settings, extension_types } from '/scripts/extensions.js';
import { POPUP_TYPE, callGenericPopup } from '/scripts/poup.js';

// --- Configuration ---
const extensionName = "quest-system-extension";
const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
const gitRepoOwner = "1830488003"; // Your GitHub username
const gitRepoName = "quest-system-extension"; // Your GitHub repository name

let currentVersion;
let latestVersion;
let changelogContent;

/**
 * Fetches the raw content of a file from the GitHub repository.
 * @param {string} filePath The path to the file in the repository.
 * @returns {Promise<string>} A promise that resolves with the file content.
 */
async function fetchRawFileFromGitHub(filePath) {
    const url = `https://raw.githubusercontent.com/${gitRepoOwner}/${gitRepoName}/main/${filePath}`;
    const response = await fetch(url, { cache: 'no-cache' });
    if (!response.ok) {
        throw new Error(`Failed to fetch ${filePath} from GitHub: ${response.statusText}`);
    }
    return response.text();
}

/**
 * Parses the version from a JSON file content.
 * @param {string} content The JSON content as a string.
 * @returns {string} The version string.
 */
function parseVersion(content) {
    try {
        const data = JSON.parse(content);
        if (data && typeof data.version === 'string') {
            return data.version;
        }
        throw new Error("Version field is invalid or not found in manifest.");
    } catch (error) {
        console.error("Failed to parse version:", error);
        return "0.0.0";
    }
}

/**
 * Compares two semantic version strings.
 * @param {string} v1 Version string 1.
 * @param {string} v2 Version string 2.
 * @returns {number} 1 if v1 > v2, -1 if v1 < v2, 0 if equal.
 */
function compareVersions(v1, v2) {
    const parts1 = v1.split('.').map(Number);
    const parts2 = v2.split('.').map(Number);
    const len = Math.max(parts1.length, parts2.length);

    for (let i = 0; i < len; i++) {
        const p1 = parts1[i] || 0;
        const p2 = parts2[i] || 0;
        if (p1 > p2) return 1;
        if (p1 < p2) return -1;
    }
    return 0;
}

/**
 * Performs the actual update by calling the SillyTavern API.
 */
async function performUpdate() {
    toastr.info("正在开始更新...");
    try {
        const response = await fetch('/api/extensions/update', {
            method: 'POST',
            headers: getRequestHeaders(),
            body: JSON.stringify({
                extensionName: extensionName,
                global: extension_types[extensionName] === 'global',
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(errorText || `API Error: ${response.status}`);
        }

        const data = await response.json();
        if (data.isUpToDate) {
            toastr.info("插件已经是最新版本。");
        } else {
            toastr.success("更新成功！将在3秒后刷新页面应用更改。");
            setTimeout(() => location.reload(), 3000);
        }
    } catch (error) {
        console.error("Update failed:", error);
        toastr.error(`更新失败: ${error.message}`);
    }
}

/**
 * Shows the update confirmation dialog with a changelog.
 */
async function showUpdateConfirmDialog() {
    try {
        changelogContent = await fetchRawFileFromGitHub('CHANGELOG.md');
    } catch (error) {
        console.error("Could not fetch changelog, showing generic confirm dialog.", error);
        changelogContent = `发现新版本 ${latestVersion}！您想现在更新吗？`;
    }

    const result = await callGenericPopup(changelogContent, POPUP_TYPE.CONFIRM, {
        okButton: "立即更新",
        cancelButton: "稍后",
        wide: true,
        large: true,
    });

    if (result) {
        await performUpdate();
    }
}


/**
 * Checks for updates and updates the UI accordingly.
 * @param {boolean} isManual - Whether the check was triggered manually by the user.
 */
export async function checkForUpdates(isManual = false) {
    const updateButton = $('#quest-check-update-button');
    const updateIndicator = $('.extension_settings[data-extension-name="quest-system-extension"] .update-indicator');

    if (isManual) {
        updateButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 检查中...');
    }

    try {
        const localManifestText = await (await fetch(`/${extensionFolderPath}/manifest.json?t=${Date.now()}`)).text();
        currentVersion = parseVersion(localManifestText);
        $('#quest-system-current-version').text(currentVersion);

        const remoteManifestText = await fetchRawFileFromGitHub('manifest.json');
        latestVersion = parseVersion(remoteManifestText);

        if (compareVersions(latestVersion, currentVersion) > 0) {
            updateIndicator.show();
            updateButton.html(`<i class="fa-solid fa-gift"></i> 发现新版 ${latestVersion}!`).off('click').on('click', showUpdateConfirmDialog);
            if (isManual) {
                toastr.success(`发现新版本 ${latestVersion}！点击按钮进行更新。`);
            }
        } else {
            updateIndicator.hide();
            if (isManual) {
                toastr.info('您当前已是最新版本。');
            }
        }
    } catch (error) {
        console.error("Update check failed:", error);
        if (isManual) {
            toastr.error(`检查更新失败: ${error.message}`);
        }
    } finally {
        if (isManual) {
            // Restore button state only if it wasn't changed to the "update available" state
            if (compareVersions(latestVersion, currentVersion) <= 0) {
                updateButton.prop('disabled', false).html('<i class="fa-solid fa-cloud-arrow-down"></i> 检查更新');
            }
        }
    }
}
