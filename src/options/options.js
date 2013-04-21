// Saves options to localStorage.
function save_options() {
  var text_area = document.getElementById("schemas");
  var schemas = text_area.value.split("\n");
  chrome.storage.sync.set({"schema_list" : schemas}, function(){
    show_status("Options saved");
  });
}

// Restores state to saved value from localStorage.
function restore_options() {
  chrome.storage.sync.get({"schema_list" : ""}, function (items){
    if (chrome.runtime.lastError) {
      show_status("Error : " + chrome.runtime.lastError);
      return;
    }
    var schema_list = items.schema_list;
    if (!schema_list) {
      return;
    }
    var text_area = document.getElementById("schemas");
    text_area.value = schema_list.join("\n");
  });
}

function show_status(message) {
  // Update status to let user know options were saved.
  var status = document.getElementById("status");
  status.innerHTML = message;
  setTimeout(function() {
    status.innerHTML = "";
  }, 750);
}

document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#save').addEventListener('click', save_options);