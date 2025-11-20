// Landscape state
let currentLandscape = null;
let originalLandscape = null;
let expandedNodes = new Set(); // Track expanded nodes

// Custom attributes state
let customAttributeCounter = 0;

// Dark mode functionality
function initDarkMode() {
  const darkModeToggle = document.getElementById("darkModeToggle");
  const darkModeIcon = document.getElementById("darkModeIcon");
  const html = document.documentElement;

  // Check for saved theme preference or default to light mode
  const savedTheme = localStorage.getItem("theme");
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;

  const updateIcon = (isDark) => {
    if (darkModeIcon && window.lucide) {
      darkModeIcon.setAttribute("data-lucide", isDark ? "sun" : "moon");
      window.lucide.createIcons();
    }
  };

  if (savedTheme === "dark" || (!savedTheme && prefersDark)) {
    html.classList.add("dark");
    updateIcon(true);
  } else {
    updateIcon(false);
  }

  darkModeToggle.addEventListener("click", () => {
    html.classList.toggle("dark");
    const isDark = html.classList.contains("dark");
    localStorage.setItem("theme", isDark ? "dark" : "light");
    updateIcon(isDark);
  });
}

// Initialize dark mode on page load
window.addEventListener("DOMContentLoaded", () => {
  initDarkMode();
  initCustomAttributes();

  // Initialize Lucide icons after DOM is loaded
  if (window.lucide) {
    window.lucide.createIcons();
  }
});

// Default custom attributes
const DEFAULT_CUSTOM_ATTRIBUTES = [
  { key: "explorviz.token.id", value: "mytokenvalue" },
  { key: "explorviz.token.secret", value: "mytokensecret" },
  { key: "telemetry.sdk.language", value: "java" },
  { key: "service.instance.id", value: "0" },
];

// Initialize custom attributes with default values
function initCustomAttributes() {
  const container = document.getElementById("custom_attributes_container");
  if (!container) return;

  resetCustomAttributes();
}

// Reset custom attributes to defaults
function resetCustomAttributes() {
  const container = document.getElementById("custom_attributes_container");
  if (!container) return;

  // Clear all existing attributes
  container.innerHTML = "";
  customAttributeCounter = 0;

  // Add default attributes
  DEFAULT_CUSTOM_ATTRIBUTES.forEach((attr) => {
    addCustomAttributeLine(attr.key, attr.value);
  });
}

// Add a new custom attribute line
function addCustomAttributeLine(key = "", value = "") {
  const container = document.getElementById("custom_attributes_container");
  if (!container) return;

  customAttributeCounter++;
  const attrId = customAttributeCounter;

  const attrDiv = document.createElement("div");
  attrDiv.className = "flex items-center gap-2 custom-attribute-row";
  attrDiv.setAttribute("data-attr-id", attrId);

  attrDiv.innerHTML = `
    <input
      type="text"
      value="${key}"
      name="key_customAttribute${attrId}"
      placeholder="Attribute key"
      class="material-input w-48"
      pattern="[a-zA-Z0-9\.\-]+"
      required
      oninvalid="this.setCustomValidity('Key may only include A-Z, a-z, 0-9, . and -')"
      oninput="this.setCustomValidity('')"
    />
    <span class="text-gray-700 dark:text-gray-300">:</span>
    <input
      type="text"
      value="${value}"
      name="value_customAttribute${attrId}"
      placeholder="Attribute value"
      class="material-input flex-1"
      pattern="[a-zA-Z0-9\.\-]+"
      required
      oninvalid="this.setCustomValidity('Value may only include A-Z, a-z, 0-9, . and -')"
      oninput="this.setCustomValidity('')"
    />
    <button
      type="button"
      class="action-btn action-btn-delete remove-attribute-btn"
      title="Remove attribute"
      onclick="removeCustomAttributeLine(${attrId})"
    >
      <i data-lucide="trash-2"></i>
    </button>
  `;

  // Initialize Lucide icon after adding to DOM
  setTimeout(() => {
    if (window.lucide) {
      window.lucide.createIcons();
    }
  }, 0);

  container.appendChild(attrDiv);
}

// Remove a custom attribute line (needs to be global for onclick handlers)
window.removeCustomAttributeLine = function (attrId) {
  const container = document.getElementById("custom_attributes_container");
  if (!container) return;

  const attrRow = container.querySelector(`[data-attr-id="${attrId}"]`);
  if (attrRow) {
    attrRow.remove();
  }
};

