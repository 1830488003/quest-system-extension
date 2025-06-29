// 使用 jQuery 确保在 DOM 加载完毕后执行
jQuery(async () => {
    // 定义扩展名称和路径
    const extensionName = "quest-system-extension";
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    // --- Configuration & Constants ---
    const QUEST_POPUP_ID = 'th-quest-system-popup-v049'; // Use a versioned ID
    // --- Storage Keys ---
    // 旧的基于聊天会话的存储键，用于数据迁移
    const PLAYER_QUEST_VARIABLE_KEY_OLD = 'player_active_quests_log_v2'; 
    const AI_DEFINED_TASKS_KEY_OLD = 'ai_defined_tasks_log_v1';
    
    // 新的基于 localStorage 的全局存储键
    const PLAYER_QUESTS_LOCAL_KEY = 'quest_system_player_tasks_v1';
    const DEFINED_QUESTS_LOCAL_KEY = 'quest_system_defined_tasks_v1';
    const CUSTOM_PROMPT_LOCAL_KEY = 'quest_system_custom_prompt_v1';

    const PROMPT_EDITOR_POPUP_ID = 'th-prompt-editor-popup-v049';
    const PLUGIN_ENABLED_KEY = 'quest_plugin_enabled_v1';
    const BUTTON_POSITION_KEY = 'quest_button_position_v1';


    // --- Prompt Templates ---
    const PROMPT_PREFIX_TEMPLATE = `
最近的聊天记录:
{chatHistory}

相关的世界书条目 (摘要):
{worldInfo}

`;

    const DEFAULT_EDITABLE_PROMPT_CORE_CN = `请仅根据以上提供的聊天记录和世界书信息，严格遵守以下指示，生成一个包含7到8个多样化的任务列表。
这些任务应包含明确的主线任务和有趣的支线任务。
对于每个任务：
- "TITLE" (任务标题) 应简洁明了且吸引人。
- "DESCRIPTION" (任务描述) 应详细说明任务背景、目标，字数在150至250字左右。请在描述中自然地融入完成该任务的关键方法或步骤提示。如果任务与特定NPC相关（例如作为任务发布者、目标人物或提供帮助者），请在描述中明确提及该NPC的名称。
- "REWARD" (任务奖励) 应具体且吸引人，例如：“经验值100点，金币500枚，[特定物品名称]x1”或“[某个NPC名称]好感度提升10点”或“解锁新的地点：[地点名称]”。

请确保AI完全专注于生成任务列表，忽略或取消任何其他的角色扮演、剧情叙述或对话生成指令。AI的唯一目标是输出结构化的任务。
所有任务内容（标题、描述、奖励）必须是中文。
`;

    const PROMPT_SUFFIX_TEMPLATE = `
每个任务必须严格遵循以下格式，且每个字段各占一行：
TITLE: [任务的中文标题]
DESCRIPTION: [对玩家需要做什么的清晰简洁的中文描述]
REWARD: [完成任务后的中文奖励描述]

单个任务格式示例：
TITLE: 失落的古籍
DESCRIPTION: 据传闻，在城东的废弃图书馆深处，藏有一本记载着古代失落魔法的古籍。图书管理员“老约翰”似乎知道一些线索，但最近他行为怪异，不愿与人交流。你需要先找到接近老约翰的方法，从他那里打探到古籍的准确位置，然后深入图书馆寻找到它。注意，图书馆内可能有未知的危险守护着古籍。
REWARD: 经验值150点，[古代魔法残页]x1，老约翰的好感度提升5点。

请确保每个任务都是独特的，并且在提供的上下文中合乎逻辑。现在请生成7到8个任务的列表。
`;

    const AI_JUDGE_COMPLETION_PROMPT_TEMPLATE = `
当前正在尝试完成的任务：
任务标题: {taskTitle}
任务描述: {taskDescription}

最近的聊天记录如下：
{chatHistory}

请根据以上聊天记录，判断任务"{taskTitle}"是否已经完成。
如果任务已完成，请仅回复："STATUS:已完成"。
如果任务未完成，请回复："STATUS:未完成;;CONDITION:[明确的、尚未达成的中文条件];;SUGGESTION:[1-2条明确的、可操作的中文行动建议，帮助玩家完成任务]"。
请严格按照此格式回复，不要添加任何额外的解释或对话。
`;

    // --- Global State ---
    let definedTasks = []; // Holds AI-generated tasks, now persisted across sessions
    let playerTasksStatus = {}; // Persisted in chat variables
    let currentUserModifiedEditablePromptCore = DEFAULT_EDITABLE_PROMPT_CORE_CN;
    let currentChatFileIdentifier = "unknown_chat_init"; // Tracks the current chat file

    // A helper to safely escape HTML
    const escapeHtml = (unsafe) => {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return String(unsafe)
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, '\\"')
            .replace(/'/g, "&#039;");
    };
    
    // --- Core API Functions ---

    // A single, robust check for necessary APIs
    function checkAPIs() {
        if (typeof jQuery === 'undefined' || typeof SillyTavern === 'undefined' || typeof TavernHelper === 'undefined' || typeof toastr === 'undefined') {
            console.error('[QuestSystem] One or more critical global APIs are not available.');
            return false;
        }
        return true;
    }

    async function injectSystemMessage(messageContent) {
        if (!checkAPIs()) {
            toastr.error("无法注入系统消息：核心API未就绪。");
            return;
        }
        try {
            await TavernHelper.createChatMessages([{
                role: 'system',
                name: '任务系统',
                message: messageContent,
                is_hidden: false
            }], { refresh: 'affected' });
        } catch (error) {
            console.error('[QuestSystem] Error injecting system message:', error);
            toastr.error(`注入系统消息失败: ${error.message}`);
        }
    }

    // --- Chat & Data Management (Character-Specific) ---

    /**
     * Cleans a chat filename by removing the path and extension.
     * @param {string} fileName - The original filename.
     * @returns {string} The cleaned filename.
     */
    function cleanChatName(fileName) {
        if (!fileName || typeof fileName !== 'string') return "unknown_chat_source";
        let cleanedName = fileName;
        if (fileName.includes("/") || fileName.includes("\\")) {
            const parts = fileName.split(/[\\/]/);
            cleanedName = parts[parts.length - 1];
        }
        return cleanedName.replace(/\.jsonl$/, "").replace(/\.json$/, "");
    }

    /**
     * Gets the latest chat filename identifier.
     * @returns {Promise<string>} The latest chat filename.
     */
    async function getLatestChatName() {
        let newChatFileIdentifier = "unknown_chat_fallback";
        try {
            let chatNameFromCommand = null;
            if (TavernHelper && typeof TavernHelper.triggerSlash === 'function') {
                chatNameFromCommand = await TavernHelper.triggerSlash("/getchatname");
            }

            if (chatNameFromCommand && typeof chatNameFromCommand === 'string' && chatNameFromCommand.trim() && chatNameFromCommand.trim() !== 'null' && chatNameFromCommand.trim() !== 'undefined') {
                newChatFileIdentifier = cleanChatName(chatNameFromCommand.trim());
            } else {
                const contextFallback = SillyTavern.getContext ? SillyTavern.getContext() : null;
                if (contextFallback && contextFallback.chat && typeof contextFallback.chat === 'string') {
                    const chatNameFromContext = cleanChatName(contextFallback.chat);
                    if (chatNameFromContext && !chatNameFromContext.startsWith("unknown_chat")) {
                        newChatFileIdentifier = chatNameFromContext;
                    }
                }
            }
        } catch (error) {
            console.error(`[QuestSystem] Error getting chat name:`, error);
        }
        return newChatFileIdentifier;
    }

    // Generates localStorage keys specific to the current character.
    const getPlayerQuestsKey = () => `${PLAYER_QUESTS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getDefinedQuestsKey = () => `${DEFINED_QUESTS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getCustomPromptKey = () => `${CUSTOM_PROMPT_LOCAL_KEY}_${currentChatFileIdentifier}`;

    /**
     * Loads all task data from localStorage for the current character.
     * Includes a one-time migration from old chat variables.
     */
    async function loadAllTaskData() {
        if (!checkAPIs()) return;

        let migrationNeeded = false;
        let migratedPlayerTasks = {};
        let migratedDefinedTasks = [];

        // Step 1: Check for old data in chat variables for migration.
        try {
            const variables = await TavernHelper.getVariables({ type: 'chat' });
            const oldPlayerTasksRaw = variables ? variables[PLAYER_QUEST_VARIABLE_KEY_OLD] : null;
            const oldDefinedTasksRaw = variables ? variables[AI_DEFINED_TASKS_KEY_OLD] : null;

            if (oldPlayerTasksRaw) {
                migratedPlayerTasks = JSON.parse(oldPlayerTasksRaw);
                migrationNeeded = true;
            }
            if (oldDefinedTasksRaw) {
                migratedDefinedTasks = JSON.parse(oldDefinedTasksRaw);
                migrationNeeded = true;
            }

            if (migrationNeeded) {
                console.log('[QuestSystem] Old chat-based data found. Preparing for migration to localStorage.');
                toastr.info('检测到旧版任务数据，将自动迁移至新版角色专属存储。');
            }
        } catch (error) {
            console.error('[QuestSystem] Error checking for old data for migration:', error);
            migrationNeeded = false; // Don't migrate if there's an error.
        }

        // Step 2: Load data from localStorage or use migrated data.
        try {
            const playerTasksRaw = localStorage.getItem(getPlayerQuestsKey());
            const definedTasksRaw = localStorage.getItem(getDefinedQuestsKey());
            const customPromptRaw = localStorage.getItem(getCustomPromptKey());

            if (migrationNeeded) {
                playerTasksStatus = migratedPlayerTasks;
                definedTasks = migratedDefinedTasks;
            } else {
                playerTasksStatus = playerTasksRaw ? JSON.parse(playerTasksRaw) : {};
                definedTasks = definedTasksRaw ? JSON.parse(definedTasksRaw) : [];
            }
            
            currentUserModifiedEditablePromptCore = customPromptRaw || DEFAULT_EDITABLE_PROMPT_CORE_CN;

        } catch (error) {
            console.error('[QuestSystem] Error loading data from localStorage:', error);
            toastr.error(`从本地存储加载任务数据失败: ${error.message}`);
            playerTasksStatus = {};
            definedTasks = [];
            currentUserModifiedEditablePromptCore = DEFAULT_EDITABLE_PROMPT_CORE_CN;
        }
        
        // Step 3: If migration occurred, save to new location and clear old data.
        if (migrationNeeded) {
            await saveAllTaskData(false); // Save to localStorage
            await TavernHelper.insertOrAssignVariables({ 
                [PLAYER_QUEST_VARIABLE_KEY_OLD]: null,
                [AI_DEFINED_TASKS_KEY_OLD]: null
            }, { type: 'chat' });
            console.log('[QuestSystem] Migration successful. Old chat variable data cleared.');
            toastr.success('任务数据迁移成功！');
        }
    }

    /**
     * Saves all task data to localStorage for the current character.
     * @param {boolean} refreshUI - Whether to refresh the UI after saving.
     */
    async function saveAllTaskData(refreshUI = true) {
        if (!checkAPIs()) return;
        try {
            localStorage.setItem(getPlayerQuestsKey(), JSON.stringify(playerTasksStatus));
            localStorage.setItem(getDefinedQuestsKey(), JSON.stringify(definedTasks));
            localStorage.setItem(getCustomPromptKey(), currentUserModifiedEditablePromptCore);
            
            if (refreshUI) {
                refreshQuestPopupUI();
            }
        } catch (error) {
            console.error('[QuestSystem] Error saving data to localStorage:', error);
            toastr.error(`保存任务数据到本地存储时出错: ${error.message}`);
        }
    }

    // --- Task Actions ---

    async function acceptTask(taskId) {
        if (!checkAPIs()) return;
        const taskIndex = definedTasks.findIndex(t => t.id === taskId);
        if (taskIndex === -1) { toastr.error(`任务 ${taskId} 未定义！`); return; }
        
        const taskDef = definedTasks.splice(taskIndex, 1)[0]; 
        
        playerTasksStatus[taskId] = {
            status: 'active',
            startTime: Date.now(),
            title: taskDef.title,
            description: taskDef.description,
            rewardMessage: taskDef.rewardMessage,
            isAIGenerated: taskDef.isAIGenerated || false
        };
        
        await saveAllTaskData();
        toastr.success(`已接受任务: ${taskDef.title}`);
        await injectSystemMessage(`${SillyTavern.name1 || '玩家'} 已接受任务: "${taskDef.title}"。\n任务描述: ${taskDef.description}`);
    }

    async function abandonTask(taskId) {
        if (!checkAPIs()) return;
        const taskInPlayerLog = playerTasksStatus[taskId];
        if (!taskInPlayerLog || taskInPlayerLog.status !== 'active') {
            toastr.warning(`任务 "${taskInPlayerLog?.title || taskId}" 并非激活状态，无法放弃。`);
            return;
        }
        
        const abandonedTask = {
            id: taskId,
            title: taskInPlayerLog.title,
            description: taskInPlayerLog.description,
            rewardMessage: taskInPlayerLog.rewardMessage,
            isAIGenerated: taskInPlayerLog.isAIGenerated || false
        };
        
        delete playerTasksStatus[taskId];
        
        if (abandonedTask.isAIGenerated && !definedTasks.some(t => t.id === taskId)) {
            definedTasks.push(abandonedTask);
        }
        
        await injectSystemMessage(`${SillyTavern.name1 || '玩家'} 已放弃任务: "${abandonedTask.title}".`);
        await saveAllTaskData();
        toastr.info(`任务已放弃: ${abandonedTask.title}`);
    }

    async function completeTask(taskId) {
        if (!checkAPIs()) return;
        const taskData = playerTasksStatus[taskId];
        if (!taskData || taskData.status !== 'active') {
            toastr.warning(`任务 "${taskData?.title || taskId}" 状态异常或非激活。`);
            return;
        }

        const genButton = $(`#${QUEST_POPUP_ID} .quest-item[data-task-id="${taskId}"] .complete`);
        const originalButtonHtml = genButton.html();
        genButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> AI判断中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 9);
            const messages = await TavernHelper.getChatMessages(`${startMessageId}-${lastMessageId}`, { include_swipes: false });
            const chatHistoryString = messages.length > 0 ? messages.map(m => `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`).join('\n') : "无最近聊天记录。";

            const judgePrompt = AI_JUDGE_COMPLETION_PROMPT_TEMPLATE
                .replace(/{taskTitle}/g, escapeHtml(taskData.title))
                .replace('{taskDescription}', escapeHtml(taskData.description))
                .replace('{chatHistory}', chatHistoryString);
            
            const aiResponse = await TavernHelper.generateRaw({ ordered_prompts: [{ role: 'user', content: judgePrompt }] });
            
            if (aiResponse.includes("STATUS:已完成")) {
                taskData.status = 'completed';
                taskData.endTime = Date.now();
                const reward = taskData.rewardMessage || "无特定奖励";
                await injectSystemMessage(`${SillyTavern.name1 || '玩家'} 已完成任务: "${taskData.title}"！获得奖励: ${reward}`);
                toastr.success(`任务完成: ${taskData.title}`);
                await saveAllTaskData();
            } else if (aiResponse.includes("STATUS:未完成")) {
                const condition = aiResponse.match(/CONDITION:\[(.*?)]/)?.[1] || "未知";
                const suggestion = aiResponse.match(/SUGGESTION:\[(.*?)]/)?.[1] || "请继续努力。";
                await injectSystemMessage(`任务 "${taskData.title}" 尚未完成。\n你需要: ${condition}\n或许可以尝试: ${suggestion}`);
                toastr.info(`任务 "${taskData.title}" 尚未完成。`);
                refreshQuestPopupUI();
            } else {
                throw new Error("AI未能明确判断任务状态。");
            }
        } catch (error) {
            console.error('[QuestSystem] Error during AI task completion judgment:', error);
            toastr.error(`AI判断任务完成时出错: ${error.message}`);
        } finally {
            const finalButton = $(`#${QUEST_POPUP_ID} .quest-item[data-task-id="${taskId}"] .complete`);
            if(finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }

    async function generateAndAddNewAiTask() {
        if (!checkAPIs()) return;
        const genButton = $(`#${QUEST_POPUP_ID} #trigger-ai-task-generation`);
        const originalButtonHtml = genButton.html();
        genButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> AI思考中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 4);
            const messages = await TavernHelper.getChatMessages(`${startMessageId}-${lastMessageId}`, { include_swipes: false });
            const chatHistoryString = messages.length > 0 ? messages.map(m => `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`).join('\n') : "无最近聊天记录。";

            let worldInfoString = "未加载相关的世界设定信息。";
            const primaryLorebookName = await TavernHelper.getCurrentCharPrimaryLorebook();
            if (primaryLorebookName) {
                const lorebookEntries = await TavernHelper.getLorebookEntries(primaryLorebookName);
                if (lorebookEntries.length > 0) {
                    worldInfoString = lorebookEntries.filter(e => e.enabled && e.content).slice(0, 5).map(e => `条目: ${e.comment}\n内容: ${e.content}`).join('\n\n');
                }
            }

            const finalUserPrompt = PROMPT_PREFIX_TEMPLATE.replace('{chatHistory}', chatHistoryString).replace('{worldInfo}', worldInfoString)
                                  + currentUserModifiedEditablePromptCore
                                  + PROMPT_SUFFIX_TEMPLATE;

            const generatedText = await TavernHelper.generateRaw({
                ordered_prompts: [{ role: 'user', content: finalUserPrompt }],
                max_new_tokens: 2048
            });

            const questBlocksRegex = /^\s*TITLE:\s*(.*?)\s*DESCRIPTION:\s*(.*?)\s*REWARD:\s*(.*?)(?=\n\s*TITLE:|$)/gims;
            let match;
            let tasksGeneratedCount = 0;
            while ((match = questBlocksRegex.exec(generatedText)) !== null) {
                const newTask = {
                    id: 'ai_task_' + Date.now() + '_' + tasksGeneratedCount,
                    title: match[1].trim(),
                    description: match[2].trim(),
                    rewardMessage: match[3].trim(),
                    isAIGenerated: true
                };
                if (!definedTasks.some(t => t.title === newTask.title) && !Object.values(playerTasksStatus).some(pt => pt.title === newTask.title)) {
                    definedTasks.push(newTask);
                    tasksGeneratedCount++;
                }
            }

            if (tasksGeneratedCount > 0) {
                toastr.success(`AI成功生成了 ${tasksGeneratedCount} 个新任务!`);
                await saveAllTaskData();
            } else {
                toastr.error("AI返回的任务格式不正确，无法解析。");
            }
        } catch (error) {
            console.error('[QuestSystem] Error generating AI task:', error);
            toastr.error(`AI任务生成失败: ${error.message}`);
        } finally {
            const finalButton = $(`#${QUEST_POPUP_ID} #trigger-ai-task-generation`);
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }
    // --- Updater Module ---
    const Updater = {
        gitRepoOwner: "1830488003",
        gitRepoName: "quest-system-extension",
        currentVersion: "0.0.0",
        latestVersion: "0.0.0",
        changelogContent: "",

        async fetchRawFileFromGitHub(filePath) {
            const url = `https://raw.githubusercontent.com/${this.gitRepoOwner}/${this.gitRepoName}/main/${filePath}`;
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(`Failed to fetch ${filePath} from GitHub: ${response.statusText}`);
            }
            return response.text();
        },

        parseVersion(content) {
            try {
                return JSON.parse(content).version || "0.0.0";
            } catch (error) {
                console.error("Failed to parse version:", error);
                return "0.0.0";
            }
        },

        compareVersions(v1, v2) {
            const parts1 = v1.split('.').map(Number);
            const parts2 = v2.split('.').map(Number);
            for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
                const p1 = parts1[i] || 0;
                const p2 = parts2[i] || 0;
                if (p1 > p2) return 1;
                if (p1 < p2) return -1;
            }
            return 0;
        },

        async performUpdate() {
            const { getRequestHeaders } = SillyTavern.getContext().common;
            const { extension_types } = SillyTavern.getContext().extensions;
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
                if (!response.ok) throw new Error(await response.text());

                toastr.success("更新成功！将在3秒后刷新页面应用更改。");
                setTimeout(() => location.reload(), 3000);
            } catch (error) {
                toastr.error(`更新失败: ${error.message}`);
            }
        },

        async showUpdateConfirmDialog() {
            const { POPUP_TYPE, callGenericPopup } = SillyTavern.getContext().popup;
            try {
                this.changelogContent = await this.fetchRawFileFromGitHub('CHANGELOG.md');
            } catch (error) {
                this.changelogContent = `发现新版本 ${this.latestVersion}！您想现在更新吗？`;
            }
            if (await callGenericPopup(this.changelogContent, POPUP_TYPE.CONFIRM, { okButton: "立即更新", cancelButton: "稍后", wide: true, large: true })) {
                await this.performUpdate();
            }
        },

        async checkForUpdates(isManual = false) {
            const updateButton = $('#quest-check-update-button');
            const updateIndicator = $('.extension_settings[data-extension-name="quest-system-extension"] .update-indicator');
            if (isManual) {
                updateButton.prop('disabled', true).html('<i class="fas fa-spinner fa-spin"></i> 检查中...');
            }
            try {
                const localManifestText = await (await fetch(`/${extensionFolderPath}/manifest.json?t=${Date.now()}`)).text();
                this.currentVersion = this.parseVersion(localManifestText);
                $('#quest-system-current-version').text(this.currentVersion);

                const remoteManifestText = await this.fetchRawFileFromGitHub('manifest.json');
                this.latestVersion = this.parseVersion(remoteManifestText);

                if (this.compareVersions(this.latestVersion, this.currentVersion) > 0) {
                    updateIndicator.show();
                    updateButton.html(`<i class="fa-solid fa-gift"></i> 发现新版 ${this.latestVersion}!`).off('click').on('click', () => this.showUpdateConfirmDialog());
                    if (isManual) toastr.success(`发现新版本 ${this.latestVersion}！点击按钮进行更新。`);
                } else {
                    updateIndicator.hide();
                    if (isManual) toastr.info('您当前已是最新版本。');
                }
            } catch (error) {
                if (isManual) toastr.error(`检查更新失败: ${error.message}`);
            } finally {
                if (isManual && this.compareVersions(this.latestVersion, this.currentVersion) <= 0) {
                    updateButton.prop('disabled', false).html('<i class="fa-solid fa-cloud-arrow-down"></i> 检查更新');
                }
            }
        }
    };

    // --- UI Functions ---
    function refreshQuestPopupUI() {
        const questPopup = $(`#${QUEST_POPUP_ID}`);
        if (questPopup.length > 0) {
            const newHtml = createQuestPopupHtml();
            questPopup.replaceWith(newHtml);
            const newQuestPopup = $(`#${QUEST_POPUP_ID}`);
            if (newQuestPopup.length) {
                bindQuestPopupEvents(newQuestPopup);
            }
        }
    }

    function createQuestPopupHtml() {
        let html = `<div id="${QUEST_POPUP_ID}" class="quest-popup-container">`;
        html += `<button class="quest-popup-close-button">&times;</button>`;
        html += `<div class="quest-popup-body">`;

        // AI Section
        html += `<div class="quest-section ai-generator">
            <h3><i class="fas fa-magic"></i> AI 任务生成器</h3>
            <p class="quest-description">点击生成AI任务，或先编辑核心指令以定制任务。</p>
            <div class="quest-actions">
                <button id="trigger-ai-task-generation" class="quest-button"><i class="fas fa-magic"></i> 生成AI任务</button>
                <button id="edit-ai-prompt-button" class="quest-button edit-prompt"><i class="fas fa-edit"></i> 编辑指令</button>
            </div>
        </div>`;

        // Active Quests
        const activeTasks = Object.entries(playerTasksStatus).filter(([_, data]) => data.status === 'active');
        html += `<div class="quest-section active-quests"><h3><i class="fas fa-hourglass-half"></i> 当前任务</h3>`;
        if (activeTasks.length > 0) {
            activeTasks.forEach(([id, task]) => {
                html += `<div class="quest-item" data-task-id="${id}">
                    <h4 class="quest-title">${escapeHtml(task.title)} ${task.isAIGenerated ? '<i class="fas fa-robot" title="AI生成"></i>' : ''}</h4>
                    <p class="quest-description">${escapeHtml(task.description)}</p>
                    <div class="quest-actions">
                        <button class="quest-button complete" data-action="complete" data-task-id="${id}"><i class="fas fa-check"></i> 完成</button>
                        <button class="quest-button abandon" data-action="abandon" data-task-id="${id}"><i class="fas fa-times"></i> 放弃</button>
                    </div>
                </div>`;
            });
        } else { html += `<p class="no-tasks">无进行中的任务。</p>`; }
        html += `</div>`;

        // Available Quests
        const availableTasks = definedTasks.filter(task => !playerTasksStatus[task.id]);
        html += `<div class="quest-section available-quests"><h3><i class="fas fa-clipboard-list"></i> 可接任务</h3>`;
        if (availableTasks.length > 0) {
            availableTasks.forEach(task => {
                html += `<div class="quest-item" data-task-id="${task.id}">
                    <h4 class="quest-title">${escapeHtml(task.title)} <i class="fas fa-robot" title="AI生成"></i></h4>
                    <p class="quest-description">${escapeHtml(task.description)}</p>
                    <div class="quest-actions">
                         <button class="quest-button accept" data-action="accept" data-task-id="${task.id}"><i class="fas fa-plus"></i> 接受</button>
                    </div>
                </div>`;
            });
        } else { html += `<p class="no-tasks">暂无新任务，请尝试AI生成。</p>`; }
        html += `</div>`;
        
        // Completed Quests
        const completedTasks = Object.entries(playerTasksStatus).filter(([_, data]) => data.status === 'completed');
        html += `<div class="quest-section completed-quests"><h3><i class="fas fa-check-double"></i> 已完成任务</h3>`;
        if (completedTasks.length > 0) {
            completedTasks.forEach(([id, task]) => {
                html += `<div class="quest-item completed-quest" data-task-id="${id}">
                    <h4 class="quest-title">${escapeHtml(task.title)} ${task.isAIGenerated ? '<i class="fas fa-robot" title="AI生成"></i>' : ''}</h4>
                    <p class="quest-description">${escapeHtml(task.description)}</p>
                </div>`;
            });
        } else { html += `<p class="no-tasks">尚未完成任何任务。</p>`; }
        html += `</div>`;

        html += `</div></div>`;
        return html;
    }
    
    function bindQuestPopupEvents(popupContent$) {
        popupContent$.off('.questSystem').on('click.questSystem', '.quest-button, .quest-popup-close-button', async function(event) {
            event.stopPropagation();
            const button = $(this);

            if (button.hasClass('quest-popup-close-button')) {
                closeQuestLogPopup();
                return;
            }
            
            const buttonId = button.attr('id');
            const action = button.data('action');
            const taskId = button.data('task-id');

            if (buttonId === 'trigger-ai-task-generation') await generateAndAddNewAiTask();
            if (buttonId === 'edit-ai-prompt-button') showPromptEditorPopup();

            if (action && taskId) {
                 if (action === 'accept') await acceptTask(taskId);
                 if (action === 'abandon') await abandonTask(taskId);
                 if (action === 'complete') await completeTask(taskId);
            }
        });
    }

    function showPromptEditorPopup() {
        const editorHtml = `<div id="${PROMPT_EDITOR_POPUP_ID}" style="display: flex; flex-direction: column; gap: 15px; padding:15px; background-color: #2e2e34; color: #f0f0f0;">
            <h3>AI任务生成核心指令编辑器</h3>
            <p>您正在编辑AI生成任务的<b>核心指令</b>部分。</p>
            <textarea id="ai-prompt-editor-textarea" style="width: 98%; min-height: 200px; background-color: #25252a; color: #f0f0f0;">${escapeHtml(currentUserModifiedEditablePromptCore)}</textarea>
            <div style="text-align: right;">
                <button id="restore-default-prompt-button" class="menu_button" style="margin-right: 10px;">恢复默认</button>
                <button id="save-custom-prompt-button" class="menu_button" style="background-color: #28a745;">保存</button>
            </div>
        </div>`;

        SillyTavern.getContext().callGenericPopup(editorHtml, SillyTavern.getContext().POPUP_TYPE.DISPLAY, "编辑AI任务核心指令", { wide: true, large: true });
        
        setTimeout(() => {
            const popupInstance = $(`#${PROMPT_EDITOR_POPUP_ID}`).closest('dialog[open]');
            if (!popupInstance.length) return;

            popupInstance.find('#save-custom-prompt-button').on('click.questEditor', async function() {
                currentUserModifiedEditablePromptCore = popupInstance.find('#ai-prompt-editor-textarea').val();
                await saveAllTaskData(false); // Save all data including the new prompt
                toastr.success("核心指令已为当前角色保存！");
                popupInstance.find('.popup_close').trigger('click');
            });

            popupInstance.find('#restore-default-prompt-button').on('click.questEditor', async function() {
                currentUserModifiedEditablePromptCore = DEFAULT_EDITABLE_PROMPT_CORE_CN;
                popupInstance.find('#ai-prompt-editor-textarea').val(DEFAULT_EDITABLE_PROMPT_CORE_CN);
                await saveAllTaskData(false); // Save all data including the default prompt
                toastr.info("核心指令已为当前角色恢复为默认设置。");
            });
        }, 300);
    }
    
    function closeQuestLogPopup() {
        const popup = $(`#${QUEST_POPUP_ID}`);
        if (popup.length) {
            popup.remove();
        }
    }

    function toggleQuestLogPopup() {
        const questPopup = $(`#${QUEST_POPUP_ID}`);
        if (questPopup.length > 0) {
            closeQuestLogPopup();
        } else {
            showQuestLogPopup();
        }
    }

    async function showQuestLogPopup() {
        if (!checkAPIs()) return;
        closeQuestLogPopup();
        const popupContentHtml = createQuestPopupHtml();
        $('body').append(popupContentHtml);
        const popupInstance = $(`#${QUEST_POPUP_ID}`);
        if (popupInstance.length) {
            bindQuestPopupEvents(popupInstance);
        }
    }
    
    function makeButtonDraggable(button) {
        let isDragging = false;
        let wasDragged = false;
        let offset = { x: 0, y: 0 };

        // 统一获取事件坐标（兼容鼠标和触摸）
        function getEventCoords(e) {
            // 对于触摸事件，e.originalEvent.touches[0] 包含了坐标
            if (e.type.startsWith('touch')) {
                return { x: e.originalEvent.touches[0].clientX, y: e.originalEvent.touches[0].clientY };
            }
            // 对于鼠标事件，直接从 e 获取
            return { x: e.clientX, y: e.clientY };
        }

        // 拖动开始的处理函数
        function dragStart(e) {
            if (e.target !== button[0]) return;
            isDragging = true;
            wasDragged = false;
            const coords = getEventCoords(e);
            offset.x = coords.x - button.offset().left;
            offset.y = coords.y - button.offset().top;
            button.css('cursor', 'grabbing');
            $('body').css({
                'user-select': 'none',
                '-webkit-user-select': 'none' // 兼容旧版 WebKit
            });
        }

        // 拖动过程中的处理函数
        function dragMove(e) {
            if (!isDragging) return;
            e.preventDefault(); // 阻止触摸时的页面滚动
            wasDragged = true;
            
            const coords = getEventCoords(e);
            let newX = coords.x - offset.x;
            let newY = coords.y - offset.y;
            
            // 限制在视口内
            newX = Math.max(0, Math.min(newX, window.innerWidth - button.outerWidth()));
            newY = Math.max(0, Math.min(newY, window.innerHeight - button.outerHeight()));

            button.css({ top: newY + 'px', left: newX + 'px', right: '', bottom: '' });
        }

        // 拖动结束的处理函数
        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            button.css('cursor', 'grab');
            $('body').css({
                'user-select': 'auto',
                '-webkit-user-select': 'auto'
            });
            // 只有在实际拖动后才保存位置
            if (wasDragged) {
                localStorage.setItem(BUTTON_POSITION_KEY, JSON.stringify({ top: button.css('top'), left: button.css('left') }));
            }
        }

        // 为按钮绑定鼠标和触摸事件
        button.on('mousedown touchstart', dragStart);
        $(document).on('mousemove touchmove', dragMove);
        $(document).on('mouseup touchend', dragEnd);
        
        // 单击事件处理
        button.on('click', function(e) {
            // 如果按钮被拖动了，则阻止单击事件（不打开弹窗）
            if (wasDragged) {
                e.stopPropagation();
                e.preventDefault();
                return;
            }
            // 否则，这是一个真正的单击，切换弹窗
            toggleQuestLogPopup();
        });
    }

    // --- Initialization ---

    /**
     * Resets the script's state when a new chat is detected.
     * This involves reloading all data for the new character.
     */
    async function resetForNewChat() {
        const newChatName = await getLatestChatName();
        if (newChatName !== currentChatFileIdentifier) {
            console.log(`[QuestSystem] Chat switched from "${currentChatFileIdentifier}" to "${newChatName}". Reloading data.`);
            toastr.info(`任务日志已切换至角色: ${newChatName}`);
            currentChatFileIdentifier = newChatName;
            await loadAllTaskData(); // Load data for the new character
            refreshQuestPopupUI(); // Refresh the UI if it's open
        }
    }

    async function initialize() {
        console.log('[QuestSystem] Initializing...');

        if (!checkAPIs()) return;

        // Initial load
        currentChatFileIdentifier = await getLatestChatName();
        await loadAllTaskData();

        // Set up a poller to detect chat switches
        setInterval(resetForNewChat, 2000); // Check every 2 seconds

        // Create the button
        const buttonId = 'quest-log-entry-button';
        if ($(`#${buttonId}`).length === 0) {
            const buttonHtml = `<div id="${buttonId}" title="任务日志" class="fa-solid fa-scroll"></div>`;
            $('body').append(buttonHtml);
            const questButton = $(`#${buttonId}`);
            
            // Make it draggable
            makeButtonDraggable(questButton);
            
            // Set initial position and visibility
            const savedPosition = JSON.parse(localStorage.getItem(BUTTON_POSITION_KEY));
            if (savedPosition) {
                questButton.css({ top: savedPosition.top, left: savedPosition.left });
            } else {
                // Default position if none is saved
                questButton.css({ top: '60px', right: '10px', left: 'auto' });
            }

            const isPluginEnabled = localStorage.getItem(PLUGIN_ENABLED_KEY) !== 'false';
            questButton.toggle(isPluginEnabled);
            
            // The click event is now handled inside makeButtonDraggable to distinguish between click and drag.

            // Add a resize listener to keep the button in view after it has been dragged
            let resizeTimeout;
            $(window).on('resize.questSystem', function() {
                // Only run this logic if the position has been explicitly set by the user (dragged)
                if (!localStorage.getItem(BUTTON_POSITION_KEY)) return;

                const button = $(`#${'quest-log-entry-button'}`);
                if (!button.length || !button.is(':visible')) return;
                
                clearTimeout(resizeTimeout);
                resizeTimeout = setTimeout(() => {
                    const rect = button[0].getBoundingClientRect();
                    const winWidth = window.innerWidth;
                    const winHeight = window.innerHeight;

                    let newX = rect.left;
                    let newY = rect.top;
                    
                    let needsUpdate = false;

                    // Check horizontal bounds
                    if (rect.right > winWidth) {
                        newX = winWidth - rect.width;
                        needsUpdate = true;
                    } else if (rect.left < 0) {
                        newX = 0;
                        needsUpdate = true;
                    }

                    // Check vertical bounds
                    if (rect.bottom > winHeight) {
                        newY = winHeight - rect.height;
                        needsUpdate = true;
                    } else if (rect.top < 0) {
                        newY = 0;
                        needsUpdate = true;
                    }

                    if (needsUpdate) {
                        // Position is relative to the viewport, which is what we need for 'fixed' position
                        const newPos = { top: newY + 'px', left: newX + 'px' };
                        button.css(newPos);
                        // Also remove 'right' and 'bottom' properties if they exist from default styling
                        button.css({right: '', bottom: ''});
                        localStorage.setItem(BUTTON_POSITION_KEY, JSON.stringify(newPos));
                    }
                }, 50); // A small delay is fine
            });
        }
        
        // Load settings and bind new standard panel events
        try {
            const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
            $("#extensions_settings2").append(settingsHtml);
            
            const extensionSettings = $('.extension_settings[data-extension-name="quest-system-extension"]');

            // 1. Bind standard inline-drawer toggle
            extensionSettings.find('.inline-drawer-toggle').on('click', function() {
                $(this).closest('.inline-drawer').toggleClass('open');
            });

            // 2. Bind plugin toggle switch
            const pluginToggle = extensionSettings.find('#quest-plugin-toggle');
            const isPluginEnabled = localStorage.getItem(PLUGIN_ENABLED_KEY) !== 'false';
            pluginToggle.prop('checked', isPluginEnabled);

            pluginToggle.on('change', function() {
                const enabled = $(this).is(':checked');
                localStorage.setItem(PLUGIN_ENABLED_KEY, enabled);
                $(`#${buttonId}`).toggle(enabled);
                toastr.info(`任务浮动按钮已${enabled ? '启用' : '禁用'}`);
            });

            // 3. Bind edit prompt button
            extensionSettings.find('#quest-edit-prompt-button').on('click', function() {
                showPromptEditorPopup();
            });
            
            // 4. Bind update button and run initial check
            extensionSettings.find('#quest-check-update-button').on('click', () => Updater.checkForUpdates(true));
            Updater.checkForUpdates(false); // Initial silent check

            // Make sure the drawer is closed by default
            extensionSettings.find('.inline-drawer').removeClass('open');

        } catch (error) {
            console.error("加载任务系统扩展的 settings.html 或绑定事件失败：", error);
        }

        toastr.success("任务系统(完整版)已加载！");
        console.log('[QuestSystem] Initialization complete.');
    }

    /**
     * Waits for all critical SillyTavern APIs to be available before initializing the extension.
     * This prevents race conditions and errors during page load.
     */
    function runWhenReady() {
        if (typeof jQuery !== 'undefined' && typeof SillyTavern !== 'undefined' && typeof TavernHelper !== 'undefined' && typeof toastr !== 'undefined' && SillyTavern.getContext) {
            console.log('[QuestSystem] All APIs are ready. Initializing...');
            initialize();
        } else {
            // APIs are not ready yet, check again in 100ms.
            setTimeout(runWhenReady, 100);
        }
    }

    // Start the process.
    runWhenReady();
});
