// Evernote backbone script
(function($){

  Backbone.sync = function(method, model, success, error){
  	switch (method) {
  		case "update":
	  		localStorage.setItem(model.id, JSON.stringify(model.attributes))
	  		break;

  		case "read":
	  		$.each(localStorage, function (key, value){
	  			/^[0-9]{4}-[0-9]{4}$/.test(key) && model.add(JSON.parse(value));
	  		})
	  		break;

  		default:
  			console.log(method, model)
  			break;
  	}
  	can_exit = true
    //success();
  }

  var NoteItem = Backbone.Model.extend({
    defaults: {
    	id: null,
      title: 'Untitled',
      content: 'Empty note',
      updated_at: null,
      created_at: null,
    },

    initialize: function() {
    	_.bindAll(this, 'getDescription')
    },

    getDescription: function() {
    	html = this.get('content').replace(/(<\/div>|<br>|[\n\r])/gi, " "),
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
    	var age = (((new Date).getTime() - this.model.get('created_at')) <= (6 * 60 * 60 * 1000))?moment(this.model.get('created_at')).fromNow():moment(this.model.get('created_at')).calendar();
    	$(this.el).addClass("document-item")
    	$(this.el).html("<span class=u-pull-right style='font-size: 11px;color: rgba(255,255,255,0.9);'>"+ age +"</span>")
      $(this.el).append("<strong class=document-item-title>"+ (this.model.get('title')?this.model.get('title'):"Untitled Note") +"</strong>")
      $(this.el).append("<p class=document-item-content>"+ (this.model.getDescription()?this.model.getDescription():"<em>Empty note</em>") +"</p>")
      
      return this
    },

    unrender: function() {
    	localStorage.removeItem(this.model.get('id'))
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
      _.bindAll(this, 'render', 'appendItem', 'addItem', 'removeItem')

      this.vent = options.vent
      this.vent.bind("deleteNote", this.removeItem)

      this.collection.bind('add', this.appendItem)

      this.render()

      this.addItem({title:'Welcome to Evernote', content:'Hello dude, this guide is for you!'})
      this.addItem({title:'Saving documents in your account', content:'In Evernote you are able to store pdf\'s, images, microsoft documents, and much more!'})

      this.collection.fetch()

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
      note['updated_at'] = (new Date).getTime()
      note['created_at'] = (new Date).getTime()
      var noteItem = new NoteItem();
      noteItem.set(note)
      this.collection.add(noteItem);
      return noteItem
    },

    removeItem: function(id){
    	this.collection.remove(id);
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
    	"click .delete": "deleteNote"
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
      $(this.el).find(".document-editor-status").html('New document')
      $(this.el).find(".document-editor-title").val('')
			$(this.el).find(".document-editor-content").html('')
		},

		deleteNote: function() {
			this.vent.trigger("deleteNote", this.id)
			this.reset()
		},

		load: function(item) {
			this.id = item.get('id')
      $(this.el).find(".document-editor-title").val(item.get('title'))
      $(this.el).find(".document-editor-status").html("Updated "+moment(item.get('updated_at')).fromNow())
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
			item.set({updated_at: (new Date).getTime()})
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