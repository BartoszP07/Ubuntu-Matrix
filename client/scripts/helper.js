// Helper AI Model Selector
const modelSelector = document.getElementById("model-selector");
const modelSelectorBtn = document.getElementById("model-selector-btn");
const selectedModelLabel = document.getElementById("selected-model-label");
const modelOptions = document.querySelectorAll(".model-option");

let currentAiModel = "gemini-3.5-flash-lite";

if (modelSelector && modelSelectorBtn) {
    modelSelectorBtn.addEventListener("click", function (e) {
        e.stopPropagation();
        const isOpen = modelSelector.classList.toggle("open");
        modelSelectorBtn.setAttribute("aria-expanded", String(isOpen));
    });

    modelOptions.forEach(function (option) {
        option.addEventListener("click", function (e) {
            e.stopPropagation();
            const modelValue = option.getAttribute("data-model");
            const modelLabel = option.getAttribute("data-label");

            currentAiModel = modelValue;
            modelSelector.setAttribute("data-selected-model", modelValue);
            selectedModelLabel.textContent = modelLabel;

            modelOptions.forEach(function (opt) {
                opt.classList.remove("active");
                opt.setAttribute("aria-selected", "false");
            });
            option.classList.add("active");
            option.setAttribute("aria-selected", "true");

            modelSelector.classList.remove("open");
            modelSelectorBtn.setAttribute("aria-expanded", "false");
        });
    });

    document.addEventListener("click", function (e) {
        if (!modelSelector.contains(e.target)) {
            modelSelector.classList.remove("open");
            modelSelectorBtn.setAttribute("aria-expanded", "false");
        }
    });
}

// Chat Formatting & Server Communication
const send_prompt_button = document.getElementById("send-prompt-btn");
const clear_chat_button = document.getElementById("clear-chat-btn");
const prompt_input = document.getElementById("prompt-input");
const helper_holder_div = document.getElementById("helper-holder-div");
const helper_chat_area = document.getElementById("helper-chat-area");

// Unique chat session ID per page load (or reset when clearing chat)
let chat_session_id = "matrix_" + Date.now();

if (clear_chat_button) {
    clear_chat_button.addEventListener("click", function () {
        helper_chat_area.innerHTML = "";
        helper_holder_div.classList.remove("active");
        chat_session_id = "matrix_" + Date.now();
    });
}

// Escape raw HTML to prevent XSS before formatting markdown
function escapeHtml(str) {
    return str
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}

// Strip ANSI terminal color codes if sgpt outputs any
function stripAnsi(str) {
    return str.replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "");
}

// Format AI plain text / markdown into clean HTML for the chat bubble
function formatAiMessage(rawText) {
    if (!rawText) return "<p>No response received.</p>";

    let cleaned = stripAnsi(String(rawText)).trim();

    // Extract fenced code blocks first so their contents aren't altered
    const codeBlocks = [];
    cleaned = cleaned.replace(/```(\w*)\n?([\s\S]*?)```/g, function (_, lang, code) {
        const placeholder = `@@CODEBLOCK_${codeBlocks.length}@@`;
        const langBadge = lang ? `<span class="ai-code-lang">${escapeHtml(lang)}</span>` : "";
        codeBlocks.push(
            `<div class="ai-code-block">${langBadge}<pre><code>${escapeHtml(code.trim())}</code></pre></div>`
        );
        return placeholder;
    });

    // Escape remaining text
    cleaned = escapeHtml(cleaned);

    // Inline code `code`
    cleaned = cleaned.replace(/`([^`\n]+)`/g, '<code class="ai-inline-code">$1</code>');

    // Bold **text**
    cleaned = cleaned.replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>");

    // Convert paragraphs and bullet lines
    const lines = cleaned.split("\n");
    let html = "";
    let inList = false;

    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();

        if (/^[-*•]\s+/.test(line)) {
            if (!inList) {
                html += '<ul class="ai-list">';
                inList = true;
            }
            html += `<li>${line.replace(/^[-*•]\s+/, "")}</li>`;
        } else {
            if (inList) {
                html += "</ul>";
                inList = false;
            }
            if (line === "") {
                html += '<div class="ai-spacer"></div>';
            } else {
                html += `<p class="ai-paragraph">${line}</p>`;
            }
        }
    }
    if (inList) {
        html += "</ul>";
    }

    // Restore code blocks
    codeBlocks.forEach(function (blockHtml, index) {
        html = html.replace(`@@CODEBLOCK_${index}@@`, blockHtml);
    });

    return html;
}

// Create and append a chat bubble to #helper-chat-area
function appendChatMessage(role, contentHtml, modelName) {
    helper_holder_div.classList.add("active");

    const msgDiv = document.createElement("div");
    msgDiv.className = `chat-message ${role === "user" ? "user-message" : "ai-message"}`;

    if (role === "ai") {
        const headerDiv = document.createElement("div");
        headerDiv.className = "ai-message-header";
        headerDiv.innerHTML = `<span class="ai-message-sparkle">✦</span><span class="ai-message-model">${escapeHtml(modelName || currentAiModel)}</span>`;

        const bodyDiv = document.createElement("div");
        bodyDiv.className = "ai-message-body";
        bodyDiv.innerHTML = contentHtml;

        msgDiv.appendChild(headerDiv);
        msgDiv.appendChild(bodyDiv);
    } else {
        msgDiv.textContent = contentHtml;
    }

    helper_chat_area.appendChild(msgDiv);
    helper_chat_area.scrollTop = helper_chat_area.scrollHeight;
    return msgDiv;
}

async function sendPrompt() {
    const prompt = prompt_input.value.trim();
    if (!prompt) return;

    const model = currentAiModel;
    const modelLabel = selectedModelLabel ? selectedModelLabel.innerText : model;

    // Clear input and show user message bubble
    prompt_input.value = "";
    appendChatMessage("user", prompt);

    // Show AI loading indicator bubble
    const aiBubble = appendChatMessage(
        "ai",
        `<div class="ai-thinking"><span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-dot"></span><span class="thinking-text">Thinking...</span></div>`,
        modelLabel
    );
    const aiBody = aiBubble.querySelector(".ai-message-body");

    send_prompt_button.disabled = true;

    try {
        const response = await fetch("/api/send-prompt", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                prompt: prompt,
                model: model,
                session_id: chat_session_id,
            }),
        });

        const data = await response.json();

        if (!response.ok || data.error) {
            aiBubble.classList.add("error-message");
            aiBody.innerHTML = `<p class="ai-error-text">${escapeHtml(data.error || "Failed to get response from server.")}</p>`;
        } else {
            aiBody.innerHTML = formatAiMessage(data.message);
        }
    } catch (err) {
        console.error(err);
        aiBubble.classList.add("error-message");
        aiBody.innerHTML = `<p class="ai-error-text">Could not reach the server. Please check your connection.</p>`;
    } finally {
        send_prompt_button.disabled = false;
        helper_chat_area.scrollTop = helper_chat_area.scrollHeight;
    }
}

send_prompt_button.addEventListener("click", sendPrompt);

// Allow pressing Enter (without Shift) to send the prompt
prompt_input.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        sendPrompt();
    }
});
