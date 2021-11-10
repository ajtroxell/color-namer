jQuery(document).ready(function ($) {});

(function (win) {
  "use strict";

  var $;
  if ('shoestring' in win) {
    $ = win.shoestring;
  } else if ('jQuery' in win) {
    $ = win.jQuery;
  } else {
    throw new Error("tablesaw: DOM library not found.");
  }

  if ("addEventListener" in document) {
    document.addEventListener("DOMContentLoaded", function () {
      $(document).trigger("enhance.tablesaw");
    });
  }

})(typeof window !== "undefined" ? window : this);
//# sourceMappingURL=subpage.js.map
