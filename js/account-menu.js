/* Populate the shared account menu from this browser's saved profile. */
(() => {
  const accountMenu = document.querySelector(".account-menu");
  document.addEventListener("keydown", (event) => { if (event.key === "Tab") accountMenu?.classList.add("keyboard-open"); });
  document.addEventListener("pointerdown", () => accountMenu?.classList.remove("keyboard-open"));
  let profile = {};
  try {
    profile = JSON.parse(window.localStorage.getItem("facilo-profile") || "{}");
    if (!profile || typeof profile !== "object") profile = {};
  } catch (_) {}
  const name = String(profile.name || "").trim();
  const email = String(profile.email || "").trim();
  document.querySelectorAll(".account-name").forEach((node) => {
    node.textContent = name || "Your profile";
  });
  document.querySelectorAll(".account-email").forEach((node) => {
    node.textContent = email || "Manage your Facilo account";
  });
  const initials = name ? name.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase() : "F";
  document.querySelectorAll(".account-avatar").forEach((node) => {
    node.textContent = initials;
  });
})();