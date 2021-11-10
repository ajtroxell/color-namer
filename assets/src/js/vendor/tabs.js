jQuery(document).ready(function ($) {
  $('.tabs').each(function () {
    // The class for the container div
    var tabContainer = $(this);
    var wrapTabs = $('.tab-con', tabContainer);
    // The setup
    $('ul.tab-list', tabContainer).empty().attr('role', 'tablist');
    $('.tab-content', tabContainer).each(function () {
      var tabHeading = $(this).find("> .tab-title").html();
      var tabHeadingID = 'tab' + $(this).index();
      $('ul.tab-list', tabContainer).append('<li><a href="#' + tabHeadingID + '">' + tabHeading + '</a></li>');
      $(this).attr('id', tabHeadingID);
    });
    $('[role="tablist"] > li', tabContainer).attr('role', 'presentation');
    $('[role="tablist"] a', tabContainer).attr({
      'role': 'tab',
      'tabindex': '-1'
    });
    // Make each aria-controls correspond id of targeted section (re href)
    $('[role="tablist"] a', tabContainer).each(function () {
      $(this).attr('aria-controls', $(this).attr('href').substring(1));
    });
    // Make the first tab selected by default and allow it focus
    $('[role="tablist"] li:first-child a', tabContainer).attr({
      'aria-selected': 'true',
      'tabindex': '0'
    });
    // Make each section focusable and give it the tabpanel role
    $('section', tabContainer).attr({
      'role': 'tabpanel'
    });
    // Make first child of each panel focusable programmatically
    $('section > *:first-child', tabContainer).attr({
      'tabindex': '0'
    });
    // Make all but the first section hidden (ARIA state and display CSS)
    $('[role="tabpanel"]:not(:first-of-type)', tabContainer).attr({
      'aria-hidden': 'true'
    });
    // Change focus between tabs with arrow keys
    $('[role="tab"]', tabContainer).on('keydown', function (e) {
      // define current, previous and next (possible) tabs
      var tabCurrent = $(this);
      var tabPrev = $(this).parents('li').prev().children('[role="tab"]');
      var tabNext = $(this).parents('li').next().children('[role="tab"]');
      var tabTarget;
      // find the direction (prev or next)
      switch (e.keyCode) {
        case 37:
          tabTarget = tabPrev;
          break;
        case 39:
          tabTarget = tabNext;
          break;
        default:
          tabTarget = false
          break;
      }
      if (tabTarget.length) {
        tabCurrent.attr({
          'tabindex': '-1',
          'aria-selected': null
        });
        tabTarget.attr({
          'tabindex': '0',
          'aria-selected': true
        }).focus();
      }
      // Hide panels
      $('[role="tabpanel"]', tabContainer).attr('aria-hidden', 'true');
      // Show panel which corresponds to target
      $('#' + $(document.activeElement).attr('href').substring(1)).attr('aria-hidden', null);
    });
    // Handle click on tab to show + focus tabpanel
    $('[role="tab"]', tabContainer).on('click', function (e) {
      e.preventDefault();
      var tabID = $(this).attr('href');
      // remove focusability [sic] and aria-selected
      $('[role="tab"]', tabContainer).attr({
        'tabindex': '-1',
        'aria-selected': null
      });
      // replace above on clicked tab
      $(this).attr({
        'aria-selected': true,
        'tabindex': '0'
      });
      // Hide panels
      $('[role="tabpanel"]', tabContainer).attr('aria-hidden', 'true');
      // show corresponding panel
      // $('#' + $(this).attr('href').substring(1)).attr('aria-hidden', null);
      $('section' + tabID).attr('aria-hidden', null);
    });

    var tabsContainerWidth = $('.tab-con', tabContainer).outerWidth();
    var tabsWidth = $('ul.tab-list', tabContainer).outerWidth();
    var scrollWidth = tabsWidth - tabsContainerWidth;

    if (tabsWidth > tabsContainerWidth) {
      tabContainer.addClass('scroll-right');
      wrapTabs.on('scroll', function () {
        if (wrapTabs.scrollLeft() >= tabsWidth - tabsContainerWidth) {
          tabContainer.removeClass('scroll-right');
        } else {
          tabContainer.addClass('scroll-right');
        }
        if (wrapTabs.scrollLeft() > 1) {
          tabContainer.addClass('scroll-left');
        } else {
          tabContainer.removeClass('scroll-left');
        }
      });
    }
  });
});