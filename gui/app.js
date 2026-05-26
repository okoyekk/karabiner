// Karabiner Configurator Client App

const PRIORITY_MAPPING_KEYS = ["spacebar", "a", "s", "x"];
const SUBLAYER_KEYS = ["a", "s", "x"];
const METADATA_KEYS = ["_comment"];
const LAYER_NAMES = {
  none: "Base Layer (Default mappings)",
  a: "App Shortcuts (Hyper + A)",
  s: "Site Shortcuts (Hyper + S)",
  x: "Exec Shell Layer (Hyper + X)"
};
const SUBLAYER_SHORT_NAMES = {
  a: "App",
  s: "Site",
  x: "Exec Shell"
};
const EDITABLE_ACTION_TYPES = new Set(["app", "open", "shell", "to"]);
const URL_SCHEME_RE = /^[a-z][a-z0-9+.-]*:/i;

// State Management
let state = {
  mappings: {},
  currentLayer: "none",
  selectedKey: null,
  hasUnsavedChanges: false
};

// DOM References
const DOM = {
  layerBtns: document.querySelectorAll(".layer-btn"),
  keyCaps: document.querySelectorAll(".key-cap"),
  layerTitle: document.getElementById("layer-title"),
  statTotal: document.getElementById("stat-total"),
  statSublayers: document.getElementById("stat-sublayers"),
  btnApply: document.getElementById("btn-apply-layout"),
  btnDiscard: document.getElementById("btn-discard-layout"),
  drawer: document.getElementById("editor-drawer"),
  btnCloseDrawer: document.getElementById("btn-close-drawer"),
  selectedKeyName: document.getElementById("selected-key-name"),
  mappingForm: document.getElementById("mapping-form"),
  actionType: document.getElementById("action-type"),
  btnDelete: document.getElementById("btn-delete-mapping"),
  toastContainer: document.getElementById("toast-container"),
  applyHint: document.getElementById("apply-hint"),
  
  // Field groups
  fieldGroups: {
    app: document.getElementById("field-group-app"),
    open: document.getElementById("field-group-open"),
    shell: document.getElementById("field-group-shell"),
    to: document.getElementById("field-group-to")
  },
  noteGroup: document.getElementById("field-group-note"),
  
  // Inputs
  inputs: {
    appName: document.getElementById("app-name"),
    openUrl: document.getElementById("open-url"),
    openUrlHint: document.getElementById("open-url-hint"),
    shellCommand: document.getElementById("shell-command"),
    note: document.getElementById("mapping-note"),
    toKey: document.getElementById("to-key"),
    mods: {
      control: document.getElementById("mod-control"),
      shift: document.getElementById("mod-shift"),
      option: document.getElementById("mod-option"),
      command: document.getElementById("mod-command")
    }
  }
};

// Start application
async function init() {
  setupEventListeners();
  await fetchMappings();
  activateLayer(state.currentLayer);
  updateSummaryStats();
  updatePendingChangesUI();
}

// Fetch current mappings from local server
async function fetchMappings(options = {}) {
  const {
    successMessage = "Layout mappings loaded successfully!",
    showSuccessToast = true,
    resetToEmptyOnError = true,
    errorMessage = "Error loading mappings. Using default empty layout."
  } = options;

  try {
    const res = await fetch("/api/mappings", { cache: "no-store" });
    if (!res.ok) throw new Error("Failed to load layout mappings");
    state.mappings = orderMappings(await res.json());
    state.hasUnsavedChanges = false;
    if (showSuccessToast) {
      showToast(successMessage, "success");
    }
    return true;
  } catch (err) {
    console.error(err);
    showToast(errorMessage, "error");
    if (resetToEmptyOnError) {
      state.mappings = {};
      state.hasUnsavedChanges = false;
    }
    return false;
  }
}

