// Evernote backbone script
(function($){

  Backbone.sync = function(method, model, success, error){
  	console.log("method: ", method)
  	console.log("model: ", model)
  	can_exit = true
    success();
  }

  var NoteItem = Backbone.Model.extend({
    defaults: {
    	id: null,
      title: 'Untitled',
      content: 'Empty note'
    },

    initialize: function() {
    	_.bindAll(this, 'getDescription')
    },

    getDescription: function() {
    	html = this.get('content').replace(/(<\/div>|<br>|[\n\r])/gi, " ")
		  var tmp = document.createElement("DIV");
		  tmp.innerHTML = html;
		  return (tmp.textContent || tmp.innerText || "").slice(0,100);
    },

  });

  var Notes = Backbone.Collection.extend({
    model: NoteItem
  })

  var NoteItemView = Backbone.View.extend({
    tagName: 'div',

    events: {
      'click': 'select'
    },

    initialize: function(options) {
      _.bindAll(this, 'render', 'unrender', 'remove', 'select')

      this.vent = options.vent

      this.model.bind('change', this.render)
      this.model.bind('remove', this.unrender)
    },

    render: function() {
    	$(this.el).addClass("document-item")
      $(this.el).html("<strong class=document-item-title>"+ (this.model.get('title')?this.model.get('title'):"Untitled Note") +"</strong>")
      $(this.el).append("<p class=document-item-content>"+ (this.model.getDescription()?this.model.getDescription():"<em>Empty note</em>") +"</p>")
      
      return this
    },

    unrender: function() {
      $(this.el).remove()
    },

    remove: function() {
      this.model.destroy()
    },

    select: function() {
      this.vent.trigger("loadInEditor", this.model)
    },
  });

  var NotesView = Backbone.View.extend({
    el: $(".document-navbar"),

    events: {
    	"click .new-document": "blankDocument"
    },
    
    initialize: function(options) {
      _.bindAll(this, 'render', 'appendItem', 'addItem')

      this.vent = options.vent

      this.collection.bind('add', this.appendItem)

      this.render()

      this.addItem({title:'Welcome to Evernote', content:'Hello dude, this guide is for you!'})
      this.addItem({title:'Saving documents in your account', content:'In Evernote you are able to store pdf\'s, images, microsoft documents, and much more!'})
    },

    render: function() {
      var self = this;
      _(this.collection.models).each(function(item){
        self.appendItem(item);
      }, this);
    },

    addItem: function(note){
      note = note?note:{};
      note['id'] = Math.ceil(Math.random()*(9999-1111)+1111)+ "-" +Math.ceil(Math.random()*(9999-1111)+1111)
      var noteItem = new NoteItem();
      noteItem.set(note)
      this.collection.add(noteItem);
      return noteItem
    },

    appendItem: function(item) {
	    var noteView = new NoteItemView({
  	    model: item,
  	    vent: this.vent
    	});

      $(this.el).find(".document-item-container").prepend(noteView.render().el)
    },

    blankDocument: function() {
    	this.vent.trigger("clearAllEditor",{})
    },

  });

	var EditorView = Backbone.View.extend({
		el: $(".document-editor"),

    events: {
    	"keyup .document-editor-content": "saveOnEnter",
    	"keyup .document-editor-title": "saveOnEnter",
    },

		initialize: function(options) {
			_.bindAll(this, 'load', 'save', 'reset')

			this.notesView = options.notesView

			this.vent = options.vent
			this.vent.bind("loadInEditor", this.load)
			this.vent.bind("clearAllEditor", this.reset)
		},

		reset: function() {
			this.id = null
      $(this.el).find(".document-editor-title").val('')
			$(this.el).find(".document-editor-content").html('')
		},

		load: function(item) {
			this.id = item.get('id')
      $(this.el).find(".document-editor-title").val(item.get('title'))
			$(this.el).find(".document-editor-content").html(item.get('content'))
		},

		get: function() {
			return {
				title: $(this.el).find(".document-editor-title").val(),
				content: $(this.el).find(".document-editor-content").html()
			};
		},

		saveOnEnter: function(event) {
			can_exit = false
			if (!this.id)
			{
				this.id = this.notesView.addItem(this.get()).id
			}
			model = this.collection.find({id: this.id})
			this.save(model)
		},

    save: function(item) {
			item.set(this.get())
			item.save()
    },
	})

	var vent = _.extend({}, Backbone.Events);
	var notesCollection = new Notes();
  var notesView = new NotesView({collection: notesCollection, vent: vent});
	var editorView = new EditorView({collection: notesCollection, notesView: notesView, vent: vent});

})(jQuery)

var can_exit = true;

function goodbye(e) {
	if (can_exit) return;
	e = e || window.event;
	e.cancelBubble = true;
	e.returnValue = 'You sure you want to leave? Some changes has not been saved.';
	if (e.stopPropagation){e.stopPropagation();e.preventDefault();}
}
window.onbeforeunload=goodbye;