// Add custom attribute button handler
const buttonAddCustomAttribute = document.getElementById(
  "button_add_custom_attribute",
);
if (buttonAddCustomAttribute) {
  buttonAddCustomAttribute.addEventListener("click", () => {
    addCustomAttributeLine("", "");
  });
}

// Reset custom attributes button handler
const buttonResetCustomAttributes = document.getElementById(
  "button_reset_custom_attributes",
);
if (buttonResetCustomAttributes) {
  buttonResetCustomAttributes.addEventListener("click", () => {
    if (
      confirm(
        "Reset all custom attributes to default values? This will remove all current attributes.",
      )
    ) {
      resetCustomAttributes();
    }
  });
}

// Limit range sliders to prevent minimum and maximum values from crossing
const rangeMinClassCount = document.getElementById("range_minClassCount");
const rangeMaxClassCount = document.getElementById("range_maxClassCount");
const rangeMinMethodCount = document.getElementById("range_minMethodCount");
const rangeMaxMethodCount = document.getElementById("range_maxMethodCount");

if (rangeMinClassCount && rangeMaxClassCount) {
  rangeMinClassCount.addEventListener("input", (event) => {
    if (parseInt(rangeMaxClassCount.value) < parseInt(event.target.value)) {
      event.target.value = rangeMaxClassCount.value;
      event.preventDefault();
    }
  });

  rangeMaxClassCount.addEventListener("input", (event) => {
    if (parseInt(rangeMinClassCount.value) > parseInt(event.target.value)) {
      event.target.value = rangeMinClassCount.value;
      event.preventDefault();
    }
  });
}

if (rangeMinMethodCount && rangeMaxMethodCount) {
  rangeMinMethodCount.addEventListener("input", (event) => {
    if (parseInt(rangeMaxMethodCount.value) < parseInt(event.target.value)) {
      event.target.value = rangeMaxMethodCount.value;
      event.preventDefault();
    }
  });

  rangeMaxMethodCount.addEventListener("input", (event) => {
    if (parseInt(rangeMinMethodCount.value) > parseInt(event.target.value)) {
      event.target.value = rangeMinMethodCount.value;
      event.preventDefault();
    }
  });
}

// Update labels next to range sliders to show exact range value
const formRangeIds = [
  "appCount",
  "packageDepth",
  "minClassCount",
  "maxClassCount",
  "minMethodCount",
  "maxMethodCount",
  "balance",
  "duration",
  "callCount",
  "maxCallDepth",
];

formRangeIds.forEach((id) => {
  const range = document.getElementById(`range_${id}`);
  const label = document.getElementById(`label_${id}`);
  if (range && label) {
    label.textContent = range.value;
    range.addEventListener("input", (event) => {
      label.textContent = event.target.value;
    });
  }
});

// Landscape generation form handler
const formLandscape = document.getElementById("form_landscape");
if (formLandscape) {
  formLandscape.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById("landscape_status");

    try {
      const formData = new FormData(formLandscape);
      const data = {};
      for (const [key, value] of formData.entries()) {
        data[key] = value;
      }

      const response = await fetch("/landscape", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate landscape");
      }

      const landscape = await response.json();
      currentLandscape = landscape;
      originalLandscape = JSON.parse(JSON.stringify(landscape)); // Deep copy
      expandedNodes.clear();

      showStatus(statusDiv, "Landscape generated successfully!", "success");
      renderLandscapeEditor(landscape);
      document
        .getElementById("landscape_editor_container")
        .classList.remove("hidden");
    } catch (error) {
      showStatus(statusDiv, `Error: ${error.message}`, "error");
    }
  });
}