// Setup Event Listeners
function setupEventListeners() {
  // Layer Selection
  DOM.layerBtns.forEach(btn => {
    btn.addEventListener("click", () => {
      activateLayer(btn.dataset.layer);
    });
  });

  // Visual Keycaps Interaction
  DOM.keyCaps.forEach(cap => {
    cap.addEventListener("click", () => {
      const key = cap.dataset.key;
      if (!key) return; // ignore static disabled keys

      if (isReservedSublayerKey(key)) {
        showToast(getReservedSublayerMessage(key), "error");
        return;
      }

      const mapping = getMappingForKey(key);
      if (
        state.currentLayer === "none" &&
        mapping &&
        mapping.type === "sublayer" &&
        SUBLAYER_KEYS.includes(key)
      ) {
        activateLayer(key);
        showToast(`Editing ${LAYER_NAMES[key]}`, "success");
        return;
      }
      
      // Select keycap in UI
      DOM.keyCaps.forEach(c => c.classList.remove("selected"));
      cap.classList.add("selected");
      
      state.selectedKey = key;
      openDrawer(key);
    });
  });

  // Action type drop-down change
  DOM.actionType.addEventListener("change", () => {
    showFormFieldsFor(DOM.actionType.value);
    updateOpenUrlHint();
  });

  // Close drawer
  DOM.btnCloseDrawer.addEventListener("click", closeDrawer);

  // Form submit
  DOM.mappingForm.addEventListener("submit", handleSaveMapping);

  // Delete/Clear mapping
  DOM.btnDelete.addEventListener("click", handleDeleteMapping);

  // Save & Apply Layout
  DOM.btnApply.addEventListener("click", handleApplyLayout);
  DOM.btnDiscard.addEventListener("click", handleDiscardChanges);

  DOM.inputs.openUrl.addEventListener("input", updateOpenUrlHint);
}

// Render visual keyboard highlights depending on mappings in current layer
function renderKeyboard() {
  DOM.keyCaps.forEach(cap => {
    const key = cap.dataset.key;
    if (!key) return;

    cap.classList.remove("mapped");
    cap.classList.remove("selected");
    cap.classList.remove("active-sublayer-key");
    cap.classList.remove("reserved-sublayer-key");

    const mapping = getMappingForKey(key);
    if (mapping && (mapping.type !== "sublayer" || state.currentLayer === "none")) {
      cap.classList.add("mapped");
    }

    if (isReservedSublayerKey(key)) {
      cap.classList.add("active-sublayer-key");
      cap.classList.add("reserved-sublayer-key");
    }
  });
}

// Get the mapping defined for a key in the current selected layer
function getMappingForKey(key) {
  if (state.currentLayer === "none") {
    return state.mappings[key] || null;
  }

  if (isReservedSublayerKey(key)) {
    return null;
  }

  const sublayer = state.mappings[state.currentLayer];
  if (sublayer && sublayer.type === "sublayer" && sublayer.mappings) {
    return sublayer.mappings[key] || null;
  }
  
  return null;
}

// Update summary stats cards
function updateSummaryStats() {
  let count = Object.keys(state.mappings).filter((key) => !isMetadataKey(key)).length;
  let sublayerCount = 0;

  SUBLAYER_KEYS.forEach(subKey => {
    const sub = state.mappings[subKey];
    if (sub && sub.type === "sublayer" && sub.mappings) {
      sublayerCount += 1;
      count += Object.keys(sub.mappings).length;
    }
  });

  DOM.statTotal.textContent = count;
  DOM.statSublayers.textContent = sublayerCount;
}

// Open Editor Drawer & Pre-populate form inputs
function openDrawer(key) {
  DOM.selectedKeyName.textContent = key.replace(/_/g, " ").toUpperCase();
  DOM.drawer.classList.add("open");
  
  // Reset fields
  resetFormFields();

  // Find mapping value
  const mapping = getMappingForKey(key);
  
  if (mapping && EDITABLE_ACTION_TYPES.has(mapping.type)) {
    DOM.actionType.value = mapping.type;
    DOM.btnDelete.style.display = "block";
    
    // Pre-populate fields based on type
    if (mapping.type === "app") {
      DOM.inputs.appName.value = mapping.value || "";
    } else if (mapping.type === "open") {
      DOM.inputs.openUrl.value = mapping.value || "";
    } else if (mapping.type === "shell") {
      DOM.inputs.shellCommand.value = mapping.value || "";
    } else if (mapping.type === "to") {
      // Keystroke config
      const keystroke = mapping.value[0] || {};
      DOM.inputs.toKey.value = keystroke.key_code || "";
      
      const modifiers = keystroke.modifiers || [];
      DOM.inputs.mods.control.checked = modifiers.includes("left_control") || modifiers.includes("control");
      DOM.inputs.mods.shift.checked = modifiers.includes("left_shift") || modifiers.includes("shift");
      DOM.inputs.mods.option.checked = modifiers.includes("left_option") || modifiers.includes("option");
      DOM.inputs.mods.command.checked = modifiers.includes("left_command") || modifiers.includes("command");
    }

    DOM.inputs.note.value = mapping.note || "";
  } else {
    DOM.actionType.value = "none";
    DOM.btnDelete.style.display = "none";
  }
  
  showFormFieldsFor(DOM.actionType.value);
  updateOpenUrlHint();
}

