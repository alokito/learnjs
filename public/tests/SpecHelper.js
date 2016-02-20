(function(){
  var fixture;

  function loadFixture(path) {
    var html;
    jQuery.ajax({
      url: '/index.html',
      success: function(result) {
        html = result;
      },
      async: false
    });
    return $.parseHTML(html);
  }
  var index = $('<div>').append(loadFixture('/index.html'));

  function resetFixture() {
    if (!fixture) {
      var markup = index.find('div.markup');
      fixture = $('<div class="fixture" style="display: none">').append(markup);
      $('body').append(fixture.clone());
    } else {
      $('.fixture').replaceWith(fixture.clone());
    }
  }

  beforeEach(function () {
    resetFixture();
  });
  $(function(){
    $('body').append(index.find('div.templates').clone());
  });
})();
