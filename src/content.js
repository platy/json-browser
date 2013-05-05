var chrome, window, document, history, Jsonary;  // Gets rid of jslint errors

var schemaKey = "JSON Browser";
var ignoreState = true;
var JsonBrowser = {};

function serialiseJsonaryData(data, previousState) {
  var schemaUrls = (previousState && previousState.schemas) ? previousState.schemas.slice(0) : [];
  data.schemas().each(function (index, schema) {
    var schemaUri = schema.referenceUrl();
    console.log("Saving schema: " + schema.referenceUrl());
    if (schemaUrls.indexOf(schemaUri) === -1) {
      schemaUrls.push(schemaUri);
    }
  });
  return {
    json: data.json(),
    uri: data.document.url,
    schemas: schemaUrls
  };
}

function deserialiseJsonaryData(state) {
  var i, data = Jsonary.create(JSON.parse(state.json), state.uri, true);
  for (i = 0; i < state.schemas.length; i++) {
    var schemaUri = state.schemas[i];
    if (schemaUri) {
      console.log("Adding schema: " + schemaUri);
      data.addSchema(schemaUri, schemaKey);
    }
  }
  return data;
}

function renderSchema() {
  var data = JsonBrowser.data;
  data.removeSchema(schemaKey);
  var schema = JsonBrowser.schema;
  if (data && schema && (!history.state || !history.state.json)) {
    console.log("Reloading with schema " + schema);

    if (history.state && history.state.json) {
      history.replaceState(serialiseJsonaryData(JsonBrowser.data, history.state), "", window.location.toString());
    }
    JsonBrowser.data.addSchema(schema, schemaKey);
  }
}

function addCss(element, path) {
  var styleLink = document.createElement("link");
  styleLink.setAttribute("rel", "stylesheet");
  styleLink.setAttribute("type", "text/css");
  styleLink.setAttribute("href", chrome.extension.getURL(path));
  element.appendChild(styleLink);
}

function addJsonCss() {
  var head = document.getElementsByTagName("head")[0];
  addCss(head, "renderers/common.css");
  addCss(head, "renderers/basic.jsonary.css");
  addCss(head, "style/browser.css");
  addCss(head, "style/chrome-bootstrap.css");
}

function navigateTo(itemUrl, request) {
  if (request !== undefined) {
    var node = document.body.childNodes[0];
    node.innerHTML = "Loading...";
    history.replaceState(serialiseJsonaryData(JsonBrowser.data, history.state), "", window.location.toString());
    request.getRawResponse(function (data) {
      console.log(data.referenceUrl());
      JsonBrowser.data = data;
      Jsonary.render(node, JsonBrowser.data);
      history.pushState(serialiseJsonaryData(JsonBrowser.data), "", itemUrl);
      data.whenSchemasStable(function () {
        // All the schemas have loaded, so save again to get the full schema list
        if (JsonBrowser.data === data) {
          history.replaceState(serialiseJsonaryData(JsonBrowser.data, history.state), "", itemUrl);
        }
      });
    });
  } else {
    window.location = itemUrl;
  }
}

function onpopstateHandler() {
  if (history.state && history.state.json) {
    if (ignoreState && history.state.uri) {
      ignoreState = false;
      if (window.location.toString() !== history.state.uri) {
        console.log([window.location.toString(), history.state.uri]);
        window.location.replace(history.state.uri);
      } else {
        history.replaceState({}, "", history.state.uri);
      }
      return;
    }
    console.log("Loading from saved state");
    console.log(history.state);
    var node = document.body.childNodes[0];
    JsonBrowser.data = deserialiseJsonaryData(history.state);
    Jsonary.render(node, JsonBrowser.data);
  }
}

function looksLikeJson(json) {
  return json.match(/^\s*[\{\["]/) !== null;
}

function isUnitialisedJson(element) {
  return element.nodeName === "PRE"
      && element.children.length === 0
      && looksLikeJson(element.innerText);
}

function initialiseJSON(node, json) {
  Jsonary.addLinkPreHandler(function (link, submissionData) {
    if (link.method !== "GET") {
      return;
    }
    var href = link.href;
    if (submissionData.defined()) {
      if (href.indexOf("?") === -1) {
        href += "?";
      } else {
        href += "&";
      }
      href += Jsonary.encodeData(submissionData.value());
    }
    navigateTo(href);
    return false;
  });
  Jsonary.addLinkHandler(function (link, data, request) {
    ignoreState = false;
    navigateTo(link.href, request);
    return true;
  });
  var baseUri = window.location.toString();
  JsonBrowser.data = Jsonary.create(json, baseUri, true);
  Jsonary.render(node, JsonBrowser.data);
  addJsonCss();
  renderSchema();
  if (history.state && history.state.json) {
    history.replaceState(serialiseJsonaryData(JsonBrowser.data, history.state), "", window.location.toString());
  }

  // Route all logging to the console
  Jsonary.setLogFunction(function (level, message) {
    if (level >= Jsonary.logLevel.WARNING) {
      console.log("Log level " + level + ": " + message);
    }
  });

  chrome.runtime.sendMessage({"show" : "page_icon"});
}

function openSelector() {
  var overlay = document.createElement("div");
  overlay.setAttribute("id", "overlay");
  overlay.setAttribute("class", "overlay");
  overlay.onclick = closeSelector;

  var selector = document.createElement("div");
  selector.setAttribute("id", "selector");
  selector.setAttribute("class", "sidebar page");
  selector.innerHTML = 
      '<h1>Personal schemas</h1>' +
      '<ul id="schema-list" class="highlightable">' +
      '</ul>' +
      '<section>Set up personal schemas on the extension options page.</section>';

  overlay.appendChild(selector);
  document.body.appendChild(overlay);

  chrome.storage.sync.get({"schema_list" : [], "my_schemas" : {}}, onOptionsLoaded);
}

function closeSelector() {
  document.body.removeChild(document.getElementById("overlay"));
  document.body.removeChild(document.getElementById("selector"));
}

function onloadHandler() {
  var node = document.body.childNodes[0];
  if (isUnitialisedJson(node)) {
    console.log("JSON found, initialising JsonBrowser");
    document.body.innerHTML = "";

    var browserButton = document.createElement("div");
    browserButton.setAttribute('class', 'selectorButton');
    browserButton.innerHTML = '<img src="' + chrome.extension.getURL("/logo/logo-19.png") + '"/>';
    browserButton.onclick = openSelector;
    document.body.appendChild(browserButton);

    var json = JSON.parse(node.innerText);
    var jsonary = document.createElement("div");
    document.body.appendChild(jsonary);
    jsonary.setAttribute('class', 'jsonary');
    initialiseJSON(jsonary, json);
  }
}

function onMessage(request, sender, sendResponse) {
  JsonBrowser.schema = request.schemaUrl;
  renderSchema();
}

function onSchemaSelect(schema) {
  JsonBrowser.schema = schema;
  renderSchema();
  closeSelector();
}

if (!window.onload && !window.onpopstate) {
  window.onpopstate = onpopstateHandler;
  window.onload = onloadHandler;
  chrome.runtime.onMessage.addListener(onMessage);
}
