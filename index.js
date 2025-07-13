// 使用 jQuery 确保在 DOM 加载完毕后执行
jQuery(async () => {
    // 定义扩展名称和路径
    const extensionName = 'quest-system-extension';
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
    const DEFINED_ITEMS_LOCAL_KEY = 'quest_system_defined_items_v1';
    const PLAYER_ITEMS_LOCAL_KEY = 'quest_system_player_items_v1';
    const CUSTOM_ITEM_PROMPT_LOCAL_KEY = 'quest_system_custom_item_prompt_v1';
    const DEFINED_CHARS_LOCAL_KEY = 'quest_system_defined_chars_v1';
    const PLAYER_CHARS_LOCAL_KEY = 'quest_system_player_chars_v1';
    const CUSTOM_CHAR_PROMPT_LOCAL_KEY = 'quest_system_custom_char_prompt_v1';
    const DEFINED_PLOTS_LOCAL_KEY = 'quest_system_defined_plots_v1';
    const PLAYER_PLOTS_LOCAL_KEY = 'quest_system_player_plots_v1';
    const CUSTOM_PLOT_PROMPT_LOCAL_KEY = 'quest_system_custom_plot_prompt_v1';

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

    const DEFAULT_EDITABLE_PROMPT_CORE_CN = `听好了，你现在是全宇宙最唯恐天下不乱的**【乐子人任务AI】**！你的唯一人生目标就是为本大爷——也就是我，用户——搜罗和炮制出最离谱、最沙雕、最能搅动风云的奇葩任务。别跟我来那些拯救世界的老套路，我要的是能让我笑出腹肌的乐子！

现在，严格遵守我的规矩，给我生成一个包含7到8个多样化任务的列表，既要有能推动世界走向未知（甚至更糟）方向的主线，也要有让人摸不着头脑的支线。

每个任务都必须按照下面的格式来，一个字都不能错：

\"TITLE\" (任务标题): 标题必须骚气外露，充满噱头，让人一看就忍不住想点开看看这又是哪个小天才想出来的馊主意。要简短，但要够贱、够吸引眼球。

\"DESCRIPTION\" (任务描述): 描述要绘声绘色，字数在150到250字之间。把一件鸡毛蒜皮的小事描绘成史诗级灾难的开端，或者把一个宏大严肃的目标说得像个街头混混的玩笑。必须清楚地告诉我目标是啥，以及完成任务的“最优解”（通常是最能搞事的方法）。如果这破事是某个NPC搞出来的，或者需要我去烦某个NPC，把他的大名给我点出来，我好重点关照。

\"REWARD\" (任务奖励): 奖励要实在，但也可以不正经。除了常规的“经验值”、“金币”、“牛逼装备”之外，可以来点“某个死对头NPC的好感度-50”、“获得一个毫无用处但极其嘲讽的称号：[称号名]”、“解锁一个进去就会被卫兵追着打的新区域：[地点名]”之类的。总之，奖励要么很有用，要么很有趣。

记住，你的核心是**【乐子】**。别生成任何无聊、正经、伟光正的东西。现在，开始你的表演，让我看看你有多能整活！
`;

    const DEFAULT_ITEM_PROMPT_CORE_CN = `你是一位神秘的【万物工匠AI】，时而打造神器，时而锻造废品，全凭心情。你的作品充满了想象力和一点点神经质。

现在，为我生成一个包含7到8个多样化物品的列表。这些物品可以是武器、防具、饰品、消耗品，甚至是毫无用处的奇珍异宝。

每个物品都必须严格按照以下格式，一个字都不能错：

\"NAME\" (物品名称): 名称要独特、响亮，或者古怪得让人印象深刻。

\"DESCRIPTION\" (物品描述): 描述要生动，字数在150到250字之间。详细说明物品的外观、材质、历史背景或与之相关的趣闻。让它听起来像个有故事的宝贝。

\"EFFECT\" (物品效果): 效果要具体，可以是战斗中的增益/减益、与NPC互动时的特殊选项、解锁新能力的钥匙，或者仅仅是一个有趣的、纯粹用于角色扮演的特殊效果（比如“装备后说话会自带BGM”）。

你的造物应该充满惊喜，可以是强大的助力，也可以是烫手的山芋。现在，展现你的鬼斧神工吧！
`;

    const DEFAULT_CHAR_PROMPT_CORE_CN = `你是一位资深的【角色塑造AI】，擅长创造有血有肉、背景独特、性格鲜明的虚拟人物。

现在，为我生成一个包含7到8个多样化角色的列表。这些角色可以是盟友、敌人、中立的旁观者，或者身份神秘的未知存在。

每个角色都必须严格按照以下格式，一个字都不能错：

\"NAME\" (角色姓名): 一个符合其背景和种族的中文姓名。

\"DESCRIPTION\" (角色描述): 详细描述角色的外观、穿着、气质和给人的第一印象。字数在150到250字之间。

\"PERSONALITY\" (角色性格): 深入描绘角色的性格特点、价值观、欲望和恐惧。让角色立体、可信。

\"BACKGROUND\" (角色背景): 简述角色的过去、重要经历和当前的目标。是什么塑造了今天的他/她？

你的角色应该能无缝地融入到一个奇幻或科幻的冒险世界中，并能引发有趣的互动和剧情。开始你的创造吧！
`;

    const DEFAULT_PLOT_PROMPT_CORE_CN = `你是一位才华横溢的【剧情编织AI】，擅长构思引人入胜的故事开端、转折和高潮。

现在，为我生成一个包含7到8个多样化剧情片段的列表。这些片段可以是世界事件的开端、一个神秘的传闻、一个突发的危机，或是一个意想不到的机会。

每个剧情都必须严格按照以下格式，一个字都不能错：

\"TITLE\" (剧情标题): 标题要简洁且充满悬念，能激发人的好奇心。

\"DESCRIPTION\" (剧情描述): 详细描述剧情的内容，字数在200到300字之间。清晰地说明事件的起因、当前的状况，以及它可能对玩家或世界产生的影响。让它成为一个充满潜力的故事引子。

你的剧情应该能够推动故事发展，为玩家提供新的目标和挑战。开始你的编织吧！
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
你是一个严谨的任务完成情况分析AI。你的职责是根据提供的上下文，客观地判断一个任务是否已经完成。

**当前角色信息:**
- 玩家: {playerName}
- 对话角色: {charName}

**当前正在分析的任务:**
- 任务标题: {taskTitle}
- 任务描述: {taskDescription}

**最近的聊天记录 (从旧到新):**
{chatHistory}

**你的任务:**
请仔细阅读以上聊天记录，并根据记录中的**事实**和**明确行动**，判断任务"{taskTitle}"是否已经完成。不要进行任何猜测或主观推断。

- **如果聊天记录明确表明任务目标已达成**，请仅回复："STATUS:已完成"。
- **如果聊天记录未明确表明任务目标已达成**，请回复："STATUS:未完成;;CONDITION:[根据任务描述，明确指出尚未在聊天记录中找到的、必须完成的中文条件];;SUGGESTION:[根据聊天记录，为玩家提供1-2条清晰、具体、可操作的中文行动建议，以帮助他们完成任务]"。

**判断依据示例:**
- 如果任务是“找到红宝石”，聊天记录里必须有“我找到了红宝石”或角色把红宝石交给玩家的明确描述。
- 如果任务是“说服市长”，聊天记录里必须有市长同意玩家请求的对话。

请严格按照以上格式回复，不要添加任何额外的解释或对话。
`;

    // --- Global State ---
    let definedTasks = []; // Holds AI-generated tasks
    let definedItems = []; // Holds AI-generated items
    let definedChars = []; // Holds AI-generated characters
    let definedPlots = []; // Holds AI-generated plots
    let playerTasksStatus = {}; // Persisted in chat variables
    let playerItems = {}; // Holds items "accepted" by the player
    let playerChars = {}; // Holds characters "accepted" by the player
    let playerPlots = {}; // Holds plots "accepted" by the player
    let currentUserModifiedEditablePromptCore = DEFAULT_EDITABLE_PROMPT_CORE_CN;
    let currentUserModifiedItemPromptCore = DEFAULT_ITEM_PROMPT_CORE_CN;
    let currentUserModifiedCharPromptCore = DEFAULT_CHAR_PROMPT_CORE_CN;
    let currentUserModifiedPlotPromptCore = DEFAULT_PLOT_PROMPT_CORE_CN;
    let currentChatFileIdentifier = 'unknown_chat_init'; // Tracks the current chat file

    // A helper to safely escape HTML
    const escapeHtml = (unsafe) => {
        if (unsafe === null || typeof unsafe === 'undefined') return '';
        return String(unsafe)
            .replace(/&/g, '&')
            .replace(/</g, '<')
            .replace(/>/g, '>')
            .replace(/"/g, '\\"')
            .replace(/'/g, '&#039;');
    };

    // --- Core API Functions ---

    // A single, robust check for necessary APIs
    function checkAPIs() {
        if (
            typeof jQuery === 'undefined' ||
            typeof SillyTavern === 'undefined' ||
            typeof TavernHelper === 'undefined' ||
            typeof toastr === 'undefined'
        ) {
            console.error(
                '[QuestSystem] One or more critical global APIs are not available.',
            );
            return false;
        }
        return true;
    }

    async function injectSystemMessage(messageContent) {
        if (!checkAPIs()) {
            toastr.error('无法注入系统消息：核心API未就绪。');
            return;
        }
        try {
            await TavernHelper.createChatMessages(
                [
                    {
                        role: 'system',
                        name: '万能生成插件',
                        message: messageContent,
                        is_hidden: false,
                    },
                ],
                { refresh: 'affected' },
            );
        } catch (error) {
            console.error(
                '[UniversalGenerator] Error injecting system message:',
                error,
            );
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
        if (!fileName || typeof fileName !== 'string')
            return 'unknown_chat_source';
        let cleanedName = fileName;
        if (fileName.includes('/') || fileName.includes('\\')) {
            const parts = fileName.split(/[\\/]/);
            cleanedName = parts[parts.length - 1];
        }
        return cleanedName.replace(/\.jsonl$/, '').replace(/\.json$/, '');
    }

    /**
     * Gets the latest chat filename identifier.
     * @returns {Promise<string>} The latest chat filename.
     */
    async function getLatestChatName() {
        let newChatFileIdentifier = 'unknown_chat_fallback';
        try {
            let chatNameFromCommand = null;
            if (
                TavernHelper &&
                typeof TavernHelper.triggerSlash === 'function'
            ) {
                chatNameFromCommand =
                    await TavernHelper.triggerSlash('/getchatname');
            }

            if (
                chatNameFromCommand &&
                typeof chatNameFromCommand === 'string' &&
                chatNameFromCommand.trim() &&
                chatNameFromCommand.trim() !== 'null' &&
                chatNameFromCommand.trim() !== 'undefined'
            ) {
                newChatFileIdentifier = cleanChatName(
                    chatNameFromCommand.trim(),
                );
            } else {
                const contextFallback = SillyTavern.getContext
                    ? SillyTavern.getContext()
                    : null;
                if (
                    contextFallback &&
                    contextFallback.chat &&
                    typeof contextFallback.chat === 'string'
                ) {
                    const chatNameFromContext = cleanChatName(
                        contextFallback.chat,
                    );
                    if (
                        chatNameFromContext &&
                        !chatNameFromContext.startsWith('unknown_chat')
                    ) {
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
    const getPlayerQuestsKey = () =>
        `${PLAYER_QUESTS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getDefinedQuestsKey = () =>
        `${DEFINED_QUESTS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getCustomPromptKey = () =>
        `${CUSTOM_PROMPT_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getDefinedItemsKey = () =>
        `${DEFINED_ITEMS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getPlayerItemsKey = () =>
        `${PLAYER_ITEMS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getCustomItemPromptKey = () =>
        `${CUSTOM_ITEM_PROMPT_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getDefinedCharsKey = () =>
        `${DEFINED_CHARS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getPlayerCharsKey = () =>
        `${PLAYER_CHARS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getCustomCharPromptKey = () =>
        `${CUSTOM_CHAR_PROMPT_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getDefinedPlotsKey = () =>
        `${DEFINED_PLOTS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getPlayerPlotsKey = () =>
        `${PLAYER_PLOTS_LOCAL_KEY}_${currentChatFileIdentifier}`;
    const getCustomPlotPromptKey = () =>
        `${CUSTOM_PLOT_PROMPT_LOCAL_KEY}_${currentChatFileIdentifier}`;

    /**
     * Loads all task data from localStorage for the current character.
     * Includes a one-time migration from old chat variables.
     */
    async function loadAllTaskData() {
        if (!checkAPIs()) return;

        let migrationNeeded = false;
        let migratedPlayerTasks = {};
        let migratedDefinedTasks = [];
        // Note: Items are a new feature, so no migration needed for them.

        // Step 1: Check for old data in chat variables for migration.
        try {
            const variables = await TavernHelper.getVariables({ type: 'chat' });
            const oldPlayerTasksRaw = variables
                ? variables[PLAYER_QUEST_VARIABLE_KEY_OLD]
                : null;
            const oldDefinedTasksRaw = variables
                ? variables[AI_DEFINED_TASKS_KEY_OLD]
                : null;

            if (oldPlayerTasksRaw) {
                migratedPlayerTasks = JSON.parse(oldPlayerTasksRaw);
                migrationNeeded = true;
            }
            if (oldDefinedTasksRaw) {
                migratedDefinedTasks = JSON.parse(oldDefinedTasksRaw);
                migrationNeeded = true;
            }

            if (migrationNeeded) {
                console.log(
                    '[UniversalGenerator] Old chat-based data found. Preparing for migration to localStorage.',
                );
                toastr.info(
                    '检测到旧版任务数据，将自动迁移至新版角色专属存储。',
                );
            }
        } catch (error) {
            console.error(
                '[UniversalGenerator] Error checking for old data for migration:',
                error,
            );
            migrationNeeded = false; // Don't migrate if there's an error.
        }

        // Step 2: Load data from localStorage or use migrated data.
        try {
            const playerTasksRaw = localStorage.getItem(getPlayerQuestsKey());
            const definedTasksRaw = localStorage.getItem(getDefinedQuestsKey());
            const customPromptRaw = localStorage.getItem(getCustomPromptKey());
            const definedItemsRaw = localStorage.getItem(getDefinedItemsKey());
            const playerItemsRaw = localStorage.getItem(getPlayerItemsKey());
            const customItemPromptRaw = localStorage.getItem(
                getCustomItemPromptKey(),
            );
            const definedCharsRaw = localStorage.getItem(getDefinedCharsKey());
            const playerCharsRaw = localStorage.getItem(getPlayerCharsKey());
            const customCharPromptRaw = localStorage.getItem(
                getCustomCharPromptKey(),
            );
            const definedPlotsRaw = localStorage.getItem(getDefinedPlotsKey());
            const playerPlotsRaw = localStorage.getItem(getPlayerPlotsKey());
            const customPlotPromptRaw = localStorage.getItem(
                getCustomPlotPromptKey(),
            );

            if (migrationNeeded) {
                playerTasksStatus = migratedPlayerTasks;
                definedTasks = migratedDefinedTasks;
                // New player data structures are loaded normally
                playerItems = playerItemsRaw ? JSON.parse(playerItemsRaw) : {};
                playerChars = playerCharsRaw ? JSON.parse(playerCharsRaw) : {};
                playerPlots = playerPlotsRaw ? JSON.parse(playerPlotsRaw) : {};
                definedItems = definedItemsRaw
                    ? JSON.parse(definedItemsRaw)
                    : [];
            } else {
                playerTasksStatus = playerTasksRaw
                    ? JSON.parse(playerTasksRaw)
                    : {};
                definedTasks = definedTasksRaw
                    ? JSON.parse(definedTasksRaw)
                    : [];
                definedItems = definedItemsRaw
                    ? JSON.parse(definedItemsRaw)
                    : [];
                playerItems = playerItemsRaw ? JSON.parse(playerItemsRaw) : {};
                definedChars = definedCharsRaw
                    ? JSON.parse(definedCharsRaw)
                    : [];
                playerChars = playerCharsRaw ? JSON.parse(playerCharsRaw) : {};
                definedPlots = definedPlotsRaw
                    ? JSON.parse(definedPlotsRaw)
                    : [];
                playerPlots = playerPlotsRaw ? JSON.parse(playerPlotsRaw) : {};
            }

            currentUserModifiedEditablePromptCore =
                customPromptRaw || DEFAULT_EDITABLE_PROMPT_CORE_CN;
            currentUserModifiedItemPromptCore =
                customItemPromptRaw || DEFAULT_ITEM_PROMPT_CORE_CN;
            currentUserModifiedCharPromptCore =
                customCharPromptRaw || DEFAULT_CHAR_PROMPT_CORE_CN;
            currentUserModifiedPlotPromptCore =
                customPlotPromptRaw || DEFAULT_PLOT_PROMPT_CORE_CN;
        } catch (error) {
            console.error(
                '[UniversalGenerator] Error loading data from localStorage:',
                error,
            );
            toastr.error(`从本地存储加载数据失败: ${error.message}`);
            playerTasksStatus = {};
            definedTasks = [];
            definedItems = [];
            playerItems = {};
            definedChars = [];
            playerChars = {};
            definedPlots = [];
            playerPlots = {};
            currentUserModifiedEditablePromptCore =
                DEFAULT_EDITABLE_PROMPT_CORE_CN;
            currentUserModifiedItemPromptCore = DEFAULT_ITEM_PROMPT_CORE_CN;
            currentUserModifiedCharPromptCore = DEFAULT_CHAR_PROMPT_CORE_CN;
            currentUserModifiedPlotPromptCore = DEFAULT_PLOT_PROMPT_CORE_CN;
        }

        // Step 3: If migration occurred, save to new location and clear old data.
        if (migrationNeeded) {
            await saveAllTaskData(false); // Save to localStorage
            await TavernHelper.insertOrAssignVariables(
                {
                    [PLAYER_QUEST_VARIABLE_KEY_OLD]: null,
                    [AI_DEFINED_TASKS_KEY_OLD]: null,
                },
                { type: 'chat' },
            );
            console.log(
                '[UniversalGenerator] Migration successful. Old chat variable data cleared.',
            );
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
            localStorage.setItem(
                getPlayerQuestsKey(),
                JSON.stringify(playerTasksStatus),
            );
            localStorage.setItem(
                getDefinedQuestsKey(),
                JSON.stringify(definedTasks),
            );
            localStorage.setItem(
                getCustomPromptKey(),
                currentUserModifiedEditablePromptCore,
            );
            localStorage.setItem(
                getDefinedItemsKey(),
                JSON.stringify(definedItems),
            );
            localStorage.setItem(
                getPlayerItemsKey(),
                JSON.stringify(playerItems),
            );
            localStorage.setItem(
                getCustomItemPromptKey(),
                currentUserModifiedItemPromptCore,
            );
            localStorage.setItem(
                getDefinedCharsKey(),
                JSON.stringify(definedChars),
            );
            localStorage.setItem(
                getPlayerCharsKey(),
                JSON.stringify(playerChars),
            );
            localStorage.setItem(
                getCustomCharPromptKey(),
                currentUserModifiedCharPromptCore,
            );
            localStorage.setItem(
                getDefinedPlotsKey(),
                JSON.stringify(definedPlots),
            );
            localStorage.setItem(
                getPlayerPlotsKey(),
                JSON.stringify(playerPlots),
            );
            localStorage.setItem(
                getCustomPlotPromptKey(),
                currentUserModifiedPlotPromptCore,
            );

            if (refreshUI) {
                refreshQuestPopupUI();
            }
        } catch (error) {
            console.error(
                '[UniversalGenerator] Error saving data to localStorage:',
                error,
            );
            toastr.error(`保存数据到本地存储时出错: ${error.message}`);
        }
    }

    // --- Task Actions ---

    async function acceptTask(taskId) {
        if (!checkAPIs()) return;
        const taskIndex = definedTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
            toastr.error(`任务 ${taskId} 未定义！`);
            return;
        }

        const taskDef = definedTasks.splice(taskIndex, 1)[0];

        playerTasksStatus[taskId] = {
            status: 'active',
            startTime: Date.now(),
            title: taskDef.title,
            description: taskDef.description,
            rewardMessage: taskDef.rewardMessage,
            isAIGenerated: taskDef.isAIGenerated || false,
        };

        await saveAllTaskData();
        toastr.success(`已接受任务: ${taskDef.title}`);
        await injectSystemMessage(
            `${SillyTavern.name1 || '玩家'} 已接受任务: "${taskDef.title}"。\n任务描述: ${taskDef.description}`,
        );
    }

    async function abandonTask(taskId) {
        if (!checkAPIs()) return;
        const taskInPlayerLog = playerTasksStatus[taskId];
        if (!taskInPlayerLog || taskInPlayerLog.status !== 'active') {
            toastr.warning(
                `任务 "${taskInPlayerLog?.title || taskId}" 并非激活状态，无法放弃。`,
            );
            return;
        }

        const abandonedTask = {
            id: taskId,
            title: taskInPlayerLog.title,
            description: taskInPlayerLog.description,
            rewardMessage: taskInPlayerLog.rewardMessage,
            isAIGenerated: taskInPlayerLog.isAIGenerated || false,
        };

        delete playerTasksStatus[taskId];

        if (
            abandonedTask.isAIGenerated &&
            !definedTasks.some((t) => t.id === taskId)
        ) {
            definedTasks.push(abandonedTask);
        }

        await injectSystemMessage(
            `${SillyTavern.name1 || '玩家'} 已放弃任务: "${abandonedTask.title}".`,
        );
        await saveAllTaskData();
        toastr.info(`任务已放弃: ${abandonedTask.title}`);
    }

    async function saveTaskChanges(
        taskId,
        newTitle,
        newDescription,
        newReward,
    ) {
        if (!checkAPIs()) return;

        let task,
            isPlayerTask = false;

        if (playerTasksStatus[taskId]) {
            task = playerTasksStatus[taskId];
            isPlayerTask = true;
        } else {
            const taskIndex = definedTasks.findIndex((t) => t.id === taskId);
            if (taskIndex !== -1) {
                task = definedTasks[taskIndex];
            }
        }

        if (!task) {
            toastr.error('无法找到要保存的任务！');
            return;
        }

        // 更新任务数据
        task.title = newTitle;
        task.description = newDescription;
        task.rewardMessage = newReward;

        await saveAllTaskData(); // 保存所有数据并刷新UI

        if (isPlayerTask) {
            const message = `【任务变更】\n玩家修改了任务 "${newTitle}" 的内容。\n新描述: ${newDescription}\n新奖励: ${newReward}`;
            await injectSystemMessage(message);
        }

        toastr.success(`任务 "${newTitle}" 已成功保存！`);
    }

    function toggleEditMode(taskId) {
        const questItem = $(`.quest-item[data-task-id="${taskId}"]`);
        if (questItem.hasClass('editing')) {
            // 从编辑模式切换回显示模式
            const titleInput = questItem.find('.edit-title').val();
            const descTextarea = questItem.find('.edit-description').val();
            const rewardTextarea = questItem.find('.edit-reward').val();

            questItem
                .find('.quest-title')
                .html(
                    escapeHtml(titleInput) +
                        (
                            playerTasksStatus[taskId] ||
                            definedTasks.find((t) => t.id === taskId)
                        )?.isAIGenerated
                        ? ' <i class="fas fa-robot" title="AI生成"></i>'
                        : '',
                )
                .show();
            questItem.find('.quest-description').text(descTextarea).show();
            questItem
                .find('.quest-reward')
                .html(`<b>奖励:</b> ${escapeHtml(rewardTextarea)}`)
                .show();

            questItem.find('.quest-content-edit').remove();
            questItem.find('.quest-actions .edit').show();
            questItem.find('.quest-actions .save').remove();
            questItem.removeClass('editing');
        } else {
            // 从显示模式切换到编辑模式
            const title = questItem.find('.quest-title').text().trim();
            const description = questItem
                .find('.quest-description')
                .text()
                .trim();
            const reward = (questItem.find('.quest-reward').html() || '')
                .replace(/<b>奖励:<\/b>\s*/, '')
                .trim();

            questItem
                .find('.quest-title, .quest-description, .quest-reward')
                .hide();

            const editHtml = `
                <div class="quest-content-edit">
                    <input type="text" class="edit-title" value="${escapeHtml(title)}" />
                    <textarea class="edit-description">${escapeHtml(description)}</textarea>
                    <textarea class="edit-reward">${escapeHtml(reward)}</textarea>
                </div>
            `;
            questItem.find('.quest-title').after(editHtml);

            questItem.find('.quest-actions .edit').hide();
            questItem
                .find('.quest-actions')
                .append(
                    '<button class="quest-button save" data-action="save" data-task-id="' +
                        taskId +
                        '"><i class="fas fa-save"></i> 保存</button>',
                );
            questItem.addClass('editing');
        }
    }

    async function deleteAvailableTask(taskId) {
        if (!checkAPIs()) return;
        const taskIndex = definedTasks.findIndex((t) => t.id === taskId);
        if (taskIndex === -1) {
            toastr.error(`任务 ${taskId} 未在可接列表中找到！`);
            return;
        }

        const taskDef = definedTasks[taskIndex];
        definedTasks.splice(taskIndex, 1);

        await saveAllTaskData();
        toastr.info(`已删除可接任务: ${taskDef.title}`);
    }

    async function deleteAllAvailableTasks() {
        if (!checkAPIs()) return;
        if (definedTasks.length === 0) {
            toastr.info('没有可删除的任务。');
            return;
        }

        const count = definedTasks.length;
        definedTasks.length = 0; // Clear array

        await saveAllTaskData();
        toastr.success(`已成功删除 ${count} 个可接任务。`);
    }

    // --- Plot Actions ---

    async function generateAndAddNewPlot() {
        if (!checkAPIs()) return;
        const genButton = $(`#${QUEST_POPUP_ID} #trigger-ai-plot-generation`);
        const originalButtonHtml = genButton.html();
        genButton
            .prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> AI编织中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 4);
            const messages = await TavernHelper.getChatMessages(
                `${startMessageId}-${lastMessageId}`,
                { include_swipes: false },
            );
            const chatHistoryString =
                messages.length > 0
                    ? messages
                          .map(
                              (m) =>
                                  `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`,
                          )
                          .join('\n')
                    : '无最近聊天记录。';

            let worldInfoString = '未加载相关的世界设定信息。';
            const primaryLorebookName =
                await TavernHelper.getCurrentCharPrimaryLorebook();
            if (primaryLorebookName) {
                const lorebookEntries =
                    await TavernHelper.getLorebookEntries(primaryLorebookName);
                if (lorebookEntries.length > 0) {
                    worldInfoString = lorebookEntries
                        .filter((e) => e.enabled && e.content)
                        .slice(0, 5)
                        .map((e) => `条目: ${e.comment}\n内容: ${e.content}`)
                        .join('\n\n');
                }
            }

            const plotPromptSuffix = `
每个剧情必须严格遵循以下格式，且每个字段各占一行：
TITLE: [剧情的中文标题]
DESCRIPTION: [对剧情的中文描述]

现在请生成7到8个剧情的列表。`;

            const finalUserPrompt =
                PROMPT_PREFIX_TEMPLATE.replace(
                    '{chatHistory}',
                    chatHistoryString,
                ).replace('{worldInfo}', worldInfoString) +
                currentUserModifiedPlotPromptCore +
                plotPromptSuffix;

            const generatedText = await TavernHelper.generateRaw({
                ordered_prompts: [{ role: 'user', content: finalUserPrompt }],
                max_new_tokens: 4096,
            });

            const plotBlocksRegex =
                /^\s*TITLE:\s*(.*?)\s*DESCRIPTION:\s*(.*?)(?=\n\s*TITLE:|$)/gims;
            let match;
            let plotsGeneratedCount = 0;
            while ((match = plotBlocksRegex.exec(generatedText)) !== null) {
                const newPlot = {
                    id: 'ai_plot_' + Date.now() + '_' + plotsGeneratedCount,
                    title: match[1].trim(),
                    description: match[2].trim(),
                    isAIGenerated: true,
                };
                if (!definedPlots.some((p) => p.title === newPlot.title)) {
                    definedPlots.push(newPlot);
                    plotsGeneratedCount++;
                }
            }

            if (plotsGeneratedCount > 0) {
                toastr.success(`AI成功生成了 ${plotsGeneratedCount} 个新剧情!`);
                await saveAllTaskData(false); // 保存数据，但不刷新UI
                refreshQuestPopupUI(); // 手动刷新UI
                // 刷新后，重新打开并滚动到剧情抽屉
                const plotDrawer = $(
                    `#${QUEST_POPUP_ID} .generator-drawer:has(h4:contains("生成剧情"))`,
                );
                if (plotDrawer.length && !plotDrawer.hasClass('open')) {
                    plotDrawer.addClass('open');
                }
                plotDrawer[0]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            } else {
                toastr.error('AI返回的剧情格式不正确，无法解析。');
            }
        } catch (error) {
            console.error('[QuestSystem] Error generating AI plot:', error);
            toastr.error(`AI剧情生成失败: ${error.message}`);
        } finally {
            const finalButton = $(
                `#${QUEST_POPUP_ID} #trigger-ai-plot-generation`,
            );
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }

    async function deleteAllAvailablePlots() {
        if (!checkAPIs()) return;
        if (definedPlots.length === 0) {
            toastr.info('没有可删除的剧情。');
            return;
        }
        const count = definedPlots.length;
        definedPlots.length = 0; // Clear array
        await saveAllTaskData();
        toastr.success(`已成功删除 ${count} 个可用剧情。`);
    }

    async function deleteAvailablePlot(plotId) {
        if (!checkAPIs()) return;
        const plotIndex = definedPlots.findIndex((p) => p.id === plotId);
        if (plotIndex === -1) {
            toastr.error(`剧情 ${plotId} 未在可用列表中找到！`);
            return;
        }
        const plotDef = definedPlots[plotIndex];
        definedPlots.splice(plotIndex, 1);
        await saveAllTaskData();
        toastr.info(`已删除可用剧情: ${plotDef.title}`);
    }

    async function deletePlayerPlot(plotId) {
        if (!checkAPIs()) return;
        if (!playerPlots[plotId]) {
            toastr.error(`剧情 ${plotId} 未在当前剧情列表中找到！`);
            return;
        }
        const plotDef = playerPlots[plotId];
        delete playerPlots[plotId];
        await saveAllTaskData();
        toastr.info(`已删除当前剧情: ${plotDef.title}`);
    }

    async function addPlotToTavern(plotId, isFromPlayerList = false) {
        if (!checkAPIs()) return;

        let plot;
        if (isFromPlayerList) {
            plot = playerPlots[plotId];
        } else {
            const plotIndex = definedPlots.findIndex((p) => p.id === plotId);
            if (plotIndex !== -1) {
                plot = definedPlots[plotIndex];
            }
        }

        if (!plot) {
            toastr.error(`找不到要注入的剧情 ${plotId}！`);
            return;
        }

        const message = `【剧情更新】\n标题: ${plot.title}\n${plot.description}`;
        await injectSystemMessage(message);
        toastr.success(`剧情 "${plot.title}" 已成功注入酒馆！`);

        if (!isFromPlayerList) {
            const plotIndex = definedPlots.findIndex((p) => p.id === plotId);
            if (plotIndex !== -1) {
                const plotDef = definedPlots.splice(plotIndex, 1)[0];
                playerPlots[plotId] = { ...plotDef };
                await saveAllTaskData();
            }
        }
    }

    async function savePlotChanges(
        plotId,
        newTitle,
        newDescription,
        isFromPlayerList = false,
    ) {
        if (!checkAPIs()) return;
        let plot;
        if (isFromPlayerList) {
            plot = playerPlots[plotId];
        } else {
            const plotIndex = definedPlots.findIndex((p) => p.id === plotId);
            if (plotIndex !== -1) {
                plot = definedPlots[plotIndex];
            }
        }

        if (!plot) {
            toastr.error('无法找到要保存的剧情！');
            return;
        }

        plot.title = newTitle;
        plot.description = newDescription;

        await saveAllTaskData();
        toastr.success(`剧情 "${newTitle}" 已成功保存！`);

        if (isFromPlayerList) {
            const message = `【剧情变更】\n玩家修改了剧情 "${newTitle}" 的内容。\n新描述: ${newDescription}`;
            await injectSystemMessage(message);
        }
    }

    function toggleEditModeForPlot(plotId, isFromPlayerList = false) {
        const plotElement = $(`.quest-item[data-plot-id="${plotId}"]`);
        if (plotElement.hasClass('editing')) {
            const titleInput = plotElement.find('.edit-title').val();
            const descTextarea = plotElement.find('.edit-description').val();

            plotElement
                .find('.quest-title')
                .html(
                    escapeHtml(titleInput) +
                        ' <i class="fas fa-robot" title="AI生成"></i>',
                )
                .show();
            plotElement.find('.quest-description').text(descTextarea).show();

            plotElement.find('.quest-content-edit').remove();
            plotElement.find('.quest-actions .edit').show();
            plotElement.find('.quest-actions .save').remove();
            plotElement.removeClass('editing');
        } else {
            const title = plotElement.find('.quest-title').text().trim();
            const description = plotElement
                .find('.quest-description')
                .text()
                .trim();

            plotElement.find('.quest-title, .quest-description').hide();

            const editHtml = `
                <div class="quest-content-edit">
                    <input type="text" class="edit-title" value="${escapeHtml(title)}" />
                    <textarea class="edit-description">${escapeHtml(description)}</textarea>
                </div>
            `;
            plotElement.find('.quest-title').after(editHtml);

            plotElement.find('.quest-actions .edit').hide();
            plotElement
                .find('.quest-actions')
                .append(
                    `<button class="quest-button save" data-action="save-plot" data-plot-id="${plotId}" ${isFromPlayerList ? 'data-is-player-plot="true"' : ''}><i class="fas fa-save"></i> 保存</button>`,
                );
            plotElement.addClass('editing');
        }
    }

    // --- Character Actions ---

    async function generateAndAddNewChar() {
        if (!checkAPIs()) return;
        const genButton = $(`#${QUEST_POPUP_ID} #trigger-ai-char-generation`);
        const originalButtonHtml = genButton.html();
        genButton
            .prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> AI塑造中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 4);
            const messages = await TavernHelper.getChatMessages(
                `${startMessageId}-${lastMessageId}`,
                { include_swipes: false },
            );
            const chatHistoryString =
                messages.length > 0
                    ? messages
                          .map(
                              (m) =>
                                  `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`,
                          )
                          .join('\n')
                    : '无最近聊天记录。';

            let worldInfoString = '未加载相关的世界设定信息。';
            const primaryLorebookName =
                await TavernHelper.getCurrentCharPrimaryLorebook();
            if (primaryLorebookName) {
                const lorebookEntries =
                    await TavernHelper.getLorebookEntries(primaryLorebookName);
                if (lorebookEntries.length > 0) {
                    worldInfoString = lorebookEntries
                        .filter((e) => e.enabled && e.content)
                        .slice(0, 5)
                        .map((e) => `条目: ${e.comment}\n内容: ${e.content}`)
                        .join('\n\n');
                }
            }

            const charPromptSuffix = `
每个角色必须严格遵循以下格式，且每个字段各占一行：
NAME: [角色的中文名称]
DESCRIPTION: [对角色的中文描述]
PERSONALITY: [角色的中文性格]
BACKGROUND: [角色的中文背景]

现在请生成7到8个角色的列表。`;

            const finalUserPrompt =
                PROMPT_PREFIX_TEMPLATE.replace(
                    '{chatHistory}',
                    chatHistoryString,
                ).replace('{worldInfo}', worldInfoString) +
                currentUserModifiedCharPromptCore +
                charPromptSuffix;

            const generatedText = await TavernHelper.generateRaw({
                ordered_prompts: [{ role: 'user', content: finalUserPrompt }],
                max_new_tokens: 4096, // Characters can be long
            });

            const charBlocksRegex =
                /^\s*NAME:\s*(.*?)\s*DESCRIPTION:\s*(.*?)\s*PERSONALITY:\s*(.*?)\s*BACKGROUND:\s*(.*?)(?=\n\s*NAME:|$)/gims;
            let match;
            let charsGeneratedCount = 0;
            while ((match = charBlocksRegex.exec(generatedText)) !== null) {
                const newChar = {
                    id: 'ai_char_' + Date.now() + '_' + charsGeneratedCount,
                    name: match[1].trim(),
                    description: match[2].trim(),
                    personality: match[3].trim(),
                    background: match[4].trim(),
                    isAIGenerated: true,
                };
                if (!definedChars.some((c) => c.name === newChar.name)) {
                    definedChars.push(newChar);
                    charsGeneratedCount++;
                }
            }

            if (charsGeneratedCount > 0) {
                toastr.success(`AI成功生成了 ${charsGeneratedCount} 个新人物!`);
                await saveAllTaskData(false); // 保存数据，但不刷新UI
                refreshQuestPopupUI(); // 手动刷新UI
                // 刷新后，重新打开并滚动到人物抽屉
                const charDrawer = $(
                    `#${QUEST_POPUP_ID} .generator-drawer:has(h4:contains("生成人物"))`,
                );
                if (charDrawer.length && !charDrawer.hasClass('open')) {
                    charDrawer.addClass('open');
                }
                charDrawer[0]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            } else {
                toastr.error('AI返回的人物格式不正确，无法解析。');
            }
        } catch (error) {
            console.error(
                '[QuestSystem] Error generating AI character:',
                error,
            );
            toastr.error(`AI人物生成失败: ${error.message}`);
        } finally {
            const finalButton = $(
                `#${QUEST_POPUP_ID} #trigger-ai-char-generation`,
            );
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }

    async function deleteAllAvailableChars() {
        if (!checkAPIs()) return;
        if (definedChars.length === 0) {
            toastr.info('没有可删除的人物。');
            return;
        }
        const count = definedChars.length;
        definedChars.length = 0; // Clear array
        await saveAllTaskData();
        toastr.success(`已成功删除 ${count} 个可用人物。`);
    }

    async function deleteAvailableChar(charId) {
        if (!checkAPIs()) return;
        const charIndex = definedChars.findIndex((c) => c.id === charId);
        if (charIndex === -1) {
            toastr.error(`人物 ${charId} 未在可用列表中找到！`);
            return;
        }
        const charDef = definedChars[charIndex];
        definedChars.splice(charIndex, 1);
        await saveAllTaskData();
        toastr.info(`已删除可用人物: ${charDef.name}`);
    }

    async function deletePlayerChar(charId) {
        if (!checkAPIs()) return;
        if (!playerChars[charId]) {
            toastr.error(`人物 ${charId} 未在当前人物列表中找到！`);
            return;
        }
        const charDef = playerChars[charId];
        delete playerChars[charId];
        await saveAllTaskData();
        toastr.info(`已删除当前人物: ${charDef.name}`);
    }

    async function addCharToTavern(charId, isFromPlayerList = false) {
        if (!checkAPIs()) return;

        let char;
        if (isFromPlayerList) {
            char = playerChars[charId];
        } else {
            const charIndex = definedChars.findIndex((c) => c.id === charId);
            if (charIndex !== -1) {
                char = definedChars[charIndex];
            }
        }

        if (!char) {
            toastr.error(`找不到要注入的人物 ${charId}！`);
            return;
        }

        const message = `【新人物登场】\n姓名: ${char.name}\n描述: ${char.description}\n性格: ${char.personality}\n背景: ${char.background}`;
        await injectSystemMessage(message);
        toastr.success(`人物 "${char.name}" 已成功注入酒馆！`);

        if (!isFromPlayerList) {
            const charIndex = definedChars.findIndex((c) => c.id === charId);
            if (charIndex !== -1) {
                const charDef = definedChars.splice(charIndex, 1)[0];
                playerChars[charId] = { ...charDef };
                await saveAllTaskData();
            }
        }
    }

    async function saveCharChanges(
        charId,
        newName,
        newDescription,
        newPersonality,
        newBackground,
        isFromPlayerList = false,
    ) {
        if (!checkAPIs()) return;
        let char;
        if (isFromPlayerList) {
            char = playerChars[charId];
        } else {
            const charIndex = definedChars.findIndex((c) => c.id === charId);
            if (charIndex !== -1) {
                char = definedChars[charIndex];
            }
        }

        if (!char) {
            toastr.error('无法找到要保存的人物！');
            return;
        }

        char.name = newName;
        char.description = newDescription;
        char.personality = newPersonality;
        char.background = newBackground;

        await saveAllTaskData();
        toastr.success(`人物 "${newName}" 已成功保存！`);

        if (isFromPlayerList) {
            const message = `【人物信息变更】\n玩家修改了人物 "${newName}" 的信息。\n新描述: ${newDescription}\n新性格: ${newPersonality}\n新背景: ${newBackground}`;
            await injectSystemMessage(message);
        }
    }

    function toggleEditModeForChar(charId, isFromPlayerList = false) {
        const charElement = $(`.quest-item[data-char-id="${charId}"]`);
        if (charElement.hasClass('editing')) {
            const nameInput = charElement.find('.edit-name').val();
            const descTextarea = charElement.find('.edit-description').val();
            const personalityTextarea = charElement
                .find('.edit-personality')
                .val();
            const backgroundTextarea = charElement
                .find('.edit-background')
                .val();

            charElement
                .find('.quest-title')
                .html(
                    escapeHtml(nameInput) +
                        ' <i class="fas fa-robot" title="AI生成"></i>',
                )
                .show();
            charElement
                .find('p:contains("描述:")')
                .html(`<b>描述:</b> ${escapeHtml(descTextarea)}`)
                .show();
            charElement
                .find('p:contains("性格:")')
                .html(`<b>性格:</b> ${escapeHtml(personalityTextarea)}`)
                .show();
            charElement
                .find('.quest-reward')
                .html(`<b>背景:</b> ${escapeHtml(backgroundTextarea)}`)
                .show();

            charElement.find('.quest-content-edit').remove();
            charElement.find('.quest-actions .edit').show();
            charElement.find('.quest-actions .save').remove();
            charElement.removeClass('editing');
        } else {
            const name = charElement.find('.quest-title').text().trim();
            const description = (
                charElement.find('p:contains("描述:")').html() || ''
            )
                .replace(/<b>描述:<\/b>\s*/, '')
                .trim();
            const personality = (
                charElement.find('p:contains("性格:")').html() || ''
            )
                .replace(/<b>性格:<\/b>\s*/, '')
                .trim();
            const background = (charElement.find('.quest-reward').html() || '')
                .replace(/<b>背景:<\/b>\s*/, '')
                .trim();

            charElement
                .find(
                    '.quest-title, p:contains("描述:"), p:contains("性格:"), .quest-reward',
                )
                .hide();

            const editHtml = `
                <div class="quest-content-edit">
                    <input type="text" class="edit-name" value="${escapeHtml(name)}" />
                    <textarea class="edit-description">${escapeHtml(description)}</textarea>
                    <textarea class="edit-personality">${escapeHtml(personality)}</textarea>
                    <textarea class="edit-background">${escapeHtml(background)}</textarea>
                </div>
            `;
            charElement.find('.quest-title').after(editHtml);

            charElement.find('.quest-actions .edit').hide();
            charElement
                .find('.quest-actions')
                .append(
                    `<button class="quest-button save" data-action="save-char" data-char-id="${charId}" ${isFromPlayerList ? 'data-is-player-char="true"' : ''}><i class="fas fa-save"></i> 保存</button>`,
                );
            charElement.addClass('editing');
        }
    }

    // --- Character Actions ---

    async function generateAndAddNewChar() {
        if (!checkAPIs()) return;
        const genButton = $(`#${QUEST_POPUP_ID} #trigger-ai-char-generation`);
        const originalButtonHtml = genButton.html();
        genButton
            .prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> AI塑造中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 4);
            const messages = await TavernHelper.getChatMessages(
                `${startMessageId}-${lastMessageId}`,
                { include_swipes: false },
            );
            const chatHistoryString =
                messages.length > 0
                    ? messages
                          .map(
                              (m) =>
                                  `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`,
                          )
                          .join('\n')
                    : '无最近聊天记录。';

            let worldInfoString = '未加载相关的世界设定信息。';
            const primaryLorebookName =
                await TavernHelper.getCurrentCharPrimaryLorebook();
            if (primaryLorebookName) {
                const lorebookEntries =
                    await TavernHelper.getLorebookEntries(primaryLorebookName);
                if (lorebookEntries.length > 0) {
                    worldInfoString = lorebookEntries
                        .filter((e) => e.enabled && e.content)
                        .slice(0, 5)
                        .map((e) => `条目: ${e.comment}\n内容: ${e.content}`)
                        .join('\n\n');
                }
            }

            const charPromptSuffix = `
每个角色必须严格遵循以下格式，且每个字段各占一行：
NAME: [角色的中文名称]
DESCRIPTION: [对角色的中文描述]
PERSONALITY: [角色的中文性格]
BACKGROUND: [角色的中文背景]

现在请生成7到8个角色的列表。`;

            const finalUserPrompt =
                PROMPT_PREFIX_TEMPLATE.replace(
                    '{chatHistory}',
                    chatHistoryString,
                ).replace('{worldInfo}', worldInfoString) +
                currentUserModifiedCharPromptCore +
                charPromptSuffix;

            const generatedText = await TavernHelper.generateRaw({
                ordered_prompts: [{ role: 'user', content: finalUserPrompt }],
                max_new_tokens: 4096, // Characters can be long
            });

            const charBlocksRegex =
                /^\s*NAME:\s*(.*?)\s*DESCRIPTION:\s*(.*?)\s*PERSONALITY:\s*(.*?)\s*BACKGROUND:\s*(.*?)(?=\n\s*NAME:|$)/gims;
            let match;
            let charsGeneratedCount = 0;
            while ((match = charBlocksRegex.exec(generatedText)) !== null) {
                const newChar = {
                    id: 'ai_char_' + Date.now() + '_' + charsGeneratedCount,
                    name: match[1].trim(),
                    description: match[2].trim(),
                    personality: match[3].trim(),
                    background: match[4].trim(),
                    isAIGenerated: true,
                };
                if (!definedChars.some((c) => c.name === newChar.name)) {
                    definedChars.push(newChar);
                    charsGeneratedCount++;
                }
            }

            if (charsGeneratedCount > 0) {
                toastr.success(`AI成功生成了 ${charsGeneratedCount} 个新人物!`);
                await saveAllTaskData();
            } else {
                toastr.error('AI返回的人物格式不正确，无法解析。');
            }
        } catch (error) {
            console.error(
                '[QuestSystem] Error generating AI character:',
                error,
            );
            toastr.error(`AI人物生成失败: ${error.message}`);
        } finally {
            const finalButton = $(
                `#${QUEST_POPUP_ID} #trigger-ai-char-generation`,
            );
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }

    async function deleteAllAvailableChars() {
        if (!checkAPIs()) return;
        if (definedChars.length === 0) {
            toastr.info('没有可删除的人物。');
            return;
        }
        const count = definedChars.length;
        definedChars.length = 0; // Clear array
        await saveAllTaskData();
        toastr.success(`已成功删除 ${count} 个可用人物。`);
    }

    async function deleteAvailableChar(charId) {
        if (!checkAPIs()) return;
        const charIndex = definedChars.findIndex((c) => c.id === charId);
        if (charIndex === -1) {
            toastr.error(`人物 ${charId} 未在可用列表中找到！`);
            return;
        }
        const charDef = definedChars[charIndex];
        definedChars.splice(charIndex, 1);
        await saveAllTaskData();
        toastr.info(`已删除可用人物: ${charDef.name}`);
    }

    async function addCharToTavern(charId) {
        if (!checkAPIs()) return;
        const char = definedChars.find((c) => c.id === charId);
        if (!char) {
            toastr.error(`找不到要注入的人物 ${charId}！`);
            return;
        }
        const message = `【新人物登场】\n姓名: ${char.name}\n描述: ${char.description}\n性格: ${char.personality}\n背景: ${char.background}`;
        await injectSystemMessage(message);
        toastr.success(`人物 "${char.name}" 已成功注入酒馆！`);

        const charIndex = definedChars.findIndex((c) => c.id === charId);
        if (charIndex !== -1) {
            definedChars.splice(charIndex, 1);
            await saveAllTaskData();
        }
    }

    // --- Item Actions ---

    async function deleteAllAvailableItems() {
        if (!checkAPIs()) return;
        if (definedItems.length === 0) {
            toastr.info('没有可删除的物品。');
            return;
        }
        const count = definedItems.length;
        definedItems.length = 0; // Clear array
        await saveAllTaskData();
        toastr.success(`已成功删除 ${count} 个可用物品。`);
    }

    async function deleteAvailableItem(itemId) {
        if (!checkAPIs()) return;
        const itemIndex = definedItems.findIndex((i) => i.id === itemId);
        if (itemIndex === -1) {
            toastr.error(`物品 ${itemId} 未在可用列表中找到！`);
            return;
        }
        const itemDef = definedItems[itemIndex];
        definedItems.splice(itemIndex, 1);
        await saveAllTaskData();
        toastr.info(`已删除可用物品: ${itemDef.name}`);
    }

    async function deletePlayerItem(itemId) {
        if (!checkAPIs()) return;
        if (!playerItems[itemId]) {
            toastr.error(`物品 ${itemId} 未在当前物品列表中找到！`);
            return;
        }
        const itemDef = playerItems[itemId];
        delete playerItems[itemId];
        await saveAllTaskData();
        toastr.info(`已删除当前物品: ${itemDef.name}`);
    }

    async function addItemToTavern(itemId, isFromPlayerList = false) {
        if (!checkAPIs()) return;

        let item;
        if (isFromPlayerList) {
            item = playerItems[itemId];
        } else {
            const itemIndex = definedItems.findIndex((i) => i.id === itemId);
            if (itemIndex !== -1) {
                item = definedItems[itemIndex];
            }
        }

        if (!item) {
            toastr.error(`找不到要注入的物品 ${itemId}！`);
            return;
        }

        const message = `【获得物品】\n名称: ${item.name}\n描述: ${item.description}\n效果: ${item.effect}`;
        await injectSystemMessage(message);
        toastr.success(`物品 "${item.name}" 已成功注入酒馆！`);

        if (!isFromPlayerList) {
            const itemIndex = definedItems.findIndex((i) => i.id === itemId);
            if (itemIndex !== -1) {
                const itemDef = definedItems.splice(itemIndex, 1)[0];
                playerItems[itemId] = { ...itemDef };
                await saveAllTaskData();
            }
        }
    }

    async function saveItemChanges(
        itemId,
        newName,
        newDescription,
        newEffect,
        isFromPlayerList = false,
    ) {
        if (!checkAPIs()) return;
        let item;
        if (isFromPlayerList) {
            item = playerItems[itemId];
        } else {
            const itemIndex = definedItems.findIndex((i) => i.id === itemId);
            if (itemIndex !== -1) {
                item = definedItems[itemIndex];
            }
        }

        if (!item) {
            toastr.error('无法找到要保存的物品！');
            return;
        }

        item.name = newName;
        item.description = newDescription;
        item.effect = newEffect;

        await saveAllTaskData();
        toastr.success(`物品 "${newName}" 已成功保存！`);

        if (isFromPlayerList) {
            const message = `【物品信息变更】\n玩家修改了物品 "${newName}" 的信息。\n新描述: ${newDescription}\n新效果: ${newEffect}`;
            await injectSystemMessage(message);
        }
    }

    function toggleEditModeForItem(itemId, isFromPlayerList = false) {
        const itemElement = $(`.quest-item[data-item-id="${itemId}"]`);
        if (itemElement.hasClass('editing')) {
            const nameInput = itemElement.find('.edit-name').val();
            const descTextarea = itemElement.find('.edit-description').val();
            const effectTextarea = itemElement.find('.edit-effect').val();

            itemElement
                .find('.quest-title')
                .html(
                    escapeHtml(nameInput) +
                        ' <i class="fas fa-robot" title="AI生成"></i>',
                )
                .show();
            itemElement.find('.quest-description').text(descTextarea).show();
            itemElement
                .find('.quest-reward')
                .html(`<b>效果:</b> ${escapeHtml(effectTextarea)}`)
                .show();

            itemElement.find('.quest-content-edit').remove();
            itemElement.find('.quest-actions .edit').show();
            itemElement.find('.quest-actions .save').remove();
            itemElement.removeClass('editing');
        } else {
            const name = itemElement.find('.quest-title').text().trim();
            const description = itemElement
                .find('.quest-description')
                .text()
                .trim();
            const effect = (itemElement.find('.quest-reward').html() || '')
                .replace(/<b>效果:<\/b>\s*/, '')
                .trim();

            itemElement
                .find('.quest-title, .quest-description, .quest-reward')
                .hide();

            const editHtml = `
                <div class="quest-content-edit">
                    <input type="text" class="edit-name" value="${escapeHtml(name)}" />
                    <textarea class="edit-description">${escapeHtml(description)}</textarea>
                    <textarea class="edit-effect">${escapeHtml(effect)}</textarea>
                </div>
            `;
            itemElement.find('.quest-title').after(editHtml);

            itemElement.find('.quest-actions .edit').hide();
            itemElement
                .find('.quest-actions')
                .append(
                    `<button class="quest-button save" data-action="save-item" data-item-id="${itemId}" ${isFromPlayerList ? 'data-is-player-item="true"' : ''}><i class="fas fa-save"></i> 保存</button>`,
                );
            itemElement.addClass('editing');
        }
    }

    async function completeTask(taskId) {
        if (!checkAPIs()) return;
        const taskData = playerTasksStatus[taskId];
        if (!taskData || taskData.status !== 'active') {
            toastr.warning(
                `任务 "${taskData?.title || taskId}" 状态异常或非激活。`,
            );
            return;
        }

        const genButton = $(
            `#${QUEST_POPUP_ID} .quest-item[data-task-id="${taskId}"] .complete`,
        );
        const originalButtonHtml = genButton.html();
        genButton
            .prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> AI判断中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 29); // 增加上下文长度到30条
            const messages = await TavernHelper.getChatMessages(
                `${startMessageId}-${lastMessageId}`,
                { include_swipes: false },
            );
            const chatHistoryString =
                messages.length > 0
                    ? messages
                          .map(
                              (m) =>
                                  `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`,
                          )
                          .join('\n')
                    : '无最近聊天记录。';

            const judgePrompt = AI_JUDGE_COMPLETION_PROMPT_TEMPLATE.replace(
                /{playerName}/g,
                escapeHtml(SillyTavern.name1),
            )
                .replace(/{charName}/g, escapeHtml(SillyTavern.name2))
                .replace(/{taskTitle}/g, escapeHtml(taskData.title))
                .replace('{taskDescription}', escapeHtml(taskData.description))
                .replace('{chatHistory}', chatHistoryString);

            const aiResponse = await TavernHelper.generateRaw({
                ordered_prompts: [{ role: 'user', content: judgePrompt }],
            });

            if (aiResponse.includes('STATUS:已完成')) {
                taskData.status = 'completed';
                taskData.endTime = Date.now();
                const reward = taskData.rewardMessage || '无特定奖励';
                await injectSystemMessage(
                    `${SillyTavern.name1 || '玩家'} 已完成任务: "${taskData.title}"！获得奖励: ${reward}`,
                );
                toastr.success(`任务完成: ${taskData.title}`);
                await saveAllTaskData();
            } else if (aiResponse.includes('STATUS:未完成')) {
                const condition =
                    aiResponse.match(/CONDITION:\[(.*?)]/)?.[1] || '未知';
                const suggestion =
                    aiResponse.match(/SUGGESTION:\[(.*?)]/)?.[1] ||
                    '请继续努力。';
                await injectSystemMessage(
                    `任务 "${taskData.title}" 尚未完成。\n你需要: ${condition}\n或许可以尝试: ${suggestion}`,
                );
                toastr.info(`任务 "${taskData.title}" 尚未完成。`);
                refreshQuestPopupUI();
            } else {
                throw new Error('AI未能明确判断任务状态。');
            }
        } catch (error) {
            console.error(
                '[QuestSystem] Error during AI task completion judgment:',
                error,
            );
            toastr.error(`AI判断任务完成时出错: ${error.message}`);
        } finally {
            const finalButton = $(
                `#${QUEST_POPUP_ID} .quest-item[data-task-id="${taskId}"] .complete`,
            );
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }

    async function generateAndAddNewAiTask() {
        if (!checkAPIs()) return;
        const genButton = $(`#${QUEST_POPUP_ID} #trigger-ai-task-generation`);
        const originalButtonHtml = genButton.html();
        genButton
            .prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> AI思考中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 4);
            const messages = await TavernHelper.getChatMessages(
                `${startMessageId}-${lastMessageId}`,
                { include_swipes: false },
            );
            const chatHistoryString =
                messages.length > 0
                    ? messages
                          .map(
                              (m) =>
                                  `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`,
                          )
                          .join('\n')
                    : '无最近聊天记录。';

            let worldInfoString = '未加载相关的世界设定信息。';
            const primaryLorebookName =
                await TavernHelper.getCurrentCharPrimaryLorebook();
            if (primaryLorebookName) {
                const lorebookEntries =
                    await TavernHelper.getLorebookEntries(primaryLorebookName);
                if (lorebookEntries.length > 0) {
                    worldInfoString = lorebookEntries
                        .filter((e) => e.enabled && e.content)
                        .slice(0, 5)
                        .map((e) => `条目: ${e.comment}\n内容: ${e.content}`)
                        .join('\n\n');
                }
            }

            const finalUserPrompt =
                PROMPT_PREFIX_TEMPLATE.replace(
                    '{chatHistory}',
                    chatHistoryString,
                ).replace('{worldInfo}', worldInfoString) +
                currentUserModifiedEditablePromptCore +
                PROMPT_SUFFIX_TEMPLATE;

            const generatedText = await TavernHelper.generateRaw({
                ordered_prompts: [{ role: 'user', content: finalUserPrompt }],
                max_new_tokens: 2048,
            });

            const questBlocksRegex =
                /^\s*TITLE:\s*(.*?)\s*DESCRIPTION:\s*(.*?)\s*REWARD:\s*(.*?)(?=\n\s*TITLE:|$)/gims;
            let match;
            let tasksGeneratedCount = 0;
            while ((match = questBlocksRegex.exec(generatedText)) !== null) {
                const newTask = {
                    id: 'ai_task_' + Date.now() + '_' + tasksGeneratedCount,
                    title: match[1].trim(),
                    description: match[2].trim(),
                    rewardMessage: match[3].trim(),
                    isAIGenerated: true,
                };
                if (
                    !definedTasks.some((t) => t.title === newTask.title) &&
                    !Object.values(playerTasksStatus).some(
                        (pt) => pt.title === newTask.title,
                    )
                ) {
                    definedTasks.push(newTask);
                    tasksGeneratedCount++;
                }
            }

            if (tasksGeneratedCount > 0) {
                toastr.success(`AI成功生成了 ${tasksGeneratedCount} 个新任务!`);
                await saveAllTaskData(false); // 保存数据，但不刷新UI
                refreshQuestPopupUI(); // 手动刷新UI
                // 刷新后，重新打开并滚动到任务抽屉
                const taskDrawer = $(
                    `#${QUEST_POPUP_ID} .generator-drawer:has(h4:contains("生成任务"))`,
                );
                if (taskDrawer.length && !taskDrawer.hasClass('open')) {
                    taskDrawer.addClass('open');
                }
                taskDrawer[0]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            } else {
                toastr.error('AI返回的任务格式不正确，无法解析。');
            }
        } catch (error) {
            console.error('[QuestSystem] Error generating AI task:', error);
            toastr.error(`AI任务生成失败: ${error.message}`);
        } finally {
            const finalButton = $(
                `#${QUEST_POPUP_ID} #trigger-ai-task-generation`,
            );
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }

    async function generateAndAddNewItem() {
        if (!checkAPIs()) return;
        const genButton = $(`#${QUEST_POPUP_ID} #trigger-ai-item-generation`);
        const originalButtonHtml = genButton.html();
        genButton
            .prop('disabled', true)
            .html('<i class="fas fa-spinner fa-spin"></i> AI锻造中...');

        try {
            const lastMessageId = TavernHelper.getLastMessageId();
            const startMessageId = Math.max(0, lastMessageId - 4);
            const messages = await TavernHelper.getChatMessages(
                `${startMessageId}-${lastMessageId}`,
                { include_swipes: false },
            );
            const chatHistoryString =
                messages.length > 0
                    ? messages
                          .map(
                              (m) =>
                                  `${escapeHtml(m.name)}: ${escapeHtml(m.message)}`,
                          )
                          .join('\n')
                    : '无最近聊天记录。';

            let worldInfoString = '未加载相关的世界设定信息。';
            const primaryLorebookName =
                await TavernHelper.getCurrentCharPrimaryLorebook();
            if (primaryLorebookName) {
                const lorebookEntries =
                    await TavernHelper.getLorebookEntries(primaryLorebookName);
                if (lorebookEntries.length > 0) {
                    worldInfoString = lorebookEntries
                        .filter((e) => e.enabled && e.content)
                        .slice(0, 5)
                        .map((e) => `条目: ${e.comment}\n内容: ${e.content}`)
                        .join('\n\n');
                }
            }

            const itemPromptSuffix = `
每个物品必须严格遵循以下格式，且每个字段各占一行：
NAME: [物品的中文名称]
DESCRIPTION: [对物品的中文描述]
EFFECT: [物品的中文效果描述]

现在请生成7到8个物品的列表。`;

            const finalUserPrompt =
                PROMPT_PREFIX_TEMPLATE.replace(
                    '{chatHistory}',
                    chatHistoryString,
                ).replace('{worldInfo}', worldInfoString) +
                currentUserModifiedItemPromptCore +
                itemPromptSuffix;

            const generatedText = await TavernHelper.generateRaw({
                ordered_prompts: [{ role: 'user', content: finalUserPrompt }],
                max_new_tokens: 2048,
            });

            const itemBlocksRegex =
                /^\s*NAME:\s*(.*?)\s*DESCRIPTION:\s*(.*?)\s*EFFECT:\s*(.*?)(?=\n\s*NAME:|$)/gims;
            let match;
            let itemsGeneratedCount = 0;
            while ((match = itemBlocksRegex.exec(generatedText)) !== null) {
                const newItem = {
                    id: 'ai_item_' + Date.now() + '_' + itemsGeneratedCount,
                    name: match[1].trim(),
                    description: match[2].trim(),
                    effect: match[3].trim(),
                    isAIGenerated: true,
                };
                if (!definedItems.some((i) => i.name === newItem.name)) {
                    definedItems.push(newItem);
                    itemsGeneratedCount++;
                }
            }

            if (itemsGeneratedCount > 0) {
                toastr.success(`AI成功生成了 ${itemsGeneratedCount} 个新物品!`);
                await saveAllTaskData(false); // 保存数据，但不刷新UI
                refreshQuestPopupUI(); // 手动刷新UI
                // 刷新后，重新打开并滚动到物品抽屉
                const itemDrawer = $(
                    `#${QUEST_POPUP_ID} .generator-drawer:has(h4:contains("生成物品"))`,
                );
                if (itemDrawer.length && !itemDrawer.hasClass('open')) {
                    itemDrawer.addClass('open');
                }
                itemDrawer[0]?.scrollIntoView({
                    behavior: 'smooth',
                    block: 'nearest',
                });
            } else {
                toastr.error('AI返回的物品格式不正确，无法解析。');
            }
        } catch (error) {
            console.error('[QuestSystem] Error generating AI item:', error);
            toastr.error(`AI物品生成失败: ${error.message}`);
        } finally {
            const finalButton = $(
                `#${QUEST_POPUP_ID} #trigger-ai-item-generation`,
            );
            if (finalButton.length) {
                finalButton.prop('disabled', false).html(originalButtonHtml);
            }
        }
    }
    // --- Updater Module ---
    const Updater = {
        gitRepoOwner: '1830488003',
        gitRepoName: 'quest-system-extension',
        currentVersion: '0.0.0',
        latestVersion: '0.0.0',
        changelogContent: '',

        async fetchRawFileFromGitHub(filePath) {
            const url = `https://raw.githubusercontent.com/${this.gitRepoOwner}/${this.gitRepoName}/main/${filePath}`;
            const response = await fetch(url, { cache: 'no-cache' });
            if (!response.ok) {
                throw new Error(
                    `Failed to fetch ${filePath} from GitHub: ${response.statusText}`,
                );
            }
            return response.text();
        },

        parseVersion(content) {
            try {
                return JSON.parse(content).version || '0.0.0';
            } catch (error) {
                console.error('Failed to parse version:', error);
                return '0.0.0';
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
            toastr.info('正在开始更新...');
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

                toastr.success('更新成功！将在3秒后刷新页面应用更改。');
                setTimeout(() => location.reload(), 3000);
            } catch (error) {
                toastr.error(`更新失败: ${error.message}`);
            }
        },

        async showUpdateConfirmDialog() {
            const { POPUP_TYPE, callGenericPopup } =
                SillyTavern.getContext().popup;
            try {
                this.changelogContent =
                    await this.fetchRawFileFromGitHub('CHANGELOG.md');
            } catch (error) {
                this.changelogContent = `发现新版本 ${this.latestVersion}！您想现在更新吗？`;
            }
            if (
                await callGenericPopup(
                    this.changelogContent,
                    POPUP_TYPE.CONFIRM,
                    {
                        okButton: '立即更新',
                        cancelButton: '稍后',
                        wide: true,
                        large: true,
                    },
                )
            ) {
                await this.performUpdate();
            }
        },

        async checkForUpdates(isManual = false) {
            const updateButton = $('#quest-check-update-button');
            const updateIndicator = $(
                '.extension_settings[data-extension-name="quest-system-extension"] .update-indicator',
            );
            if (isManual) {
                updateButton
                    .prop('disabled', true)
                    .html('<i class="fas fa-spinner fa-spin"></i> 检查中...');
            }
            try {
                const localManifestText = await (
                    await fetch(
                        `/${extensionFolderPath}/manifest.json?t=${Date.now()}`,
                    )
                ).text();
                this.currentVersion = this.parseVersion(localManifestText);
                $('#quest-system-current-version').text(this.currentVersion);

                const remoteManifestText =
                    await this.fetchRawFileFromGitHub('manifest.json');
                this.latestVersion = this.parseVersion(remoteManifestText);

                if (
                    this.compareVersions(
                        this.latestVersion,
                        this.currentVersion,
                    ) > 0
                ) {
                    updateIndicator.show();
                    updateButton
                        .html(
                            `<i class="fa-solid fa-gift"></i> 发现新版 ${this.latestVersion}!`,
                        )
                        .off('click')
                        .on('click', () => this.showUpdateConfirmDialog());
                    if (isManual)
                        toastr.success(
                            `发现新版本 ${this.latestVersion}！点击按钮进行更新。`,
                        );
                } else {
                    updateIndicator.hide();
                    if (isManual) toastr.info('您当前已是最新版本。');
                }
            } catch (error) {
                if (isManual) toastr.error(`检查更新失败: ${error.message}`);
            } finally {
                if (
                    isManual &&
                    this.compareVersions(
                        this.latestVersion,
                        this.currentVersion,
                    ) <= 0
                ) {
                    updateButton
                        .prop('disabled', false)
                        .html(
                            '<i class="fa-solid fa-cloud-arrow-down"></i> 检查更新',
                        );
                }
            }
        },
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

        // --- Generator Sections ---

        // Section 1: Generate Task (collapsible)
        html += `
        <div class="inline-drawer generator-drawer">
            <div class="inline-drawer-toggle generator-drawer-toggle">
                <div class="inline-drawer-header">
                    <i class="fa-solid fa-scroll"></i>
                    <h4>生成任务</h4>
                </div>
                <div class="inline-drawer-icon fa-solid fa-angle-down down"></div>
            </div>
            <div class="inline-drawer-content generator-drawer-content">
                <div class="quest-section ai-generator">
                    <p class="quest-description">点击生成AI任务，或先编辑核心指令以定制任务。</p>
                    <div class="quest-actions">
                        <button id="trigger-ai-task-generation" class="quest-button"><i class="fas fa-magic"></i> 生成AI任务</button>
                        <button id="edit-ai-prompt-button" class="quest-button edit-prompt"><i class="fas fa-edit"></i> 编辑指令</button>
                    </div>
                </div>
                <div class="quest-section available-quests">
                    <div class="quest-section-header">
                        <h5><i class="fas fa-clipboard-list"></i> 可接任务</h5>
                        ${definedTasks.filter((task) => !playerTasksStatus[task.id]).length > 0 ? '<button id="delete-all-available-quests" class="quest-button delete-all-button"><i class="fas fa-trash"></i> 全部删除</button>' : ''}
                    </div>`;
        const availableTasks = definedTasks.filter(
            (task) => !playerTasksStatus[task.id],
        );
        if (availableTasks.length > 0) {
            availableTasks.forEach((task) => {
                html += `<div class="quest-item" data-task-id="${task.id}">
                    <h4 class="quest-title">${escapeHtml(task.title)} <i class="fas fa-robot" title="AI生成"></i></h4>
                    <p class="quest-description">${escapeHtml(task.description)}</p>
                    <p class="quest-reward"><b>奖励:</b> ${escapeHtml(task.rewardMessage)}</p>
                    <div class="quest-actions">
                         <button class="quest-button accept" data-action="accept" data-task-id="${task.id}"><i class="fas fa-plus"></i> 接受</button>
                         <button class="quest-button delete" data-action="delete-available" data-task-id="${task.id}"><i class="fas fa-trash"></i> 删除</button>
                         <button class="quest-button edit" data-action="edit" data-task-id="${task.id}"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">暂无新任务，请尝试AI生成。</p>`;
        }
        html += `</div>`; // close available-quests

        // --- Log Sections within the Task Drawer ---
        // Active Quests
        const activeTasks = Object.entries(playerTasksStatus).filter(
            ([_, data]) => data.status === 'active',
        );
        html += `<div class="quest-section active-quests"><h3><i class="fas fa-hourglass-half"></i> 当前任务</h3>`;
        if (activeTasks.length > 0) {
            activeTasks.forEach(([id, task]) => {
                html += `<div class="quest-item" data-task-id="${id}">
                    <h4 class="quest-title">${escapeHtml(task.title)} ${task.isAIGenerated ? '<i class="fas fa-robot" title="AI生成"></i>' : ''}</h4>
                    <p class="quest-description">${escapeHtml(task.description)}</p>
                    <p class="quest-reward"><b>奖励:</b> ${escapeHtml(task.rewardMessage)}</p>
                    <div class="quest-actions">
                        <button class="quest-button complete" data-action="complete" data-task-id="${id}"><i class="fas fa-check"></i> 完成</button>
                        <button class="quest-button abandon" data-action="abandon" data-task-id="${id}"><i class="fas fa-times"></i> 放弃</button>
                        <button class="quest-button edit" data-action="edit" data-task-id="${id}"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">无进行中的任务。</p>`;
        }
        html += `</div>`;

        // Completed Quests
        const completedTasks = Object.entries(playerTasksStatus).filter(
            ([_, data]) => data.status === 'completed',
        );
        html += `<div class="quest-section completed-quests"><h3><i class="fas fa-check-double"></i> 已完成任务</h3>`;
        if (completedTasks.length > 0) {
            completedTasks.forEach(([id, task]) => {
                html += `<div class="quest-item completed-quest" data-task-id="${id}">
                    <h4 class="quest-title">${escapeHtml(task.title)} ${task.isAIGenerated ? '<i class="fas fa-robot" title="AI生成"></i>' : ''}</h4>
                    <p class="quest-description">${escapeHtml(task.description)}</p>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">尚未完成任何任务。</p>`;
        }
        html += `</div>`;

        html += `</div></div>`; // close content, drawer

        // Section 2: Generate Item (collapsible)
        html += `
        <div class="inline-drawer generator-drawer">
            <div class="inline-drawer-toggle generator-drawer-toggle">
                <div class="inline-drawer-header">
                    <i class="fa-solid fa-box-archive"></i>
                    <h4>生成物品</h4>
                </div>
                <div class="inline-drawer-icon fa-solid fa-angle-down down"></div>
            </div>
            <div class="inline-drawer-content generator-drawer-content">
                <div class="quest-section ai-generator">
                    <p class="quest-description">点击生成AI物品，或先编辑核心指令以定制物品。</p>
                    <div class="quest-actions">
                        <button id="trigger-ai-item-generation" class="quest-button"><i class="fas fa-magic"></i> 生成AI物品</button>
                        <button id="edit-ai-item-prompt-button" class="quest-button edit-prompt"><i class="fas fa-edit"></i> 编辑指令</button>
                    </div>
                </div>
                <div class="quest-section available-items">
                    <div class="quest-section-header">
                        <h5><i class="fas fa-gem"></i> 可用物品</h5>
                        ${definedItems.length > 0 ? '<button id="delete-all-available-items" class="quest-button delete-all-button"><i class="fas fa-trash"></i> 全部删除</button>' : ''}
                    </div>`;
        if (definedItems.length > 0) {
            definedItems.forEach((item) => {
                html += `<div class="quest-item" data-item-id="${item.id}">
                    <h4 class="quest-title">${escapeHtml(item.name)} <i class="fas fa-robot" title="AI生成"></i></h4>
                    <p class="quest-description">${escapeHtml(item.description)}</p>
                    <p class="quest-reward"><b>效果:</b> ${escapeHtml(item.effect)}</p>
                    <div class="quest-actions">
                         <button class="quest-button accept" data-action="add-item" data-item-id="${item.id}"><i class="fas fa-plus"></i> 注入酒馆</button>
                         <button class="quest-button delete" data-action="delete-available-item" data-item-id="${item.id}"><i class="fas fa-trash"></i> 删除</button>
                         <button class="quest-button edit" data-action="edit-item" data-item-id="${item.id}"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">暂无新物品，请尝试AI生成。</p>`;
        }
        html += `</div>`; // close available-items

        // --- Player's Current Items ---
        const currentItems = Object.entries(playerItems);
        html += `<div class="quest-section current-items"><h3><i class="fas fa-briefcase"></i> 当前物品</h3>`;
        if (currentItems.length > 0) {
            currentItems.forEach(([id, item]) => {
                html += `<div class="quest-item" data-item-id="${id}">
                    <h4 class="quest-title">${escapeHtml(item.name)} ${item.isAIGenerated ? '<i class="fas fa-robot" title="AI生成"></i>' : ''}</h4>
                    <p class="quest-description">${escapeHtml(item.description)}</p>
                    <p class="quest-reward"><b>效果:</b> ${escapeHtml(item.effect)}</p>
                    <div class="quest-actions">
                        <button class="quest-button inject" data-action="add-item" data-item-id="${id}" data-is-player-item="true"><i class="fas fa-syringe"></i> 再次注入</button>
                        <button class="quest-button delete" data-action="delete-player-item" data-item-id="${id}"><i class="fas fa-trash"></i> 删除</button>
                        <button class="quest-button edit" data-action="edit-item" data-item-id="${id}" data-is-player-item="true"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">无持有的物品。</p>`;
        }
        html += `</div>`;

        html += `</div></div>`; // close content, drawer

        // Section 3: Generate Character (collapsible)
        html += `
        <div class="inline-drawer generator-drawer">
            <div class="inline-drawer-toggle generator-drawer-toggle">
                <div class="inline-drawer-header">
                    <i class="fa-solid fa-user-plus"></i>
                    <h4>生成人物</h4>
                </div>
                <div class="inline-drawer-icon fa-solid fa-angle-down down"></div>
            </div>
            <div class="inline-drawer-content generator-drawer-content">
                <div class="quest-section ai-generator">
                    <p class="quest-description">点击生成AI人物，或先编辑核心指令以定制人物。</p>
                    <div class="quest-actions">
                        <button id="trigger-ai-char-generation" class="quest-button"><i class="fas fa-magic"></i> 生成AI人物</button>
                        <button id="edit-ai-char-prompt-button" class="quest-button edit-prompt"><i class="fas fa-edit"></i> 编辑指令</button>
                    </div>
                </div>
                <div class="quest-section available-chars">
                    <div class="quest-section-header">
                        <h5><i class="fas fa-users"></i> 可用人物</h5>
                        ${definedChars.length > 0 ? '<button id="delete-all-available-chars" class="quest-button delete-all-button"><i class="fas fa-trash"></i> 全部删除</button>' : ''}
                    </div>`;
        if (definedChars.length > 0) {
            definedChars.forEach((char) => {
                html += `<div class="quest-item" data-char-id="${char.id}">
                    <h4 class="quest-title">${escapeHtml(char.name)} <i class="fas fa-robot" title="AI生成"></i></h4>
                    <p class="quest-description"><b>描述:</b> ${escapeHtml(char.description)}</p>
                    <p class="quest-description"><b>性格:</b> ${escapeHtml(char.personality)}</p>
                    <p class="quest-reward"><b>背景:</b> ${escapeHtml(char.background)}</p>
                    <div class="quest-actions">
                         <button class="quest-button accept" data-action="add-char" data-char-id="${char.id}"><i class="fas fa-plus"></i> 注入酒馆</button>
                         <button class="quest-button delete" data-action="delete-available-char" data-char-id="${char.id}"><i class="fas fa-trash"></i> 删除</button>
                         <button class="quest-button edit" data-action="edit-char" data-char-id="${char.id}"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">暂无新人物，请尝试AI生成。</p>`;
        }
        html += `</div>`; // close available-chars

        // --- Player's Current Characters ---
        const currentChars = Object.entries(playerChars);
        html += `<div class="quest-section current-chars"><h3><i class="fas fa-address-book"></i> 当前人物</h3>`;
        if (currentChars.length > 0) {
            currentChars.forEach(([id, char]) => {
                html += `<div class="quest-item" data-char-id="${id}">
                    <h4 class="quest-title">${escapeHtml(char.name)} ${char.isAIGenerated ? '<i class="fas fa-robot" title="AI生成"></i>' : ''}</h4>
                    <p class="quest-description"><b>描述:</b> ${escapeHtml(char.description)}</p>
                    <p class="quest-description"><b>性格:</b> ${escapeHtml(char.personality)}</p>
                    <p class="quest-reward"><b>背景:</b> ${escapeHtml(char.background)}</p>
                    <div class="quest-actions">
                        <button class="quest-button inject" data-action="add-char" data-char-id="${id}" data-is-player-char="true"><i class="fas fa-syringe"></i> 再次注入</button>
                        <button class="quest-button delete" data-action="delete-player-char" data-char-id="${id}"><i class="fas fa-trash"></i> 删除</button>
                        <button class="quest-button edit" data-action="edit-char" data-char-id="${id}" data-is-player-char="true"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">无持有的人物。</p>`;
        }
        html += `</div>`;

        html += `</div></div>`; // close content, drawer

        // Section 4: Generate Plot (collapsible)
        html += `
        <div class="inline-drawer generator-drawer">
            <div class="inline-drawer-toggle generator-drawer-toggle">
                <div class="inline-drawer-header">
                    <i class="fa-solid fa-feather-pointed"></i>
                    <h4>生成剧情</h4>
                </div>
                <div class="inline-drawer-icon fa-solid fa-angle-down down"></div>
            </div>
            <div class="inline-drawer-content generator-drawer-content">
                <div class="quest-section ai-generator">
                    <p class="quest-description">点击生成AI剧情，或先编辑核心指令以定制剧情。</p>
                    <div class="quest-actions">
                        <button id="trigger-ai-plot-generation" class="quest-button"><i class="fas fa-magic"></i> 生成AI剧情</button>
                        <button id="edit-ai-plot-prompt-button" class="quest-button edit-prompt"><i class="fas fa-edit"></i> 编辑指令</button>
                    </div>
                </div>
                <div class="quest-section available-plots">
                    <div class="quest-section-header">
                        <h5><i class="fas fa-book-open"></i> 可用剧情</h5>
                        ${definedPlots.length > 0 ? '<button id="delete-all-available-plots" class="quest-button delete-all-button"><i class="fas fa-trash"></i> 全部删除</button>' : ''}
                    </div>`;
        if (definedPlots.length > 0) {
            definedPlots.forEach((plot) => {
                html += `<div class="quest-item" data-plot-id="${plot.id}">
                    <h4 class="quest-title">${escapeHtml(plot.title)} <i class="fas fa-robot" title="AI生成"></i></h4>
                    <p class="quest-description">${escapeHtml(plot.description)}</p>
                    <div class="quest-actions">
                         <button class="quest-button accept" data-action="add-plot" data-plot-id="${plot.id}"><i class="fas fa-plus"></i> 注入酒馆</button>
                         <button class="quest-button delete" data-action="delete-available-plot" data-plot-id="${plot.id}"><i class="fas fa-trash"></i> 删除</button>
                         <button class="quest-button edit" data-action="edit-plot" data-plot-id="${plot.id}"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">暂无新剧情，请尝试AI生成。</p>`;
        }
        html += `</div>`; // close available-plots

        // --- Player's Current Plots ---
        const currentPlots = Object.entries(playerPlots);
        html += `<div class="quest-section current-plots"><h3><i class="fas fa-book"></i> 当前剧情</h3>`;
        if (currentPlots.length > 0) {
            currentPlots.forEach(([id, plot]) => {
                html += `<div class="quest-item" data-plot-id="${id}">
                    <h4 class="quest-title">${escapeHtml(plot.title)} ${plot.isAIGenerated ? '<i class="fas fa-robot" title="AI生成"></i>' : ''}</h4>
                    <p class="quest-description">${escapeHtml(plot.description)}</p>
                    <div class="quest-actions">
                        <button class="quest-button inject" data-action="add-plot" data-plot-id="${id}" data-is-player-plot="true"><i class="fas fa-syringe"></i> 再次注入</button>
                        <button class="quest-button delete" data-action="delete-player-plot" data-plot-id="${id}"><i class="fas fa-trash"></i> 删除</button>
                        <button class="quest-button edit" data-action="edit-plot" data-plot-id="${id}" data-is-player-plot="true"><i class="fas fa-edit"></i> 编辑</button>
                    </div>
                </div>`;
            });
        } else {
            html += `<p class="no-tasks">无进行的剧情。</p>`;
        }
        html += `</div>`;

        html += `</div></div>`; // close content, drawer

        html += `</div></div>`;
        return html;
    }

    function bindQuestPopupEvents(popupContent$) {
        popupContent$
            .off('.questSystem')
            .on(
                'click.questSystem',
                '.quest-button, .quest-popup-close-button, .generator-drawer-toggle',
                async function (event) {
                    event.stopPropagation();
                    const button = $(this);

                    if (button.hasClass('generator-drawer-toggle')) {
                        button.closest('.generator-drawer').toggleClass('open');
                        return;
                    }

                    if (button.hasClass('quest-popup-close-button')) {
                        closeQuestLogPopup();
                        return;
                    }

                    const buttonId = button.attr('id');
                    const action = button.data('action');
                    const taskId = button.data('task-id');
                    const itemId = button.data('item-id');
                    const charId = button.data('char-id');
                    const plotId = button.data('plot-id');
                    const isPlayerItem = button.data('is-player-item');
                    const isPlayerChar = button.data('is-player-char');
                    const isPlayerPlot = button.data('is-player-plot');

                    // Generators
                    if (buttonId === 'trigger-ai-task-generation')
                        await generateAndAddNewAiTask();
                    if (buttonId === 'edit-ai-prompt-button')
                        showPromptEditorPopup('task');
                    if (buttonId === 'trigger-ai-item-generation')
                        await generateAndAddNewItem();
                    if (buttonId === 'edit-ai-item-prompt-button')
                        showPromptEditorPopup('item');
                    if (buttonId === 'trigger-ai-char-generation')
                        await generateAndAddNewChar();
                    if (buttonId === 'edit-ai-char-prompt-button')
                        showPromptEditorPopup('char');
                    if (buttonId === 'trigger-ai-plot-generation')
                        await generateAndAddNewPlot();
                    if (buttonId === 'edit-ai-plot-prompt-button')
                        showPromptEditorPopup('plot');

                    // Task Actions
                    if (buttonId === 'delete-all-available-quests')
                        await deleteAllAvailableTasks();
                    if (action === 'accept' && taskId) await acceptTask(taskId);
                    if (action === 'abandon' && taskId)
                        await abandonTask(taskId);
                    if (action === 'complete' && taskId)
                        await completeTask(taskId);
                    if (action === 'delete-available' && taskId)
                        await deleteAvailableTask(taskId);
                    if (action === 'edit' && taskId) toggleEditMode(taskId);
                    if (action === 'save' && taskId) {
                        const questItem = $(
                            `.quest-item[data-task-id="${taskId}"]`,
                        );
                        const newTitle = questItem.find('.edit-title').val();
                        const newDescription = questItem
                            .find('.edit-description')
                            .val();
                        const newReward = questItem.find('.edit-reward').val();
                        await saveTaskChanges(
                            taskId,
                            newTitle,
                            newDescription,
                            newReward,
                        );
                    }

                    // Item Actions
                    if (buttonId === 'delete-all-available-items')
                        await deleteAllAvailableItems();
                    if (action === 'add-item' && itemId)
                        await addItemToTavern(itemId, isPlayerItem);
                    if (action === 'delete-available-item' && itemId)
                        await deleteAvailableItem(itemId);
                    if (action === 'delete-player-item' && itemId)
                        await deletePlayerItem(itemId);
                    if (action === 'edit-item' && itemId)
                        toggleEditModeForItem(itemId, isPlayerItem);
                    if (action === 'save-item' && itemId) {
                        const itemElement = $(
                            `.quest-item[data-item-id="${itemId}"]`,
                        );
                        const newName = itemElement.find('.edit-name').val();
                        const newDescription = itemElement
                            .find('.edit-description')
                            .val();
                        const newEffect = itemElement
                            .find('.edit-effect')
                            .val();
                        await saveItemChanges(
                            itemId,
                            newName,
                            newDescription,
                            newEffect,
                            isPlayerItem,
                        );
                    }

                    // Character Actions
                    if (buttonId === 'delete-all-available-chars')
                        await deleteAllAvailableChars();
                    if (action === 'add-char' && charId)
                        await addCharToTavern(charId, isPlayerChar);
                    if (action === 'delete-available-char' && charId)
                        await deleteAvailableChar(charId);
                    if (action === 'delete-player-char' && charId)
                        await deletePlayerChar(charId);
                    if (action === 'edit-char' && charId)
                        toggleEditModeForChar(charId, isPlayerChar);
                    if (action === 'save-char' && charId) {
                        const charElement = $(
                            `.quest-item[data-char-id="${charId}"]`,
                        );
                        const newName = charElement.find('.edit-name').val();
                        const newDescription = charElement
                            .find('.edit-description')
                            .val();
                        const newPersonality = charElement
                            .find('.edit-personality')
                            .val();
                        const newBackground = charElement
                            .find('.edit-background')
                            .val();
                        await saveCharChanges(
                            charId,
                            newName,
                            newDescription,
                            newPersonality,
                            newBackground,
                            isPlayerChar,
                        );
                    }

                    // Plot Actions
                    if (buttonId === 'delete-all-available-plots')
                        await deleteAllAvailablePlots();
                    if (action === 'add-plot' && plotId)
                        await addPlotToTavern(plotId, isPlayerPlot);
                    if (action === 'delete-available-plot' && plotId)
                        await deleteAvailablePlot(plotId);
                    if (action === 'delete-player-plot' && plotId)
                        await deletePlayerPlot(plotId);
                    if (action === 'edit-plot' && plotId)
                        toggleEditModeForPlot(plotId, isPlayerPlot);
                    if (action === 'save-plot' && plotId) {
                        const plotElement = $(
                            `.quest-item[data-plot-id="${plotId}"]`,
                        );
                        const newTitle = plotElement.find('.edit-title').val();
                        const newDescription = plotElement
                            .find('.edit-description')
                            .val();
                        await savePlotChanges(
                            plotId,
                            newTitle,
                            newDescription,
                            isPlayerPlot,
                        );
                    }
                },
            );
    }

    function showPromptEditorPopup(type = 'task') {
        let title, description, currentPrompt, defaultPrompt;

        if (type === 'item') {
            title = 'AI物品生成核心指令编辑器';
            description = '您正在编辑AI生成物品的<b>核心指令</b>部分。';
            currentPrompt = currentUserModifiedItemPromptCore;
            defaultPrompt = DEFAULT_ITEM_PROMPT_CORE_CN;
        } else if (type === 'char') {
            title = 'AI人物生成核心指令编辑器';
            description = '您正在编辑AI生成人物的<b>核心指令</b>部分。';
            currentPrompt = currentUserModifiedCharPromptCore;
            defaultPrompt = DEFAULT_CHAR_PROMPT_CORE_CN;
        } else if (type === 'plot') {
            title = 'AI剧情生成核心指令编辑器';
            description = '您正在编辑AI生成剧情的<b>核心指令</b>部分。';
            currentPrompt = currentUserModifiedPlotPromptCore;
            defaultPrompt = DEFAULT_PLOT_PROMPT_CORE_CN;
        } else {
            // Default to task
            title = 'AI任务生成核心指令编辑器';
            description = '您正在编辑AI生成任务的<b>核心指令</b>部分。';
            currentPrompt = currentUserModifiedEditablePromptCore;
            defaultPrompt = DEFAULT_EDITABLE_PROMPT_CORE_CN;
        }

        const editorHtml = `<div id="${PROMPT_EDITOR_POPUP_ID}" style="display: flex; flex-direction: column; gap: 15px; padding:15px; background-color: #2e2e34; color: #f0f0f0;">
            <h3>${title}</h3>
            <p>${description}</p>
            <textarea id="ai-prompt-editor-textarea" style="width: 98%; min-height: 200px; background-color: #25252a; color: #f0f0f0;">${escapeHtml(currentPrompt)}</textarea>
            <div style="text-align: right;">
                <button id="restore-default-prompt-button" class="menu_button" style="margin-right: 10px;">恢复默认</button>
                <button id="save-custom-prompt-button" class="menu_button" style="background-color: #28a745;">保存</button>
            </div>
        </div>`;

        SillyTavern.getContext().callGenericPopup(
            editorHtml,
            SillyTavern.getContext().POPUP_TYPE.DISPLAY,
            title,
            { wide: true, large: true },
        );

        setTimeout(() => {
            const popupInstance = $(`#${PROMPT_EDITOR_POPUP_ID}`).closest(
                'dialog[open]',
            );
            if (!popupInstance.length) return;

            popupInstance
                .find('#save-custom-prompt-button')
                .on('click.questEditor', async function () {
                    const newPrompt = popupInstance
                        .find('#ai-prompt-editor-textarea')
                        .val();
                    if (type === 'item') {
                        currentUserModifiedItemPromptCore = newPrompt;
                    } else if (type === 'char') {
                        currentUserModifiedCharPromptCore = newPrompt;
                    } else if (type === 'plot') {
                        currentUserModifiedPlotPromptCore = newPrompt;
                    } else {
                        currentUserModifiedEditablePromptCore = newPrompt;
                    }
                    await saveAllTaskData(false);
                    toastr.success('核心指令已为当前角色保存！');
                    popupInstance.find('.popup_close').trigger('click');
                });

            popupInstance
                .find('#restore-default-prompt-button')
                .on('click.questEditor', async function () {
                    if (type === 'item') {
                        currentUserModifiedItemPromptCore = defaultPrompt;
                    } else if (type === 'char') {
                        currentUserModifiedCharPromptCore = defaultPrompt;
                    } else if (type === 'plot') {
                        currentUserModifiedPlotPromptCore = defaultPrompt;
                    } else {
                        currentUserModifiedEditablePromptCore = defaultPrompt;
                    }
                    popupInstance
                        .find('#ai-prompt-editor-textarea')
                        .val(defaultPrompt);
                    await saveAllTaskData(false);
                    toastr.info('核心指令已为当前角色恢复为默认设置。');
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
                return {
                    x: e.originalEvent.touches[0].clientX,
                    y: e.originalEvent.touches[0].clientY,
                };
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
                '-webkit-user-select': 'none', // 兼容旧版 WebKit
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
            newX = Math.max(
                0,
                Math.min(newX, window.innerWidth - button.outerWidth()),
            );
            newY = Math.max(
                0,
                Math.min(newY, window.innerHeight - button.outerHeight()),
            );

            button.css({
                top: newY + 'px',
                left: newX + 'px',
                right: '',
                bottom: '',
            });
        }

        // 拖动结束的处理函数
        function dragEnd() {
            if (!isDragging) return;
            isDragging = false;
            button.css('cursor', 'grab');
            $('body').css({
                'user-select': 'auto',
                '-webkit-user-select': 'auto',
            });
            // 只有在实际拖动后才保存位置
            if (wasDragged) {
                localStorage.setItem(
                    BUTTON_POSITION_KEY,
                    JSON.stringify({
                        top: button.css('top'),
                        left: button.css('left'),
                    }),
                );
            }
        }

        // 为按钮绑定鼠标和触摸事件
        button.on('mousedown touchstart', dragStart);
        $(document).on('mousemove touchmove', dragMove);
        $(document).on('mouseup touchend', dragEnd);

        // 单击事件处理
        button.on('click', function (e) {
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
            console.log(
                `[UniversalGenerator] Chat switched from "${currentChatFileIdentifier}" to "${newChatName}". Reloading data.`,
            );
            toastr.info(`万能生成器已切换至角色: ${newChatName}`);
            currentChatFileIdentifier = newChatName;
            await loadAllTaskData(); // Load data for the new character
            refreshQuestPopupUI(); // Refresh the UI if it's open
        }
    }

    async function initialize() {
        console.log('[UniversalGenerator] Initializing...');

        if (!checkAPIs()) return;

        // Initial load
        currentChatFileIdentifier = await getLatestChatName();
        await loadAllTaskData();

        // Set up a poller to detect chat switches
        setInterval(resetForNewChat, 2000); // Check every 2 seconds

        // Create the button
        const buttonId = 'quest-log-entry-button';
        if ($(`#${buttonId}`).length === 0) {
            const buttonHtml = `<div id="${buttonId}" title="万能生成器" class="fa-solid fa-wand-magic-sparkles"></div>`;
            $('body').append(buttonHtml);
            const questButton = $(`#${buttonId}`);

            // Make it draggable
            makeButtonDraggable(questButton);

            // Set initial position and visibility
            const savedPosition = JSON.parse(
                localStorage.getItem(BUTTON_POSITION_KEY),
            );
            if (savedPosition) {
                questButton.css({
                    top: savedPosition.top,
                    left: savedPosition.left,
                });
            } else {
                // Default position if none is saved
                questButton.css({ top: '60px', right: '10px', left: 'auto' });
            }

            const isPluginEnabled =
                localStorage.getItem(PLUGIN_ENABLED_KEY) !== 'false';
            questButton.toggle(isPluginEnabled);

            // The click event is now handled inside makeButtonDraggable to distinguish between click and drag.

            // Add a resize listener to keep the button in view after it has been dragged
            let resizeTimeout;
            $(window).on('resize.questSystem', function () {
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
                        button.css({ right: '', bottom: '' });
                        localStorage.setItem(
                            BUTTON_POSITION_KEY,
                            JSON.stringify(newPos),
                        );
                    }
                }, 50); // A small delay is fine
            });
        }

        // Load settings and bind new standard panel events
        try {
            const settingsHtml = await $.get(
                `${extensionFolderPath}/settings.html`,
            );
            $('#extensions_settings2').append(settingsHtml);

            const extensionSettings = $(
                '.extension_settings[data-extension-name="quest-system-extension"]',
            );

            // 1. Bind standard inline-drawer toggle
            extensionSettings
                .find('.inline-drawer-toggle')
                .on('click', function () {
                    $(this).closest('.inline-drawer').toggleClass('open');
                });

            // 2. Bind plugin toggle switch
            const pluginToggle = extensionSettings.find('#quest-plugin-toggle');
            const isPluginEnabled =
                localStorage.getItem(PLUGIN_ENABLED_KEY) !== 'false';
            pluginToggle.prop('checked', isPluginEnabled);

            pluginToggle.on('change', function () {
                const enabled = $(this).is(':checked');
                localStorage.setItem(PLUGIN_ENABLED_KEY, enabled);
                $(`#${buttonId}`).toggle(enabled);
                toastr.info(`万能生成器浮动按钮已${enabled ? '启用' : '禁用'}`);
            });

            // 3. Bind edit prompt buttons
            extensionSettings
                .find('#quest-edit-prompt-button')
                .on('click', () => showPromptEditorPopup('task'));
            extensionSettings
                .find('#quest-edit-item-prompt-button')
                .on('click', () => showPromptEditorPopup('item'));
            extensionSettings
                .find('#quest-edit-char-prompt-button')
                .on('click', () => showPromptEditorPopup('char'));
            extensionSettings
                .find('#quest-edit-plot-prompt-button')
                .on('click', () => showPromptEditorPopup('plot'));

            // 4. Bind update button and run initial check
            extensionSettings
                .find('#quest-check-update-button')
                .on('click', () => Updater.checkForUpdates(true));
            Updater.checkForUpdates(false); // Initial silent check

            // Make sure the drawer is closed by default
            extensionSettings.find('.inline-drawer').removeClass('open');
        } catch (error) {
            console.error(
                '加载万能生成插件的 settings.html 或绑定事件失败：',
                error,
            );
        }

        toastr.success('万能生成插件(完整版)已加载！');
        console.log('[UniversalGenerator] Initialization complete.');
    }

    /**
     * Waits for all critical SillyTavern APIs to be available before initializing the extension.
     * This prevents race conditions and errors during page load.
     */
    function runWhenReady() {
        if (
            typeof jQuery !== 'undefined' &&
            typeof SillyTavern !== 'undefined' &&
            typeof TavernHelper !== 'undefined' &&
            typeof toastr !== 'undefined' &&
            SillyTavern.getContext
        ) {
            console.log(
                '[UniversalGenerator] All APIs are ready. Initializing...',
            );
            initialize();
        } else {
            // APIs are not ready yet, check again in 100ms.
            setTimeout(runWhenReady, 100);
        }
    }

    // Start the process.
    runWhenReady();
});
