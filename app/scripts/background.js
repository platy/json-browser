// Whether Accept request header should be set to json
var acceptJson = false;

function parseHeader(headerString) {
  var headerParts = headerString.split(";");
  var header = {body: headerParts[0]};
  var i;
  for (i = headerParts.length - 1; i >= 1; i--) {
    var kv = headerParts[i].split("=");
    header[kv[0].trim()] = kv.slice(1).join('=');
  }
  return header;
}

function getHeader(headers, headerName) {
  var headerArray = []
  var i;
  for (i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() === headerName.toLowerCase()) {
      headerArray.push(parseHeader(headers[i].value));
    }
  }
  return headerArray;
}

function schemaDescriptionForResponse(details) {
  var contentTypeHeader = getHeader(details.responseHeaders, "content-type")[0];
  var links = getHeader(details.responseHeaders, "link");
  var profile;
  var schema = {"$ref": profile, "links": []};
  for (var link in links) {
    schema["links"].push(
      {
        rel: links[link].rel.replace(/"([\s\S]*)"/, "$1"),
        href: links[link].body.replace(/<([\s\S]*)>/, "$1")
      });
  }
  if (contentTypeHeader.profile) {
    profile = contentTypeHeader.profile;

    if (profile[0] === '"' && profile[profile.length - 1] === '"') {
      profile = profile.substr(1, profile.length - 2).replace(/\\(.)/g, function(a, b) {
        return b;
      });
    }

    schema["$ref"] = profile;
  }
  return schema;
}

function onJsonPage(details, retry) {
  var schemaDesc = schemaDescriptionForResponse(details);
  console.log(details.tabId + " - JSON with schema : " + schemaDesc["$ref"]);
  chrome.tabs.sendMessage(
    details.tabId,
    {"schema": schemaDesc},
    function (response) {
      if (response === undefined) {
        console.error("Message failed - " + chrome.runtime.lastError.message + " - " + retry + " retries remaining.");
        if (retry > 0) {
          onJsonPage(details, retry - 1);
        }
      } else {
        console.log("Content script instructed to reload with schema");
      }
    }
  );
}

function contentTypeIsJson(contentTypeHeader) {
  if (contentTypeHeader === undefined) {
    console.error("contentTypeHeader undefined");
    return false;
  }
  return contentTypeHeader.body === "application/json";
}

// Check for json in response to load schema from headers
function onCompleted(details) {
  var headers = details.responseHeaders;
  var contentTypeHeader = getHeader(headers, "content-type")[0];
  if (contentTypeIsJson(contentTypeHeader)) {
    onJsonPage(details, 1);
  } else {
    console.log(details.tabId + " - Not JSON");
  }
}

// Set Accept header
function onBeforeSendHeaders(details) {
  if (acceptJson) {
    var headers = details.requestHeaders;
    for (var i = headers.length - 1; i >= 0; i--)
      if(headers[i].name === "Accept")
        headers[i].value = "application/json";
    return {requestHeaders: headers};
  }
}

var filter = {
  urls: ["<all_urls>"],
  types: ["main_frame"]
};

chrome.webRequest.onBeforeSendHeaders.addListener(
  onBeforeSendHeaders,
  filter,
  ["requestHeaders", "blocking"]
);

chrome.webRequest.onCompleted.addListener(
  onCompleted,
  filter,
  ["responseHeaders"]
);

chrome.browserAction.onClicked.addListener(
  function(tab) {
    acceptJson = !acceptJson;
    if (acceptJson)
      chrome.browserAction.setBadgeText({text:'json'});
    else
      chrome.browserAction.setBadgeText({text:''});
  }
);

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    chrome.pageAction.show(sender.tab.id);
    sendResponse();
  }
);
