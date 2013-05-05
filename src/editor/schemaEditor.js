var my_schemas;

function SchemaEditor(node, json) {
  this.node = node;
  this.data = Jsonary.create(json);
  this.data.addSchema("http://json-schema.org/hyper-schema");
  Jsonary.render(node.getElementsByClassName("schema_section")[0], this.data);
  var saveButton = this.node.getElementsByClassName('save')[0];
  node.getElementsByClassName('title')[0].innerHTML = this.title();
  saveButton.addEventListener('click', this.save);
  saveButton.editor = this;
}

SchemaEditor.prototype.value = function () {
  return this.data.value();
};

SchemaEditor.prototype.title = function () {
  return this.value().title;
};

SchemaEditor.prototype.show_status = function (message) {
  // Update status to let user know options were saved.
  var status = this.node.getElementsByClassName("status")[0];
  status.innerHTML = message;
  setTimeout(function () {
    status.innerHTML = "";
  }, 2000);
};

SchemaEditor.prototype.save = function () {
  SchemaEditor.saveFunction(this.editor, function (editor) {
    editor.show_status("Saved");
  });
};


// Saves options to localStorage.
SchemaEditor.saveFunction = function (editor, callback) {
  if (!my_schemas.hasOwnProperty(editor.title())) {
    addSchemaToList(editor.title(), editor.node);
  }
  my_schemas[editor.title()] = editor.value();
  chrome.storage.sync.set({"my_schemas" : my_schemas}, function () {
    callback(editor);
  });
};

function new_schema() {
  new SchemaEditor(document.getElementById("editor"), {});
  clearSelectedMenuOptions();
  clearChildClasses(document.getElementsByClassName("mainview")[0], 'div');
  document.getElementById("editor").setAttribute('class', 'selected');
}

function onSchemaSelect() {
  clearChildClasses(document.getElementsByClassName("mainview")[0], 'div');
  var schema_title = this.getAttribute('data-link');
  clearSelectedMenuOptions();
  this.parentElement.setAttribute('class', 'selected');
  this.parentElement.editorNode.setAttribute('class', 'selected');
}

function addSchemaToList(schema, editorNode) {
  var list_node = document.getElementById("my_schemas");
  var li = document.createElement('li');
  li.innerHTML = '<a href="#" data-link="'+schema+'">'+schema+'</a>';
  li.children[0].addEventListener('click', onSchemaSelect);
  li.editorNode = editorNode;
  list_node.appendChild(li);
}

function clearSelectedMenuOptions() {
  var list_node = document.getElementsByClassName("navigation")[0];
  clearChildClasses(list_node, 'li');
}

function clearChildClasses(node, tagName) {
  var deselectLis = node.getElementsByTagName(tagName);
  for (var i = deselectLis.length - 1; i >= 0; i--) {
    if (deselectLis[i].getAttribute('class') === "selected")
      deselectLis[i].setAttribute('class', '');
  };
}

// Restores state to saved value from localStorage.
function restore_options() {
  chrome.storage.sync.get({"my_schemas" : {}}, function (items){
  if (chrome.runtime.lastError) {
    alert("Error : " + chrome.runtime.lastError);
    return;
  }
  my_schemas = items.my_schemas;
  if (!my_schemas) {
    return;
  }
  var view = document.getElementsByClassName("mainview")[0];
  var schemaTemplate = document.getElementById("editor").innerHTML;
  for (id in my_schemas) {
      if (my_schemas.hasOwnProperty(id)) {
        var node = document.createElement("div");
        node.innerHTML = schemaTemplate;
        new SchemaEditor(node, my_schemas[id]);
        view.appendChild(node);
        addSchemaToList(id, node);
      }
  }
});
}


document.addEventListener('DOMContentLoaded', restore_options);
document.querySelector('#new').addEventListener('click', new_schema);
