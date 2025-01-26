document.addEventListener("DOMContentLoaded", function () {
  const lengthSlider = document.getElementById("length-slider");
  const lengthValue = document.getElementById("length-value");
  const specialChars = document.getElementById("special-chars");
  const generateBtn = document.getElementById("generate-btn");
  const passwordOutput = document.getElementById("password-output");
  const copyBtn = document.getElementById("copy-btn");

  lengthSlider.addEventListener("input", () => {
    lengthValue.textContent = lengthSlider.value;
  });

  function generatePassword() {
    const length = parseInt(lengthSlider.value);
    const useSpecial = specialChars.checked;

    const uppercase = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
    const lowercase = "abcdefghijklmnopqrstuvwxyz";
    const numbers = "0123456789";
    const special = "!@#$%^&*()_+-=[]{}|;:,.<>?";

    let chars = uppercase + lowercase + numbers;
    if (useSpecial) chars += special;

    let password = "";
    for (let i = 0; i < length; i++) {
      password += chars.charAt(Math.floor(Math.random() * chars.length));
    }

    passwordOutput.value = password;
  }

  generateBtn.addEventListener("click", generatePassword);

  copyBtn.addEventListener("click", () => {
    passwordOutput.select();
    document.execCommand("copy");

    // Visual feedback
    copyBtn.classList.add("copied");
    setTimeout(() => copyBtn.classList.remove("copied"), 1000);
  });

  // Generate initial password
  generatePassword();
});
