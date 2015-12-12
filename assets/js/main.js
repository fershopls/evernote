// Evernote backbone script
(function($){

  Backbone.sync = function(method, model, success, error){
    success();
  }

  var NoteItem = Backbone.Model.extend({
    defaults: {
    	id: null,
      title: 'Untitled',
      content: 'Empty note'
    }
  });

  var Notes = Backbone.Collection.extend({
    model: NoteItem
  })

  var NoteItemView = Backbone.View.extend({
    tagName: 'div',

    events: {
      'click': 'select'
    },

    initialize: function() {
      _.bindAll(this, 'render', 'unrender', 'remove', 'select')

      this.model.bind('change', this.render)
      this.model.bind('remove', this.unrender)
    },

    render: function() {
    	$(this.el).addClass("document-item")
      $(this.el).html("<strong class=document-item-title>"+ this.model.get('title') +"</strong>")
      $(this.el).append("<p class=document-item-content>"+ this.model.get('content') +"</p>")
      
      return this
    },

    unrender: function() {
      $(this.el).remove()
    },

    remove: function() {
      this.model.destroy()
    },

    select: function() {
      console.log("Select ", this.model.get('id'))
      
      $('.document-editor').attr('data-id', this.model.get('id'))
      $('.document-editor').find(".document-editor-title").val(this.model.get('title'))
			$('.document-editor').find(".document-editor-content").html(this.model.get('content'))
    },
  });

  var NotesView = Backbone.View.extend({
    el: $(".document-item-container"),
    
    initialize: function() {
      _.bindAll(this, 'render', 'appendItem', 'addItem')

      this.collection = new Notes();
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
    },

    appendItem: function(item) {
      var noteView = new NoteItemView({
        model: item
      });

      $(this.el).prepend(noteView.render().el)
    },

  });

  var notesView = new NotesView();

})(jQuery)