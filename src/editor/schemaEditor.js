var my_schemas;

function SchemaEditor(node, json) {
  this.node = node;
  this.data = Jsonary.create(json);
  this.data.addSchema("http://json-schema.org/hyper-schema");
  Jsonary.render(node.getElementsByClassName("structure")[0], this.data);
  this.node.getElementsByClassName('title')[0].innerHTML = this.title();

  this.rawTextArea = node.getElementsByTagName('textarea')[0];
  this.rawTextArea.value = JSON.stringify(json, null, 2);
  this.value = SchemaEditor.prototype.rawValue;

  var saveButton = this.node.getElementsByClassName('save')[0];
  saveButton.addEventListener('click', this.save);
  saveButton.editor = this;
  var downloadButton = this.node.getElementsByClassName('download')[0];
  downloadButton.addEventListener('click', this.download);
  downloadButton.editor = this;
  var structureButton = this.node.getElementsByClassName('structure_button')[0];
  structureButton.addEventListener('click', this.showStructure);
  structureButton.editor = this;
  var rawButton = this.node.getElementsByClassName('raw_button')[0];
  rawButton.addEventListener('click', this.showRaw);
  rawButton.editor = this;
}

SchemaEditor.prototype.showStructure = function() {
  var editor = this.editor;
  editor.node.setAttribute('class', 'selected show_structure');
  editor.data.document.setRaw(editor.value());
  editor.value = SchemaEditor.prototype.structureValue;
}

SchemaEditor.prototype.showRaw = function() {
  var editor = this.editor;
  editor.node.setAttribute('class', 'selected');
  editor.rawTextArea.value = JSON.stringify(editor.value(), null, 2);
  editor.value = SchemaEditor.prototype.rawValue;
}

SchemaEditor.prototype.structureValue = function () {
  return this.data.value();
};

SchemaEditor.prototype.rawValue = function () {
  return JSON.parse(this.rawTextArea.value);
};

SchemaEditor.prototype.title = function () {
  return this.data.value().title;
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

SchemaEditor.prototype.download = function () {
  window.location.href = "data:application/octet-stream," + JSON.stringify(this.editor.value());
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
  var schema_title = this.parentElement.schemaId;
  clearSelectedMenuOptions();
  this.parentElement.setAttribute('class', 'selected');
  this.parentElement.editorNode.setAttribute('class', 'selected');
}

function onSchemaDelete() {
  var menuItem = this.parentElement;
  if (window.confirm("Delete schema '" + menuItem.schemaId + "'")) {
    my_schemas[menuItem.schemaId] = undefined;
    chrome.storage.sync.set({"my_schemas" : my_schemas}, function () {
      menuItem.parentElement.removeChild(menuItem);
    });
  }
}

function addSchemaToList(schema, editorNode) {
  var list_node = document.getElementById("my_schemas");
  var li = document.createElement('li');
  li.innerHTML = '<a href="#">'+schema+'</a><a class="delete">Delete</a>';
  li.children[0].addEventListener('click', onSchemaSelect);
  li.children[1].addEventListener('click', onSchemaDelete)
  li.schemaId = schema;
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
function restore_local_schemas() {
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


document.addEventListener('DOMContentLoaded', restore_local_schemas);
document.querySelector('#new').addEventListener('click', new_schema);