// Trace generation form handler
const formTraces = document.getElementById("form_traces");
if (formTraces) {
  formTraces.addEventListener("submit", async (e) => {
    e.preventDefault();
    const statusDiv = document.getElementById("trace_status");

    // Check if landscape exists
    if (!currentLandscape) {
      showStatus(statusDiv, "Please generate a landscape first!", "error");
      return;
    }

    try {
      const formData = new FormData(formTraces);
      const data = {};

      // Collect regular form fields
      for (const [key, value] of formData.entries()) {
        // Skip custom attribute fields - we'll collect them separately
        if (
          key.startsWith("key_customAttribute") ||
          key.startsWith("value_customAttribute")
        ) {
          continue;
        }
        if (key === "allowCyclicCalls") {
          data[key] = value === "on";
        } else if (key === "visitAllMethods") {
          data[key] = value === "on";
        } else {
          data[key] = value;
        }
      }

      // Collect custom attributes - backend expects key_customAttribute1, value_customAttribute1 format
      const container = document.getElementById("custom_attributes_container");
      if (container) {
        const attrRows = container.querySelectorAll(".custom-attribute-row");
        let attrCounter = 1;
        attrRows.forEach((row) => {
          const keyInput = row.querySelector(
            'input[name^="key_customAttribute"]',
          );
          const valueInput = row.querySelector(
            'input[name^="value_customAttribute"]',
          );
          if (
            keyInput &&
            valueInput &&
            keyInput.value.trim() &&
            valueInput.value.trim()
          ) {
            data[`key_customAttribute${attrCounter}`] = keyInput.value.trim();
            data[`value_customAttribute${attrCounter}`] =
              valueInput.value.trim();
            attrCounter++;
          }
        });
      }

      const response = await fetch("/traces", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate trace");
      }

      showStatus(
        statusDiv,
        "Trace generated and sent successfully!",
        "success",
      );
      setTimeout(() => {
        statusDiv.innerHTML = "";
      }, 3000);
    } catch (error) {
      showStatus(statusDiv, `Error: ${error.message}`, "error");
    }
  });
}

