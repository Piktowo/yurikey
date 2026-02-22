(() => {
  const btn = document.getElementById("btn-import-keybox");
  if (!btn) return;

  const targetPath = "/data/adb/tricky_store/keybox.xml";
  const statusId = "keybox-status";

  function escapeShell(value) {
    return `'${String(value).replace(/'/g, `'"'"'`)}'`;
  }

  function ksuExec(command) {
    return new Promise((resolve, reject) => {
      if (!window.ksu || typeof ksu.exec !== "function") {
        reject(new Error("ksu.exec not available"));
        return;
      }

      const cbId = "cb_" + Date.now();
      window[cbId] = (result) => {
        delete window[cbId];
        resolve(result);
      };

      ksu.exec(command, "{}", cbId);
    });
  }

  async function installFileContent(content) {
    const dir = targetPath.substring(0, targetPath.lastIndexOf("/"));
    const delimiter = "YURIKEY_EOF_" + Date.now();

    const command =
      `mkdir -p ${escapeShell(dir)}\n` +
      `cat <<'${delimiter}' > ${escapeShell(targetPath)}\n` +
      content + `\n${delimiter}\n` +
      `chmod 644 ${escapeShell(targetPath)}`;

    await ksuExec(command);
  }

  async function installFromPath(path) {
    const dir = targetPath.substring(0, targetPath.lastIndexOf("/"));
    const safePath = escapeShell(path);

    const command =
      `mkdir -p ${escapeShell(dir)}\n` +
      `cp -f ${safePath} ${escapeShell(targetPath)}\n` +
      `chmod 644 ${escapeShell(targetPath)}`;

    await ksuExec(command);
  }

  function ensureStatusBox() {
    let box = document.getElementById(statusId);
    if (!box) {
      box = document.createElement("div");
      box.id = statusId;
      box.className = "info-box info-content";
      btn.parentNode.appendChild(box);
    }
    return box;
  }

  function renderStatusBox() {
    const box = ensureStatusBox();

    box.innerHTML = `
      <h3 data-i18n="custom_keybox_title"></h3>
      <p data-i18n="custom_keybox_description"></p>
      <div class="form-row" style="display:flex;gap:0.5rem;flex-wrap:wrap;align-items:center;">
        <input id="keybox-path-input" type="text"
          placeholder="/sdcard/Download/keybox.xml"
          style="flex:1;min-width:220px;" />
        <button id="keybox-path-install"
          class="menu-btn"
          type="button"
          data-i18n="install_from_path"></button>
      </div>
      <div id="keybox-status-messages"></div>
    `;

    if (typeof applyI18n === "function") {
      applyI18n();
    }

    const pathBtn = document.getElementById("keybox-path-install");
    const pathInput = document.getElementById("keybox-path-input");

    pathBtn.addEventListener("click", async () => {
      const path = pathInput.value.trim();
      if (!path) {
        addStatus("path_required", "error");
        return;
      }

      try {
        await installFromPath(path);
        addStatus("install_success", "success");
        pathInput.value = "";
      } catch (e) {
        console.error(e);
        addStatus("install_failed", "error");
      }
    });
  }

  function addStatus(key, tone = "") {
    const container = document.getElementById("keybox-status-messages");
    if (!container) return;

    const p = document.createElement("p");
    p.setAttribute("data-i18n", key);
    if (tone) p.className = tone;

    container.appendChild(p);

    if (typeof applyI18n === "function") {
      applyI18n();
    }
  }

  btn.addEventListener("click", () => {
    renderStatusBox();

    const input = document.createElement("input");
    input.type = "file";
    input.style.display = "none";
    document.body.appendChild(input);

    input.addEventListener("change", async () => {
      const file = input.files?.[0];
      if (!file) return;

      try {
        const content = await file.text();
        await installFileContent(content);
        addStatus("install_success", "success");
      } catch (e) {
        console.error(e);
        addStatus("install_failed", "error");
      }

      input.remove();
    });

    input.click();
  });
})();
