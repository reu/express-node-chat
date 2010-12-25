jQuery(function($){
  function longPool(response) {
    var room = $('#room');

    if (response) {
      room.append(response);
    }

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
});
