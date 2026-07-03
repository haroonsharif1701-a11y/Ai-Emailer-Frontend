/* ==========================================================================
   AI Emailer — Theme Toggle (Light / Dark)
   Persists choice in localStorage so it survives a page refresh.
   ========================================================================== */
$(function () {
  const STORAGE_KEY = "ai-emailer-theme";
  const $root = $(document.documentElement);
  const $icon = $("#themeToggle i");

  function applyIcon(theme) {
    $icon.attr("class", theme === "dark" ? "fa-solid fa-sun" : "fa-solid fa-moon");
  }

  // Sync icon with whatever the pre-paint script already set
  applyIcon($root.attr("data-theme") || "light");

  $("#themeToggle").on("click", function () {
    const current = $root.attr("data-theme") === "dark" ? "dark" : "light";
    const next = current === "dark" ? "light" : "dark";
    $root.attr("data-theme", next);
    localStorage.setItem(STORAGE_KEY, next);
    applyIcon(next);
  });
});
