/* ==========================================================================
   Auth page logic — now calls the real ASP.NET Core /api/auth/login
   endpoint. Requires js/api.js to be loaded first (see login.html).
   ========================================================================== */
$(function () {

  $("#pwToggle").on("click", function () {
    const $input = $("#password");
    const isPw = $input.attr("type") === "password";
    $input.attr("type", isPw ? "text" : "password");
    $(this).attr("aria-label", isPw ? "Hide password" : "Show password").attr("aria-pressed", String(isPw));
    $(this).html(isPw ? '<i class="fa-regular fa-eye-slash"></i>' : '<i class="fa-regular fa-eye"></i>');
  });

  function validate() {
    let ok = true;
    $(".field-error").text("");

    const email = $("#email").val().trim();
    const password = $("#password").val();

    if (!email) {
      $("#emailError").text("Email is required.");
      ok = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      $("#emailError").text("Enter a valid email address.");
      ok = false;
    }

    if (!password) {
      $("#passwordError").text("Password is required.");
      ok = false;
    } else if (password.length < 6) {
      $("#passwordError").text("Password must be at least 6 characters.");
      ok = false;
    }

    return ok;
  }

  $("#loginForm").on("submit", async function (e) {
    e.preventDefault();

    if (!validate()) {
      $(".auth-card").addClass("shake");
      setTimeout(() => $(".auth-card").removeClass("shake"), 300);
      return;
    }

    const $btn = $("#loginBtn");
    $btn.prop("disabled", true).html('<i class="fa-solid fa-spinner fa-spin"></i> Signing in...');

    try {
      const result = await apiFetch("/api/auth/login", {
        method: "POST",
        body: { email: $("#email").val().trim(), password: $("#password").val() },
      });
      setToken(result.token);
      window.location.href = "index.html?landing=1";
    } catch (err) {
      $("#passwordError").text(err.message || "Sign in failed. Try again.");
      $(".auth-card").addClass("shake");
      setTimeout(() => $(".auth-card").removeClass("shake"), 300);
      $btn.prop("disabled", false).html('<i class="fa-solid fa-arrow-right-to-bracket"></i> Sign In');
    }
  });

  // OAuth Redirection Logic
  const providerButtons = $("#loginGoogle, #loginMicrosoft").prop("hidden", true).prop("disabled", true);
  apiFetch("/api/auth/providers").then(providers => {
    $("#loginGoogle").prop("hidden", !providers.gmail).prop("disabled", !providers.gmail);
    $("#loginMicrosoft").prop("hidden", !providers.outlook).prop("disabled", !providers.outlook);
  }).catch(() => providerButtons.prop("hidden", true));

  providerButtons.on("click", async function () {
    try {
      const encode = bytes => btoa(String.fromCharCode(...bytes)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
      const verifier = encode(crypto.getRandomValues(new Uint8Array(32)));
      const challenge = encode(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier))));
      sessionStorage.setItem("ai-emailer-oauth-verifier", verifier);
      const provider = this.id === "loginGoogle" ? "Google" : "EntraID";
      window.location.href = `${API_BASE_URL}/api/auth/login-external?provider=${provider}&challenge=${challenge}`;
    } catch (error) { alert("Could not start login: " + error.message); }
  });

});
