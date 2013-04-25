function parseHeader(headerString) {
  var headerParts = headerString.split(";");
  var header = {body: headerParts[0]};
  var i;
  for (i = headerParts.length - 1; i >= 1; i--) {
    var kv = headerParts[i].split("=");
    header[kv[0].trim()] = kv[1];
  }
  return header;
}

function getHeader(headers, headerName) {
  var i;
  for (i = 0; i < headers.length; i++) {
    if (headers[i].name.toLowerCase() === headerName.toLowerCase()) {
      return parseHeader(headers[i].value);
    }
  }
}

function schemaDescriptionForResponse(details) {
  var contentTypeHeader = getHeader(details.responseHeaders, "content-type");
  var link = getHeader(details.responseHeaders, "link");
  var profile;
  if (link && link.rel === "describedby") {
    profile = link.body.replace(/<([\s\S]*)>/, "$1");
  } else {
    profile = contentTypeHeader.profile;
  }
  return {schemaUrl: profile};
}

function onJsonPage(details, retry) {
  var schemaUrl = schemaDescriptionForResponse(details);
  console.log(details.tabId + " - JSON with schema : " + schemaUrl.schemaUrl);
  chrome.tabs.sendMessage(
    details.tabId,
    schemaUrl,
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

function onCompleted(details) {
  var headers = details.responseHeaders;
  var contentTypeHeader = getHeader(headers, "content-type");
  if (contentTypeIsJson(contentTypeHeader)) {
    onJsonPage(details, 1);
  } else {
    console.log(details.tabId + " - Not JSON");
  }
}

var filter = {
  urls: ["<all_urls>"],
  types: ["main_frame"]
};

chrome.webRequest.onCompleted.addListener(
  onCompleted,
  filter,
  ["responseHeaders"]
);

chrome.runtime.onMessage.addListener(
  function (request, sender, sendResponse) {
    chrome.pageAction.show(sender.tab.id);
    sendResponse();
  }
);
