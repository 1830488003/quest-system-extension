// 使用 jQuery 确保在 DOM 加载完毕后执行
jQuery(async () => {
    // 定义扩展名称和路径
    const extensionName = "quest-system-extension";
    const extensionFolderPath = `scripts/extensions/third-party/${extensionName}`;
    
    // --- Configuration & Constants ---
    const QUEST_POPUP_ID = 'th-quest-system-popup-v049'; // Use a versioned ID
    const PLAYER_QUEST_VARIABLE_KEY = 'player_active_quests_log_v2';
    const OLD_PLAYER_QUEST_VARIABLE_KEY = 'player_active_quests_log'; // For migration
    const PROMPT_EDITOR_POPUP_ID = 'th-prompt-editor-popup-v049';

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
    let definedTasks = []; // Holds AI-generated tasks, not persisted across sessions
    let playerTasksStatus = {}; // Persisted in chat variables
    let currentUserModifiedEditablePromptCore = DEFAULT_EDITABLE_PROMPT_CORE_CN;

    // A helper to safely escape HTML
    const escapeHtml = (unsafe) => {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return String(unsafe)
            .replace(/&/g, "&")
            .replace(/</g, "<")
            .replace(/>/g, ">")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#039;");
    };
    
    // --- Core API Functions ---

    // A single, robust check for necessary APIs
    function checkAPIs() {
        if (typeof jQuery === 'undefined' || typeof SillyTavern === 'undefined' || typeof TavernHelper === 'undefined' || typeof toastr === 'undefined') {
            console.error('[QuestSystem] One or more critical global APIs are not available.');
            return false;
        }
        // The check for callGenericPopup is removed as it's no longer the primary display method.
        // It will be checked specifically where it's used (e.g., prompt editor).
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

    // --- Data Management ---

    async function loadPlayerTasks() {
        if (!checkAPIs()) return;
        
        try {
            const variables = await TavernHelper.getVariables({ type: 'chat' });
            let rawData = variables ? variables[PLAYER_QUEST_VARIABLE_KEY] : null;
            let oldRawData = variables ? variables[OLD_PLAYER_QUEST_VARIABLE_KEY] : null;

            if (rawData) {
                // Standard path: data exists under the new key.
                try {
                    playerTasksStatus = JSON.parse(rawData);
                } catch (parseError) {
                    console.warn('[QuestSystem] Failed to parse player task data. It might be corrupted.', parseError);
                    if (typeof rawData === 'string' && rawData.includes('[object Object]')) {
                        console.log('[QuestSystem] Detected v2 corrupted task data. Resetting.');
                        toastr.warning('检测到损坏的任务数据，已自动重置。');
                        playerTasksStatus = {};
                        await savePlayerTasks(); 
                    } else {
                        playerTasksStatus = {};
                    }
                }
            } else if (oldRawData) {
                // Migration path: old data found, new data missing.
                console.log('[QuestSystem] Old task data found. Migrating to new format...');
                toastr.info('检测到旧版任务数据，正在迁移...');
                try {
                    playerTasksStatus = JSON.parse(oldRawData);
                    // Immediately save under the new key and clear the old one.
                    await savePlayerTasks(); // This saves with the new key.
                    await TavernHelper.insertOrAssignVariables({ [OLD_PLAYER_QUEST_VARIABLE_KEY]: null }, { type: 'chat' });
                    console.log('[QuestSystem] Migration successful. Old data key cleared.');
                    toastr.success('任务数据迁移成功！');
                } catch (migrationParseError) {
                    console.error('[QuestSystem] Failed to parse old task data during migration.', migrationParseError);
                    toastr.error('迁移旧任务数据失败，数据可能已损坏。');
                    playerTasksStatus = {};
                }
            } else {
                // No data exists at all.
                playerTasksStatus = {};
            }
        } catch (error) {
            console.error('[QuestSystem] Critical error during task loading:', error);
            toastr.error(`加载任务数据时发生严重错误: ${error.message}`);
            playerTasksStatus = {};
        }
    }

    async function savePlayerTasks() {
        if (!checkAPIs()) return;
        try {
            // Persist the player's task status
            await TavernHelper.insertOrAssignVariables({ [PLAYER_QUEST_VARIABLE_KEY]: JSON.stringify(playerTasksStatus) }, { type: 'chat' });
            // After any save, refresh the UI to ensure consistency
            refreshQuestPopupUI();
        } catch (error) {
            console.error('[QuestSystem] Error saving tasks:', error);
            toastr.error(`保存任务数据出错: ${error.message}`);
        }
    }

    // --- Task Actions ---

    async function acceptTask(taskId) {
        if (!checkAPIs()) return;
        const taskDef = definedTasks.find(t => t.id === taskId);
        if (!taskDef) { toastr.error(`任务 ${taskId} 未定义！`); return; }
        
        playerTasksStatus[taskId] = {
            status: 'active',
            startTime: Date.now(),
            title: taskDef.title,
            description: taskDef.description,
            rewardMessage: taskDef.rewardMessage,
            isAIGenerated: taskDef.isAIGenerated || false
        };
        await savePlayerTasks(); // This saves and then triggers a UI refresh
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
        
        const abandonedTaskTitle = taskInPlayerLog.title;
        delete playerTasksStatus[taskId];
        
        // Remove from the dynamic list of AI-generated tasks to make it available again
        // Note: this assumes if you abandon, you might want to see it again.
        // If abandoned AI tasks should disappear forever, a different logic is needed.
        // For now, let's keep it simple: abandoning removes from active, but not from `definedTasks`.
        
        await injectSystemMessage(`${SillyTavern.name1 || '玩家'} 已放弃任务: "${abandonedTaskTitle}".`);
        await savePlayerTasks(); // This saves and then triggers a UI refresh
        toastr.info(`任务已放弃: ${abandonedTaskTitle}`);
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
                await savePlayerTasks(); // This saves and then triggers a UI refresh
            } else if (aiResponse.includes("STATUS:未完成")) {
                const condition = aiResponse.match(/CONDITION:\[(.*?)]/)?.[1] || "未知";
                const suggestion = aiResponse.match(/SUGGESTION:\[(.*?)]/)?.[1] || "请继续努力。";
                await injectSystemMessage(`任务 "${taskData.title}" 尚未完成。\n你需要: ${condition}\n或许可以尝试: ${suggestion}`);
                toastr.info(`任务 "${taskData.title}" 尚未完成。`);
                refreshQuestPopupUI(); // Also refresh UI to show the task is still active
            } else {
                throw new Error("AI未能明确判断任务状态。");
            }
        } catch (error) {
            console.error('[QuestSystem] Error during AI task completion judgment:', error);
            toastr.error(`AI判断任务完成时出错: ${error.message}`);
        } finally {
            // Restore button state, but the popup might have been refreshed, so we re-select it
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
                // Add if not already in the defined list OR in the player's log
                if (!definedTasks.some(t => t.title === newTask.title) && !Object.values(playerTasksStatus).some(pt => pt.title === newTask.title)) {
                    definedTasks.push(newTask);
                    tasksGeneratedCount++;
                }
            }

            if (tasksGeneratedCount > 0) {
                toastr.success(`AI成功生成了 ${tasksGeneratedCount} 个新任务!`);
                // **THE FIX**: Directly refresh the UI instead of saving.
                // Nothing is saved to player logs until a task is accepted.
                refreshQuestPopupUI();
            } else {
                toastr.error("AI返回的任务格式不正确，无法解析。");
            }
        } catch (error) {
            console.error('[QuestSystem] Error generating AI task:', error);
            toastr.error(`AI任务生成失败: ${error.message}`);
        } finally {
            // Re-select the button as the popup might have been refreshed
            const finalButton = $(`#${QUEST_POPUP_ID} #trigger-ai-task-generation`);
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }
    
    // --- Update Checker ---
    async function check_for_update() {
        try {
            // Fetch our own manifest to get homepage and version
            const manifestResponse = await fetch(`/${extensionFolderPath}/manifest.json?t=${Date.now()}`); // bust cache
            if (!manifestResponse.ok) {
                console.warn('[QuestSystem] Could not fetch local manifest for update check.');
                return;
            }
            const manifest = await manifestResponse.json();

            const homePage = manifest.homePage;
            const currentVersion = manifest.version;

            if (!homePage || homePage.trim() === "") {
                console.log('[QuestSystem] homePage not set in manifest.json, skipping update check.');
                return;
            }

            // Construct the raw URL for package.json on the main branch
            const repoUrl = new URL(homePage);
            const rawUrl = `https://raw.githubusercontent.com${repoUrl.pathname}/main/package.json`;

            console.log(`[QuestSystem] Checking for updates from ${rawUrl}`);

            const response = await fetch(rawUrl);
            if (!response.ok) {
                throw new Error(`Failed to fetch remote package.json: ${response.statusText}`);
            }
            const remotePackage = await response.json();
            const latestVersion = remotePackage.version;

            console.log(`[QuestSystem] Current version: ${currentVersion}, Latest version: ${latestVersion}`);

            // Using a simple string comparison, assuming SemVer-like strings.
            if (latestVersion > currentVersion) {
                console.log('[QuestSystem] New version found!');
                const updateMessage = `发现新版本: ${latestVersion}！请通过启动器或Git更新。`;
                
                // Show a toast notification to alert the user immediately.
                toastr.info(updateMessage, '任务系统更新', {timeOut: 0, extendedTimeOut: 0, closeButton: true});

            } else {
                console.log('[QuestSystem] Extension is up to date.');
            }
        } catch (error) {
            console.error('[QuestSystem] Update check failed:', error);
        }
    }
    
    // --- UI Functions ---

    /**
     * @brief Refreshes the quest popup's content if it's currently open.
     * This is the single source of truth for UI updates.
     */
    function refreshQuestPopupUI() {
        // The popup is now a direct child of the body.
        const questPopup = $(`#${QUEST_POPUP_ID}`);

        if (questPopup.length > 0) {
            // Generate the full new HTML for the popup's content
            const newHtml = createQuestPopupHtml();
            // Replace the old popup with the new one
            questPopup.replaceWith(newHtml);
            // Re-find the newly inserted element by its ID to bind events
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

        html += `</div></div>`; // Close body and container
        return html;
    }
    
    function bindQuestPopupEvents(popupContent$) {
        // Use a single delegated event handler for all buttons inside the popup
        popupContent$.off('.questSystem').on('click.questSystem', '.quest-button, .quest-popup-close-button', async function(event) {
            event.stopPropagation();
            const button = $(this);

            // Handle close button specifically
            if (button.hasClass('quest-popup-close-button')) {
                closeQuestLogPopup();
                return;
            }
            
            const buttonId = button.attr('id');
            const action = button.data('action');
            const taskId = button.data('task-id');

            // Handle specific buttons by ID first
            if (buttonId === 'trigger-ai-task-generation') {
                await generateAndAddNewAiTask();
                return;
            }
            if (buttonId === 'edit-ai-prompt-button') {
                showPromptEditorPopup();
                return;
            }

            // Handle generic task actions
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

            popupInstance.find('#save-custom-prompt-button').on('click.questEditor', function() {
                currentUserModifiedEditablePromptCore = popupInstance.find('#ai-prompt-editor-textarea').val();
                toastr.success("核心指令已保存！");
                popupInstance.find('.popup_close').trigger('click');
            });

            popupInstance.find('#restore-default-prompt-button').on('click.questEditor', function() {
                currentUserModifiedEditablePromptCore = DEFAULT_EDITABLE_PROMPT_CORE_CN;
                popupInstance.find('#ai-prompt-editor-textarea').val(DEFAULT_EDITABLE_PROMPT_CORE_CN);
                toastr.info("核心指令已恢复为默认设置。");
            });
        }, 300);
    }
    
    function closeQuestLogPopup() {
        console.log('[QuestSystem] closeQuestLogPopup called.');
        const popup = $(`#${QUEST_POPUP_ID}`);
        if (popup.length) {
            console.log('[QuestSystem] Removing popup element.');
            popup.remove();
        }
    }

    /**
     * @brief Toggles the visibility of the quest popup.
     * This function checks if the popup exists. If it does, it closes it.
     * If it doesn't, it calls the function to create and show it.
     * This prevents the popup from being re-rendered if it's already open.
     */
    function toggleQuestLogPopup() {
        console.log('[QuestSystem] toggleQuestLogPopup called.');
        const questPopup = $(`#${QUEST_POPUP_ID}`);
        if (questPopup.length > 0) {
            console.log('[QuestSystem] Popup exists, calling closeQuestLogPopup.');
            closeQuestLogPopup();
        } else {
            console.log('[QuestSystem] Popup does not exist, calling showQuestLogPopup.');
            // No need to await here, as it's a fire-and-forget UI action.
            showQuestLogPopup();
        }
    }

    async function showQuestLogPopup() {
        console.log('[QuestSystem] showQuestLogPopup called.');
        if (!checkAPIs()) {
            console.error('[QuestSystem] checkAPIs() failed in showQuestLogPopup.');
            return;
        }
        
        // Defensively close any existing popup to ensure a clean state.
        console.log('[QuestSystem] Calling closeQuestLogPopup from showQuestLogPopup to ensure clean state.');
        closeQuestLogPopup();

        // The task data is pre-loaded at initialization.
        // We intentionally DO NOT call loadPlayerTasks() here to prevent
        // the "get chat variables" log from appearing on every click.
        console.log('[QuestSystem] Creating popup HTML.');
        const popupContentHtml = createQuestPopupHtml();
        
        console.log('[QuestSystem] Appending popup HTML to body.');
        $('body').append(popupContentHtml);

        const popupInstance = $(`#${QUEST_POPUP_ID}`);
        if (popupInstance.length) {
            console.log('[QuestSystem] Popup instance found, binding events.');
            bindQuestPopupEvents(popupInstance);
        } else {
            console.error("[QuestSystem] Could not find quest popup instance to bind events after appending.");
        }
    }
    
    // --- Initialization ---
    async function initialize() {
        console.log('[QuestSystem] Initializing...');
        if (!checkAPIs()) {
            console.error("[QuestSystem] Initialization failed due to missing APIs.");
            return;
        }

        // Load tasks once on startup to avoid logging on every click
        console.log('[QuestSystem] Loading player tasks...');
        await loadPlayerTasks();
        console.log('[QuestSystem] Player tasks loaded.');

        // Check for updates
        console.log('[QuestSystem] Checking for updates...');
        check_for_update(); // Intentionally not awaited

        // Create a button in the UI as the entry point
        const buttonId = 'quest-log-entry-button';
        if ($(`#${buttonId}`).length === 0) {
            console.log('[QuestSystem] Creating entry button.');
            // Style is now controlled entirely by style.css
            const buttonHtml = `<div id="${buttonId}" title="任务日志" class="fa-solid fa-scroll"></div>`;
            $('body').append(buttonHtml);
            // Bind the new toggle function to the button's click event.
            // This ensures the popup opens and closes correctly on clicks.
            console.log('[QuestSystem] Binding click event to entry button.');
            $(`#${buttonId}`).on('click', toggleQuestLogPopup);
        }
        toastr.success("任务系统(完整版)已加载！");
        console.log('[QuestSystem] Initialization complete.');
    }

    // Load settings from SillyTavern
    try {
        const settingsHtml = await $.get(`${extensionFolderPath}/settings.html`);
        $("#extensions_settings2").append(settingsHtml);
    } catch (error) {
        console.error("加载任务系统扩展的 settings.html 失败：", error);
    }

    initialize();
});
