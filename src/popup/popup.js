
function loadSchema(tabId, schema, retry) {
	chrome.tabs.sendMessage(tabId, {schemaUrl : schema},
		function(response) {
		  if (response === undefined) {
		    console.error("Message failed - " + chrome.runtime.lastError.message + " - " + retry + " retries remaining.");
		    if (retry > 0) {
		      loadSchema(tabId, schema, retry - 1);
		    }
		  } else {
		    console.log("Content script instructed to reload with schema");
		  }
		}
	);
}

function onOptionsLoaded(items){
  if (chrome.runtime.lastError) {
    pop_status("Error : " + chrome.runtime.lastError);
    return;
  }
  var schema_list = items.schema_list;
  if (!schema_list) {
    return;
  }
  for (var i = schema_list.length - 1; i >= 0; i--) {
    addSchemaToList(schema_list[i]);
  }
}

function addSchemaToList(schema) {
  var list_node = document.getElementById("schema-list");
  var li = document.createElement('li');
  li.innerHTML = '<a href="#" data-link="'+schema+'"><dl><dt>...'+schema.slice(-30)+'</dt><dd>'+schema+'</dd></dl></a>';
  li.children[0].addEventListener('click', onSchemaSelect);
  list_node.appendChild(li);
}

function onSchemaSelect() {
  var schema = this.getAttribute('data-link');
  chrome.tabs.query({active:true,currentWindow:true},function(tabs){
    loadSchema(tabs[0].id, schema, 1);
  });
}

chrome.storage.sync.get({"schema_list" : []}, onOptionsLoaded);
