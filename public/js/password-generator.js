document.addEventListener("DOMContentLoaded", function () {
    initPasswordGeneratorPage();
});

function initPasswordGeneratorPage() {
    const passwordLengthSlider = document.getElementById("passwordLength");
    const lengthValue = document.getElementById("lengthValue");
    const generateBtn = document.getElementById("generatePassword");
    const passwordInput = document.getElementById("generatedPassword");
    const copyBtn = document.getElementById("copyPassword");
    const specialCharsCheckbox = document.getElementById("specialChars");

    passwordLengthSlider.addEventListener("input", function() {
        lengthValue.textContent = this.value;
    });

    generateBtn.addEventListener("click", function() {
        const length = parseInt(passwordLengthSlider.value);
        const useSpecialChars = specialCharsCheckbox.checked;
        const password = generatePassword(length, useSpecialChars);
        passwordInput.value = password;
    });

    copyBtn.addEventListener("click", async function() {
        const passwordToCopy = passwordInput.value.trim();
        if (!passwordToCopy) {
            showNotification("No password to copy. Generate a password first!", true);
            return;
        }

        try {
            await navigator.clipboard.writeText(passwordToCopy);
            showNotification("Password copied to clipboard!", false);
        } catch (err) {
            console.error('Failed to copy: ', err);
            showNotification("Failed to copy password", true);
        }
    });

    // Remove the line that sets passwordInput.readOnly = true;
    // as we've already set it in the HTML
}

function generatePassword(length, useSpecialChars) {
    const lowercase = 'abcdefghijklmnopqrstuvwxyz';
    const uppercase = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    const special = '!@#$%^&*()_+~`|}{[]:;?><,./-=';

    let chars = lowercase + uppercase + numbers;
    if (useSpecialChars) {
        chars += special;
    }

    let password = '';
    for (let i = 0; i < length; i++) {
        password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    return password;
}

function showNotification(message, isError = false) {
    const copyBtn = document.getElementById("copyPassword");
    const notification = document.createElement("div");
    notification.textContent = message;
    notification.style.position = "absolute";
    notification.style.padding = "5px 10px";
    notification.style.borderRadius = "5px";
    notification.style.backgroundColor = isError ? "#e74c3c" : "#2ecc71";
    notification.style.color = "white";
    notification.style.zIndex = "1000";
    notification.style.fontSize = "14px";
    notification.style.whiteSpace = "nowrap";

    // Position the notification
    const copyBtnRect = copyBtn.getBoundingClientRect();
    notification.style.top = `${copyBtnRect.top + window.scrollY}px`;
    notification.style.left = `${copyBtnRect.right + 10}px`; // 10px to the right of the button

    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.opacity = "0";
        notification.style.transition = "opacity 0.5s ease-out";
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 2000);
}