// Save landscape button
const buttonSaveLandscape = document.getElementById("button_save_landscape");
if (buttonSaveLandscape) {
  buttonSaveLandscape.addEventListener("click", async () => {
    if (!currentLandscape) {
      return;
    }

    try {
      const response = await fetch("/landscape", {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(currentLandscape),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save landscape");
      }

      const statusDiv = document.getElementById("landscape_status");
      showStatus(statusDiv, "Landscape saved successfully!", "success");
      originalLandscape = JSON.parse(JSON.stringify(currentLandscape)); // Update original
    } catch (error) {
      const statusDiv = document.getElementById("landscape_status");
      showStatus(statusDiv, `Error: ${error.message}`, "error");
    }
  });
}

// Reload landscape button
const buttonReloadLandscape = document.getElementById(
  "button_reload_landscape",
);
if (buttonReloadLandscape) {
  buttonReloadLandscape.addEventListener("click", () => {
    if (originalLandscape) {
      currentLandscape = JSON.parse(JSON.stringify(originalLandscape));
      renderLandscapeEditor(currentLandscape);
      const statusDiv = document.getElementById("landscape_status");
      showStatus(statusDiv, "Landscape reloaded from original.", "info");
    }
  });
}

// Add app button
const buttonAddApp = document.getElementById("button_add_app");
if (buttonAddApp) {
  buttonAddApp.addEventListener("click", () => {
    if (!currentLandscape) {
      currentLandscape = [];
    }
    const appName = prompt("Enter app name:", "newapp");
    if (appName && appName.trim() !== "") {
      // Create a minimal app structure
      const rootPackage3 = {
        name: appName.trim().replace(/-/g, ""),
        classes: [],
        subpackages: [],
      };
      const rootPackage2 = {
        name: "tracegenerator",
        classes: [],
        subpackages: [rootPackage3],
      };
      const rootPackage1 = {
        name: "org",
        classes: [],
        subpackages: [rootPackage2],
      };
      rootPackage2.parent = rootPackage1;
      rootPackage3.parent = rootPackage2;

      // Create a default class
      const defaultClass = {
        identifier: "Main",
        methods: [{ identifier: "main" }],
        parentAppName: appName.trim(),
      };
      rootPackage3.classes.push(defaultClass);
      defaultClass.parent = rootPackage3;

      const newApp = {
        name: appName.trim(),
        rootPackage: rootPackage1,
        entryPoint: defaultClass,
        classes: [defaultClass],
        packages: [rootPackage2, rootPackage3],
        methods: [defaultClass.methods[0]],
      };

      currentLandscape.push(newApp);
      renderLandscapeEditor(currentLandscape);
    }
  });
}

// Expand all button
const buttonExpandAll = document.getElementById("button_expand_all");
if (buttonExpandAll) {
  buttonExpandAll.addEventListener("click", () => {
    if (!currentLandscape) return;

    // Collect all node IDs that should be expanded
    const allNodeIds = new Set();

    currentLandscape.forEach((app, appIdx) => {
      const appNodeId = generateNodeId("app", appIdx);
      allNodeIds.add(appNodeId);

      function collectPackageNodes(pkg) {
        const pkgNodeId = generateNodeId(
          "pkg",
          appIdx,
          pkg.name.replace(/\./g, "_"),
        );
        allNodeIds.add(pkgNodeId);

        if (pkg.subpackages) {
          pkg.subpackages.forEach((subPkg) => {
            collectPackageNodes(subPkg);
          });
        }

        if (pkg.classes) {
          pkg.classes.forEach((cls) => {
            const clsNodeId = generateNodeId(
              "cls",
              appIdx,
              cls.identifier.replace(/\./g, "_"),
            );
            allNodeIds.add(clsNodeId);
          });
        }
      }

      if (app.rootPackage) {
        collectPackageNodes(app.rootPackage);
      }
    });

    expandedNodes = allNodeIds;
    renderLandscapeEditor(currentLandscape);
  });
}

// Collapse all button
const buttonCollapseAll = document.getElementById("button_collapse_all");
if (buttonCollapseAll) {
  buttonCollapseAll.addEventListener("click", () => {
    expandedNodes.clear();
    if (currentLandscape) {
      renderLandscapeEditor(currentLandscape);
    }
  });
}

// Load existing landscape on page load
window.addEventListener("load", async () => {
  try {
    const response = await fetch("/landscape");
    if (response.ok) {
      const landscape = await response.json();
      currentLandscape = landscape;
      originalLandscape = JSON.parse(JSON.stringify(landscape));
      renderLandscapeEditor(landscape);
      document
        .getElementById("landscape_editor_container")
        .classList.remove("hidden");
    }
  } catch (error) {
    // No landscape exists yet, that's fine
  }
});

// Helper function to show status messages
function showStatus(container, message, type) {
  const styles = {
    success:
      "bg-green-50 dark:bg-green-900/30 border-green-200 dark:border-green-800 text-green-800 dark:text-green-200",
    error:
      "bg-red-50 dark:bg-red-900/30 border-red-200 dark:border-red-800 text-red-800 dark:text-red-200",
    info: "bg-blue-50 dark:bg-blue-900/30 border-blue-200 dark:border-blue-800 text-blue-800 dark:text-blue-200",
  };
  container.innerHTML = `<div class="material-card p-4 border ${styles[type] || styles.info}">${message}</div>`;
}

// Generate unique ID for nodes
function generateNodeId(type, ...parts) {
  return `${type}_${parts.join("_")}`;
}

// Render landscape editor with hierarchical structure
function renderLandscapeEditor(landscape) {
  const editor = document.getElementById("landscape_editor");
  if (!editor) return;

  let html = "";

  landscape.forEach((app, appIdx) => {
    const appNodeId = generateNodeId("app", appIdx);
    const hasChildren =
      app.rootPackage &&
      ((app.rootPackage.subpackages &&
        app.rootPackage.subpackages.length > 0) ||
        (app.rootPackage.classes && app.rootPackage.classes.length > 0));
    const isExpanded = expandedNodes.has(appNodeId);

    html += `<div class="tree-node" data-type="app" data-app="${appIdx}" data-toggle-node="${appNodeId}">`;
    html += `<span class="tree-toggle ${hasChildren ? (isExpanded ? "expanded" : "collapsed") : "leaf"} w-4 text-center cursor-pointer text-gray-600 dark:text-gray-400 flex items-center justify-center" data-node-id="${appNodeId}">`;
    if (hasChildren) {
      html += `<i data-lucide="${isExpanded ? "chevron-down" : "chevron-right"}" class="w-4 h-4"></i>`;
    } else {
      html += `<i data-lucide="circle" class="w-2 h-2"></i>`;
    }
    html += `</span>`;
    html += `<span class="entity-name font-bold text-blue-600 dark:text-blue-400 text-base flex items-center gap-2">
      <i data-lucide="smartphone" class="w-5 h-5"></i>
      ${app.name}
    </span>`;
    html += `<div class="action-buttons">`;
    html += `<button class="action-btn action-btn-add" onclick="event.stopPropagation(); addPackage(${appIdx})" title="Add Package">
      <i data-lucide="plus"></i>
    </button>`;
    html += `<button class="action-btn action-btn-edit" onclick="event.stopPropagation(); renameApp(${appIdx})" title="Rename">
      <i data-lucide="pencil"></i>
    </button>`;
    html += `<button class="action-btn action-btn-delete" onclick="event.stopPropagation(); deleteApp(${appIdx})" title="Delete">
      <i data-lucide="trash-2"></i>
    </button>`;
    html += `</div></div>`;

    if (hasChildren && isExpanded) {
      html += `<div class="ml-5" data-parent="${appNodeId}">`;
      html += renderPackage(app.rootPackage, appIdx, 0);
      html += `</div>`;
    }
  });

  editor.innerHTML = html;

  // Initialize Lucide icons after DOM update
  // Use setTimeout to ensure DOM is fully updated
  setTimeout(() => {
    if (window.lucide) {
      // Initialize icons within the editor container
      window.lucide.createIcons(editor);
    }
  }, 0);

  // Add toggle handlers for entire tree nodes
  editor.querySelectorAll("[data-toggle-node]").forEach((nodeElement) => {
    nodeElement.addEventListener("click", function (e) {
      // Don't toggle if clicking on action buttons
      if (
        e.target.closest(".action-buttons") ||
        e.target.closest(".action-btn")
      ) {
        return;
      }
      const nodeId = this.dataset.toggleNode;
      if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
      } else {
        expandedNodes.add(nodeId);
      }
      renderLandscapeEditor(currentLandscape);
    });
  });

  // Also handle clicks on triangle icons (for backward compatibility)
  editor.querySelectorAll(".tree-toggle").forEach((toggle) => {
    toggle.addEventListener("click", function (e) {
      e.stopPropagation();
      const nodeId = this.dataset.nodeId;
      if (expandedNodes.has(nodeId)) {
        expandedNodes.delete(nodeId);
      } else {
        expandedNodes.add(nodeId);
      }
      renderLandscapeEditor(currentLandscape);
    });
  });
}

