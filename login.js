import { fbService } from "./firebase-service.js";

const $ = (id) => document.getElementById(id);

const statusEl = $("login-status");
const tabGoogle = $("tab-google");
const tabPin = $("tab-pin");
const formGoogle = $("form-google");
const formPin = $("form-pin");
const btnGoogle = $("btn-google");
const btnPinLogin = $("btn-pin-login");
const pinUserInput = $("pin-user");
const pinCodeInput = $("pin-code");
const togglePinVisBtn = $("toggle-pin-vis");

const connectionChip = $("connection-chip");

const setStatus = (message, type = "error") => {
  statusEl.textContent = message;
  statusEl.className = `login-status ${type}`;
};

const updateConnectionChip = () => {
  if (!connectionChip) return;
  const online = navigator.onLine;
  connectionChip.classList.toggle("error", !online);
  connectionChip.classList.toggle("ok", online);
  const dot = connectionChip.querySelector(".status-dot");
  if (dot) dot.style.background = online ? "var(--ok)" : "var(--danger)";
  connectionChip.lastElementChild.textContent = online ? "Conexión estable" : "Sin conexión a internet";
};

const setLoading = (button, isLoading) => {
  button.disabled = isLoading;
  if (isLoading) {
    button.innerHTML = `<span class="spinner" style="width:20px; height:20px; border-width:2px;"></span> Connecting...`;
  } else {
    if (button.id === "btn-google") {
      button.innerHTML = `<span>G</span> <span>Continue with Google</span>`;
    } else {
      button.innerHTML = "Enter / Create";
    }
  }
};

const switchTab = (activeTab) => {
  if (activeTab === "google") {
    tabGoogle.classList.add("active");
    tabPin.classList.remove("active");
    formGoogle.style.display = "block";
    formPin.style.display = "none";
  } else {
    tabPin.classList.add("active");
    tabGoogle.classList.remove("active");
    formPin.style.display = "flex";
    formGoogle.style.display = "none";
    pinUserInput.focus();
  }
  setStatus("");
};

tabGoogle.onclick = () => switchTab("google");
tabPin.onclick = () => switchTab("pin");

togglePinVisBtn.onclick = () => {
  const isPassword = pinCodeInput.type === "password";
  pinCodeInput.type = isPassword ? "text" : "password";
  togglePinVisBtn.textContent = isPassword ? "\u{1F648}" : "\u{1F441}";
};

const validatePinForm = () => {
  const u = pinUserInput.value.trim();
  const p = pinCodeInput.value.trim();
  if (!u || u.length < 3) {
    setStatus("Usuario mínimo 3 caracteres.", "error");
    return false;
  }
  if (!/^[a-zA-Z0-9._-]+$/.test(u)) {
    setStatus("Solo letras, números, punto, guión y guión bajo.", "error");
    return false;
  }
  if (!/^[0-9]{6}$/.test(p)) {
    setStatus("PIN debe tener 6 dígitos numéricos.", "error");
    return false;
  }
  return true;
};

btnGoogle.onclick = async () => {
  if (!navigator.onLine) return setStatus("Se requiere conexión para Google.", "error");
  setLoading(btnGoogle, true);
  setStatus("Starting with Google...", "info");
  const res = await fbService.loginGoogle();
  if (!res.success) {
    setLoading(btnGoogle, false);
    if (res.error.includes("popup-closed-by-user")) {
      setStatus("Process cancelled.");
    } else {
      setStatus("Authentication error.");
    }
  } else {
    setStatus("Login successful. Redirecting...", "success");
    sessionStorage.setItem("auth_ok", "1");
    window.location.replace('./index.html');
  }
};

btnPinLogin.onclick = async () => {
  if (!navigator.onLine) return setStatus("Se requiere conexión para login.", "error");
  if (!validatePinForm()) return;
  const u = pinUserInput.value.trim();
  const p = pinCodeInput.value.trim();

  setLoading(btnPinLogin, true);
  setStatus("Verificando credenciales...", "info");
  localStorage.setItem("lastUsername", u);

  const res = await fbService.loginPin(u, p);
  if (!res.success) {
    setLoading(btnPinLogin, false);
    setStatus(res.error);
  } else {
    const message = res.isNew ? "Account created. Redirecting..." : "Login successful. Redirecting...";
    setStatus(message, "success");
    sessionStorage.setItem("auth_ok", "1");
    window.location.replace('./index.html');
  }
};

pinUserInput.addEventListener("keydown", (e) => { if (e.key === "Enter") btnPinLogin.click(); });
pinCodeInput.addEventListener("keydown", (e) => { if (e.key === "Enter") btnPinLogin.click(); });

/**
 * Main entry point for the login page. Acts as an auth guard.
 */
async function main() {
    try {
        if (!fbService.enabled) {
            setStatus("Falta configuración de Firebase. Define window.__FIREBASE_CONFIG__ antes de cargar.", "error");
            const loader = document.getElementById("app-loader");
            if (loader) loader.remove();
            return;
        }

        const user = await fbService.getInitialUser();

        if (user) {
            // User is already logged in, redirect to the main app.
            setStatus("Session found. Redirecting...", "success");
            sessionStorage.setItem("auth_ok", "1");
            setTimeout(() => window.location.replace('./index.html'), 500);
            return; // Stop further execution.
        }

        // No user found. Reveal Login UI.
        const container = document.querySelector(".login-container");
        const loader = document.getElementById("app-loader");

        if (container) container.style.display = "grid";
        if (loader) {
            loader.style.opacity = "0";
            setTimeout(() => loader.remove(), 300);
        }
        updateConnectionChip();
        
        // Restore last used username if available.
        const lastUsername = localStorage.getItem("lastUsername");
        if (lastUsername) {
            pinUserInput.value = lastUsername;
        }

    } catch (error) {
        console.error("Login page initialization error:", error);
        setLoading(btnGoogle, false);
        setLoading(btnPinLogin, false);
        setStatus("Error verifying session. Try again.", "error");
    }
}

document.addEventListener("DOMContentLoaded", () => {
    // The fbService.init() is for ongoing changes, which is not needed on this page
    // as any successful login will cause a redirect. We just need the initial check.
    updateConnectionChip();
    window.addEventListener("online", updateConnectionChip);
    window.addEventListener("offline", updateConnectionChip);
    main();
});
