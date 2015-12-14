// evernote.js

var Evernote = (function($){

  Backbone.sync = function (method, model, options) {
  //   console.log(" -- SYNC ["+method+"] --", model, ' options: ',options)
  }

  var NoteModel = Backbone.Model.extend({
    defaults: {
      id: null,
      title: 'Untitled',
      content: '',
      created_at: 0,
      updated_at: 0,
    },

    initialize: function() {
      _.bindAll(this, 'description')
    },

    description: function() {
        var tmp = document.createElement('DIV');
        tmp.innerHTML = this.get('content').replace(/(<\/div>|<br>|[\n\r])/gi, " ");
        return (tmp.textContent || tmp.innerText || "").slice(0,120);
    },

    sync: function(method, model, options) {
      console.log(" -- SYNC ["+method+"] --", model, ' options: ',options)
      switch (method) {
        case "update":
          localStorage.setItem(model.id, JSON.stringify(model.toJSON()))
          break;
        case "delete":
          localStorage.removeItem(model.id)
          break;
      }
    },

  })



  var NoteCollection = Backbone.Collection.extend({
     model: NoteModel,

    sync: function(method, model, options) {
      switch (method) {
        case "read":
          $.each(localStorage, function(key, val){
            /^[0-9]{4}-[0-9]{4}$/.test(key) && model.add(JSON.parse(val));
          });
          break;
      }
    },

  });



  var NoteView = Backbone.View.extend({
    tagName: 'div',

    events: {
      'click': 'loadInEditor'
    },

    initialize: function(options) {
      this.vent = options.vent
      _.bindAll(this, 'render', 'unrender', 'loadInEditor')

      this.model.bind('change', this.render)
      this.model.bind('remove', this.unrender)
    },

    render: function() {
      var age = (((new Date).getTime() - this.model.get('created_at')) <= (6 * 60 * 60 * 1000))?moment(this.model.get('created_at')).fromNow():moment(this.model.get('created_at')).calendar();
      $(this.el).addClass("document-item")
      $(this.el).html("<span class=u-pull-right style='font-size: 11px;color: rgba(255,255,255,0.9);'>"+ age +"</span>")
      $(this.el).append("<strong class=document-item-title>"+ (this.model.get('title')?this.model.get('title'):"Untitled Note") +"</strong>")
      $(this.el).append("<p class=document-item-content>"+ (this.model.get('content')?this.model.description():"<em>Empty note</em>") +"</p>")
      
      return this
    },

    unrender: function() {
      $(this.el).remove()
    },

    loadInEditor: function() {
      this.vent.trigger('NoteEditorViewLoad', this.model)
    }

  })



  var NoteListView = Backbone.View.extend({
    el: $('.document-navbar'),

    events: {
      'click .new-document': 'createNewNote'
    },

    initialize: function(options) {
      this.vent = options.vent
      _.bindAll(this, 'createItem', 'appendItem', 'removeItem', 'createNewNote')

      this.vent.bind('NoteListViewRemoveItem', this.removeItem)
      this.vent.bind('NoteListViewCreateNewNote', this.createItem)
      this.collection.bind('add', this.appendItem)

      this.createItem({title:'Welcome to Evernote', content:'Hello dude, this guide is for you!'})
      this.createItem({title:'Saving documents in your account', content:'In Evernote you are able to store pdf\'s, images, microsoft documents, and much more!'})

      this.collection.fetch()
    },

    generateRandomId: function() {
      return Math.ceil(Math.random()*(9999-1111)+1111)+ '-' +Math.ceil(Math.random()*(9999-1111)+1111)
    },

    createItem: function(data, NoteEditorSelf) {
      if (!data) return 0
      // Default `creation` values
      data['id'] = this.generateRandomId()
      data['updated_at'] = (new Date).getTime()
      data['created_at'] = (new Date).getTime()
      // Create new NoteModel & store it in collection
      var note = new NoteModel(data);
      this.collection.add(note);
      if (NoteEditorSelf)
        NoteEditorSelf.id = note.id
      // Return created model
      return note
    },

    appendItem: function(note) {
      var view = new NoteView({model: note, vent: this.vent})
      $(this.el).find('.document-item-container').prepend(view.render().el)
    },

    removeItem: function(id) {
      this.collection.find({id: id}).destroy()
    },

    createNewNote: function() {
      this.vent.trigger('NoteEditorViewClear', {})
    }

  })



  var NoteEditorView = Backbone.View.extend({
    el: $('.document-editor'),

    events: {
      'keyup .document-editor-title': 'eventSaveNote',
      'keyup .document-editor-content': 'eventSaveNote',
      'click .delete': 'deleteNote'
    },

    initialize: function(options) {
      this.vent = options.vent
      _.bindAll(this, 'get', 'load', 'clear', 'saveNote', 'eventSaveNote', 'deleteNote')

      this.vent.bind('NoteEditorViewLoad', this.load)
      this.vent.bind('NoteEditorViewClear', this.clear)
    },

    get: function() {
      return {
        title: $(this.el).find('.document-editor-title').val(),
        content: $(this.el).find('.document-editor-content').html()
      };
    },

    load: function(note) {
      this.id = note.get('id')
      
      $(this.el).find('.document-editor-title').val(note.get('title'))
      $(this.el).find('.document-editor-status').html('updated '+moment(note.get('updated_at')).fromNow())
      $(this.el).find('.document-editor-content').html(note.get('content'))
    },

    clear: function() {
      this.id = null

      $(this.el).find('.document-editor-status').html('new')
      $(this.el).find('.document-editor-title').val('')
      $(this.el).find('.document-editor-content').html('')
    },

    eventSaveNote: function(event) {
      if (!this.id)
      {
        this.vent.trigger('NoteListViewCreateNewNote', {}, this)
      }
      note = this.collection.find({id: this.id})
      this.saveNote(note)
    },

    saveNote: function(note) {
      note.set(this.get())
      note.set({updated_at: (new Date).getTime()})
      note.save()
      return note
    },

    deleteNote: function() {
      this.vent.trigger('NoteListViewRemoveItem', this.id)
      this.clear()
    },

  })



  var note = {}

  note['vent']       = _.extend({}, Backbone.Events)
  note['collection'] = new NoteCollection();
  note['list']       = new NoteListView({collection: note.collection, vent: note.vent});
  note['editor']     = new NoteEditorView({collection: note.collection, vent: note.vent});

  return note

})(jQuery);