// Render package recursively
function renderPackage(pkg, appIdx, depth) {
  const pkgNodeId = generateNodeId("pkg", appIdx, pkg.name.replace(/\./g, "_"));
  const hasChildren =
    (pkg.subpackages && pkg.subpackages.length > 0) ||
    (pkg.classes && pkg.classes.length > 0);
  const isExpanded = expandedNodes.has(pkgNodeId);

  let html = `<div class="tree-node" data-type="package" data-app="${appIdx}" data-package="${pkg.name}" data-toggle-node="${pkgNodeId}">`;
  html += `<span class="tree-toggle ${hasChildren ? (isExpanded ? "expanded" : "collapsed") : "leaf"} w-4 text-center cursor-pointer text-gray-600 dark:text-gray-400 flex items-center justify-center" data-node-id="${pkgNodeId}">`;
  if (hasChildren) {
    html += `<i data-lucide="${isExpanded ? "chevron-down" : "chevron-right"}" class="w-4 h-4"></i>`;
  } else {
    html += `<i data-lucide="circle" class="w-2 h-2"></i>`;
  }
  html += `</span>`;
  html += `<span class="entity-name text-green-700 dark:text-green-400 flex items-center gap-2">
      <i data-lucide="package" class="w-5 h-5"></i>
      ${pkg.name}
    </span>`;
  html += `<div class="action-buttons">`;
  html += `<button class="action-btn action-btn-add-green" onclick="event.stopPropagation(); addSubPackage(${appIdx}, '${pkg.name.replace(/'/g, "\\'")}')" title="Add Subpackage">
      <i data-lucide="plus"></i>
    </button>`;
  html += `<button class="action-btn action-btn-add-green" onclick="event.stopPropagation(); addClass(${appIdx}, '${pkg.name.replace(/'/g, "\\'")}')" title="Add Class">
      <i data-lucide="file-code"></i>
    </button>`;
  html += `<button class="action-btn action-btn-edit" onclick="event.stopPropagation(); renamePackage(${appIdx}, '${pkg.name.replace(/'/g, "\\'")}')" title="Rename">
      <i data-lucide="pencil"></i>
    </button>`;
  html += `<button class="action-btn action-btn-delete" onclick="event.stopPropagation(); deletePackage(${appIdx}, '${pkg.name.replace(/'/g, "\\'")}')" title="Delete">
      <i data-lucide="trash-2"></i>
    </button>`;
  html += `</div></div>`;

  if (hasChildren && isExpanded) {
    html += `<div class="ml-5" data-parent="${pkgNodeId}">`;

    // Render classes
    if (pkg.classes && pkg.classes.length > 0) {
      pkg.classes.forEach((cls) => {
        html += renderClass(cls, appIdx, pkg.name);
      });
    }

    // Render subpackages
    if (pkg.subpackages && pkg.subpackages.length > 0) {
      pkg.subpackages.forEach((subPkg) => {
        html += renderPackage(subPkg, appIdx, depth + 1);
      });
    }

    html += `</div>`;
  }

  return html;
}

