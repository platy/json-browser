function schemaDescriptionForResponse(details) {
  var contentTypeHeader = getHeader(details.responseHeaders, "content-type")
  var profile = contentTypeHeader.split(";")[1].split("profile=")[1];
  return {schemaUrl: profile};
}

function onJsonPage(details, retry) {
  console.log("JSON page " + details.tabId);
  chrome.pageAction.show(details.tabId);
  chrome.tabs.sendMessage(details.tabId, 
      schemaDescriptionForResponse(details),
      function(response) {
        if (response === undefined) {
          console.error("Message failed - " + chrome.runtime.lastError.message + " - " + retry + " retries remaining.");
          if (retry > 0)
            onJsonPage(details, retry - 1);
        } else
          console.log("Content script instructed to reload with schema");
      }
    );
}

function onCompleted(details) {
  console.log("completed");
  var headers = details.responseHeaders;
  var contentTypeHeader = getHeader(headers, "content-type")
  if (contentTypeIsJson(contentTypeHeader))
    onJsonPage(details, 1);
}

function getHeader(headers, headerName) {
  for (var i=0; i<headers.length; i++)
    if (headers[i].name.toLowerCase()==headerName.toLowerCase())
      return headers[i].value;
  console.error("Header " + headerName + " not found");
}

function contentTypeIsJson(contentTypeHeader) {
  if (contentTypeHeader === undefined) {
    console.error("contentTypeHeader undefined");
    return false;
  }
  console.log("contentTypeIsJson - '" + contentTypeHeader + "'");
  return contentTypeHeader.split(";")[0].trim() === "application/json";
}

var filter = {
  urls: ["<all_urls>",
      "http://*/*",
      "https://*/*"],
  types: ["main_frame"]
};

chrome.webRequest.onCompleted.addListener(
    onCompleted, filter, ["responseHeaders"]);

