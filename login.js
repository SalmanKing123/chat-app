// 3 users
const users = [
  { username: "Sam", password: "sam123##" },
  { username: "Mohsin", password: "mohsin123$$" },
  { username: "Arsh", password: "arsh123%%" },
];

const usernameInput = document.getElementById("username");
const passwordInput = document.getElementById("password");
const togglePassword = document.getElementById("togglePassword");
const loginBtn = document.getElementById("loginBtn");

// Show/hide password
togglePassword.addEventListener("click", () => {
  const type =
    passwordInput.getAttribute("type") === "password" ? "text" : "password";
  passwordInput.setAttribute("type", type);
  togglePassword.textContent = type === "password" ? "👁️" : "🙈";
});

// Login button click
loginBtn.addEventListener("click", () => {
  const username = usernameInput.value.trim();
  const password = passwordInput.value.trim();

  const validUser = users.find(
    (user) =>
      user.username.toLowerCase() === username.toLowerCase() &&
      user.password === password
  );

  if (validUser) {
    localStorage.setItem("loggedInUser", validUser.username);
    window.location.href = "index.html";
  } else {
    alert("❌ Invalid username or password!");
  }
});
