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

    JsonBrowser.data.addSchema(schema);
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
	window.location = itemUrl;
}

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
    Jsonary.addLinkHandler(function(link, data, request) {
      navigateTo(link.href);
      return true;
    });
    JsonBrowser.data = Jsonary.create(JSON.parse(singleton.innerText)).readOnlyCopy();
    Jsonary.render(singleton, JsonBrowser.data);
    addJsonCss();
    renderSchema();
  }
}

window.onload = initialiseJSONBrowser;

chrome.runtime.onMessage.addListener(onMessage);
