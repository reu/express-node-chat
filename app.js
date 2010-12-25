var express = require('express'),
    app     = express.createServer(
      express.staticProvider(__dirname + '/public'),
      express.cookieDecoder(),
      express.session(),
      express.bodyDecoder(),
      express.logger({ format: ':method :url :status in :response-timems' }),
      express.methodOverride()
    );

app.set('view engine', 'jade');

Room = function(){
  this.id        = new Date().getTime(),
  this.name      = null,
  this.messages  = [],
  this.callbacks = [],
  this.users     = [],

  this.maximum_messages = 200,

  this.appendMessage = function(message) {
    this.messages.push(message);

    while (this.callbacks.length > 0) {
      this.callbacks.shift()([message]);
    }

    this.flushMessages();
  },

  this.query = function(since, callback) {
    var pendingMessages = [];
    for(var key in this.messages) {
      var message = this.messages[key];

      if (message.sent_at > since)
        pendingMessages.push(message);
    }

    if (pendingMessages.length > 0) {
      callback(pendingMessages);
    } else {
      this.callbacks.push(callback);
    }
  },

  this.flushMessages = function() {
    while (this.messages.length > this.maximum_messages)
      this.messages.shift();
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

var room = Room.createByName('General room');
room.id = 1;
rooms[1] = room;

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
  req.room.query(parseInt(req.query.since), function(messages){
    res.send(res.partial('message', messages));
    res.end();
  });
});

app.post('/rooms/:room_id/messages', filters.getRoom, function(req, res){
  var message = new Message('teste', req.body.message.text);
  req.room.appendMessage(message);
  res.writeHead(200);
  res.end();
});

app.listen(3000);
