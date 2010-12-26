jQuery(function($){
  $('form').submit(function(e){
    this.action = '/rooms/' + $('#room_id').val() + '/join';
  });
});