// Render class
function renderClass(cls, appIdx, packageName) {
  const clsNodeId = generateNodeId(
    "cls",
    appIdx,
    cls.identifier.replace(/\./g, "_"),
  );
  const hasChildren = cls.methods && cls.methods.length > 0;
  const isExpanded = expandedNodes.has(clsNodeId);

  let html = `<div class="tree-node" data-type="class" data-app="${appIdx}" data-class="${cls.identifier}" data-package="${packageName}" data-toggle-node="${clsNodeId}">`;
  html += `<span class="tree-toggle ${hasChildren ? (isExpanded ? "expanded" : "collapsed") : "leaf"} w-4 text-center cursor-pointer text-gray-600 dark:text-gray-400 flex items-center justify-center" data-node-id="${clsNodeId}">`;
  if (hasChildren) {
    html += `<i data-lucide="${isExpanded ? "chevron-down" : "chevron-right"}" class="w-4 h-4"></i>`;
  } else {
    html += `<i data-lucide="circle" class="w-2 h-2"></i>`;
  }
  html += `</span>`;
  html += `<span class="entity-name text-orange-700 dark:text-orange-400 flex items-center gap-2">
      <i data-lucide="file-code" class="w-5 h-5"></i>
      ${cls.identifier}
    </span>`;
  html += `<div class="action-buttons">`;
  html += `<button class="action-btn action-btn-add-orange" onclick="event.stopPropagation(); addMethod(${appIdx}, '${cls.identifier.replace(/'/g, "\\'")}')" title="Add Method">
      <i data-lucide="plus"></i>
    </button>`;
  html += `<button class="action-btn action-btn-edit" onclick="event.stopPropagation(); renameClass(${appIdx}, '${cls.identifier.replace(/'/g, "\\'")}')" title="Rename">
      <i data-lucide="pencil"></i>
    </button>`;
  html += `<button class="action-btn action-btn-delete" onclick="event.stopPropagation(); deleteClass(${appIdx}, '${cls.identifier.replace(/'/g, "\\'")}')" title="Delete">
      <i data-lucide="trash-2"></i>
    </button>`;
  html += `</div></div>`;

  if (hasChildren && isExpanded) {
    html += `<div class="ml-5" data-parent="${clsNodeId}">`;
    cls.methods.forEach((method) => {
      html += renderMethod(method, appIdx, cls.identifier);
    });
    html += `</div>`;
  }

  return html;
}

// Render method
function renderMethod(method, appIdx, className) {
  let html = `<div class="tree-node" data-type="method" data-app="${appIdx}" data-class="${className}" data-method="${method.identifier}">`;
  html += `<span class="tree-toggle leaf w-4 text-center text-gray-400 dark:text-gray-500 flex items-center justify-center">
      <i data-lucide="circle" class="w-2 h-2"></i>
    </span>`;
  html += `<span class="text-gray-700 dark:text-gray-300 text-sm flex items-center gap-2">
      <i data-lucide="zap" class="w-4 h-4"></i>
      ${method.identifier}
    </span>`;
  html += `<div class="action-buttons">`;
  html += `<button class="action-btn action-btn-edit" onclick="event.stopPropagation(); renameMethod(${appIdx}, '${className.replace(/'/g, "\\'")}', '${method.identifier.replace(/'/g, "\\'")}')" title="Rename">
      <i data-lucide="pencil"></i>
    </button>`;
  html += `<button class="action-btn action-btn-delete" onclick="event.stopPropagation(); deleteMethod(${appIdx}, '${className.replace(/'/g, "\\'")}', '${method.identifier.replace(/'/g, "\\'")}')" title="Delete">
      <i data-lucide="trash-2"></i>
    </button>`;
  html += `</div></div>`;
  return html;
}

// Helper function to find package by name
function findPackage(app, packageName) {
  function searchInPackage(pkg) {
    if (pkg.name === packageName) {
      return pkg;
    }
    if (pkg.subpackages) {
      for (const subPkg of pkg.subpackages) {
        const found = searchInPackage(subPkg);
        if (found) return found;
      }
    }
    return null;
  }
  return searchInPackage(app.rootPackage);
}

// Helper function to find class by identifier
function findClass(app, className) {
  function searchInPackage(pkg) {
    if (pkg.classes) {
      const cls = pkg.classes.find((c) => c.identifier === className);
      if (cls) return cls;
    }
    if (pkg.subpackages) {
      for (const subPkg of pkg.subpackages) {
        const found = searchInPackage(subPkg);
        if (found) return found;
      }
    }
    return null;
  }
  return searchInPackage(app.rootPackage);
}

