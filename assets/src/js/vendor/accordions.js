jQuery(document).ready(function ($) {
  $('.accordions').each(function () {
    var $this = $(this);
    $this.addClass('active');
  });
  function accordionTitles() {
    var r = $.Deferred();
    var titleCount = 0;
    $('.accordions .accordion-title').each(function () {
      titleCount++;
      var $this = $(this);
      var id = 'accordion-' + titleCount;
      if ($this.hasClass('open')) {
        $this.addClass('is-active');
        if ($this.is('div')) {
          $('h2', $this).wrapInner('<button onclick="return false;" aria-expanded="true" aria-controls="' + id + '">');
        } else {
          $this.wrapInner('<button onclick="return false;" aria-expanded="true" aria-controls="' + id + '">');
        }
      } else {
        if ($this.is('div')) {
          $('h2', $this).wrapInner('<button onclick="return false;" aria-expanded="false" aria-controls="' + id + '">');
        } else {
          $this.wrapInner('<button onclick="return false;" aria-expanded="false" aria-controls="' + id + '">');
        }
      }
    });
    return r;
  }
  function accordionContent() {
    var r = $.Deferred();
    var contentCount = 0;
    $('.accordions .accordion-content').each(function () {
      contentCount++;
      var $this = $(this);
      var id = 'accordion-' + contentCount;
      if ($('.accordion-title#' + id).hasClass('open')) {
        $this.attr('id', id).attr('aria-hidden', 'false');
      } else {
        $this.attr('id', id).attr('aria-hidden', 'true');
      }
    });
    return r;
  }
  function accordionButtons() {
    $('.accordions .accordion-title button').on('click', function (e) {
      e.preventDefault();
      var id = $(this).attr('aria-controls');
      var state = $(this).attr('aria-expanded') === 'false' ? true : false;
      var panel = $('.accordion-content#' + id);
      $(this).attr('aria-expanded', state);
      $(this).parents('.accordion-title').toggleClass('is-active');
      panel.attr('aria-hidden', !state);
    });
  }
  accordionTitles().done(accordionContent().done(accordionButtons()));
});