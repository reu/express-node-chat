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
    // Adds the message to the rooms messages collection
    this.messages.push(message);

    // Now we execute all the remaining callbacks. So, all the
    // users connected to the room will receive the update.
    while (this.callbacks.length > 0) 
      this.callbacks.shift()([message]);

    // Here we clean up old messages
    this.flushMessages();
  },

  this.query = function(since, callback) {
    // The users will constantly query the room for new messages.
    // The main point here is that different from the usual implementations, 
    // node doesn't "block" the process, so the users can remain
    // "connected" until the server respond to then.
    var pendingMessages = [];
    for(var key in this.messages) {
      var message = this.messages[key];

      if (message.sent_at > since)
        pendingMessages.push(message);
    }

    if (pendingMessages.length > 0) {
      // If the user didn`t receive some of the message, then we will
      // use the callback to render then
      callback(pendingMessages);
    } else {
      // Otherwise, we will add this to the room's callback collection,
      // and we are gonna call it when someone send a new message.
      this.callbacks.push(callback);
    }
  },

  this.flushMessages = function() {
    while (this.messages.length > this.maximum_messages)
      this.messages.shift();
  }
}

// Convinience stactic method, used as a room factory
Room.createByName = function(name) {
  var room = new Room();
  room.name = name;
  return room;
}

// The message class. Currently stored in memory.
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

User = function(nick){
  this.nick = nick
}

// Here we will store all our rooms
var rooms = [];

// Default room
var room = Room.createByName('General room');
room.id = 1;
rooms[1] = room;

// As both "/" and "/rooms" url shares the same behaviour, we needed
// to extract the function for then
var indexHandler = function(req, res){
  res.render('rooms/index', { locals: { rooms: rooms } });
};

// Helper filters to avoid duplication
var filters = {
  getRoom: function(req, res, next){
    var room = rooms[req.params.room_id];

    if (room) {
      req.room = room;
      next();
    } else {
      res.send('Oops... room not found =/', 404);
    }
  },

  getUser: function(req, res, next) {
    var user = req.room.users[req.sessionID];

    if (user) {
      req.user = user;
      next();
    } else {
      req.flash('error', 'You are not on this room.');
      res.redirect('home');
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

  res.redirect('home');
});

// Show
app.get('/rooms/:room_id', filters.getRoom, filters.getUser, function(req, res){
  res.render('rooms/room', { locals: { room: req.room } });
});

app.get('/rooms/:room_id/join', filters.getRoom, function(req, res){
  if (!req.room.users[req.sessionID])
    req.room.users[req.sessionID] = new User(req.query.user.nick);

  res.redirect('/rooms/' + req.room.id);
});

// Messages
// List
app.get('/rooms/:room_id/messages', filters.getRoom, function(req, res){
  req.room.query(parseInt(req.query.since), function(messages){
    res.send(res.partial('message', messages));
    res.end();
  });
});

app.post('/rooms/:room_id/messages', filters.getRoom, filters.getUser, function(req, res){
  var message = new Message(req.user.nick, req.body.message.text);
  req.room.appendMessage(message);
  res.writeHead(200);
  res.end();
});

app.listen(3000);
