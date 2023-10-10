var LiveView = (() => {
  var __defProp = Object.defineProperty;
  var __getOwnPropSymbols = Object.getOwnPropertySymbols;
  var __hasOwnProp = Object.prototype.hasOwnProperty;
  var __propIsEnum = Object.prototype.propertyIsEnumerable;
  var __defNormalProp = (obj, key, value) => key in obj ? __defProp(obj, key, { enumerable: true, configurable: true, writable: true, value }) : obj[key] = value;
  var __spreadValues = (a, b) => {
    for (var prop in b || (b = {}))
      if (__hasOwnProp.call(b, prop))
        __defNormalProp(a, prop, b[prop]);
    if (__getOwnPropSymbols)
      for (var prop of __getOwnPropSymbols(b)) {
        if (__propIsEnum.call(b, prop))
          __defNormalProp(a, prop, b[prop]);
      }
    return a;
  };

  // js/phoenix_live_head/index.ts
  var PhxLiveHead;
  (function(PhxLiveHead2) {
    PhxLiveHead2.NAMESPACE = "plh";
    const ALL_ATTR = "*";
    const CLASS_ATTR = "class";
    const ATTR = { "c": CLASS_ATTR, "h": "href" };
    const QUERY = { "f": "link[rel*='icon']" };
    function camelToKebabCase(s) {
      return s.replace(/([a-z])([A-Z])/g, "$1-$2").toLowerCase();
    }
    function stateKey(key, el) {
      return `${PhxLiveHead2.NAMESPACE}:${el.dataset["id"]}-${key}`;
    }
    function randId() {
      return Math.floor((1 + Math.random()) * 65536).toString(16).substring(1);
    }
    function attrObject(el) {
      return Array.from(el.attributes).filter((a) => a.specified).map((a) => ({ [a.nodeName]: a.nodeValue })).reduce((prev, curr) => Object.assign(prev || {}, curr));
    }
    function isStateBackupped(el, attr, key) {
      const saved = getState(el, key);
      if (saved !== void 0 && attr === ALL_ATTR) {
        return true;
      }
      if (saved !== void 0 && attr !== ALL_ATTR) {
        return saved[attr] !== void 0;
      }
      return false;
    }
    function getState(el, key) {
      const value = sessionStorage.getItem(stateKey(key, el)) || null;
      return value !== null ? JSON.parse(value) : void 0;
    }
    function saveState(el, key, value) {
      return sessionStorage.setItem(stateKey(key, el), JSON.stringify(value));
    }
    function backupState(el, attr, key) {
      const attrs = attrObject(el);
      if (attr !== ALL_ATTR) {
        return saveState(el, key, { [attr]: attrs[attr] });
      }
      saveState(el, key, attrs);
    }
    function restoreState(el, attr, key) {
      const state = getState(el, key);
      if (state === void 0) {
        console.warn(`No state backup found for key ${stateKey(key, el)}`);
      } else {
        if (attr !== ALL_ATTR) {
          return restoreAttrState(el, attr, key);
        }
        for (const attr2 of Object.keys(state)) {
          restoreAttrState(el, attr2, key);
        }
      }
    }
    function restoreAttrState(el, attr, key) {
      const state = getState(el, key);
      if (state === void 0) {
        console.warn(`No state backup found for key ${stateKey(key, el)}`);
      } else {
        const value = state[attr];
        if (value !== null) {
          attr === CLASS_ATTR ? el.className = value : el.setAttribute(attr, value);
        }
      }
    }
    function setDynamicAttributes(el, replacements) {
      for (const [dynKey, dynTempl] of Object.entries(el.dataset).filter(([key, _]) => key.startsWith("dynamic"))) {
        const attr = camelToKebabCase(dynKey.substring("dynamic".length));
        if (dynTempl === void 0) {
          return;
        }
        if (Object.keys(replacements).some((replacement) => dynTempl == null ? void 0 : dynTempl.includes(`{${replacement}}`))) {
          const newValue = dynTempl == null ? void 0 : dynTempl.replace(/{(\w+)}/g, (placeholderWithDelimiters, placeholderWithoutDelimiters) => replacements.hasOwnProperty(placeholderWithoutDelimiters) ? replacements[placeholderWithoutDelimiters] : sessionStorage.getItem(stateKey("dyn-" + placeholderWithoutDelimiters, el)) || `[!value for ${placeholderWithDelimiters} not found!]`);
          el.setAttribute(attr, newValue);
        }
      }
    }
    function applyToElement(el, changes) {
      let replacements = {};
      changes.forEach(function(change) {
        const [action, attr_input, value] = change;
        const attr = ATTR[attr_input] || attr_input;
        if (action === "d") {
          replacements = __spreadValues({ [attr]: value }, replacements);
          sessionStorage.setItem(stateKey("dyn-" + attr, el), value);
          return;
        } else if (Object.keys(replacements).length > 0) {
          setDynamicAttributes(el, replacements);
          replacements = [];
        }
        if (attr === CLASS_ATTR) {
          switch (action) {
            case "s":
              el.className = value;
              break;
            case "a":
              el.classList.add(value);
              break;
            case "x":
              el.classList.remove(value);
              break;
            case "t":
              el.classList.toggle(value);
              break;
            case "b":
              backupState(el, attr_input, value);
              break;
            case "r":
              restoreState(el, attr, value);
              break;
            case "i":
              restoreState(el, attr, "orig");
              break;
            default:
              null;
          }
        } else {
          switch (action) {
            case "s":
              el.setAttribute(attr, value);
              break;
            case "x":
              el.removeAttribute(attr);
              break;
            case "b":
              backupState(el, attr_input, value);
              break;
            case "r":
              restoreState(el, attr, value);
              break;
            case "i":
              restoreState(el, attr, "orig");
              break;
            default:
              null;
          }
        }
      });
      if (Object.keys(replacements).length > 0) {
        setDynamicAttributes(el, replacements);
      }
    }
    ;
    function main(event) {
      const detail = event.detail;
      for (const [query_input, changes_input] of detail.c.reverse()) {
        const query = QUERY[query_input] || query_input;
        const elements = document.querySelectorAll(query);
        const changes = changes_input.reverse();
        elements.forEach((el) => {
          const tel = el;
          if (!tel.dataset["id"]) {
            tel.dataset["id"] = randId();
          }
          if (!isStateBackupped(tel, ALL_ATTR, "orig")) {
            backupState(tel, ALL_ATTR, "orig");
          }
          applyToElement(tel, changes);
        });
      }
    }
    PhxLiveHead2.main = main;
  })(PhxLiveHead || (PhxLiveHead = {}));
  Object.keys(sessionStorage).forEach((key) => key.startsWith(PhxLiveHead.NAMESPACE) && sessionStorage.removeItem(key));
  window.addEventListener("phx:hd", (event) => {
    PhxLiveHead.main(event);
  });
})();
