jQuery(document).ready(function ($) {
  // hash focus onload
  if (document.location.hash) {
    var myAnchor = document.location.hash;
    $(myAnchor).attr('tabindex', -1).on('blur focusout', function () {
      $(this).removeAttr('tabindex');
    }).focus();
  }

  // hash focus inline
  $(window).bind('hashchange', function () {
    var hash = "#" + window.location.hash.replace(/^#/, '');
    if (hash != "#") {
      $(hash).attr('tabindex', -1).on('blur focusout', function () {
        $(this).removeAttr('tabindex');
      }).focus();
    }
    else {
      $("#headcontainer").attr('tabindex', -1).on('blur focusout', function () {
        $(this).removeAttr('tabindex');
      }).focus();
    }
  });
});