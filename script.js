// =============================
// FORM VALIDATION
// =============================
document.getElementById("myForm").addEventListener("submit", function (event) {
  event.preventDefault(); // stop form from submitting

  const username = document.getElementById("username").value.trim();
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value.trim();
  const message = document.getElementById("formMessage");

  // Custom validation rules
  if (username.length < 3) {
    message.textContent = "⚠️ Username must be at least 3 characters long.";
    message.style.color = "red";
    return;
  }

  if (!email.includes("@") || !email.includes(".")) {
    message.textContent = "⚠️ Please enter a valid email address.";
    message.style.color = "red";
    return;
  }

  if (password.length < 6) {
    message.textContent = "⚠️ Password must be at least 6 characters.";
    message.style.color = "red";
    return;
  }

  message.textContent = "✅ Form submitted successfully!";
  message.style.color = "green";
});

// =============================
// COUNTER FEATURE
// =============================
let count = 0;
document.getElementById("countBtn").addEventListener("click", function () {
  count++;
  document.getElementById("count").textContent = count;
});

// =============================
// TOGGLE CONTENT FEATURE
// =============================
document.getElementById("toggleBtn").addEventListener("click", function () {
  const hiddenContent = document.getElementById("hiddenContent");
  if (hiddenContent.style.display === "none") {
    hiddenContent.style.display = "block";
  } else {
    hiddenContent.style.display = "none";
  }
});
