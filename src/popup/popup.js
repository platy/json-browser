
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
  for (var i = schema_list.length - 1; i >= 0; i--) {
    addSchemaToList(schema_list[i]);
  }
  var my_schemas = items.my_schemas;
  for (var schema in my_schemas) {
    addSchemaToList(schema);
  }
}

function addSchemaToList(schema) {
  var list_node = document.getElementById("schema-list");
  var li = document.createElement('li');
  var shortenedName = schema.length > 30 ? '...'+schema.slice(-30) : schema;
  li.innerHTML = '<a href="#" data-link="'+schema+'"><dl><dt>'+shortenedName+'</dt><dd>'+schema+'</dd></dl></a>';
  li.children[0].addEventListener('click', onSchemaClick);
  list_node.appendChild(li);
}

function onSchemaClick() {
  var schema = this.getAttribute('data-link');
  window.onSchemaSelect(schema);
}