// Rename functions
function renameApp(appIdx) {
  const app = currentLandscape[appIdx];
  const newName = prompt("Enter new app name:", app.name);
  if (newName && newName.trim() !== "") {
    app.name = newName.trim();
    renderLandscapeEditor(currentLandscape);
  }
}

function renamePackage(appIdx, packageName) {
  const app = currentLandscape[appIdx];
  const pkg = findPackage(app, packageName);
  if (pkg) {
    const newName = prompt("Enter new package name:", pkg.name);
    if (newName && newName.trim() !== "") {
      pkg.name = newName.trim();
      renderLandscapeEditor(currentLandscape);
    }
  }
}

function renameClass(appIdx, className) {
  const app = currentLandscape[appIdx];
  const cls = findClass(app, className);
  if (cls) {
    const newName = prompt("Enter new class name:", cls.identifier);
    if (newName && newName.trim() !== "") {
      cls.identifier = newName.trim();
      renderLandscapeEditor(currentLandscape);
    }
  }
}

function renameMethod(appIdx, className, methodName) {
  const app = currentLandscape[appIdx];
  const cls = findClass(app, className);
  if (cls && cls.methods) {
    const method = cls.methods.find((m) => m.identifier === methodName);
    if (method) {
      const newName = prompt("Enter new method name:", method.identifier);
      if (newName && newName.trim() !== "") {
        method.identifier = newName.trim();
        renderLandscapeEditor(currentLandscape);
      }
    }
  }
}

// Add functions
function addPackage(appIdx) {
  const app = currentLandscape[appIdx];
  const packageName = prompt("Enter package name:", "newpackage");
  if (packageName && packageName.trim() !== "") {
    // Find the app's root package (org.tracegenerator.appname)
    let targetPackage = app.rootPackage;
    if (targetPackage.subpackages && targetPackage.subpackages.length > 0) {
      targetPackage = targetPackage.subpackages[0]; // tracegenerator
      if (targetPackage.subpackages && targetPackage.subpackages.length > 0) {
        targetPackage = targetPackage.subpackages[0]; // appname
      }
    }

    const newPackage = {
      name: packageName.trim(),
      classes: [],
      subpackages: [],
      parent: targetPackage,
    };

    // Add to target package's subpackages
    if (!targetPackage.subpackages) {
      targetPackage.subpackages = [];
    }
    targetPackage.subpackages.push(newPackage);

    // Also add to app.packages array
    if (!app.packages) {
      app.packages = [];
    }
    app.packages.push(newPackage);

    renderLandscapeEditor(currentLandscape);
  }
}

function addSubPackage(appIdx, parentPackageName) {
  const app = currentLandscape[appIdx];
  const parentPkg = findPackage(app, parentPackageName);
  if (parentPkg) {
    const packageName = prompt("Enter subpackage name:", "newsubpackage");
    if (packageName && packageName.trim() !== "") {
      const newPackage = {
        name: packageName.trim(),
        classes: [],
        subpackages: [],
        parent: parentPkg,
      };

      if (!parentPkg.subpackages) {
        parentPkg.subpackages = [];
      }
      parentPkg.subpackages.push(newPackage);

      // Also add to app.packages array
      if (!app.packages) {
        app.packages = [];
      }
      app.packages.push(newPackage);

      renderLandscapeEditor(currentLandscape);
    }
  }
}

function addClass(appIdx, packageName) {
  const app = currentLandscape[appIdx];
  const pkg = findPackage(app, packageName);
  if (pkg) {
    const className = prompt("Enter class name:", "NewClass");
    if (className && className.trim() !== "") {
      const newClass = {
        identifier: className.trim(),
        methods: [],
        parentAppName: app.name,
        parent: pkg,
      };

      if (!pkg.classes) {
        pkg.classes = [];
      }
      pkg.classes.push(newClass);

      // Also add to app.classes array
      if (!app.classes) {
        app.classes = [];
      }
      app.classes.push(newClass);

      renderLandscapeEditor(currentLandscape);
    }
  }
}

function addMethod(appIdx, className) {
  const app = currentLandscape[appIdx];
  const cls = findClass(app, className);
  if (cls) {
    const methodName = prompt("Enter method name:", "newMethod");
    if (methodName && methodName.trim() !== "") {
      const newMethod = {
        identifier: methodName.trim(),
      };

      if (!cls.methods) {
        cls.methods = [];
      }
      cls.methods.push(newMethod);

      // Also add to app.methods array
      if (!app.methods) {
        app.methods = [];
      }
      app.methods.push(newMethod);

      renderLandscapeEditor(currentLandscape);
    }
  }
}

