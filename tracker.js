(async () => {
  if (!window.__eventListenerMonkeyPatched) {
    const originalAddEventListener = EventTarget.prototype.addEventListener;
    EventTarget.prototype.addEventListener = function (type, listener, options) {
      if (!this.__interactiveEvents) {
        this.__interactiveEvents = new Set();
      }
      const interactiveEventTypes = [
        "click",
        "input",
        "change",
        "keydown",
        "keyup",
        "keypress",
        "focus",
        "blur",
        "touchstart",
        "touchend"
      ];
      if (interactiveEventTypes.includes(type)) {
        this.__interactiveEvents.add(type);
      }
      return originalAddEventListener.call(this, type, listener, options);
    };
    window.__eventListenerMonkeyPatched = true;
  }

  if (window.__trackingInjected) {
    console.warn("Tracking script already injected.");
    return;
  }
  window.__trackingInjected = true;

  let trackingEnabled = false;

  function isInteractive(element) {
    if (!element || !element.tagName) return false;
    const tag = element.tagName.toLowerCase();
    const interactiveTags = ["a", "button", "input", "select", "textarea", "area", "details", "summary"];
    if (interactiveTags.includes(tag)) return true;
    if ((tag === "video" || tag === "audio") && element.hasAttribute("controls")) return true;
    const contentEditable = element.getAttribute("contenteditable");
    if (contentEditable === "true" || contentEditable === "") return true;
    if (element.hasAttribute("tabindex")) {
      const tabindexVal = parseInt(element.getAttribute("tabindex"), 10);
      if (!isNaN(tabindexVal) && tabindexVal >= 0) return true;
    }
    const interactiveRoles = ["button", "link", "checkbox", "menuitem", "menuitemcheckbox", "menuitemradio", "radio", "switch", "tab", "slider", "combobox", "spinbutton", "listbox", "textbox", "searchbox", "menu", "menubar", "treeitem", "option"];
    const role = element.getAttribute("role");
    if (role && interactiveRoles.includes(role.toLowerCase())) return true;
    if (element.hasAttribute("aria-haspopup")) {
      const ariaHasPopup = element.getAttribute("aria-haspopup");
      if (ariaHasPopup !== "false") return true;
    }
    try {
      const props = Object.getOwnPropertyNames(element);
      for (const prop of props) {
        if (prop.startsWith("on") && typeof element[prop] === "function") return true;
      }
    } catch (e) {}
    for (const attr of element.attributes) {
      if (attr.name.startsWith("on") && attr.value.trim() !== "") return true;
    }
    if (typeof getEventListeners === 'function') {
      const listeners = getEventListeners(element);
      if (Object.keys(listeners).length > 0) return true;
    }
    if (element.__interactiveEvents && element.__interactiveEvents.size > 0) return true;
    try {
      const computedStyle = window.getComputedStyle(element);
      if (computedStyle && computedStyle.cursor === "pointer") return true;
    } catch (e) {}
    if (tag === "svg" || element.tagName.includes('-')) return true;
    return false;
  }

  function preActionCapture(event) {
    event.preActionRawHtml = getRawHTMLSync();
    event.preActionCleanedHtml = getCleanedHTMLSync();
  }

  const clickHandler = (event) => {
    recordAction(event, "click");
  };

  const inputHandler = (event) => {
    handleTypingEvent(event);
  };

  const changeHandler = (event) => {
    if (event.target.tagName.toLowerCase() === "select") {
      recordAction(event, "select");
    }
  };

  let typingTimer;
  const typingDelay = 1500;

  function getTopLevelTarget(element) {
    let current = element;
    while (current.parentElement && isInteractive(current.parentElement)) {
      current = current.parentElement;
    }
    return current;
  }

  async function recordAction(event, type) {
    if (!trackingEnabled) return;
    const raw_html = event.preActionRawHtml || getRawHTMLSync();
    const cleaned_html = event.preActionCleanedHtml || getCleanedHTMLSync();

    try {
      const element = event.target;
      const tagName = element.tagName.toLowerCase();
      const displayTag = getFriendlyTag(element);

      let label =
        element.getAttribute("placeholder") ||
        element.getAttribute("aria-label") ||
        element.getAttribute("alt") ||
        element.getAttribute("value") ||
        (element.innerText || element.textContent || "").trim();
      if (!label) label = "Without label";

      let value = "";
      if (type === "type") {
        value = element.value;
      } else if (type === "select" && tagName === "select") {
        value = element.options[element.selectedIndex].text;
      }

      const action = `[${displayTag}] ${label} -> ${type.toUpperCase()}${value ? ": " + value : ""}`;
      const op = type.toUpperCase();
      const operation = { original_op: op, value: value, op };

      const topLevelElement = getTopLevelTarget(element);
      const isOriginal = (element === topLevelElement);

      element.setAttribute("data-pos-candidate", "true");

      const pos_candidate = {
        tag: tagName,
        attributes: serializeAttributes(element),
        is_original_target: isOriginal,
        is_top_level_target: true
      };

      const tempContainer = document.createElement("div");
      tempContainer.innerHTML = cleaned_html;
      const neg_candidates = Array.from(tempContainer.querySelectorAll("*"))
        .filter(el => isInteractive(el) && el.getAttribute("data-pos-candidate") !== "true")
        .map(el => ({
          tag: el.tagName.toLowerCase(),
          attributes: serializeAttributes(el)
        }));

      const actionData = {
        action,
        raw_html,
        cleaned_html,
        operation,
        pos_candidate,
        neg_candidates,
      };

      if (typeof saveAction !== "function") {
        console.error("saveAction function is not available. Action not recorded.");
        return;
      }

      await saveAction(actionData);
      console.log("✅ Action recorded:", action);
    } catch (error) {
      console.error("❌ Error recording action:", error);
    }
  }

  function handleTypingEvent(event) {
    const tag = event.target.tagName.toLowerCase();
    if (tag === "input" || tag === "textarea") {
      clearTimeout(typingTimer);
      typingTimer = setTimeout(() => recordAction(event, "type"), typingDelay);
    }
  }

  function addListeners() {
    if (document.readyState === "complete") {
      document.addEventListener("click", preActionCapture, true);
      document.addEventListener("input", preActionCapture, true);
      document.addEventListener("change", preActionCapture, true);

      document.addEventListener("click", clickHandler, true);
      document.addEventListener("input", inputHandler, true);
      document.addEventListener("change", changeHandler, true);
      console.log("✅ Event listeners added (capture phase) with pre-action capture");
    } else {
      window.addEventListener("load", addListeners);
    }
  }

  function removeListeners() {
    document.removeEventListener("click", preActionCapture, true);
    document.removeEventListener("input", preActionCapture, true);
    document.removeEventListener("change", preActionCapture, true);

    document.removeEventListener("click", clickHandler, true);
    document.removeEventListener("input", inputHandler, true);
    document.removeEventListener("change", changeHandler, true);
    console.log("🚫 Event listeners removed");
  }

  chrome.runtime.onMessage.addListener((request) => {
    if (request.type === "startTracking") {
      if (!trackingEnabled) {
        trackingEnabled = true;
        addListeners();
        console.log("🔔 Tracking started");
      }
    } else if (request.type === "stopTracking") {
      if (trackingEnabled) {
        trackingEnabled = false;
        removeListeners();
        console.log("🔔 Tracking stopped");
      }
    }
  });

  chrome.storage.local.get("trackingEnabled", (data) => {
    trackingEnabled = data.trackingEnabled ?? false;
    if (trackingEnabled) {
      addListeners();
    }
  });

  function getRawHTMLSync() {
    const doctype = new XMLSerializer().serializeToString(document.doctype);
    let htmlClone = document.documentElement.cloneNode(true);
    Array.from(htmlClone.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() !== "body") {
        child.remove();
      }
    });
    return doctype + "\n" + htmlClone.outerHTML;
  }

  function getCleanedHTMLSync() {
    let clonedDoc = document.documentElement.cloneNode(true);
    let elementsToRemove = clonedDoc.querySelectorAll("script, style, iframe, noscript");
    elementsToRemove.forEach((el) => el.remove());
    removeComments(clonedDoc);
    Array.from(clonedDoc.childNodes).forEach((child) => {
      if (child.nodeType === Node.ELEMENT_NODE && child.tagName.toLowerCase() !== "body") {
        child.remove();
      }
    });
    return clonedDoc.outerHTML;
  }

  function removeComments(node) {
    for (let i = 0; i < node.childNodes.length; i++) {
      let child = node.childNodes[i];
      if (child.nodeType === Node.COMMENT_NODE) {
        node.removeChild(child);
        i--;
      } else if (child.nodeType === Node.ELEMENT_NODE) {
        removeComments(child);
      }
    }
  }

  function getFriendlyTag(element) {
    const role = element.getAttribute("role");
    if (role) return role.toLowerCase();
    const tagName = element.tagName.toLowerCase();
    if (tagName === "a" && element.getAttribute("href")) {
      return "link";
    }
    const typeAttr = element.getAttribute("type");
    if (typeAttr) return typeAttr.toLowerCase();
    return tagName;
  }

  async function downloadJSON() {
    let actions = await getAllActions();
    let action_reprs = actions.map((item) => item.action);
    let data = { action_reprs, actions };
    let jsonString = JSON.stringify(data, (key, value) => {
      return key === "id" ? undefined : value;
    }, 2);
    let blob = new Blob([jsonString], { type: "application/json" });
    let a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `user_actions_${Date.now()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  }

  async function clearActions() {
    await clearAllActions();
    console.log("✅ Actions cleared successfully.");
  }

  function serializeAttributes(element) {
    let attrs = element.attributes;
    let serialized = {};
    for (let i = 0; i < attrs.length; i++) {
      if (attrs[i].name === "data-pos-candidate") continue;
      serialized[attrs[i].name] = attrs[i].value;
    }
    return JSON.stringify(serialized);
  }

  window.recordingTool = { downloadJSON, clearActions };
})();

