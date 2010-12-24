var express = require('express'),
    app     = express.createServer(
      express.cookieDecoder(),
      express.session(),
      express.bodyDecoder(),
      express.methodOverride()
    );

app.set('views', __dirname + '/views');
app.set('view engine', 'jade');

Room = function(){
  this.id       = new Date().getTime(),
  this.name     = "",
  this.messages = [],
  this.users    = [],

  appendMessage = function(message) {
    messages.push(message);
  }

  query = function(since, callback) {
    var pendingMessages = [];
    for(var key in messages) {
      var message = messages[key];

      if (message.sent_at > since) {
        pendingMessages.push(message)
      }
    }

    if (pendingMessages > 0) {
      callback(pendingMessages);
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
  this.sent_at = new Date().getTime()
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

app.listen(3000);
