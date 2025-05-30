document.addEventListener('DOMContentLoaded', function() {
    const addTemplateBtn = document.getElementById('add-template-btn');
    const addTemplateModal = document.getElementById('add-template-modal');
    const viewTemplateModal = document.getElementById('view-template-modal');
    const templateForm = document.getElementById('template-form');
    const templatesContainer = document.getElementById('templates-container');
    const deleteConfirmModal = document.getElementById('delete-confirm-modal');
    let templateToDelete = null;

    // Add this near the top with your other DOM elements
    const fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.accept = ".json";
    fileInput.style.display = "none";
    document.body.appendChild(fileInput);

    // Load existing templates
    function loadTemplates() {
        const templates = JSON.parse(localStorage.getItem('emailTemplates')) || [];
        templatesContainer.innerHTML = '';
        
        templates.forEach(template => {
            const templateContainer = createTemplateButton(template);
            templatesContainer.appendChild(templateContainer);
        });
    }

    // Create template button
    function createTemplateButton(template) {
        const templateContainer = document.createElement('div');
        templateContainer.className = 'template-container';
        
        const templateBtn = document.createElement('button');
        templateBtn.className = 'template-btn';
        templateBtn.innerHTML = `<i class="fas fa-envelope"></i> ${template.name}`;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'delete-template-btn';
        deleteBtn.innerHTML = '<i class="fas fa-trash"></i>';
        
        templateBtn.addEventListener('click', () => {
            document.getElementById('view-template-name').textContent = template.name;
            document.getElementById('view-template-content').textContent = template.content;
            viewTemplateModal.style.display = 'block';
        });

        deleteBtn.addEventListener('click', (e) => {
            e.stopPropagation();
            templateToDelete = template.name;
            deleteConfirmModal.style.display = 'block';
        });

        // Handle delete confirmation
        document.getElementById('confirm-delete-btn').addEventListener('click', () => {
            if (templateToDelete) {
                const templates = JSON.parse(localStorage.getItem('emailTemplates')) || [];
                const updatedTemplates = templates.filter(t => t.name !== templateToDelete);
                localStorage.setItem('emailTemplates', JSON.stringify(updatedTemplates));
                deleteConfirmModal.style.display = 'none';
                templateToDelete = null;
                loadTemplates();
            }
        });

        document.getElementById('cancel-delete-btn').addEventListener('click', () => {
            deleteConfirmModal.style.display = 'none';
            templateToDelete = null;
        });

        templateContainer.appendChild(templateBtn);
        templateContainer.appendChild(deleteBtn);
        return templateContainer;
    }

    // Show add template modal
    addTemplateBtn.addEventListener('click', () => {
        addTemplateModal.style.display = 'block';
        templateForm.reset();
    });

    // Handle template form submission
    templateForm.addEventListener('submit', (e) => {
        e.preventDefault();
        
        const templateName = document.getElementById('template-name').value;
        const templateContent = document.getElementById('template-content').value;
        
        const templates = JSON.parse(localStorage.getItem('emailTemplates')) || [];
        templates.push({
            name: templateName,
            content: templateContent
        });
        
        localStorage.setItem('emailTemplates', JSON.stringify(templates));
        addTemplateModal.style.display = 'none';
        loadTemplates();
    });

    // Update copy to clipboard functionality
    document.querySelector('.copy-btn').addEventListener('click', () => {
        const content = document.getElementById('view-template-content').textContent;
        const copyNotification = document.querySelector('.copy-notification');
        
        navigator.clipboard.writeText(content).then(() => {
            copyNotification.style.opacity = '1';
            setTimeout(() => {
                copyNotification.style.opacity = '0';
            }, 2000);
        }).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === addTemplateModal) {
            addTemplateModal.style.display = 'none';
            templateForm.reset();
        }
        if (e.target === viewTemplateModal) {
            viewTemplateModal.style.display = 'none';
        }
        if (e.target === deleteConfirmModal) {
            deleteConfirmModal.style.display = 'none';
            templateToDelete = null;
        }
    });

    // Export functionality
    document.getElementById('export-templates-btn').addEventListener("click", () => {
        // Get all templates data
        const templates = JSON.parse(localStorage.getItem("emailTemplates")) || [];
        const exportData = {
            templates: templates
        };

        // Create and download file
        const dataStr = JSON.stringify(exportData, null, 2);
        const blob = new Blob([dataStr], { type: "application/json" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `email_templates_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    });

    // Import functionality
    document.getElementById('import-templates-btn').addEventListener("click", () => {
        fileInput.click();
    });

    fileInput.addEventListener("change", (e) => {
        const file = e.target.files[0];
        if (file) {
            const reader = new FileReader();
            reader.onload = (e) => {
                try {
                    const importedData = JSON.parse(e.target.result);
                    
                    // Import templates data
                    localStorage.setItem("emailTemplates", JSON.stringify(importedData.templates));
                    
                    // Reload templates display
                    loadTemplates();
                    
                    // Show success message
                    alert("Templates imported successfully!");
                } catch (error) {
                    alert("Error importing templates. Please make sure the file is valid.");
                    console.error("Import error:", error);
                }
            };
            reader.readAsText(file);
        }
        // Reset file input
        fileInput.value = "";
    });

    // Initial load of templates
    loadTemplates();
});
