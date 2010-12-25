var express = require('express'),
    app     = express.createServer(
      express.cookieDecoder(),
      express.session(),
      express.bodyDecoder(),
      express.methodOverride()
    );

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

app.configure(function(){
  app.use(express.staticProvider(__dirname + '/public'));
});

Room = function(){
  this.id        = new Date().getTime(),
  this.name      = null,
  this.messages  = [],
  this.callbacks = [],
  this.users     = [],

  this.appendMessage = function(message) {
    console.log('Appending message ' + message.toString());
    this.messages.push(message);

    while (this.callbacks.length > 0) {
      console.log('Calling callback for ' + message.toString());
      this.callbacks.shift()([message]);
    }

    while (this.messages.length > 200) {
      this.messages.shift();
    }
  },

  this.query = function(since, callback) {
    var pendingMessages = [];
    for(var key in this.messages) {
      var message = this.messages[key];

      console.log('Checking ' + message.toString() + ' to ' + new Date(since));

      if (message.sent_at > since) {
        console.log('Adding ' + message.toString() + ' to pending message list')
        pendingMessages.push(message)
      }
    }

    if (pendingMessages > 0) {
      callback(pendingMessages);
    } else { 
      this.callbacks.push(callback);
    }
  }
}

Room.createByName = function(name) {
  var room = new Room();
  room.name = name;
  return room;
}

Message = function(from, text){
  this.from = from,
  this.text = text,
  this.to   = null,
  this.type = 'message',
  this.sent_at = new Date().getTime(),

  this.toString = function() {
    return this.nick + ' ' + new Date(this.sent_at) + ': ' + this.text;
  }
}

var rooms = [];

var indexHandler = function(req, res){
  res.render('rooms/index', { locals: { rooms: rooms } });
};

var filters = {
  getRoom: function(req, res, next){
    var room = rooms[req.params.room_id];

    if (room) {
      req.room = room;
      next();
    } else {
      res.send('Oops... room not found =/', 404);
    }
  }
}

// Index
app.get('/',      indexHandler);
app.get('/rooms', indexHandler);

// New
app.get('/rooms/new', function(req, res){
  res.render('rooms/new');
});

// Create
app.post('/rooms', function(req, res){
  room = Room.createByName(req.body.room.name);
  rooms[room.id] = room;

  res.redirect('/rooms/' + room.id);
});

// Show
app.get('/rooms/:room_id', filters.getRoom, function(req, res){
  res.render('rooms/room', { locals: { room: req.room } });
});

// Messages
// List
app.get('/rooms/:room_id/messages', filters.getRoom, function(req, res){
  req.room.query(new Date().getTime(), function(messages){
    res.send(res.partial('message', messages));
    res.end();
  });
});

app.post('/rooms/:room_id/messages', filters.getRoom, function(req, res){
  var message = new Message('teste', req.body.message.text);
  req.room.appendMessage(message);
  res.end();
});

app.listen(3000);
