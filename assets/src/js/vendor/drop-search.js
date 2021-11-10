// by Chirag Mehta @ chir.ag
// 2009-03-17

(function($) {

  var gLoaded = false;

  // plugin definition
  $.fn.dropSearch = function(options) {

    var o = $.extend({}, $.fn.dropSearch.defaults, options);

    return this.each(function() {

      $this = $(this);
      var opts = $.meta ? $.extend({}, o, $this.data()) : o;
      opts.id = ($this.attr("id") != "" ? $this.attr("id") + "_dsl" : "");
      loadScript(opts, setupSearch);

      var ds = null;
      var rf = 0;
      var ls = "";
      var lis = null;

      // setup search box
      $this.val(opts.inittext);
      $this.change(function() { trigSearch(); }).keyup(function() { trigSearch(); });
      $this.focus(function() { if($this.val() == opts.inittext) $this.val(""); ls = ""; trigSearch(); });
      $this.blur(function() {
        clearTimeout(rf);
        rf = setTimeout(function() {
          if($this.val() == "")
            $this.val(opts.inittext);
          killList();
        }, 300);
      });

      // bind keyboard shortcuts
      $this.keydown(function(e) {
        if(lis == null) return;

        if(e.which == 13 && lis.find("a.hover").length == 1)
          document.location.href = lis.find("a.hover").attr("href");
        if(e.which == 27)
          killList();

        if(lis.find("a.hover").length != 1)
          selectItem(lis.find("li:first"));
        var nsl = null;
        if(e.which == 38) // up
          if((nsl = lis.find("li:has(a.hover)").prev()).length != 1)
            nsl = lis.find("li:last");
        if(e.which == 33) // page up
          nsl = lis.find("li:first");
        if(e.which == 40) // down
          if((nsl = lis.find("li:has(a.hover)").next()).length != 1)
            nsl = lis.find("li:first");
        if(e.which == 34) // page down
          nsl = lis.find("li:last");
        if(nsl != null)
          selectItem(nsl);
      });

      function trigSearch()
      {
        clearTimeout(rf);
        rf = setTimeout(function() { runSearch(); }, 300);
      }

      function runSearch(tx) {
        var ns = $this.val().replace(/^\s+|\s+$/g,"");
        if(ls == ns) return;
        ls = ns;
        debug("searching for: " + ns);
        ds.execute(opts.filter + " " + ns);
      }

      function setupSearch() {
        debug("base domain: " + opts.basedomain);
        ds = new google.search.WebSearch();
        ds.setUserDefinedLabel(opts.basedomain);
        ds.setUserDefinedClassSuffix("ds");
        ds.setSiteRestriction(opts.basedomain);
        ds.setNoHtmlGeneration();
        ds.setResultSetSize(google.search.Search.LARGE_RESULTSET);
        ds.setSearchCompleteCallback(null, searchComplete, [ds]);
      };

      function searchComplete(res) {

        var ltx = "";
        if(typeof(res.results) != "undefined" && res.results.length > 0)
        {
          for(var i=0; i < res.results.length; i++)
          {
            var hit = res.results[i];
            var tl = hit.title;
            if(tl == "") tl = "[no title]";
            var ct = hit.content;
            var url = unescape(hit.url);

            ltx += "<li" + (i % 2 == 1 ? " class='alt'" : "") + "><a href=\"" + url + "\"><h3>" + tl + "</h3><p>" + ct + "</p></a></li>";
          }
          title = "<div class='title'><span><a href='#'>X</a></span><b><a href='" + res.gwsUrl + "'><u>powered by</u>More Results >></a></b></div>"; // google logo + more results
        }
        else
        {
          ltx = "<li class='alt'><a href='#'><h3>No search results for: " + ls + "</h3><p>Please try again with different search words.<br /><br /></p></a></li>";
          title = "<div class='title'><span><a href='#' onclick='return false;'>X</a></span><b><a href='" + res.gwsUrl + "'><u>powered by</u>Search Results</a></b></div>"; // google logo + more results
        }

        lis = $("<div " + (opts.id == "" ? "" : "id='" + opts.id + "' ") + "class='dropSearchList'>" + title + "<ul>" + ltx + "</ul></div>").width(opts.width);
        killList();
        var tho = $this.offset();
        var py = (opts.relative ? 0 : tho.top) + Math.max($this.height(), $this.outerHeight());
        var px = (opts.relative ? 0 : tho.left);
        if(opts.align == "right")
          px = px - opts.width + Math.min($this.width(), $this.outerWidth());
        lis.css({left: px + "px", top: py + "px"});

        lis.find(".title span a").click(function() {return false; });
        lis.find("li a").mouseover(function() { selectItem($(this).parent()); });
        selectItem(lis.find("li:first"));

        $this.after(lis);
      };

      function selectItem(li) {
        if(lis == null) return;
        lis.find("li a.hover").removeClass("hover");
        li.find("a").addClass("hover");
      };

      function killList() {
        $(".dropSearchList").remove();
      };

    });
  };

  // debug for firefox
  function debug(msg) {
    if(window.console && window.console.log)
      window.console.log(msg);
  };

  // load g-ajax script
  function loadScript(opts, ss) {

    if(gLoaded)
      return ss();
    gLoaded = true;

    if(opts.gkey == "")
      opts.gkey = "ABQIAAAAY1Ra10AXncai470nSaQkbxS3vfBTIfOOPbeQIbSU21j9mwGtMBTUGyaGPAND94wexdiSqPvDGhugHQ";
    gurl = "http://www.google.com/jsapi?key=" + opts.gkey;

    $.getScript(gurl, function() {
      google.load("search", "1.0", {"nocss": true, "callback" : ss});
      debug("google ajax search api loaded");
    });
  };

  $.fn.dropSearch.defaults = {
    align: "left",
    basedomain: "http://chir.ag",
    filter: "",
    gkey: "",
    inittext: "search",
    relative: false,
    width: "300"
  };

})(jQuery);