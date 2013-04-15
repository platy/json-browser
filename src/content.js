function serialiseJsonaryData(data, previousState) {
  var schemaUrls = (previousState && previousState.schemas) ? previousState.schemas.slice(0) : [];
  data.schemas().each(function (index, schema) {
    var schemaUri = schema.referenceUrl();
    console.log("Saving schema: " + schema.referenceUrl());
    if (schemaUrls.indexOf(schemaUri) == -1) {
      schemaUrls.push(schemaUri);
    }
  });
  return {
    json: data.json(),
    uri: data.referenceUrl(),
    schemas: schemaUrls
  }
}

var schemaKey = "JSON Browser";

function deserialiseJsonaryData(state) {
  var data = Jsonary.create(JSON.parse(state.json), state.uri, true);
  for (var i = 0; i < state.schemas.length; i++) {
    var schemaUri = state.schemas[i];
    if (schemaUri) {
      console.log("Adding schema: " + schemaUri);
      data.addSchema(schemaUri, schemaKey);
    }
  }
  return data;
}

var JsonBrowser = {};

function onMessage(request, sender, sendResponse) {
  JsonBrowser.schema = request.schemaUrl;
  renderSchema();
}

function renderSchema() {
  var data = JsonBrowser.data;
  var schema = JsonBrowser.schema;
  if (data != undefined && schema != undefined) {
    console.log("Reloading with schema " + schema);

    JsonBrowser.data.addSchema(schema, schemaKey);
    history.replaceState(serialiseJsonaryData(JsonBrowser.data, history.state), "", window.location.toString());
  }
}

function addJsonCss() {
  var head = document.getElementsByTagName("head")[0];
  addCss(head, "renderers/common.css");
  addCss(head, "renderers/basic.jsonary.css");
}

function addCss(element, path) {
  var styleLink = document.createElement("link");
  styleLink.setAttribute("rel", "stylesheet");
  styleLink.setAttribute("type", "text/css");
  styleLink.setAttribute("href", chrome.extension.getURL(path));
  element.appendChild(styleLink);
}

function navigateTo(itemUrl, request) {
  if (request != undefined) {
    var singleton = document.body.childNodes[0];
    singleton.innerHTML = "Loading...";
    history.replaceState(serialiseJsonaryData(JsonBrowser.data, history.state), "", window.location.toString());
    request.getRawResponse(function (data) {
      JsonBrowser.data = data;
      Jsonary.render(singleton, JsonBrowser.data);
      history.pushState(serialiseJsonaryData(JsonBrowser.data), "", itemUrl);
    });
  } else {
    window.location = itemUrl;
  }
}

window.onpopstate = function () {
  if (history.state.json) {
    console.log("Loading from saved state");
    console.log(history.state);
    var singleton = document.body.childNodes[0];
    JsonBrowser.data = deserialiseJsonaryData(history.state);
    Jsonary.render(singleton, JsonBrowser.data);
  }
};

function looksLikeJson(json) {
  return json.match(/^.*[{["]/) != null;
}

function isUnitialisedJson(element) {
  return element.nodeName == "PRE"
      && element.children.length == 0
      && looksLikeJson(element.innerText);
}

function initialiseJSONBrowser() {
  var singleton = document.body.childNodes[0];
  if (isUnitialisedJson(singleton)) {
    Jsonary.addLinkPreHandler(function(link, submissionData) {
      if (link.method != "GET") {
        return;
      }
      var href = link.href;
      if (submissionData.defined()) {
        if (href.indexOf("?") == -1) {
          href += "?";
        } else {
          href += "&";
        }
         href += Jsonary.encodeData(submissionData.value());
      }
      navigateTo(href);
      return false;
    });
    Jsonary.addLinkHandler(function(link, data, request) {
      navigateTo(link.href, request);
      return true;
    });
    var baseUri = window.location.toString();
    var json = JSON.parse(singleton.innerText);
    JsonBrowser.data = Jsonary.create(json, baseUri)
      .readOnlyCopy();
    Jsonary.render(singleton, JsonBrowser.data);
    history.replaceState(serialiseJsonaryData(JsonBrowser.data, history.state), "", window.location.toString());
    addJsonCss();
    renderSchema();
  }
}

window.onload = initialiseJSONBrowser;

chrome.runtime.onMessage.addListener(onMessage);
