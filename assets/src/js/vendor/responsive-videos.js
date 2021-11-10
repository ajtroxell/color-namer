$('iframe[src*="youtube.com"], iframe[src*="player.vimeo.com"]').each(function () {
  if (!$('body').hasClass('dnnEditState')) {
    iframe = $(this);
    height = iframe.height();
    width = iframe.width();
    ratio = ((height / width) * 100);
    padding = ratio.toFixed(2) + '%';
    if (iframe.hasClass('alignleft')) {
      iframe.wrap('<div class="flex-container alignleft"><div class="flex-video" style="padding-top:' + padding + '"></div></div>');
    } else if ($('iframe').hasClass('alignright')) {
      iframe.wrap('<div class="flex-container alignright"><div class="flex-video" style="padding-top:' + padding + '"></div></div>');
    } else if ($('iframe').hasClass('aligncenter')) {
      iframe.wrap('<div class="flex-container aligncenter"><div class="flex-video" style="padding-top:' + padding + '"></div></div>');
    } else {
      iframe.wrap('<div class="flex-video" style="padding-top:' + padding + '"></div>');
    }
  }
});