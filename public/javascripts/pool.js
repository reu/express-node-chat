jQuery(function($){
  function longPool(response) {
    var room = $('#room');

    appendMessage(response);

    $.ajax({ 
      cache: false,
      type: 'GET',
      url: '/rooms/' + room.data('room-id') + '/messages',
      dataType : 'html',
      data: { since: $('.message:last', room).data('time') || 1 },
      error: function() {
        setTimeout(longPool, 10 * 1000);
      },
      success: function(data) {
        longPool(data);
      }
    });
  }

  longPool();

  $('form').submit(function(e){
    e.preventDefault();
    $.post(this.action, $(this).serialize(), appendMessage, 'html');
    $('#message_text').val('');
  });

  function appendMessage(message) {
    $('#room').append(message);
  }
});
