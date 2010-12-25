jQuery(function($){
  var maximumRetries = 3,
      retries = 0;

  function longPool() {
    var room = $('#room');

    $.ajax({ 
      cache: false,
      type: 'GET',
      url: '/rooms/' + room.data('room-id') + '/messages',
      dataType : 'html',
      data: { since: $('.message:last', room).data('time') || 1 },
      error: function() {
        if(++retries >= maximumRetries) {
          // If we are getting repeating errors, we kick the user out of the room
          window.location = '/';
        } else {
          // Ok, let's wait 10 seconds and try again
          setTimeout(longPool, 10 * 1000);
        }
      },
      success: function(data) {
        appendMessage(data);

        // Start pooling again
        longPool(data);
      }
    });
  }

  // We start pooling as soon as the user enters the room
  longPool();

  $('form').submit(function(e){
    e.preventDefault();
    $.post(this.action, $(this).serialize(), null, 'html');
    $('#message_text').val('');
  });

  function appendMessage(message) {
    $('#room').append(message);
  }
});