// Close Editor Drawer
function closeDrawer() {
  DOM.drawer.classList.remove("open");
  DOM.keyCaps.forEach(c => c.classList.remove("selected"));
  state.selectedKey = null;
}

// Show specific form inputs depending on selected action type
function showFormFieldsFor(type) {
  Object.keys(DOM.fieldGroups).forEach(k => {
    DOM.fieldGroups[k].style.display = "none";
  });
  
  if (DOM.fieldGroups[type]) {
    DOM.fieldGroups[type].style.display = "block";
  }

  DOM.noteGroup.style.display = type === "none" ? "none" : "flex";
}

// Reset form elements
function resetFormFields() {
  DOM.inputs.appName.value = "";
  DOM.inputs.openUrl.value = "";
  DOM.inputs.shellCommand.value = "";
  DOM.inputs.note.value = "";
  DOM.inputs.toKey.value = "";
  DOM.inputs.mods.control.checked = false;
  DOM.inputs.mods.shift.checked = false;
  DOM.inputs.mods.option.checked = false;
  DOM.inputs.mods.command.checked = false;
  updateOpenUrlHint();
}

// Save Key Mapping configuration
function handleSaveMapping(e) {
  e.preventDefault();
  
  const key = state.selectedKey;
  if (!key) return;

  if (isReservedSublayerKey(key)) {
    showToast(getReservedSublayerMessage(key), "error");
    return;
  }
  
  const type = DOM.actionType.value;
  
  if (type === "none") {
    handleDeleteMapping();
    return;
  }
  
  let value = null;
  const note = DOM.inputs.note.value.trim();
  
  if (type === "app") {
    value = DOM.inputs.appName.value.trim();
    if (!value) {
      showToast("Application name cannot be empty!", "error");
      return;
    }
  } else if (type === "open") {
    value = DOM.inputs.openUrl.value.trim();
    if (!value) {
      showToast("URL cannot be empty!", "error");
      return;
    }
    if (!hasUrlScheme(value)) {
      updateOpenUrlHint();
      showToast('Include a scheme like "https://" or the URL might not open correctly.', "error");
      return;
    }
  } else if (type === "shell") {
    value = DOM.inputs.shellCommand.value.trim();
    if (!value) {
      showToast("Shell Script cannot be empty!", "error");
      return;
    }
  } else if (type === "to") {
    const toKey = DOM.inputs.toKey.value.trim();
    if (!toKey) {
      showToast("Target Key cannot be empty!", "error");
      return;
    }
    
    // Build modifiers list
    const modifiers = [];
    if (DOM.inputs.mods.control.checked) modifiers.push("left_control");
    if (DOM.inputs.mods.shift.checked) modifiers.push("left_shift");
    if (DOM.inputs.mods.option.checked) modifiers.push("left_option");
    if (DOM.inputs.mods.command.checked) modifiers.push("left_command");
    
    const keystroke = { key_code: toKey };
    if (modifiers.length > 0) keystroke.modifiers = modifiers;
    
    value = [keystroke];
  }
  
  // Set mapping in state
  const mappingObj = { type, value };
  if (note) {
    mappingObj.note = note;
  }

  setMappingValue(key, mappingObj);
  
  showToast(`Configured key [${key.toUpperCase()}] successfully!`, "success");
  closeDrawer();
  renderKeyboard();
  updateSummaryStats();
}

// Set mapping config value depending on layer context
function setMappingValue(key, mappingObj) {
  if (state.currentLayer === "none") {
    state.mappings[key] = mappingObj;
  } else {
    if (!state.mappings[state.currentLayer]) {
      state.mappings[state.currentLayer] = { type: "sublayer", mappings: {} };
    }
    state.mappings[state.currentLayer].mappings[key] = mappingObj;
  }

  state.mappings = orderMappings(state.mappings);
  setPendingChanges(true);
}

// Clear/Delete mapping config
function handleDeleteMapping() {
  const key = state.selectedKey;
  if (!key) return;
  
  if (state.currentLayer === "none") {
    delete state.mappings[key];
  } else {
    const sublayer = state.mappings[state.currentLayer];
    if (sublayer && sublayer.mappings) {
      delete sublayer.mappings[key];
    }
  }

  state.mappings = orderMappings(state.mappings);
  setPendingChanges(true);
  
  showToast(`Cleared mapping for key [${key.toUpperCase()}]`, "success");
  closeDrawer();
  renderKeyboard();
  updateSummaryStats();
}

