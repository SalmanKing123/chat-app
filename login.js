// 3 users
const users = [
  { username: "Sam", password: "sam123##" },
  { username: "Mohsin", password: "mohsin123$$" },
  { username: "Arsh", password: "arsh123%%" },
];

const form = document.getElementById("loginForm");

form.addEventListener("submit", function (e) {
  e.preventDefault();
  const usernameInput = document.getElementById("username").value.trim();
  const passwordInput = document.getElementById("password").value.trim();

  const validUser = users.find(
    (user) =>
      user.username.toLowerCase() === usernameInput.toLowerCase() &&
      user.password === passwordInput
  );

  if (validUser) {
    localStorage.setItem("loggedInUser", validUser.username);
    window.location.href = "index.html";
  } else {
    alert("❌ Invalid username or password!");
  }
});