// Delete functions
function deleteApp(appIdx) {
  if (confirm("Are you sure you want to delete this app?")) {
    currentLandscape.splice(appIdx, 1);
    renderLandscapeEditor(currentLandscape);
  }
}

function deletePackage(appIdx, packageName) {
  const app = currentLandscape[appIdx];

  function removePackageAndChildren(pkg) {
    // Remove all classes and their methods
    if (pkg.classes) {
      pkg.classes.forEach((cls) => {
        // Remove from app.classes
        if (app.classes) {
          const clsIndex = app.classes.indexOf(cls);
          if (clsIndex !== -1) {
            app.classes.splice(clsIndex, 1);
          }
        }
        // Remove methods from app.methods
        if (cls.methods && app.methods) {
          cls.methods.forEach((method) => {
            const methodIndex = app.methods.indexOf(method);
            if (methodIndex !== -1) {
              app.methods.splice(methodIndex, 1);
            }
          });
        }
      });
    }

    // Recursively remove subpackages
    if (pkg.subpackages) {
      pkg.subpackages.forEach((subPkg) => {
        removePackageAndChildren(subPkg);
      });
    }

    // Remove from app.packages
    if (app.packages) {
      const pkgIndex = app.packages.indexOf(pkg);
      if (pkgIndex !== -1) {
        app.packages.splice(pkgIndex, 1);
      }
    }
  }

  function removeFromParent(parentPkg) {
    if (parentPkg.subpackages) {
      const index = parentPkg.subpackages.findIndex(
        (p) => p.name === packageName,
      );
      if (index !== -1) {
        const pkg = parentPkg.subpackages[index];
        removePackageAndChildren(pkg);
        parentPkg.subpackages.splice(index, 1);
        return true;
      }
    }
    if (parentPkg.subpackages) {
      for (const subPkg of parentPkg.subpackages) {
        if (removeFromParent(subPkg)) {
          return true;
        }
      }
    }
    return false;
  }

  if (
    confirm(
      `Are you sure you want to delete package "${packageName}" and all its contents?`,
    )
  ) {
    removeFromParent(app.rootPackage);
    renderLandscapeEditor(currentLandscape);
  }
}

function deleteClass(appIdx, className) {
  const app = currentLandscape[appIdx];

  function removeFromPackage(pkg) {
    if (pkg.classes) {
      const index = pkg.classes.findIndex((c) => c.identifier === className);
      if (index !== -1) {
        const cls = pkg.classes[index];

        // Remove from app.classes array
        if (app.classes) {
          const clsIndex = app.classes.indexOf(cls);
          if (clsIndex !== -1) {
            app.classes.splice(clsIndex, 1);
          }
        }

        // Remove methods from app.methods array
        if (cls.methods && app.methods) {
          cls.methods.forEach((method) => {
            const methodIndex = app.methods.indexOf(method);
            if (methodIndex !== -1) {
              app.methods.splice(methodIndex, 1);
            }
          });
        }

        pkg.classes.splice(index, 1);
        return true;
      }
    }
    if (pkg.subpackages) {
      for (const subPkg of pkg.subpackages) {
        if (removeFromPackage(subPkg)) {
          return true;
        }
      }
    }
    return false;
  }

  if (confirm(`Are you sure you want to delete class "${className}"?`)) {
    removeFromPackage(app.rootPackage);
    renderLandscapeEditor(currentLandscape);
  }
}

function deleteMethod(appIdx, className, methodName) {
  const app = currentLandscape[appIdx];
  const cls = findClass(app, className);
  if (cls && cls.methods) {
    const index = cls.methods.findIndex((m) => m.identifier === methodName);
    if (index !== -1) {
      if (confirm(`Are you sure you want to delete method "${methodName}"?`)) {
        const method = cls.methods[index];

        // Remove from app.methods array
        if (app.methods) {
          const methodIndex = app.methods.indexOf(method);
          if (methodIndex !== -1) {
            app.methods.splice(methodIndex, 1);
          }
        }

        cls.methods.splice(index, 1);
        renderLandscapeEditor(currentLandscape);
      }
    }
  }
}

// Make functions globally available
window.addPackage = addPackage;
window.addSubPackage = addSubPackage;
window.addClass = addClass;
window.addMethod = addMethod;
window.renameApp = renameApp;
window.renamePackage = renamePackage;
window.renameClass = renameClass;
window.renameMethod = renameMethod;
window.deleteApp = deleteApp;
window.deletePackage = deletePackage;
window.deleteClass = deleteClass;
window.deleteMethod = deleteMethod;
