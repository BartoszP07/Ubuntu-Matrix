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
