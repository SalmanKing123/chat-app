document.addEventListener("DOMContentLoaded", () => {
  // 3 users
  const users = [
    { username: "Sam", password: "sam123##" },
    { username: "Mohsin", password: "mohsin123$$" },
    { username: "Arsh", password: "arsh123%%" },
  ];

  const form = document.getElementById("loginForm");

  // =================== SHOW/HIDE PASSWORD ===================
  const passwordInput = document.getElementById("password");
  const togglePassword = document.getElementById("togglePassword");

  togglePassword.addEventListener("click", () => {
    const type =
      passwordInput.getAttribute("type") === "password" ? "text" : "password";
    passwordInput.setAttribute("type", type);

    // Optional: change icon
    togglePassword.textContent = type === "password" ? "👁️" : "🙈";
  });

  // =================== LOGIN FORM SUBMIT ===================
  form.addEventListener("submit", function (e) {
    e.preventDefault();
    const usernameInput = document.getElementById("username").value.trim();
    const passwordInputValue = passwordInput.value.trim(); // updated variable

    const validUser = users.find(
      (user) =>
        user.username.toLowerCase() === usernameInput.toLowerCase() &&
        user.password === passwordInputValue
    );

    if (validUser) {
      localStorage.setItem("loggedInUser", validUser.username);
      window.location.href = "index.html";
    } else {
      alert("❌ Invalid username or password!");
    }
  });
});
