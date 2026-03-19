const API = "https://trackmind-api.onrender.com";

// Already logged in? Go straight to dashboard
if (localStorage.getItem("tm_token")) {
  window.location.href = "dashboard.html";
}

function switchTab(tab) {
  document.querySelectorAll(".tab").forEach((t, i) => {
    t.classList.toggle("on", (tab === "login" && i === 0) || (tab === "signup" && i === 1));
  });
  document.getElementById("login-form").classList.toggle("on", tab === "login");
  document.getElementById("signup-form").classList.toggle("on", tab === "signup");
  clearErrs();
}

function showErr(id, msg) {
  const el = document.getElementById(id);
  el.textContent = msg;
  el.style.display = "block";
}

function clearErrs() {
  document.querySelectorAll(".err").forEach(e => { e.style.display = "none"; e.textContent = ""; });
}

function saveAndRedirect(data) {
  localStorage.setItem("tm_token", data.token);
  localStorage.setItem("tm_user", JSON.stringify(data.user));
  window.location.href = "dashboard.html";
}

async function doLogin(e) {
  e.preventDefault();
  clearErrs();
  const btn = document.getElementById("l-btn");
  btn.disabled = true; btn.textContent = "Logging in...";
  try {
    const res  = await fetch(`${API}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email:    document.getElementById("l-email").value.trim(),
        password: document.getElementById("l-pass").value
      })
    });
    const data = await res.json();
    if (!res.ok) { showErr("login-err", data.error || "Login failed"); return; }
    saveAndRedirect(data);
  } catch {
    showErr("login-err", "Cannot reach server. Is Flask running?");
  } finally {
    btn.disabled = false; btn.textContent = "Log in";
  }
}

async function doSignup(e) {
  e.preventDefault();
  clearErrs();
  const btn = document.getElementById("s-btn");
  btn.disabled = true; btn.textContent = "Creating account...";
  try {
    const res  = await fetch(`${API}/api/auth/signup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name:     document.getElementById("s-name").value.trim(),
        email:    document.getElementById("s-email").value.trim(),
        password: document.getElementById("s-pass").value
      })
    });
    const data = await res.json();
    if (!res.ok) { showErr("signup-err", data.error || "Signup failed"); return; }
    saveAndRedirect(data);
  } catch {
    showErr("signup-err", "Cannot reach server. Is Flask running?");
  } finally {
    btn.disabled = false; btn.textContent = "Create account";
  }
}