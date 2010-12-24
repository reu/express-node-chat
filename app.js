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
  id       = null,
  name     = "",
  messages = [],
  users    = []
}

var rooms = [];

var indexHandler = function(req, res){
 res.render('rooms/index', { locals: { rooms: rooms } });
};
 
// Index
app.get('/',      indexHandler);
app.get('/rooms', indexHandler);

// New
app.get('/rooms/new', function(req, res){
  res.render('rooms/new');
});

// Create
app.post('/rooms', function(req, res){
  var room  = new Room();
  room.id   = new Date().getTime();
  room.name = req.body.room.name;

  rooms[room.id] = room;

  res.redirect('/rooms/' + room.id);
});

// Show
app.get('/rooms/:id', function(req, res){
  var room = rooms[req.params.id];

  if (room) {
    res.render('rooms/room', { locals: { room: room } });
  } else {
    res.send('Oops... room not found =/', 404);
  } 
});

app.listen(3000);