// Submit mapping data to backend server and compile Karabiner layout
async function handleApplyLayout() {
  showToast("Applying changes & compiling Karabiner layout...", "success");
  
  try {
    const res = await fetch("/api/mappings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderMappings(state.mappings))
    });
    
    if (!res.ok) {
      const errData = await res.json().catch(() => ({}));
      throw new Error(errData.details || "Compilation failed");
    }

    setPendingChanges(false);
    showToast("Karabiner layout successfully compiled and applied!", "success");
  } catch (err) {
    console.error(err);
    showToast(`Error compiling layout: ${err.message}`, "error");
  }
}

async function handleDiscardChanges() {
  if (!state.hasUnsavedChanges) return;

  const confirmed = window.confirm(
    "Discard your unsaved changes and restore the last applied layout?"
  );
  if (!confirmed) return;

  closeDrawer();
  const restored = await fetchMappings({
    successMessage: "Unsaved changes discarded. Restored the last applied layout.",
    errorMessage: "Couldn't reload the saved layout. Kept your current unsaved changes.",
    resetToEmptyOnError: false
  });
  if (!restored) return;
  activateLayer(state.currentLayer);
  updateSummaryStats();
}

function activateLayer(layer) {
  state.currentLayer = layer;
  DOM.layerBtns.forEach(btn => {
    btn.classList.toggle("active", btn.dataset.layer === layer);
  });
  closeDrawer();
  DOM.layerTitle.textContent = LAYER_NAMES[layer] || "Key Mapping";
  renderKeyboard();
}

function orderMappings(mappings) {
  const ordered = {};

  METADATA_KEYS.forEach(key => {
    if (key in mappings) {
      ordered[key] = mappings[key];
    }
  });

  PRIORITY_MAPPING_KEYS.forEach(key => {
    if (key in mappings) {
      ordered[key] = mappings[key];
    }
  });

  Object.entries(mappings).forEach(([key, value]) => {
    if (!(key in ordered)) {
      ordered[key] = value;
    }
  });

  return ordered;
}

function isMetadataKey(key) {
  return METADATA_KEYS.includes(key);
}

function isReservedSublayerKey(key) {
  return state.currentLayer !== "none" && key === state.currentLayer;
}

function getReservedSublayerMessage(key) {
  const layerName = SUBLAYER_SHORT_NAMES[key] || key.toUpperCase();
  return `${key.toUpperCase()} is reserved as the ${layerName} layer trigger. Choose another shortcut key in this layer.`;
}

function hasUrlScheme(value) {
  return URL_SCHEME_RE.test(value);
}

function updateOpenUrlHint() {
  const value = DOM.inputs.openUrl.value.trim();
  const missingScheme = value !== "" && !hasUrlScheme(value);

  DOM.inputs.openUrl.classList.toggle("invalid", missingScheme);
  DOM.inputs.openUrlHint.classList.toggle("warning", missingScheme);
  DOM.inputs.openUrlHint.textContent = missingScheme
    ? 'Add a scheme like "https://" or the URL might not open correctly.'
    : 'Include the full URL with a scheme, like "https://example.com".';
}

function setPendingChanges(hasUnsavedChanges) {
  state.hasUnsavedChanges = hasUnsavedChanges;
  updatePendingChangesUI();
}

function updatePendingChangesUI() {
  DOM.btnApply.classList.toggle("pending-save", state.hasUnsavedChanges);
  DOM.applyHint.classList.toggle("visible", state.hasUnsavedChanges);
  DOM.btnDiscard.style.display = state.hasUnsavedChanges ? "inline-flex" : "none";
}

// Render customized user notifications (Toasts)
function showToast(message, type = "success") {
  const toast = document.createElement("div");
  toast.className = `toast ${type}`;
  
  // Icon select
  const icon = type === "success" ? "✓" : "✗";
  toast.innerHTML = `<span class="toast-icon">${icon}</span> <span>${message}</span>`;
  
  DOM.toastContainer.appendChild(toast);
  
  // Self destroy after 4 seconds
  setTimeout(() => {
    toast.style.opacity = "0";
    toast.style.transform = "translateX(100%)";
    setTimeout(() => toast.remove(), 300);
  }, 4000);
}

// Run app
document.addEventListener("DOMContentLoaded", init);
