document.addEventListener("DOMContentLoaded", function () {
    const addTemplateBtn = document.getElementById("addTemplateBtn");
    const addTemplateModal = document.getElementById("addTemplateModal");
    const viewTemplateModal = document.getElementById("viewTemplateModal");
    const addTemplateForm = document.getElementById("addTemplateForm");
    const templateContainer = document.getElementById("templateContainer");
    const closeButtons = document.querySelectorAll(".close");
    const viewTemplateContent = document.getElementById("viewTemplateContent");
    const copyTemplateBtn = document.getElementById("copyTemplateBtn");
    const copyInfo = document.getElementById("copyInfo");
    const exportBtn = document.getElementById("exportTemplatesBtn");
    const importBtn = document.getElementById("importTemplatesBtn");

    let templates = JSON.parse(localStorage.getItem("emailTemplates")) || [];

    function saveTemplates() {
        localStorage.setItem("emailTemplates", JSON.stringify(templates));
        renderTemplates();
        updateFileControlsVisibility();
    }

    function renderTemplates() {
        templateContainer.innerHTML = "";
        templates.forEach((template, index) => {
            const templateCard = createTemplateCard(template.title, template.content, index);
            templateContainer.appendChild(templateCard);
        });
    }

    addTemplateBtn.addEventListener("click", () => {
        addTemplateModal.style.display = "block";
    });

    closeButtons.forEach(button => {
        button.addEventListener("click", () => {
            addTemplateModal.style.display = "none";
            viewTemplateModal.style.display = "none";
        });
    });

    addTemplateForm.addEventListener("submit", (e) => {
        e.preventDefault();
        const title = document.getElementById("templateTitle").value;
        const content = document.getElementById("templateContent").value;
        
        templates.push({ title, content });
        saveTemplates();
        
        addTemplateModal.style.display = "none";
        addTemplateForm.reset();
    });

    function createTemplateCard(title, content, index) {
        const card = document.createElement("div");
        card.className = "template-card";
        
        const titleSpan = document.createElement("span");
        titleSpan.textContent = title;
        titleSpan.className = "template-title";
        card.appendChild(titleSpan);
        
        const deleteBtn = document.createElement("button");
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        deleteBtn.className = "delete-btn";
        deleteBtn.addEventListener("click", (e) => {
            e.stopPropagation();
            if (confirm("Are you sure you want to delete this template?")) {
                templates.splice(index, 1);
                saveTemplates();
            }
        });
        card.appendChild(deleteBtn);
        
        card.addEventListener("click", () => {
            document.getElementById("viewTemplateTitle").textContent = title;
            viewTemplateContent.textContent = content;
            viewTemplateModal.style.display = "block";
        });

        return card;
    }

    copyTemplateBtn.addEventListener("click", () => {
        const tempTextArea = document.createElement("textarea");
        tempTextArea.value = viewTemplateContent.textContent;
        document.body.appendChild(tempTextArea);
        tempTextArea.select();
        document.execCommand("copy");
        document.body.removeChild(tempTextArea);
        
        copyInfo.classList.add("show");
        
        setTimeout(() => {
            copyInfo.classList.remove("show");
        }, 2000);
    });

    window.onclick = (event) => {
        if (event.target === addTemplateModal) {
            addTemplateModal.style.display = "none";
        }
        if (event.target === viewTemplateModal) {
            viewTemplateModal.style.display = "none";
        }
    };

    exportBtn.addEventListener("click", exportTemplates);
    importBtn.addEventListener("change", importTemplates);

    function exportTemplates() {
        const dataStr = JSON.stringify(templates);
        const dataUri = 'data:application/json;charset=utf-8,'+ encodeURIComponent(dataStr);
        const exportFileDefaultName = 'email_templates.json';

        const linkElement = document.createElement('a');
        linkElement.setAttribute('href', dataUri);
        linkElement.setAttribute('download', exportFileDefaultName);
        linkElement.click();
    }

    function importTemplates(event) {
        const file = event.target.files[0];
        const reader = new FileReader();

        reader.onload = function(e) {
            try {
                const importedTemplates = JSON.parse(e.target.result);
                templates = importedTemplates;
                saveTemplates();
                alert("Templates imported successfully!");
            } catch (error) {
                alert("Error importing templates. Please check the file format.");
            }
        };

        reader.readAsText(file);
    }

    function updateFileControlsVisibility() {
        const fileControls = document.querySelector(".file-controls-email-templates");
        if (fileControls) {
            fileControls.style.display = templates.length > 0 ? "flex" : "none";
        }
    }

    renderTemplates();
    updateFileControlsVisibility();
});

// function initEmailTemplates() {
//   // Implement email template functionality
// }

// Add any other email template-related functions here