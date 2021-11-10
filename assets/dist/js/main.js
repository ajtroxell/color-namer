// $Id: farbtastic.js,v 1.2 2007/01/08 22:53:01 unconed Exp $
// Farbtastic 1.2

jQuery.fn.farbtastic = function (callback) {
  $.farbtastic(this, callback);
  return this;
};

jQuery.farbtastic = function (container, callback) {
  var container = $(container).get(0);
  return container.farbtastic || (container.farbtastic = new jQuery._farbtastic(container, callback));
}

jQuery._farbtastic = function (container, callback) {
  // Store farbtastic object
  var fb = this;

  // Insert markup
  $(container).html('<div class="farbtastic"><div class="color"></div><div class="wheel"></div><div class="overlay"></div><div class="h-marker marker"></div><div class="sl-marker marker"></div></div>');
  var e = $('.farbtastic', container);
  fb.wheel = $('.wheel', container).get(0);
  // Dimensions
  fb.radius = 84;
  fb.square = 100;
  fb.width = 194;

  // Fix background PNGs in IE6
  if (navigator.appVersion.match(/MSIE [0-6]\./)) {
    $('*', e).each(function () {
      if (this.currentStyle.backgroundImage != 'none') {
        var image = this.currentStyle.backgroundImage;
        image = this.currentStyle.backgroundImage.substring(5, image.length - 2);
        $(this).css({
          'backgroundImage': 'none',
          'filter': "progid:DXImageTransform.Microsoft.AlphaImageLoader(enabled=true, sizingMethod=crop, src='" + image + "')"
        });
      }
    });
  }

  /**
   * Link to the given element(s) or callback.
   */
  fb.linkTo = function (callback) {
    // Unbind previous nodes
    if (typeof fb.callback == 'object') {
      $(fb.callback).unbind('keyup', fb.updateValue);
    }

    // Reset color
    fb.color = null;

    // Bind callback or elements
    if (typeof callback == 'function') {
      fb.callback = callback;
    }
    else if (typeof callback == 'object' || typeof callback == 'string') {
      fb.callback = $(callback);
      fb.callback.bind('keyup', fb.updateValue);
      if (fb.callback.get(0).value) {
        fb.setColor(fb.callback.get(0).value);
      }
    }
    return this;
  }
  fb.updateValue = function (event) {
    if (this.value && this.value != fb.color) {
      fb.setColor(this.value);
    }
  }

  /**
   * Change color with HTML syntax #123456
   */
  fb.setColor = function (color) {
    var unpack = fb.unpack(color);
    if (fb.color != color && unpack) {
      fb.color = color;
      fb.rgb = unpack;
      fb.hsl = fb.RGBToHSL(fb.rgb);
      fb.updateDisplay();
    }
    return this;
  }

  /**
   * Change color with HSL triplet [0..1, 0..1, 0..1]
   */
  fb.setHSL = function (hsl) {
    fb.hsl = hsl;
    fb.rgb = fb.HSLToRGB(hsl);
    fb.color = fb.pack(fb.rgb);
    fb.updateDisplay();
    return this;
  }

  /////////////////////////////////////////////////////

  /**
   * Retrieve the coordinates of the given event relative to the center
   * of the widget.
   */
  fb.widgetCoords = function (event) {
    var x, y;
    var el = event.target || event.srcElement;
    var reference = fb.wheel;

    if (typeof event.offsetX != 'undefined') {
      // Use offset coordinates and find common offsetParent
      var pos = { x: event.offsetX, y: event.offsetY };

      // Send the coordinates upwards through the offsetParent chain.
      var e = el;
      while (e) {
        e.mouseX = pos.x;
        e.mouseY = pos.y;
        pos.x += e.offsetLeft;
        pos.y += e.offsetTop;
        e = e.offsetParent;
      }

      // Look for the coordinates starting from the wheel widget.
      var e = reference;
      var offset = { x: 0, y: 0 }
      while (e) {
        if (typeof e.mouseX != 'undefined') {
          x = e.mouseX - offset.x;
          y = e.mouseY - offset.y;
          break;
        }
        offset.x += e.offsetLeft;
        offset.y += e.offsetTop;
        e = e.offsetParent;
      }

      // Reset stored coordinates
      e = el;
      while (e) {
        e.mouseX = undefined;
        e.mouseY = undefined;
        e = e.offsetParent;
      }
    }
    else {
      // Use absolute coordinates
      var pos = fb.absolutePosition(reference);
      x = (event.pageX || 0*(event.clientX + $('html').get(0).scrollLeft)) - pos.x;
      y = (event.pageY || 0*(event.clientY + $('html').get(0).scrollTop)) - pos.y;
    }
    // Subtract distance to middle
    return { x: x - fb.width / 2, y: y - fb.width / 2 };
  }

  /**
   * Mousedown handler
   */
  fb.mousedown = function (event) {
    // Capture mouse
    if (!document.dragging) {
      $(document).bind('mousemove', fb.mousemove).bind('mouseup', fb.mouseup);
      document.dragging = true;
    }

    // Check which area is being dragged
    var pos = fb.widgetCoords(event);
    fb.circleDrag = Math.max(Math.abs(pos.x), Math.abs(pos.y)) * 2 > fb.square;

    // Process
    fb.mousemove(event);
    return false;
  }

  /**
   * Mousemove handler
   */
  fb.mousemove = function (event) {
    // Get coordinates relative to color picker center
    var pos = fb.widgetCoords(event);

    // Set new HSL parameters
    if (fb.circleDrag) {
      var hue = Math.atan2(pos.x, -pos.y) / 6.28;
      if (hue < 0) hue += 1;
      fb.setHSL([hue, fb.hsl[1], fb.hsl[2]]);
    }
    else {
      var sat = Math.max(0, Math.min(1, -(pos.x / fb.square) + .5));
      var lum = Math.max(0, Math.min(1, -(pos.y / fb.square) + .5));
      fb.setHSL([fb.hsl[0], sat, lum]);
    }
    return false;
  }

  /**
   * Mouseup handler
   */
  fb.mouseup = function () {
    // Uncapture mouse
    $(document).unbind('mousemove', fb.mousemove);
    $(document).unbind('mouseup', fb.mouseup);
    document.dragging = false;
  }

  /**
   * Update the markers and styles
   */
  fb.updateDisplay = function () {
    // Markers
    var angle = fb.hsl[0] * 6.28;
    $('.h-marker', e).css({
      left: Math.round(Math.sin(angle) * fb.radius + fb.width / 2) + 'px',
      top: Math.round(-Math.cos(angle) * fb.radius + fb.width / 2) + 'px'
    });

    $('.sl-marker', e).css({
      left: Math.round(fb.square * (.5 - fb.hsl[1]) + fb.width / 2) + 'px',
      top: Math.round(fb.square * (.5 - fb.hsl[2]) + fb.width / 2) + 'px'
    });

    // Saturation/Luminance gradient
    $('.color', e).css('backgroundColor', fb.pack(fb.HSLToRGB([fb.hsl[0], 1, 0.5])));

    // Linked elements or callback
    if (typeof fb.callback == 'object') {
      // Set background/foreground color
      $(fb.callback).css({
        backgroundColor: fb.color,
        color: fb.hsl[2] > 0.5 ? '#000' : '#fff'
      });

      // Change linked value
      $(fb.callback).each(function() {
        if (this.value && this.value != fb.color) {
          this.value = fb.color;
        }
      });
    }
    else if (typeof fb.callback == 'function') {
      fb.callback.call(fb, fb.color);
    }
  }

  /**
   * Get absolute position of element
   */
  fb.absolutePosition = function (el) {
    var r = { x: el.offsetLeft, y: el.offsetTop };
    // Resolve relative to offsetParent
    if (el.offsetParent) {
      var tmp = fb.absolutePosition(el.offsetParent);
      r.x += tmp.x;
      r.y += tmp.y;
    }
    return r;
  };

  /* Various color utility functions */
  fb.pack = function (rgb) {
    var r = Math.round(rgb[0] * 255);
    var g = Math.round(rgb[1] * 255);
    var b = Math.round(rgb[2] * 255);
    return '#' + (r < 16 ? '0' : '') + r.toString(16) +
           (g < 16 ? '0' : '') + g.toString(16) +
           (b < 16 ? '0' : '') + b.toString(16);
  }

  fb.unpack = function (color) {
    if (color.length == 7) {
      return [parseInt('0x' + color.substring(1, 3)) / 255,
        parseInt('0x' + color.substring(3, 5)) / 255,
        parseInt('0x' + color.substring(5, 7)) / 255];
    }
    else if (color.length == 4) {
      return [parseInt('0x' + color.substring(1, 2)) / 15,
        parseInt('0x' + color.substring(2, 3)) / 15,
        parseInt('0x' + color.substring(3, 4)) / 15];
    }
  }

  fb.HSLToRGB = function (hsl) {
    var m1, m2, r, g, b;
    var h = hsl[0], s = hsl[1], l = hsl[2];
    m2 = (l <= 0.5) ? l * (s + 1) : l + s - l*s;
    m1 = l * 2 - m2;
    return [this.hueToRGB(m1, m2, h+0.33333),
        this.hueToRGB(m1, m2, h),
        this.hueToRGB(m1, m2, h-0.33333)];
  }

  fb.hueToRGB = function (m1, m2, h) {
    h = (h < 0) ? h + 1 : ((h > 1) ? h - 1 : h);
    if (h * 6 < 1) return m1 + (m2 - m1) * h * 6;
    if (h * 2 < 1) return m2;
    if (h * 3 < 2) return m1 + (m2 - m1) * (0.66666 - h) * 6;
    return m1;
  }

  fb.RGBToHSL = function (rgb) {
    var min, max, delta, h, s, l;
    var r = rgb[0], g = rgb[1], b = rgb[2];
    min = Math.min(r, Math.min(g, b));
    max = Math.max(r, Math.max(g, b));
    delta = max - min;
    l = (min + max) / 2;
    s = 0;
    if (l > 0 && l < 1) {
      s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));
    }
    h = 0;
    if (delta > 0) {
      if (max == r && max != g) h += (g - b) / delta;
      if (max == g && max != b) h += (2 + (b - r) / delta);
      if (max == b && max != r) h += (4 + (r - g) / delta);
      h /= 6;
    }
    return [h, s, l];
  }

  // Install mousedown handler (the others are set on the document on-demand)
  $('*', e).mousedown(fb.mousedown);

    // Init color
  fb.setColor('#000000');

  // Set linked elements/callback
  if (callback) {
    fb.linkTo(callback);
  }
}
/*

+-----------------------------------------------------------------+
|     Created by Chirag Mehta - http://chir.ag/projects/ntc       |
|-----------------------------------------------------------------|
|               ntc js (Name that Color JavaScript)               |
+-----------------------------------------------------------------+

All the functions, code, lists etc. have been written specifically
for the Name that Color JavaScript by Chirag Mehta unless otherwise
specified.

This script is released under the: Creative Commons License:
Attribution 2.5 http://creativecommons.org/licenses/by/2.5/

Sample Usage:

  <script type="text/javascript" src="ntc.js"></script>

  <script type="text/javascript">

    var n_match  = ntc.name("#6195ED");
    n_rgb        = n_match[0]; // This is the RGB value of the closest matching color
    n_name       = n_match[1]; // This is the text string for the name of the match
    n_exactmatch = n_match[2]; // True if exact color match, False if close-match

    alert(n_match);

  </script>

*/

var ntc = {

  init: function () {
    var color, rgb, hsl;
    for (var i = 0; i < ntc.names.length; i++) {
      color = "#" + ntc.names[i][0];
      rgb = ntc.rgb(color);
      hsl = ntc.hsl(color);
      ntc.names[i].push(rgb[0], rgb[1], rgb[2], hsl[0], hsl[1], hsl[2]);
    }
  },

  name: function (color) {

    color = color.toUpperCase();
    if (color.length < 3 || color.length > 7)
      return ["#000000", "Invalid Color: " + color, false];
    if (color.length % 3 == 0)
      color = "#" + color;
    if (color.length == 4)
      color = "#" + color.substr(1, 1) + color.substr(1, 1) + color.substr(2, 1) + color.substr(2, 1) + color.substr(3, 1) + color.substr(3, 1);

    var rgb = ntc.rgb(color);
    var r = rgb[0], g = rgb[1], b = rgb[2];
    var hsl = ntc.hsl(color);
    var h = hsl[0], s = hsl[1], l = hsl[2];
    var ndf1 = 0; ndf2 = 0; ndf = 0;
    var cl = -1, df = -1;

    for (var i = 0; i < ntc.names.length; i++) {
      if (color == "#" + ntc.names[i][0])
        return ["#" + ntc.names[i][0], ntc.names[i][1], true];

      ndf1 = Math.pow(r - ntc.names[i][2], 2) + Math.pow(g - ntc.names[i][3], 2) + Math.pow(b - ntc.names[i][4], 2);
      ndf2 = Math.pow(h - ntc.names[i][5], 2) + Math.pow(s - ntc.names[i][6], 2) + Math.pow(l - ntc.names[i][7], 2);
      ndf = ndf1 + ndf2 * 2;
      if (df < 0 || df > ndf) {
        df = ndf;
        cl = i;
      }
    }

    return (cl < 0 ? ["#000000", "Invalid Color: " + color, false] : ["#" + ntc.names[cl][0], ntc.names[cl][1], false]);
  },

  // adopted from: Farbtastic 1.2
  // http://acko.net/dev/farbtastic
  hsl: function (color) {

    var rgb = [parseInt('0x' + color.substring(1, 3)) / 255, parseInt('0x' + color.substring(3, 5)) / 255, parseInt('0x' + color.substring(5, 7)) / 255];
    var min, max, delta, h, s, l;
    var r = rgb[0], g = rgb[1], b = rgb[2];

    min = Math.min(r, Math.min(g, b));
    max = Math.max(r, Math.max(g, b));
    delta = max - min;
    l = (min + max) / 2;

    s = 0;
    if (l > 0 && l < 1)
      s = delta / (l < 0.5 ? (2 * l) : (2 - 2 * l));

    h = 0;
    if (delta > 0) {
      if (max == r && max != g) h += (g - b) / delta;
      if (max == g && max != b) h += (2 + (b - r) / delta);
      if (max == b && max != r) h += (4 + (r - g) / delta);
      h /= 6;
    }
    return [parseInt(h * 255), parseInt(s * 255), parseInt(l * 255)];
  },

  // adopted from: Farbtastic 1.2
  // http://acko.net/dev/farbtastic
  rgb: function (color) {
    return [parseInt('0x' + color.substring(1, 3)), parseInt('0x' + color.substring(3, 5)), parseInt('0x' + color.substring(5, 7))];
  },

  names: [
    ["000000", "Black"],
    ["000080", "Navy Blue"],
    ["0000C8", "Dark Blue"],
    ["0000FF", "Blue"],
    ["000741", "Stratos"],
    ["001B1C", "Swamp"],
    ["002387", "Resolution Blue"],
    ["002900", "Deep Fir"],
    ["002E20", "Burnham"],
    ["002FA7", "International Klein Blue"],
    ["003153", "Prussian Blue"],
    ["003366", "Midnight Blue"],
    ["003399", "Smalt"],
    ["003532", "Deep Teal"],
    ["003E40", "Cyprus"],
    ["004620", "Kaitoke Green"],
    ["0047AB", "Cobalt"],
    ["004816", "Crusoe"],
    ["004950", "Sherpa Blue"],
    ["0056A7", "Endeavour"],
    ["00581A", "Camarone"],
    ["0066CC", "Science Blue"],
    ["0066FF", "Blue Ribbon"],
    ["00755E", "Tropical Rain Forest"],
    ["0076A3", "Allports"],
    ["007BA7", "Deep Cerulean"],
    ["007EC7", "Lochmara"],
    ["007FFF", "Azure Radiance"],
    ["008080", "Teal"],
    ["0095B6", "Bondi Blue"],
    ["009DC4", "Pacific Blue"],
    ["00A693", "Persian Green"],
    ["00A86B", "Jade"],
    ["00CC99", "Caribbean Green"],
    ["00CCCC", "Robin's Egg Blue"],
    ["00FF00", "Green"],
    ["00FF7F", "Spring Green"],
    ["00FFFF", "Cyan / Aqua"],
    ["010D1A", "Blue Charcoal"],
    ["011635", "Midnight"],
    ["011D13", "Holly"],
    ["012731", "Daintree"],
    ["01361C", "Cardin Green"],
    ["01371A", "County Green"],
    ["013E62", "Astronaut Blue"],
    ["013F6A", "Regal Blue"],
    ["014B43", "Aqua Deep"],
    ["015E85", "Orient"],
    ["016162", "Blue Stone"],
    ["016D39", "Fun Green"],
    ["01796F", "Pine Green"],
    ["017987", "Blue Lagoon"],
    ["01826B", "Deep Sea"],
    ["01A368", "Green Haze"],
    ["022D15", "English Holly"],
    ["02402C", "Sherwood Green"],
    ["02478E", "Congress Blue"],
    ["024E46", "Evening Sea"],
    ["026395", "Bahama Blue"],
    ["02866F", "Observatory"],
    ["02A4D3", "Cerulean"],
    ["03163C", "Tangaroa"],
    ["032B52", "Green Vogue"],
    ["036A6E", "Mosque"],
    ["041004", "Midnight Moss"],
    ["041322", "Black Pearl"],
    ["042E4C", "Blue Whale"],
    ["044022", "Zuccini"],
    ["044259", "Teal Blue"],
    ["051040", "Deep Cove"],
    ["051657", "Gulf Blue"],
    ["055989", "Venice Blue"],
    ["056F57", "Watercourse"],
    ["062A78", "Catalina Blue"],
    ["063537", "Tiber"],
    ["069B81", "Gossamer"],
    ["06A189", "Niagara"],
    ["073A50", "Tarawera"],
    ["080110", "Jaguar"],
    ["081910", "Black Bean"],
    ["082567", "Deep Sapphire"],
    ["088370", "Elf Green"],
    ["08E8DE", "Bright Turquoise"],
    ["092256", "Downriver"],
    ["09230F", "Palm Green"],
    ["09255D", "Madison"],
    ["093624", "Bottle Green"],
    ["095859", "Deep Sea Green"],
    ["097F4B", "Salem"],
    ["0A001C", "Black Russian"],
    ["0A480D", "Dark Fern"],
    ["0A6906", "Japanese Laurel"],
    ["0A6F75", "Atoll"],
    ["0B0B0B", "Cod Gray"],
    ["0B0F08", "Marshland"],
    ["0B1107", "Gordons Green"],
    ["0B1304", "Black Forest"],
    ["0B6207", "San Felix"],
    ["0BDA51", "Malachite"],
    ["0C0B1D", "Ebony"],
    ["0C0D0F", "Woodsmoke"],
    ["0C1911", "Racing Green"],
    ["0C7A79", "Surfie Green"],
    ["0C8990", "Blue Chill"],
    ["0D0332", "Black Rock"],
    ["0D1117", "Bunker"],
    ["0D1C19", "Aztec"],
    ["0D2E1C", "Bush"],
    ["0E0E18", "Cinder"],
    ["0E2A30", "Firefly"],
    ["0F2D9E", "Torea Bay"],
    ["10121D", "Vulcan"],
    ["101405", "Green Waterloo"],
    ["105852", "Eden"],
    ["110C6C", "Arapawa"],
    ["120A8F", "Ultramarine"],
    ["123447", "Elephant"],
    ["126B40", "Jewel"],
    ["130000", "Diesel"],
    ["130A06", "Asphalt"],
    ["13264D", "Blue Zodiac"],
    ["134F19", "Parsley"],
    ["140600", "Nero"],
    ["1450AA", "Tory Blue"],
    ["151F4C", "Bunting"],
    ["1560BD", "Denim"],
    ["15736B", "Genoa"],
    ["161928", "Mirage"],
    ["161D10", "Hunter Green"],
    ["162A40", "Big Stone"],
    ["163222", "Celtic"],
    ["16322C", "Timber Green"],
    ["163531", "Gable Green"],
    ["171F04", "Pine Tree"],
    ["175579", "Chathams Blue"],
    ["182D09", "Deep Forest Green"],
    ["18587A", "Blumine"],
    ["19330E", "Palm Leaf"],
    ["193751", "Nile Blue"],
    ["1959A8", "Fun Blue"],
    ["1A1A68", "Lucky Point"],
    ["1AB385", "Mountain Meadow"],
    ["1B0245", "Tolopea"],
    ["1B1035", "Haiti"],
    ["1B127B", "Deep Koamaru"],
    ["1B1404", "Acadia"],
    ["1B2F11", "Seaweed"],
    ["1B3162", "Biscay"],
    ["1B659D", "Matisse"],
    ["1C1208", "Crowshead"],
    ["1C1E13", "Rangoon Green"],
    ["1C39BB", "Persian Blue"],
    ["1C402E", "Everglade"],
    ["1C7C7D", "Elm"],
    ["1D6142", "Green Pea"],
    ["1E0F04", "Creole"],
    ["1E1609", "Karaka"],
    ["1E1708", "El Paso"],
    ["1E385B", "Cello"],
    ["1E433C", "Te Papa Green"],
    ["1E90FF", "Dodger Blue"],
    ["1E9AB0", "Eastern Blue"],
    ["1F120F", "Night Rider"],
    ["1FC2C2", "Java"],
    ["20208D", "Jacksons Purple"],
    ["202E54", "Cloud Burst"],
    ["204852", "Blue Dianne"],
    ["211A0E", "Eternity"],
    ["220878", "Deep Blue"],
    ["228B22", "Forest Green"],
    ["233418", "Mallard"],
    ["240A40", "Violet"],
    ["240C02", "Kilamanjaro"],
    ["242A1D", "Log Cabin"],
    ["242E16", "Black Olive"],
    ["24500F", "Green House"],
    ["251607", "Graphite"],
    ["251706", "Cannon Black"],
    ["251F4F", "Port Gore"],
    ["25272C", "Shark"],
    ["25311C", "Green Kelp"],
    ["2596D1", "Curious Blue"],
    ["260368", "Paua"],
    ["26056A", "Paris M"],
    ["261105", "Wood Bark"],
    ["261414", "Gondola"],
    ["262335", "Steel Gray"],
    ["26283B", "Ebony Clay"],
    ["273A81", "Bay of Many"],
    ["27504B", "Plantation"],
    ["278A5B", "Eucalyptus"],
    ["281E15", "Oil"],
    ["283A77", "Astronaut"],
    ["286ACD", "Mariner"],
    ["290C5E", "Violent Violet"],
    ["292130", "Bastille"],
    ["292319", "Zeus"],
    ["292937", "Charade"],
    ["297B9A", "Jelly Bean"],
    ["29AB87", "Jungle Green"],
    ["2A0359", "Cherry Pie"],
    ["2A140E", "Coffee Bean"],
    ["2A2630", "Baltic Sea"],
    ["2A380B", "Turtle Green"],
    ["2A52BE", "Cerulean Blue"],
    ["2B0202", "Sepia Black"],
    ["2B194F", "Valhalla"],
    ["2B3228", "Heavy Metal"],
    ["2C0E8C", "Blue Gem"],
    ["2C1632", "Revolver"],
    ["2C2133", "Bleached Cedar"],
    ["2C8C84", "Lochinvar"],
    ["2D2510", "Mikado"],
    ["2D383A", "Outer Space"],
    ["2D569B", "St Tropaz"],
    ["2E0329", "Jacaranda"],
    ["2E1905", "Jacko Bean"],
    ["2E3222", "Rangitoto"],
    ["2E3F62", "Rhino"],
    ["2E8B57", "Sea Green"],
    ["2EBFD4", "Scooter"],
    ["2F270E", "Onion"],
    ["2F3CB3", "Governor Bay"],
    ["2F519E", "Sapphire"],
    ["2F5A57", "Spectra"],
    ["2F6168", "Casal"],
    ["300529", "Melanzane"],
    ["301F1E", "Cocoa Brown"],
    ["302A0F", "Woodrush"],
    ["304B6A", "San Juan"],
    ["30D5C8", "Turquoise"],
    ["311C17", "Eclipse"],
    ["314459", "Pickled Bluewood"],
    ["315BA1", "Azure"],
    ["31728D", "Calypso"],
    ["317D82", "Paradiso"],
    ["32127A", "Persian Indigo"],
    ["32293A", "Blackcurrant"],
    ["323232", "Mine Shaft"],
    ["325D52", "Stromboli"],
    ["327C14", "Bilbao"],
    ["327DA0", "Astral"],
    ["33036B", "Christalle"],
    ["33292F", "Thunder"],
    ["33CC99", "Shamrock"],
    ["341515", "Tamarind"],
    ["350036", "Mardi Gras"],
    ["350E42", "Valentino"],
    ["350E57", "Jagger"],
    ["353542", "Tuna"],
    ["354E8C", "Chambray"],
    ["363050", "Martinique"],
    ["363534", "Tuatara"],
    ["363C0D", "Waiouru"],
    ["36747D", "Ming"],
    ["368716", "La Palma"],
    ["370202", "Chocolate"],
    ["371D09", "Clinker"],
    ["37290E", "Brown Tumbleweed"],
    ["373021", "Birch"],
    ["377475", "Oracle"],
    ["380474", "Blue Diamond"],
    ["381A51", "Grape"],
    ["383533", "Dune"],
    ["384555", "Oxford Blue"],
    ["384910", "Clover"],
    ["394851", "Limed Spruce"],
    ["396413", "Dell"],
    ["3A0020", "Toledo"],
    ["3A2010", "Sambuca"],
    ["3A2A6A", "Jacarta"],
    ["3A686C", "William"],
    ["3A6A47", "Killarney"],
    ["3AB09E", "Keppel"],
    ["3B000B", "Temptress"],
    ["3B0910", "Aubergine"],
    ["3B1F1F", "Jon"],
    ["3B2820", "Treehouse"],
    ["3B7A57", "Amazon"],
    ["3B91B4", "Boston Blue"],
    ["3C0878", "Windsor"],
    ["3C1206", "Rebel"],
    ["3C1F76", "Meteorite"],
    ["3C2005", "Dark Ebony"],
    ["3C3910", "Camouflage"],
    ["3C4151", "Bright Gray"],
    ["3C4443", "Cape Cod"],
    ["3C493A", "Lunar Green"],
    ["3D0C02", "Bean  "],
    ["3D2B1F", "Bistre"],
    ["3D7D52", "Goblin"],
    ["3E0480", "Kingfisher Daisy"],
    ["3E1C14", "Cedar"],
    ["3E2B23", "English Walnut"],
    ["3E2C1C", "Black Marlin"],
    ["3E3A44", "Ship Gray"],
    ["3EABBF", "Pelorous"],
    ["3F2109", "Bronze"],
    ["3F2500", "Cola"],
    ["3F3002", "Madras"],
    ["3F307F", "Minsk"],
    ["3F4C3A", "Cabbage Pont"],
    ["3F583B", "Tom Thumb"],
    ["3F5D53", "Mineral Green"],
    ["3FC1AA", "Puerto Rico"],
    ["3FFF00", "Harlequin"],
    ["401801", "Brown Pod"],
    ["40291D", "Cork"],
    ["403B38", "Masala"],
    ["403D19", "Thatch Green"],
    ["405169", "Fiord"],
    ["40826D", "Viridian"],
    ["40A860", "Chateau Green"],
    ["410056", "Ripe Plum"],
    ["411F10", "Paco"],
    ["412010", "Deep Oak"],
    ["413C37", "Merlin"],
    ["414257", "Gun Powder"],
    ["414C7D", "East Bay"],
    ["4169E1", "Royal Blue"],
    ["41AA78", "Ocean Green"],
    ["420303", "Burnt Maroon"],
    ["423921", "Lisbon Brown"],
    ["427977", "Faded Jade"],
    ["431560", "Scarlet Gum"],
    ["433120", "Iroko"],
    ["433E37", "Armadillo"],
    ["434C59", "River Bed"],
    ["436A0D", "Green Leaf"],
    ["44012D", "Barossa"],
    ["441D00", "Morocco Brown"],
    ["444954", "Mako"],
    ["454936", "Kelp"],
    ["456CAC", "San Marino"],
    ["45B1E8", "Picton Blue"],
    ["460B41", "Loulou"],
    ["462425", "Crater Brown"],
    ["465945", "Gray Asparagus"],
    ["4682B4", "Steel Blue"],
    ["480404", "Rustic Red"],
    ["480607", "Bulgarian Rose"],
    ["480656", "Clairvoyant"],
    ["481C1C", "Cocoa Bean"],
    ["483131", "Woody Brown"],
    ["483C32", "Taupe"],
    ["49170C", "Van Cleef"],
    ["492615", "Brown Derby"],
    ["49371B", "Metallic Bronze"],
    ["495400", "Verdun Green"],
    ["496679", "Blue Bayoux"],
    ["497183", "Bismark"],
    ["4A2A04", "Bracken"],
    ["4A3004", "Deep Bronze"],
    ["4A3C30", "Mondo"],
    ["4A4244", "Tundora"],
    ["4A444B", "Gravel"],
    ["4A4E5A", "Trout"],
    ["4B0082", "Pigment Indigo"],
    ["4B5D52", "Nandor"],
    ["4C3024", "Saddle"],
    ["4C4F56", "Abbey"],
    ["4D0135", "Blackberry"],
    ["4D0A18", "Cab Sav"],
    ["4D1E01", "Indian Tan"],
    ["4D282D", "Cowboy"],
    ["4D282E", "Livid Brown"],
    ["4D3833", "Rock"],
    ["4D3D14", "Punga"],
    ["4D400F", "Bronzetone"],
    ["4D5328", "Woodland"],
    ["4E0606", "Mahogany"],
    ["4E2A5A", "Bossanova"],
    ["4E3B41", "Matterhorn"],
    ["4E420C", "Bronze Olive"],
    ["4E4562", "Mulled Wine"],
    ["4E6649", "Axolotl"],
    ["4E7F9E", "Wedgewood"],
    ["4EABD1", "Shakespeare"],
    ["4F1C70", "Honey Flower"],
    ["4F2398", "Daisy Bush"],
    ["4F69C6", "Indigo"],
    ["4F7942", "Fern Green"],
    ["4F9D5D", "Fruit Salad"],
    ["4FA83D", "Apple"],
    ["504351", "Mortar"],
    ["507096", "Kashmir Blue"],
    ["507672", "Cutty Sark"],
    ["50C878", "Emerald"],
    ["514649", "Emperor"],
    ["516E3D", "Chalet Green"],
    ["517C66", "Como"],
    ["51808F", "Smalt Blue"],
    ["52001F", "Castro"],
    ["520C17", "Maroon Oak"],
    ["523C94", "Gigas"],
    ["533455", "Voodoo"],
    ["534491", "Victoria"],
    ["53824B", "Hippie Green"],
    ["541012", "Heath"],
    ["544333", "Judge Gray"],
    ["54534D", "Fuscous Gray"],
    ["549019", "Vida Loca"],
    ["55280C", "Cioccolato"],
    ["555B10", "Saratoga"],
    ["556D56", "Finlandia"],
    ["5590D9", "Havelock Blue"],
    ["56B4BE", "Fountain Blue"],
    ["578363", "Spring Leaves"],
    ["583401", "Saddle Brown"],
    ["585562", "Scarpa Flow"],
    ["587156", "Cactus"],
    ["589AAF", "Hippie Blue"],
    ["591D35", "Wine Berry"],
    ["592804", "Brown Bramble"],
    ["593737", "Congo Brown"],
    ["594433", "Millbrook"],
    ["5A6E9C", "Waikawa Gray"],
    ["5A87A0", "Horizon"],
    ["5B3013", "Jambalaya"],
    ["5C0120", "Bordeaux"],
    ["5C0536", "Mulberry Wood"],
    ["5C2E01", "Carnaby Tan"],
    ["5C5D75", "Comet"],
    ["5D1E0F", "Redwood"],
    ["5D4C51", "Don Juan"],
    ["5D5C58", "Chicago"],
    ["5D5E37", "Verdigris"],
    ["5D7747", "Dingley"],
    ["5DA19F", "Breaker Bay"],
    ["5E483E", "Kabul"],
    ["5E5D3B", "Hemlock"],
    ["5F3D26", "Irish Coffee"],
    ["5F5F6E", "Mid Gray"],
    ["5F6672", "Shuttle Gray"],
    ["5FA777", "Aqua Forest"],
    ["5FB3AC", "Tradewind"],
    ["604913", "Horses Neck"],
    ["605B73", "Smoky"],
    ["606E68", "Corduroy"],
    ["6093D1", "Danube"],
    ["612718", "Espresso"],
    ["614051", "Eggplant"],
    ["615D30", "Costa Del Sol"],
    ["61845F", "Glade Green"],
    ["622F30", "Buccaneer"],
    ["623F2D", "Quincy"],
    ["624E9A", "Butterfly Bush"],
    ["625119", "West Coast"],
    ["626649", "Finch"],
    ["639A8F", "Patina"],
    ["63B76C", "Fern"],
    ["6456B7", "Blue Violet"],
    ["646077", "Dolphin"],
    ["646463", "Storm Dust"],
    ["646A54", "Siam"],
    ["646E75", "Nevada"],
    ["6495ED", "Cornflower Blue"],
    ["64CCDB", "Viking"],
    ["65000B", "Rosewood"],
    ["651A14", "Cherrywood"],
    ["652DC1", "Purple Heart"],
    ["657220", "Fern Frond"],
    ["65745D", "Willow Grove"],
    ["65869F", "Hoki"],
    ["660045", "Pompadour"],
    ["660099", "Purple"],
    ["66023C", "Tyrian Purple"],
    ["661010", "Dark Tan"],
    ["66B58F", "Silver Tree"],
    ["66FF00", "Bright Green"],
    ["66FF66", "Screamin' Green"],
    ["67032D", "Black Rose"],
    ["675FA6", "Scampi"],
    ["676662", "Ironside Gray"],
    ["678975", "Viridian Green"],
    ["67A712", "Christi"],
    ["683600", "Nutmeg Wood Finish"],
    ["685558", "Zambezi"],
    ["685E6E", "Salt Box"],
    ["692545", "Tawny Port"],
    ["692D54", "Finn"],
    ["695F62", "Scorpion"],
    ["697E9A", "Lynch"],
    ["6A442E", "Spice"],
    ["6A5D1B", "Himalaya"],
    ["6A6051", "Soya Bean"],
    ["6B2A14", "Hairy Heath"],
    ["6B3FA0", "Royal Purple"],
    ["6B4E31", "Shingle Fawn"],
    ["6B5755", "Dorado"],
    ["6B8BA2", "Bermuda Gray"],
    ["6B8E23", "Olive Drab"],
    ["6C3082", "Eminence"],
    ["6CDAE7", "Turquoise Blue"],
    ["6D0101", "Lonestar"],
    ["6D5E54", "Pine Cone"],
    ["6D6C6C", "Dove Gray"],
    ["6D9292", "Juniper"],
    ["6D92A1", "Gothic"],
    ["6E0902", "Red Oxide"],
    ["6E1D14", "Moccaccino"],
    ["6E4826", "Pickled Bean"],
    ["6E4B26", "Dallas"],
    ["6E6D57", "Kokoda"],
    ["6E7783", "Pale Sky"],
    ["6F440C", "Cafe Royale"],
    ["6F6A61", "Flint"],
    ["6F8E63", "Highland"],
    ["6F9D02", "Limeade"],
    ["6FD0C5", "Downy"],
    ["701C1C", "Persian Plum"],
    ["704214", "Sepia"],
    ["704A07", "Antique Bronze"],
    ["704F50", "Ferra"],
    ["706555", "Coffee"],
    ["708090", "Slate Gray"],
    ["711A00", "Cedar Wood Finish"],
    ["71291D", "Metallic Copper"],
    ["714693", "Affair"],
    ["714AB2", "Studio"],
    ["715D47", "Tobacco Brown"],
    ["716338", "Yellow Metal"],
    ["716B56", "Peat"],
    ["716E10", "Olivetone"],
    ["717486", "Storm Gray"],
    ["718080", "Sirocco"],
    ["71D9E2", "Aquamarine Blue"],
    ["72010F", "Venetian Red"],
    ["724A2F", "Old Copper"],
    ["726D4E", "Go Ben"],
    ["727B89", "Raven"],
    ["731E8F", "Seance"],
    ["734A12", "Raw Umber"],
    ["736C9F", "Kimberly"],
    ["736D58", "Crocodile"],
    ["737829", "Crete"],
    ["738678", "Xanadu"],
    ["74640D", "Spicy Mustard"],
    ["747D63", "Limed Ash"],
    ["747D83", "Rolling Stone"],
    ["748881", "Blue Smoke"],
    ["749378", "Laurel"],
    ["74C365", "Mantis"],
    ["755A57", "Russett"],
    ["7563A8", "Deluge"],
    ["76395D", "Cosmic"],
    ["7666C6", "Blue Marguerite"],
    ["76BD17", "Lima"],
    ["76D7EA", "Sky Blue"],
    ["770F05", "Dark Burgundy"],
    ["771F1F", "Crown of Thorns"],
    ["773F1A", "Walnut"],
    ["776F61", "Pablo"],
    ["778120", "Pacifika"],
    ["779E86", "Oxley"],
    ["77DD77", "Pastel Green"],
    ["780109", "Japanese Maple"],
    ["782D19", "Mocha"],
    ["782F16", "Peanut"],
    ["78866B", "Camouflage Green"],
    ["788A25", "Wasabi"],
    ["788BBA", "Ship Cove"],
    ["78A39C", "Sea Nymph"],
    ["795D4C", "Roman Coffee"],
    ["796878", "Old Lavender"],
    ["796989", "Rum"],
    ["796A78", "Fedora"],
    ["796D62", "Sandstone"],
    ["79DEEC", "Spray"],
    ["7A013A", "Siren"],
    ["7A58C1", "Fuchsia Blue"],
    ["7A7A7A", "Boulder"],
    ["7A89B8", "Wild Blue Yonder"],
    ["7AC488", "De York"],
    ["7B3801", "Red Beech"],
    ["7B3F00", "Cinnamon"],
    ["7B6608", "Yukon Gold"],
    ["7B7874", "Tapa"],
    ["7B7C94", "Waterloo "],
    ["7B8265", "Flax Smoke"],
    ["7B9F80", "Amulet"],
    ["7BA05B", "Asparagus"],
    ["7C1C05", "Kenyan Copper"],
    ["7C7631", "Pesto"],
    ["7C778A", "Topaz"],
    ["7C7B7A", "Concord"],
    ["7C7B82", "Jumbo"],
    ["7C881A", "Trendy Green"],
    ["7CA1A6", "Gumbo"],
    ["7CB0A1", "Acapulco"],
    ["7CB7BB", "Neptune"],
    ["7D2C14", "Pueblo"],
    ["7DA98D", "Bay Leaf"],
    ["7DC8F7", "Malibu"],
    ["7DD8C6", "Bermuda"],
    ["7E3A15", "Copper Canyon"],
    ["7F1734", "Claret"],
    ["7F3A02", "Peru Tan"],
    ["7F626D", "Falcon"],
    ["7F7589", "Mobster"],
    ["7F76D3", "Moody Blue"],
    ["7FFF00", "Chartreuse"],
    ["7FFFD4", "Aquamarine"],
    ["800000", "Maroon"],
    ["800B47", "Rose Bud Cherry"],
    ["801818", "Falu Red"],
    ["80341F", "Red Robin"],
    ["803790", "Vivid Violet"],
    ["80461B", "Russet"],
    ["807E79", "Friar Gray"],
    ["808000", "Olive"],
    ["808080", "Gray"],
    ["80B3AE", "Gulf Stream"],
    ["80B3C4", "Glacier"],
    ["80CCEA", "Seagull"],
    ["81422C", "Nutmeg"],
    ["816E71", "Spicy Pink"],
    ["817377", "Empress"],
    ["819885", "Spanish Green"],
    ["826F65", "Sand Dune"],
    ["828685", "Gunsmoke"],
    ["828F72", "Battleship Gray"],
    ["831923", "Merlot"],
    ["837050", "Shadow"],
    ["83AA5D", "Chelsea Cucumber"],
    ["83D0C6", "Monte Carlo"],
    ["843179", "Plum"],
    ["84A0A0", "Granny Smith"],
    ["8581D9", "Chetwode Blue"],
    ["858470", "Bandicoot"],
    ["859FAF", "Bali Hai"],
    ["85C4CC", "Half Baked"],
    ["860111", "Red Devil"],
    ["863C3C", "Lotus"],
    ["86483C", "Ironstone"],
    ["864D1E", "Bull Shot"],
    ["86560A", "Rusty Nail"],
    ["868974", "Bitter"],
    ["86949F", "Regent Gray"],
    ["871550", "Disco"],
    ["87756E", "Americano"],
    ["877C7B", "Hurricane"],
    ["878D91", "Oslo Gray"],
    ["87AB39", "Sushi"],
    ["885342", "Spicy Mix"],
    ["886221", "Kumera"],
    ["888387", "Suva Gray"],
    ["888D65", "Avocado"],
    ["893456", "Camelot"],
    ["893843", "Solid Pink"],
    ["894367", "Cannon Pink"],
    ["897D6D", "Makara"],
    ["8A3324", "Burnt Umber"],
    ["8A73D6", "True V"],
    ["8A8360", "Clay Creek"],
    ["8A8389", "Monsoon"],
    ["8A8F8A", "Stack"],
    ["8AB9F1", "Jordy Blue"],
    ["8B00FF", "Electric Violet"],
    ["8B0723", "Monarch"],
    ["8B6B0B", "Corn Harvest"],
    ["8B8470", "Olive Haze"],
    ["8B847E", "Schooner"],
    ["8B8680", "Natural Gray"],
    ["8B9C90", "Mantle"],
    ["8B9FEE", "Portage"],
    ["8BA690", "Envy"],
    ["8BA9A5", "Cascade"],
    ["8BE6D8", "Riptide"],
    ["8C055E", "Cardinal Pink"],
    ["8C472F", "Mule Fawn"],
    ["8C5738", "Potters Clay"],
    ["8C6495", "Trendy Pink"],
    ["8D0226", "Paprika"],
    ["8D3D38", "Sanguine Brown"],
    ["8D3F3F", "Tosca"],
    ["8D7662", "Cement"],
    ["8D8974", "Granite Green"],
    ["8D90A1", "Manatee"],
    ["8DA8CC", "Polo Blue"],
    ["8E0000", "Red Berry"],
    ["8E4D1E", "Rope"],
    ["8E6F70", "Opium"],
    ["8E775E", "Domino"],
    ["8E8190", "Mamba"],
    ["8EABC1", "Nepal"],
    ["8F021C", "Pohutukawa"],
    ["8F3E33", "El Salva"],
    ["8F4B0E", "Korma"],
    ["8F8176", "Squirrel"],
    ["8FD6B4", "Vista Blue"],
    ["900020", "Burgundy"],
    ["901E1E", "Old Brick"],
    ["907874", "Hemp"],
    ["907B71", "Almond Frost"],
    ["908D39", "Sycamore"],
    ["92000A", "Sangria"],
    ["924321", "Cumin"],
    ["926F5B", "Beaver"],
    ["928573", "Stonewall"],
    ["928590", "Venus"],
    ["9370DB", "Medium Purple"],
    ["93CCEA", "Cornflower"],
    ["93DFB8", "Algae Green"],
    ["944747", "Copper Rust"],
    ["948771", "Arrowtown"],
    ["950015", "Scarlett"],
    ["956387", "Strikemaster"],
    ["959396", "Mountain Mist"],
    ["960018", "Carmine"],
    ["964B00", "Brown"],
    ["967059", "Leather"],
    ["9678B6", "Purple Mountain's Majesty"],
    ["967BB6", "Lavender Purple"],
    ["96A8A1", "Pewter"],
    ["96BBAB", "Summer Green"],
    ["97605D", "Au Chico"],
    ["9771B5", "Wisteria"],
    ["97CD2D", "Atlantis"],
    ["983D61", "Vin Rouge"],
    ["9874D3", "Lilac Bush"],
    ["98777B", "Bazaar"],
    ["98811B", "Hacienda"],
    ["988D77", "Pale Oyster"],
    ["98FF98", "Mint Green"],
    ["990066", "Fresh Eggplant"],
    ["991199", "Violet Eggplant"],
    ["991613", "Tamarillo"],
    ["991B07", "Totem Pole"],
    ["996666", "Copper Rose"],
    ["9966CC", "Amethyst"],
    ["997A8D", "Mountbatten Pink"],
    ["9999CC", "Blue Bell"],
    ["9A3820", "Prairie Sand"],
    ["9A6E61", "Toast"],
    ["9A9577", "Gurkha"],
    ["9AB973", "Olivine"],
    ["9AC2B8", "Shadow Green"],
    ["9B4703", "Oregon"],
    ["9B9E8F", "Lemon Grass"],
    ["9C3336", "Stiletto"],
    ["9D5616", "Hawaiian Tan"],
    ["9DACB7", "Gull Gray"],
    ["9DC209", "Pistachio"],
    ["9DE093", "Granny Smith Apple"],
    ["9DE5FF", "Anakiwa"],
    ["9E5302", "Chelsea Gem"],
    ["9E5B40", "Sepia Skin"],
    ["9EA587", "Sage"],
    ["9EA91F", "Citron"],
    ["9EB1CD", "Rock Blue"],
    ["9EDEE0", "Morning Glory"],
    ["9F381D", "Cognac"],
    ["9F821C", "Reef Gold"],
    ["9F9F9C", "Star Dust"],
    ["9FA0B1", "Santas Gray"],
    ["9FD7D3", "Sinbad"],
    ["9FDD8C", "Feijoa"],
    ["A02712", "Tabasco"],
    ["A1750D", "Buttered Rum"],
    ["A1ADB5", "Hit Gray"],
    ["A1C50A", "Citrus"],
    ["A1DAD7", "Aqua Island"],
    ["A1E9DE", "Water Leaf"],
    ["A2006D", "Flirt"],
    ["A23B6C", "Rouge"],
    ["A26645", "Cape Palliser"],
    ["A2AAB3", "Gray Chateau"],
    ["A2AEAB", "Edward"],
    ["A3807B", "Pharlap"],
    ["A397B4", "Amethyst Smoke"],
    ["A3E3ED", "Blizzard Blue"],
    ["A4A49D", "Delta"],
    ["A4A6D3", "Wistful"],
    ["A4AF6E", "Green Smoke"],
    ["A50B5E", "Jazzberry Jam"],
    ["A59B91", "Zorba"],
    ["A5CB0C", "Bahia"],
    ["A62F20", "Roof Terracotta"],
    ["A65529", "Paarl"],
    ["A68B5B", "Barley Corn"],
    ["A69279", "Donkey Brown"],
    ["A6A29A", "Dawn"],
    ["A72525", "Mexican Red"],
    ["A7882C", "Luxor Gold"],
    ["A85307", "Rich Gold"],
    ["A86515", "Reno Sand"],
    ["A86B6B", "Coral Tree"],
    ["A8989B", "Dusty Gray"],
    ["A899E6", "Dull Lavender"],
    ["A8A589", "Tallow"],
    ["A8AE9C", "Bud"],
    ["A8AF8E", "Locust"],
    ["A8BD9F", "Norway"],
    ["A8E3BD", "Chinook"],
    ["A9A491", "Gray Olive"],
    ["A9ACB6", "Aluminium"],
    ["A9B2C3", "Cadet Blue"],
    ["A9B497", "Schist"],
    ["A9BDBF", "Tower Gray"],
    ["A9BEF2", "Perano"],
    ["A9C6C2", "Opal"],
    ["AA375A", "Night Shadz"],
    ["AA4203", "Fire"],
    ["AA8B5B", "Muesli"],
    ["AA8D6F", "Sandal"],
    ["AAA5A9", "Shady Lady"],
    ["AAA9CD", "Logan"],
    ["AAABB7", "Spun Pearl"],
    ["AAD6E6", "Regent St Blue"],
    ["AAF0D1", "Magic Mint"],
    ["AB0563", "Lipstick"],
    ["AB3472", "Royal Heath"],
    ["AB917A", "Sandrift"],
    ["ABA0D9", "Cold Purple"],
    ["ABA196", "Bronco"],
    ["AC8A56", "Limed Oak"],
    ["AC91CE", "East Side"],
    ["AC9E22", "Lemon Ginger"],
    ["ACA494", "Napa"],
    ["ACA586", "Hillary"],
    ["ACA59F", "Cloudy"],
    ["ACACAC", "Silver Chalice"],
    ["ACB78E", "Swamp Green"],
    ["ACCBB1", "Spring Rain"],
    ["ACDD4D", "Conifer"],
    ["ACE1AF", "Celadon"],
    ["AD781B", "Mandalay"],
    ["ADBED1", "Casper"],
    ["ADDFAD", "Moss Green"],
    ["ADE6C4", "Padua"],
    ["ADFF2F", "Green Yellow"],
    ["AE4560", "Hippie Pink"],
    ["AE6020", "Desert"],
    ["AE809E", "Bouquet"],
    ["AF4035", "Medium Carmine"],
    ["AF4D43", "Apple Blossom"],
    ["AF593E", "Brown Rust"],
    ["AF8751", "Driftwood"],
    ["AF8F2C", "Alpine"],
    ["AF9F1C", "Lucky"],
    ["AFA09E", "Martini"],
    ["AFB1B8", "Bombay"],
    ["AFBDD9", "Pigeon Post"],
    ["B04C6A", "Cadillac"],
    ["B05D54", "Matrix"],
    ["B05E81", "Tapestry"],
    ["B06608", "Mai Tai"],
    ["B09A95", "Del Rio"],
    ["B0E0E6", "Powder Blue"],
    ["B0E313", "Inch Worm"],
    ["B10000", "Bright Red"],
    ["B14A0B", "Vesuvius"],
    ["B1610B", "Pumpkin Skin"],
    ["B16D52", "Santa Fe"],
    ["B19461", "Teak"],
    ["B1E2C1", "Fringy Flower"],
    ["B1F4E7", "Ice Cold"],
    ["B20931", "Shiraz"],
    ["B2A1EA", "Biloba Flower"],
    ["B32D29", "Tall Poppy"],
    ["B35213", "Fiery Orange"],
    ["B38007", "Hot Toddy"],
    ["B3AF95", "Taupe Gray"],
    ["B3C110", "La Rioja"],
    ["B43332", "Well Read"],
    ["B44668", "Blush"],
    ["B4CFD3", "Jungle Mist"],
    ["B57281", "Turkish Rose"],
    ["B57EDC", "Lavender"],
    ["B5A27F", "Mongoose"],
    ["B5B35C", "Olive Green"],
    ["B5D2CE", "Jet Stream"],
    ["B5ECDF", "Cruise"],
    ["B6316C", "Hibiscus"],
    ["B69D98", "Thatch"],
    ["B6B095", "Heathered Gray"],
    ["B6BAA4", "Eagle"],
    ["B6D1EA", "Spindle"],
    ["B6D3BF", "Gum Leaf"],
    ["B7410E", "Rust"],
    ["B78E5C", "Muddy Waters"],
    ["B7A214", "Sahara"],
    ["B7A458", "Husk"],
    ["B7B1B1", "Nobel"],
    ["B7C3D0", "Heather"],
    ["B7F0BE", "Madang"],
    ["B81104", "Milano Red"],
    ["B87333", "Copper"],
    ["B8B56A", "Gimblet"],
    ["B8C1B1", "Green Spring"],
    ["B8C25D", "Celery"],
    ["B8E0F9", "Sail"],
    ["B94E48", "Chestnut"],
    ["B95140", "Crail"],
    ["B98D28", "Marigold"],
    ["B9C46A", "Wild Willow"],
    ["B9C8AC", "Rainee"],
    ["BA0101", "Guardsman Red"],
    ["BA450C", "Rock Spray"],
    ["BA6F1E", "Bourbon"],
    ["BA7F03", "Pirate Gold"],
    ["BAB1A2", "Nomad"],
    ["BAC7C9", "Submarine"],
    ["BAEEF9", "Charlotte"],
    ["BB3385", "Medium Red Violet"],
    ["BB8983", "Brandy Rose"],
    ["BBD009", "Rio Grande"],
    ["BBD7C1", "Surf"],
    ["BCC9C2", "Powder Ash"],
    ["BD5E2E", "Tuscany"],
    ["BD978E", "Quicksand"],
    ["BDB1A8", "Silk"],
    ["BDB2A1", "Malta"],
    ["BDB3C7", "Chatelle"],
    ["BDBBD7", "Lavender Gray"],
    ["BDBDC6", "French Gray"],
    ["BDC8B3", "Clay Ash"],
    ["BDC9CE", "Loblolly"],
    ["BDEDFD", "French Pass"],
    ["BEA6C3", "London Hue"],
    ["BEB5B7", "Pink Swan"],
    ["BEDE0D", "Fuego"],
    ["BF5500", "Rose of Sharon"],
    ["BFB8B0", "Tide"],
    ["BFBED8", "Blue Haze"],
    ["BFC1C2", "Silver Sand"],
    ["BFC921", "Key Lime Pie"],
    ["BFDBE2", "Ziggurat"],
    ["BFFF00", "Lime"],
    ["C02B18", "Thunderbird"],
    ["C04737", "Mojo"],
    ["C08081", "Old Rose"],
    ["C0C0C0", "Silver"],
    ["C0D3B9", "Pale Leaf"],
    ["C0D8B6", "Pixie Green"],
    ["C1440E", "Tia Maria"],
    ["C154C1", "Fuchsia Pink"],
    ["C1A004", "Buddha Gold"],
    ["C1B7A4", "Bison Hide"],
    ["C1BAB0", "Tea"],
    ["C1BECD", "Gray Suit"],
    ["C1D7B0", "Sprout"],
    ["C1F07C", "Sulu"],
    ["C26B03", "Indochine"],
    ["C2955D", "Twine"],
    ["C2BDB6", "Cotton Seed"],
    ["C2CAC4", "Pumice"],
    ["C2E8E5", "Jagged Ice"],
    ["C32148", "Maroon Flush"],
    ["C3B091", "Indian Khaki"],
    ["C3BFC1", "Pale Slate"],
    ["C3C3BD", "Gray Nickel"],
    ["C3CDE6", "Periwinkle Gray"],
    ["C3D1D1", "Tiara"],
    ["C3DDF9", "Tropical Blue"],
    ["C41E3A", "Cardinal"],
    ["C45655", "Fuzzy Wuzzy Brown"],
    ["C45719", "Orange Roughy"],
    ["C4C4BC", "Mist Gray"],
    ["C4D0B0", "Coriander"],
    ["C4F4EB", "Mint Tulip"],
    ["C54B8C", "Mulberry"],
    ["C59922", "Nugget"],
    ["C5994B", "Tussock"],
    ["C5DBCA", "Sea Mist"],
    ["C5E17A", "Yellow Green"],
    ["C62D42", "Brick Red"],
    ["C6726B", "Contessa"],
    ["C69191", "Oriental Pink"],
    ["C6A84B", "Roti"],
    ["C6C3B5", "Ash"],
    ["C6C8BD", "Kangaroo"],
    ["C6E610", "Las Palmas"],
    ["C7031E", "Monza"],
    ["C71585", "Red Violet"],
    ["C7BCA2", "Coral Reef"],
    ["C7C1FF", "Melrose"],
    ["C7C4BF", "Cloud"],
    ["C7C9D5", "Ghost"],
    ["C7CD90", "Pine Glade"],
    ["C7DDE5", "Botticelli"],
    ["C88A65", "Antique Brass"],
    ["C8A2C8", "Lilac"],
    ["C8A528", "Hokey Pokey"],
    ["C8AABF", "Lily"],
    ["C8B568", "Laser"],
    ["C8E3D7", "Edgewater"],
    ["C96323", "Piper"],
    ["C99415", "Pizza"],
    ["C9A0DC", "Light Wisteria"],
    ["C9B29B", "Rodeo Dust"],
    ["C9B35B", "Sundance"],
    ["C9B93B", "Earls Green"],
    ["C9C0BB", "Silver Rust"],
    ["C9D9D2", "Conch"],
    ["C9FFA2", "Reef"],
    ["C9FFE5", "Aero Blue"],
    ["CA3435", "Flush Mahogany"],
    ["CABB48", "Turmeric"],
    ["CADCD4", "Paris White"],
    ["CAE00D", "Bitter Lemon"],
    ["CAE6DA", "Skeptic"],
    ["CB8FA9", "Viola"],
    ["CBCAB6", "Foggy Gray"],
    ["CBD3B0", "Green Mist"],
    ["CBDBD6", "Nebula"],
    ["CC3333", "Persian Red"],
    ["CC5500", "Burnt Orange"],
    ["CC7722", "Ochre"],
    ["CC8899", "Puce"],
    ["CCCAA8", "Thistle Green"],
    ["CCCCFF", "Periwinkle"],
    ["CCFF00", "Electric Lime"],
    ["CD5700", "Tenn"],
    ["CD5C5C", "Chestnut Rose"],
    ["CD8429", "Brandy Punch"],
    ["CDF4FF", "Onahau"],
    ["CEB98F", "Sorrell Brown"],
    ["CEBABA", "Cold Turkey"],
    ["CEC291", "Yuma"],
    ["CEC7A7", "Chino"],
    ["CFA39D", "Eunry"],
    ["CFB53B", "Old Gold"],
    ["CFDCCF", "Tasman"],
    ["CFE5D2", "Surf Crest"],
    ["CFF9F3", "Humming Bird"],
    ["CFFAF4", "Scandal"],
    ["D05F04", "Red Stage"],
    ["D06DA1", "Hopbush"],
    ["D07D12", "Meteor"],
    ["D0BEF8", "Perfume"],
    ["D0C0E5", "Prelude"],
    ["D0F0C0", "Tea Green"],
    ["D18F1B", "Geebung"],
    ["D1BEA8", "Vanilla"],
    ["D1C6B4", "Soft Amber"],
    ["D1D2CA", "Celeste"],
    ["D1D2DD", "Mischka"],
    ["D1E231", "Pear"],
    ["D2691E", "Hot Cinnamon"],
    ["D27D46", "Raw Sienna"],
    ["D29EAA", "Careys Pink"],
    ["D2B48C", "Tan"],
    ["D2DA97", "Deco"],
    ["D2F6DE", "Blue Romance"],
    ["D2F8B0", "Gossip"],
    ["D3CBBA", "Sisal"],
    ["D3CDC5", "Swirl"],
    ["D47494", "Charm"],
    ["D4B6AF", "Clam Shell"],
    ["D4BF8D", "Straw"],
    ["D4C4A8", "Akaroa"],
    ["D4CD16", "Bird Flower"],
    ["D4D7D9", "Iron"],
    ["D4DFE2", "Geyser"],
    ["D4E2FC", "Hawkes Blue"],
    ["D54600", "Grenadier"],
    ["D591A4", "Can Can"],
    ["D59A6F", "Whiskey"],
    ["D5D195", "Winter Hazel"],
    ["D5F6E3", "Granny Apple"],
    ["D69188", "My Pink"],
    ["D6C562", "Tacha"],
    ["D6CEF6", "Moon Raker"],
    ["D6D6D1", "Quill Gray"],
    ["D6FFDB", "Snowy Mint"],
    ["D7837F", "New York Pink"],
    ["D7C498", "Pavlova"],
    ["D7D0FF", "Fog"],
    ["D84437", "Valencia"],
    ["D87C63", "Japonica"],
    ["D8BFD8", "Thistle"],
    ["D8C2D5", "Maverick"],
    ["D8FCFA", "Foam"],
    ["D94972", "Cabaret"],
    ["D99376", "Burning Sand"],
    ["D9B99B", "Cameo"],
    ["D9D6CF", "Timberwolf"],
    ["D9DCC1", "Tana"],
    ["D9E4F5", "Link Water"],
    ["D9F7FF", "Mabel"],
    ["DA3287", "Cerise"],
    ["DA5B38", "Flame Pea"],
    ["DA6304", "Bamboo"],
    ["DA6A41", "Red Damask"],
    ["DA70D6", "Orchid"],
    ["DA8A67", "Copperfield"],
    ["DAA520", "Golden Grass"],
    ["DAECD6", "Zanah"],
    ["DAF4F0", "Iceberg"],
    ["DAFAFF", "Oyster Bay"],
    ["DB5079", "Cranberry"],
    ["DB9690", "Petite Orchid"],
    ["DB995E", "Di Serria"],
    ["DBDBDB", "Alto"],
    ["DBFFF8", "Frosted Mint"],
    ["DC143C", "Crimson"],
    ["DC4333", "Punch"],
    ["DCB20C", "Galliano"],
    ["DCB4BC", "Blossom"],
    ["DCD747", "Wattle"],
    ["DCD9D2", "Westar"],
    ["DCDDCC", "Moon Mist"],
    ["DCEDB4", "Caper"],
    ["DCF0EA", "Swans Down"],
    ["DDD6D5", "Swiss Coffee"],
    ["DDF9F1", "White Ice"],
    ["DE3163", "Cerise Red"],
    ["DE6360", "Roman"],
    ["DEA681", "Tumbleweed"],
    ["DEBA13", "Gold Tips"],
    ["DEC196", "Brandy"],
    ["DECBC6", "Wafer"],
    ["DED4A4", "Sapling"],
    ["DED717", "Barberry"],
    ["DEE5C0", "Beryl Green"],
    ["DEF5FF", "Pattens Blue"],
    ["DF73FF", "Heliotrope"],
    ["DFBE6F", "Apache"],
    ["DFCD6F", "Chenin"],
    ["DFCFDB", "Lola"],
    ["DFECDA", "Willow Brook"],
    ["DFFF00", "Chartreuse Yellow"],
    ["E0B0FF", "Mauve"],
    ["E0B646", "Anzac"],
    ["E0B974", "Harvest Gold"],
    ["E0C095", "Calico"],
    ["E0FFFF", "Baby Blue"],
    ["E16865", "Sunglo"],
    ["E1BC64", "Equator"],
    ["E1C0C8", "Pink Flare"],
    ["E1E6D6", "Periglacial Blue"],
    ["E1EAD4", "Kidnapper"],
    ["E1F6E8", "Tara"],
    ["E25465", "Mandy"],
    ["E2725B", "Terracotta"],
    ["E28913", "Golden Bell"],
    ["E292C0", "Shocking"],
    ["E29418", "Dixie"],
    ["E29CD2", "Light Orchid"],
    ["E2D8ED", "Snuff"],
    ["E2EBED", "Mystic"],
    ["E2F3EC", "Apple Green"],
    ["E30B5C", "Razzmatazz"],
    ["E32636", "Alizarin Crimson"],
    ["E34234", "Cinnabar"],
    ["E3BEBE", "Cavern Pink"],
    ["E3F5E1", "Peppermint"],
    ["E3F988", "Mindaro"],
    ["E47698", "Deep Blush"],
    ["E49B0F", "Gamboge"],
    ["E4C2D5", "Melanie"],
    ["E4CFDE", "Twilight"],
    ["E4D1C0", "Bone"],
    ["E4D422", "Sunflower"],
    ["E4D5B7", "Grain Brown"],
    ["E4D69B", "Zombie"],
    ["E4F6E7", "Frostee"],
    ["E4FFD1", "Snow Flurry"],
    ["E52B50", "Amaranth"],
    ["E5841B", "Zest"],
    ["E5CCC9", "Dust Storm"],
    ["E5D7BD", "Stark White"],
    ["E5D8AF", "Hampton"],
    ["E5E0E1", "Bon Jour"],
    ["E5E5E5", "Mercury"],
    ["E5F9F6", "Polar"],
    ["E64E03", "Trinidad"],
    ["E6BE8A", "Gold Sand"],
    ["E6BEA5", "Cashmere"],
    ["E6D7B9", "Double Spanish White"],
    ["E6E4D4", "Satin Linen"],
    ["E6F2EA", "Harp"],
    ["E6F8F3", "Off Green"],
    ["E6FFE9", "Hint of Green"],
    ["E6FFFF", "Tranquil"],
    ["E77200", "Mango Tango"],
    ["E7730A", "Christine"],
    ["E79F8C", "Tonys Pink"],
    ["E79FC4", "Kobi"],
    ["E7BCB4", "Rose Fog"],
    ["E7BF05", "Corn"],
    ["E7CD8C", "Putty"],
    ["E7ECE6", "Gray Nurse"],
    ["E7F8FF", "Lily White"],
    ["E7FEFF", "Bubbles"],
    ["E89928", "Fire Bush"],
    ["E8B9B3", "Shilo"],
    ["E8E0D5", "Pearl Bush"],
    ["E8EBE0", "Green White"],
    ["E8F1D4", "Chrome White"],
    ["E8F2EB", "Gin"],
    ["E8F5F2", "Aqua Squeeze"],
    ["E96E00", "Clementine"],
    ["E97451", "Burnt Sienna"],
    ["E97C07", "Tahiti Gold"],
    ["E9CECD", "Oyster Pink"],
    ["E9D75A", "Confetti"],
    ["E9E3E3", "Ebb"],
    ["E9F8ED", "Ottoman"],
    ["E9FFFD", "Clear Day"],
    ["EA88A8", "Carissma"],
    ["EAAE69", "Porsche"],
    ["EAB33B", "Tulip Tree"],
    ["EAC674", "Rob Roy"],
    ["EADAB8", "Raffia"],
    ["EAE8D4", "White Rock"],
    ["EAF6EE", "Panache"],
    ["EAF6FF", "Solitude"],
    ["EAF9F5", "Aqua Spring"],
    ["EAFFFE", "Dew"],
    ["EB9373", "Apricot"],
    ["EBC2AF", "Zinnwaldite"],
    ["ECA927", "Fuel Yellow"],
    ["ECC54E", "Ronchi"],
    ["ECC7EE", "French Lilac"],
    ["ECCDB9", "Just Right"],
    ["ECE090", "Wild Rice"],
    ["ECEBBD", "Fall Green"],
    ["ECEBCE", "Aths Special"],
    ["ECF245", "Starship"],
    ["ED0A3F", "Red Ribbon"],
    ["ED7A1C", "Tango"],
    ["ED9121", "Carrot Orange"],
    ["ED989E", "Sea Pink"],
    ["EDB381", "Tacao"],
    ["EDC9AF", "Desert Sand"],
    ["EDCDAB", "Pancho"],
    ["EDDCB1", "Chamois"],
    ["EDEA99", "Primrose"],
    ["EDF5DD", "Frost"],
    ["EDF5F5", "Aqua Haze"],
    ["EDF6FF", "Zumthor"],
    ["EDF9F1", "Narvik"],
    ["EDFC84", "Honeysuckle"],
    ["EE82EE", "Lavender Magenta"],
    ["EEC1BE", "Beauty Bush"],
    ["EED794", "Chalky"],
    ["EED9C4", "Almond"],
    ["EEDC82", "Flax"],
    ["EEDEDA", "Bizarre"],
    ["EEE3AD", "Double Colonial White"],
    ["EEEEE8", "Cararra"],
    ["EEEF78", "Manz"],
    ["EEF0C8", "Tahuna Sands"],
    ["EEF0F3", "Athens Gray"],
    ["EEF3C3", "Tusk"],
    ["EEF4DE", "Loafer"],
    ["EEF6F7", "Catskill White"],
    ["EEFDFF", "Twilight Blue"],
    ["EEFF9A", "Jonquil"],
    ["EEFFE2", "Rice Flower"],
    ["EF863F", "Jaffa"],
    ["EFEFEF", "Gallery"],
    ["EFF2F3", "Porcelain"],
    ["F091A9", "Mauvelous"],
    ["F0D52D", "Golden Dream"],
    ["F0DB7D", "Golden Sand"],
    ["F0DC82", "Buff"],
    ["F0E2EC", "Prim"],
    ["F0E68C", "Khaki"],
    ["F0EEFD", "Selago"],
    ["F0EEFF", "Titan White"],
    ["F0F8FF", "Alice Blue"],
    ["F0FCEA", "Feta"],
    ["F18200", "Gold Drop"],
    ["F19BAB", "Wewak"],
    ["F1E788", "Sahara Sand"],
    ["F1E9D2", "Parchment"],
    ["F1E9FF", "Blue Chalk"],
    ["F1EEC1", "Mint Julep"],
    ["F1F1F1", "Seashell"],
    ["F1F7F2", "Saltpan"],
    ["F1FFAD", "Tidal"],
    ["F1FFC8", "Chiffon"],
    ["F2552A", "Flamingo"],
    ["F28500", "Tangerine"],
    ["F2C3B2", "Mandys Pink"],
    ["F2F2F2", "Concrete"],
    ["F2FAFA", "Black Squeeze"],
    ["F34723", "Pomegranate"],
    ["F3AD16", "Buttercup"],
    ["F3D69D", "New Orleans"],
    ["F3D9DF", "Vanilla Ice"],
    ["F3E7BB", "Sidecar"],
    ["F3E9E5", "Dawn Pink"],
    ["F3EDCF", "Wheatfield"],
    ["F3FB62", "Canary"],
    ["F3FBD4", "Orinoco"],
    ["F3FFD8", "Carla"],
    ["F400A1", "Hollywood Cerise"],
    ["F4A460", "Sandy brown"],
    ["F4C430", "Saffron"],
    ["F4D81C", "Ripe Lemon"],
    ["F4EBD3", "Janna"],
    ["F4F2EE", "Pampas"],
    ["F4F4F4", "Wild Sand"],
    ["F4F8FF", "Zircon"],
    ["F57584", "Froly"],
    ["F5C85C", "Cream Can"],
    ["F5C999", "Manhattan"],
    ["F5D5A0", "Maize"],
    ["F5DEB3", "Wheat"],
    ["F5E7A2", "Sandwisp"],
    ["F5E7E2", "Pot Pourri"],
    ["F5E9D3", "Albescent White"],
    ["F5EDEF", "Soft Peach"],
    ["F5F3E5", "Ecru White"],
    ["F5F5DC", "Beige"],
    ["F5FB3D", "Golden Fizz"],
    ["F5FFBE", "Australian Mint"],
    ["F64A8A", "French Rose"],
    ["F653A6", "Brilliant Rose"],
    ["F6A4C9", "Illusion"],
    ["F6F0E6", "Merino"],
    ["F6F7F7", "Black Haze"],
    ["F6FFDC", "Spring Sun"],
    ["F7468A", "Violet Red"],
    ["F77703", "Chilean Fire"],
    ["F77FBE", "Persian Pink"],
    ["F7B668", "Rajah"],
    ["F7C8DA", "Azalea"],
    ["F7DBE6", "We Peep"],
    ["F7F2E1", "Quarter Spanish White"],
    ["F7F5FA", "Whisper"],
    ["F7FAF7", "Snow Drift"],
    ["F8B853", "Casablanca"],
    ["F8C3DF", "Chantilly"],
    ["F8D9E9", "Cherub"],
    ["F8DB9D", "Marzipan"],
    ["F8DD5C", "Energy Yellow"],
    ["F8E4BF", "Givry"],
    ["F8F0E8", "White Linen"],
    ["F8F4FF", "Magnolia"],
    ["F8F6F1", "Spring Wood"],
    ["F8F7DC", "Coconut Cream"],
    ["F8F7FC", "White Lilac"],
    ["F8F8F7", "Desert Storm"],
    ["F8F99C", "Texas"],
    ["F8FACD", "Corn Field"],
    ["F8FDD3", "Mimosa"],
    ["F95A61", "Carnation"],
    ["F9BF58", "Saffron Mango"],
    ["F9E0ED", "Carousel Pink"],
    ["F9E4BC", "Dairy Cream"],
    ["F9E663", "Portica"],
    ["F9EAF3", "Amour"],
    ["F9F8E4", "Rum Swizzle"],
    ["F9FF8B", "Dolly"],
    ["F9FFF6", "Sugar Cane"],
    ["FA7814", "Ecstasy"],
    ["FA9D5A", "Tan Hide"],
    ["FAD3A2", "Corvette"],
    ["FADFAD", "Peach Yellow"],
    ["FAE600", "Turbo"],
    ["FAEAB9", "Astra"],
    ["FAECCC", "Champagne"],
    ["FAF0E6", "Linen"],
    ["FAF3F0", "Fantasy"],
    ["FAF7D6", "Citrine White"],
    ["FAFAFA", "Alabaster"],
    ["FAFDE4", "Hint of Yellow"],
    ["FAFFA4", "Milan"],
    ["FB607F", "Brink Pink"],
    ["FB8989", "Geraldine"],
    ["FBA0E3", "Lavender Rose"],
    ["FBA129", "Sea Buckthorn"],
    ["FBAC13", "Sun"],
    ["FBAED2", "Lavender Pink"],
    ["FBB2A3", "Rose Bud"],
    ["FBBEDA", "Cupid"],
    ["FBCCE7", "Classic Rose"],
    ["FBCEB1", "Apricot Peach"],
    ["FBE7B2", "Banana Mania"],
    ["FBE870", "Marigold Yellow"],
    ["FBE96C", "Festival"],
    ["FBEA8C", "Sweet Corn"],
    ["FBEC5D", "Candy Corn"],
    ["FBF9F9", "Hint of Red"],
    ["FBFFBA", "Shalimar"],
    ["FC0FC0", "Shocking Pink"],
    ["FC80A5", "Tickle Me Pink"],
    ["FC9C1D", "Tree Poppy"],
    ["FCC01E", "Lightning Yellow"],
    ["FCD667", "Goldenrod"],
    ["FCD917", "Candlelight"],
    ["FCDA98", "Cherokee"],
    ["FCF4D0", "Double Pearl Lusta"],
    ["FCF4DC", "Pearl Lusta"],
    ["FCF8F7", "Vista White"],
    ["FCFBF3", "Bianca"],
    ["FCFEDA", "Moon Glow"],
    ["FCFFE7", "China Ivory"],
    ["FCFFF9", "Ceramic"],
    ["FD0E35", "Torch Red"],
    ["FD5B78", "Wild Watermelon"],
    ["FD7B33", "Crusta"],
    ["FD7C07", "Sorbus"],
    ["FD9FA2", "Sweet Pink"],
    ["FDD5B1", "Light Apricot"],
    ["FDD7E4", "Pig Pink"],
    ["FDE1DC", "Cinderella"],
    ["FDE295", "Golden Glow"],
    ["FDE910", "Lemon"],
    ["FDF5E6", "Old Lace"],
    ["FDF6D3", "Half Colonial White"],
    ["FDF7AD", "Drover"],
    ["FDFEB8", "Pale Prim"],
    ["FDFFD5", "Cumulus"],
    ["FE28A2", "Persian Rose"],
    ["FE4C40", "Sunset Orange"],
    ["FE6F5E", "Bittersweet"],
    ["FE9D04", "California"],
    ["FEA904", "Yellow Sea"],
    ["FEBAAD", "Melon"],
    ["FED33C", "Bright Sun"],
    ["FED85D", "Dandelion"],
    ["FEDB8D", "Salomie"],
    ["FEE5AC", "Cape Honey"],
    ["FEEBF3", "Remy"],
    ["FEEFCE", "Oasis"],
    ["FEF0EC", "Bridesmaid"],
    ["FEF2C7", "Beeswax"],
    ["FEF3D8", "Bleach White"],
    ["FEF4CC", "Pipi"],
    ["FEF4DB", "Half Spanish White"],
    ["FEF4F8", "Wisp Pink"],
    ["FEF5F1", "Provincial Pink"],
    ["FEF7DE", "Half Dutch White"],
    ["FEF8E2", "Solitaire"],
    ["FEF8FF", "White Pointer"],
    ["FEF9E3", "Off Yellow"],
    ["FEFCED", "Orange White"],
    ["FF0000", "Red"],
    ["FF007F", "Rose"],
    ["FF00CC", "Purple Pizzazz"],
    ["FF00FF", "Magenta / Fuchsia"],
    ["FF2400", "Scarlet"],
    ["FF3399", "Wild Strawberry"],
    ["FF33CC", "Razzle Dazzle Rose"],
    ["FF355E", "Radical Red"],
    ["FF3F34", "Red Orange"],
    ["FF4040", "Coral Red"],
    ["FF4D00", "Vermilion"],
    ["FF4F00", "International Orange"],
    ["FF6037", "Outrageous Orange"],
    ["FF6600", "Blaze Orange"],
    ["FF66FF", "Pink Flamingo"],
    ["FF681F", "Orange"],
    ["FF69B4", "Hot Pink"],
    ["FF6B53", "Persimmon"],
    ["FF6FFF", "Blush Pink"],
    ["FF7034", "Burning Orange"],
    ["FF7518", "Pumpkin"],
    ["FF7D07", "Flamenco"],
    ["FF7F00", "Flush Orange"],
    ["FF7F50", "Coral"],
    ["FF8C69", "Salmon"],
    ["FF9000", "Pizazz"],
    ["FF910F", "West Side"],
    ["FF91A4", "Pink Salmon"],
    ["FF9933", "Neon Carrot"],
    ["FF9966", "Atomic Tangerine"],
    ["FF9980", "Vivid Tangerine"],
    ["FF9E2C", "Sunshade"],
    ["FFA000", "Orange Peel"],
    ["FFA194", "Mona Lisa"],
    ["FFA500", "Web Orange"],
    ["FFA6C9", "Carnation Pink"],
    ["FFAB81", "Hit Pink"],
    ["FFAE42", "Yellow Orange"],
    ["FFB0AC", "Cornflower Lilac"],
    ["FFB1B3", "Sundown"],
    ["FFB31F", "My Sin"],
    ["FFB555", "Texas Rose"],
    ["FFB7D5", "Cotton Candy"],
    ["FFB97B", "Macaroni and Cheese"],
    ["FFBA00", "Selective Yellow"],
    ["FFBD5F", "Koromiko"],
    ["FFBF00", "Amber"],
    ["FFC0A8", "Wax Flower"],
    ["FFC0CB", "Pink"],
    ["FFC3C0", "Your Pink"],
    ["FFC901", "Supernova"],
    ["FFCBA4", "Flesh"],
    ["FFCC33", "Sunglow"],
    ["FFCC5C", "Golden Tainoi"],
    ["FFCC99", "Peach Orange"],
    ["FFCD8C", "Chardonnay"],
    ["FFD1DC", "Pastel Pink"],
    ["FFD2B7", "Romantic"],
    ["FFD38C", "Grandis"],
    ["FFD700", "Gold"],
    ["FFD800", "School bus Yellow"],
    ["FFD8D9", "Cosmos"],
    ["FFDB58", "Mustard"],
    ["FFDCD6", "Peach Schnapps"],
    ["FFDDAF", "Caramel"],
    ["FFDDCD", "Tuft Bush"],
    ["FFDDCF", "Watusi"],
    ["FFDDF4", "Pink Lace"],
    ["FFDEAD", "Navajo White"],
    ["FFDEB3", "Frangipani"],
    ["FFE1DF", "Pippin"],
    ["FFE1F2", "Pale Rose"],
    ["FFE2C5", "Negroni"],
    ["FFE5A0", "Cream Brulee"],
    ["FFE5B4", "Peach"],
    ["FFE6C7", "Tequila"],
    ["FFE772", "Kournikova"],
    ["FFEAC8", "Sandy Beach"],
    ["FFEAD4", "Karry"],
    ["FFEC13", "Broom"],
    ["FFEDBC", "Colonial White"],
    ["FFEED8", "Derby"],
    ["FFEFA1", "Vis Vis"],
    ["FFEFC1", "Egg White"],
    ["FFEFD5", "Papaya Whip"],
    ["FFEFEC", "Fair Pink"],
    ["FFF0DB", "Peach Cream"],
    ["FFF0F5", "Lavender blush"],
    ["FFF14F", "Gorse"],
    ["FFF1B5", "Buttermilk"],
    ["FFF1D8", "Pink Lady"],
    ["FFF1EE", "Forget Me Not"],
    ["FFF1F9", "Tutu"],
    ["FFF39D", "Picasso"],
    ["FFF3F1", "Chardon"],
    ["FFF46E", "Paris Daisy"],
    ["FFF4CE", "Barley White"],
    ["FFF4DD", "Egg Sour"],
    ["FFF4E0", "Sazerac"],
    ["FFF4E8", "Serenade"],
    ["FFF4F3", "Chablis"],
    ["FFF5EE", "Seashell Peach"],
    ["FFF5F3", "Sauvignon"],
    ["FFF6D4", "Milk Punch"],
    ["FFF6DF", "Varden"],
    ["FFF6F5", "Rose White"],
    ["FFF8D1", "Baja White"],
    ["FFF9E2", "Gin Fizz"],
    ["FFF9E6", "Early Dawn"],
    ["FFFACD", "Lemon Chiffon"],
    ["FFFAF4", "Bridal Heath"],
    ["FFFBDC", "Scotch Mist"],
    ["FFFBF9", "Soapstone"],
    ["FFFC99", "Witch Haze"],
    ["FFFCEA", "Buttery White"],
    ["FFFCEE", "Island Spice"],
    ["FFFDD0", "Cream"],
    ["FFFDE6", "Chilean Heath"],
    ["FFFDE8", "Travertine"],
    ["FFFDF3", "Orchid White"],
    ["FFFDF4", "Quarter Pearl Lusta"],
    ["FFFEE1", "Half and Half"],
    ["FFFEEC", "Apricot White"],
    ["FFFEF0", "Rice Cake"],
    ["FFFEF6", "Black White"],
    ["FFFEFD", "Romance"],
    ["FFFF00", "Yellow"],
    ["FFFF66", "Laser Lemon"],
    ["FFFF99", "Pale Canary"],
    ["FFFFB4", "Portafino"],
    ["FFFFF0", "Ivory"],
    ["FFFFFF", "White"]
  ]

}

ntc.init();

$(document).ready(function () {
  ntc_main.init();
});

var ntc_main = {

  fb: null,

  init: function () {

    srtnm = ntc.names;
    srtnm.sort(ntc_main.nameSort);
    clrop = new Array();

    for (i = 0; i < srtnm.length; i++) {
      clr = srtnm[i][0];
      rgb = ntc.rgb("#" + clr);
      alt = ((rgb[0] + rgb[1] + rgb[2]) / 3 < 128);
      clrop.push("<option value='" + clr + "' " + (alt ? "class='w'" : "") + "style='background:#" + clr + "'>" + srtnm[i][1] + "</option>");
    }

    $("#colorpick").html("<select id=\"colorop\"><option value=\"\">Select a Color:</option>" + clrop.join() + "</select>");

    ntc_main.fb = $.farbtastic('#picker', ntc_main.setColor);
    $("#colorinp").change(ntc_main.inpColor);
    $("#colorinp").keyup(ntc_main.inpColor);
    $("#colorinp").keydown(ntc_main.inpColor);
    $("#colorop").change(ntc_main.inpColorList);
    ntc_main.setWheel((window.location.hash.length == 7 ? window.location.hash : "#6195ED"));
  },

  inpColor: function () {
    var clr = $("#colorinp").get(0).value;
    if (clr.substring(0, 1) == "#" && clr.length == 7)
      return ntc_main.setWheel(clr);
    if (clr.substring(0, 1) != "#" && clr.length == 6)
      return ntc_main.setWheel("#" + clr);
  },

  inpColorList: function () {
    if ($("#colorop").get(0).value != "")
      return ntc_main.setWheel("#" + $("#colorop").get(0).value);
  },

  nameSort: function (a, b) {
    return (a[1] > b[1] ? 1 : (a[1] < b[1] ? -1 : 0));
  },

  setColor: function (clr) {
    $("#colorbox").css({ backgroundColor: clr });
    var rgb = ntc.rgb(clr);
    $("#colorinp").get(0).value = clr.toUpperCase();
    $("#colorrgb").html("RGB: " + rgb[0] + ", " + rgb[1] + ", " + rgb[2]);

    n_match = ntc.name(clr);
    name = n_match[1];
    lowercase = name.toLowerCase().replace(/\s/g, '');
    hex = $('#colorinp').val();
    // console.log(lowercase);
    $("#colorname").html(n_match[1]);
    $('.variable').html('<code>$' + lowercase + ': ' + hex + ';</code>');
    $("#colorsolid").css({ backgroundColor: n_match[0] });
    window.location.hash = clr.toUpperCase();
  },

  setWheel: function (clr) {
    ntc_main.fb.setColor(clr);
  }

}
/*! modernizr 3.5.0 (Custom Build) | MIT *
 * https://modernizr.com/download/?-setclasses !*/
! function (n, e, s) {
  function o(n, e) {
    return typeof n === e
  }

  function a() {
    var n, e, s, a, i, l, r;
    for (var c in f)
      if (f.hasOwnProperty(c)) {
        if (n = [], e = f[c], e.name && (n.push(e.name.toLowerCase()), e.options && e.options.aliases && e.options.aliases.length))
          for (s = 0; s < e.options.aliases.length; s++) n.push(e.options.aliases[s].toLowerCase());
        for (a = o(e.fn, "function") ? e.fn() : e.fn, i = 0; i < n.length; i++) l = n[i], r = l.split("."), 1 === r.length ? Modernizr[r[0]] = a : (!Modernizr[r[0]] || Modernizr[r[0]] instanceof Boolean || (Modernizr[r[0]] = new Boolean(Modernizr[r[0]])), Modernizr[r[0]][r[1]] = a), t.push((a ? "" : "no-") + r.join("-"))
      }
  }

  function i(n) {
    var e = r.className,
      s = Modernizr._config.classPrefix || "";
    if (c && (e = e.baseVal), Modernizr._config.enableJSClass) {
      var o = new RegExp("(^|\\s)" + s + "no-js(\\s|$)");
      e = e.replace(o, "$1" + s + "js$2")
    }
    Modernizr._config.enableClasses && (e += " " + s + n.join(" " + s), c ? r.className.baseVal = e : r.className = e)
  }
  var t = [],
    f = [],
    l = {
      _version: "3.5.0",
      _config: {
        classPrefix: "",
        enableClasses: !0,
        enableJSClass: !0,
        usePrefixes: !0
      },
      _q: [],
      on: function (n, e) {
        var s = this;
        setTimeout(function () {
          e(s[n])
        }, 0)
      },
      addTest: function (n, e, s) {
        f.push({
          name: n,
          fn: e,
          options: s
        })
      },
      addAsyncTest: function (n) {
        f.push({
          name: null,
          fn: n
        })
      }
    },
    Modernizr = function () {};
  Modernizr.prototype = l, Modernizr = new Modernizr;
  var r = e.documentElement,
    c = "svg" === r.nodeName.toLowerCase();
  a(), i(t), delete l.addTest, delete l.addAsyncTest;
  for (var u = 0; u < Modernizr._q.length; u++) Modernizr._q[u]();
  n.Modernizr = Modernizr
}(window, document);
// TinyColor v1.1.2
// https://github.com/bgrins/TinyColor
// Brian Grinstead, MIT License

(function() {

var trimLeft = /^[\s,#]+/,
    trimRight = /\s+$/,
    tinyCounter = 0,
    math = Math,
    mathRound = math.round,
    mathMin = math.min,
    mathMax = math.max,
    mathRandom = math.random;

function tinycolor (color, opts) {

    color = (color) ? color : '';
    opts = opts || { };

    // If input is already a tinycolor, return itself
    if (color instanceof tinycolor) {
       return color;
    }
    // If we are called as a function, call using new instead
    if (!(this instanceof tinycolor)) {
        return new tinycolor(color, opts);
    }

    var rgb = inputToRGB(color);
    this._originalInput = color,
    this._r = rgb.r,
    this._g = rgb.g,
    this._b = rgb.b,
    this._a = rgb.a,
    this._roundA = mathRound(100*this._a) / 100,
    this._format = opts.format || rgb.format;
    this._gradientType = opts.gradientType;

    // Don't let the range of [0,255] come back in [0,1].
    // Potentially lose a little bit of precision here, but will fix issues where
    // .5 gets interpreted as half of the total, instead of half of 1
    // If it was supposed to be 128, this was already taken care of by `inputToRgb`
    if (this._r < 1) { this._r = mathRound(this._r); }
    if (this._g < 1) { this._g = mathRound(this._g); }
    if (this._b < 1) { this._b = mathRound(this._b); }

    this._ok = rgb.ok;
    this._tc_id = tinyCounter++;
}

tinycolor.prototype = {
    isDark: function() {
        return this.getBrightness() < 128;
    },
    isLight: function() {
        return !this.isDark();
    },
    isValid: function() {
        return this._ok;
    },
    getOriginalInput: function() {
      return this._originalInput;
    },
    getFormat: function() {
        return this._format;
    },
    getAlpha: function() {
        return this._a;
    },
    getBrightness: function() {
        //http://www.w3.org/TR/AERT#color-contrast
        var rgb = this.toRgb();
        return (rgb.r * 299 + rgb.g * 587 + rgb.b * 114) / 1000;
    },
    getLuminance: function() {
        //http://www.w3.org/TR/2008/REC-WCAG20-20081211/#relativeluminancedef
        var rgb = this.toRgb();
        var RsRGB, GsRGB, BsRGB, R, G, B;
        RsRGB = rgb.r/255;
        GsRGB = rgb.g/255;
        BsRGB = rgb.b/255;

        if (RsRGB <= 0.03928) {R = RsRGB / 12.92;} else {R = Math.pow(((RsRGB + 0.055) / 1.055), 2.4);}
        if (GsRGB <= 0.03928) {G = GsRGB / 12.92;} else {G = Math.pow(((GsRGB + 0.055) / 1.055), 2.4);}
        if (BsRGB <= 0.03928) {B = BsRGB / 12.92;} else {B = Math.pow(((BsRGB + 0.055) / 1.055), 2.4);}
        return (0.2126 * R) + (0.7152 * G) + (0.0722 * B);
    },
    setAlpha: function(value) {
        this._a = boundAlpha(value);
        this._roundA = mathRound(100*this._a) / 100;
        return this;
    },
    toHsv: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        return { h: hsv.h * 360, s: hsv.s, v: hsv.v, a: this._a };
    },
    toHsvString: function() {
        var hsv = rgbToHsv(this._r, this._g, this._b);
        var h = mathRound(hsv.h * 360), s = mathRound(hsv.s * 100), v = mathRound(hsv.v * 100);
        return (this._a == 1) ?
          "hsv("  + h + ", " + s + "%, " + v + "%)" :
          "hsva(" + h + ", " + s + "%, " + v + "%, "+ this._roundA + ")";
    },
    toHsl: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        return { h: hsl.h * 360, s: hsl.s, l: hsl.l, a: this._a };
    },
    toHslString: function() {
        var hsl = rgbToHsl(this._r, this._g, this._b);
        var h = mathRound(hsl.h * 360), s = mathRound(hsl.s * 100), l = mathRound(hsl.l * 100);
        return (this._a == 1) ?
          "hsl("  + h + ", " + s + "%, " + l + "%)" :
          "hsla(" + h + ", " + s + "%, " + l + "%, "+ this._roundA + ")";
    },
    toHex: function(allow3Char) {
        return rgbToHex(this._r, this._g, this._b, allow3Char);
    },
    toHexString: function(allow3Char) {
        return '#' + this.toHex(allow3Char);
    },
    toHex8: function() {
        return rgbaToHex(this._r, this._g, this._b, this._a);
    },
    toHex8String: function() {
        return '#' + this.toHex8();
    },
    toRgb: function() {
        return { r: mathRound(this._r), g: mathRound(this._g), b: mathRound(this._b), a: this._a };
    },
    toRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ")" :
          "rgba(" + mathRound(this._r) + ", " + mathRound(this._g) + ", " + mathRound(this._b) + ", " + this._roundA + ")";
    },
    toPercentageRgb: function() {
        return { r: mathRound(bound01(this._r, 255) * 100) + "%", g: mathRound(bound01(this._g, 255) * 100) + "%", b: mathRound(bound01(this._b, 255) * 100) + "%", a: this._a };
    },
    toPercentageRgbString: function() {
        return (this._a == 1) ?
          "rgb("  + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%)" :
          "rgba(" + mathRound(bound01(this._r, 255) * 100) + "%, " + mathRound(bound01(this._g, 255) * 100) + "%, " + mathRound(bound01(this._b, 255) * 100) + "%, " + this._roundA + ")";
    },
    toName: function() {
        if (this._a === 0) {
            return "transparent";
        }

        if (this._a < 1) {
            return false;
        }

        return hexNames[rgbToHex(this._r, this._g, this._b, true)] || false;
    },
    toFilter: function(secondColor) {
        var hex8String = '#' + rgbaToHex(this._r, this._g, this._b, this._a);
        var secondHex8String = hex8String;
        var gradientType = this._gradientType ? "GradientType = 1, " : "";

        if (secondColor) {
            var s = tinycolor(secondColor);
            secondHex8String = s.toHex8String();
        }

        return "progid:DXImageTransform.Microsoft.gradient("+gradientType+"startColorstr="+hex8String+",endColorstr="+secondHex8String+")";
    },
    toString: function(format) {
        var formatSet = !!format;
        format = format || this._format;

        var formattedString = false;
        var hasAlpha = this._a < 1 && this._a >= 0;
        var needsAlphaFormat = !formatSet && hasAlpha && (format === "hex" || format === "hex6" || format === "hex3" || format === "name");

        if (needsAlphaFormat) {
            // Special case for "transparent", all other non-alpha formats
            // will return rgba when there is transparency.
            if (format === "name" && this._a === 0) {
                return this.toName();
            }
            return this.toRgbString();
        }
        if (format === "rgb") {
            formattedString = this.toRgbString();
        }
        if (format === "prgb") {
            formattedString = this.toPercentageRgbString();
        }
        if (format === "hex" || format === "hex6") {
            formattedString = this.toHexString();
        }
        if (format === "hex3") {
            formattedString = this.toHexString(true);
        }
        if (format === "hex8") {
            formattedString = this.toHex8String();
        }
        if (format === "name") {
            formattedString = this.toName();
        }
        if (format === "hsl") {
            formattedString = this.toHslString();
        }
        if (format === "hsv") {
            formattedString = this.toHsvString();
        }

        return formattedString || this.toHexString();
    },

    _applyModification: function(fn, args) {
        var color = fn.apply(null, [this].concat([].slice.call(args)));
        this._r = color._r;
        this._g = color._g;
        this._b = color._b;
        this.setAlpha(color._a);
        return this;
    },
    lighten: function() {
        return this._applyModification(lighten, arguments);
    },
    brighten: function() {
        return this._applyModification(brighten, arguments);
    },
    darken: function() {
        return this._applyModification(darken, arguments);
    },
    desaturate: function() {
        return this._applyModification(desaturate, arguments);
    },
    saturate: function() {
        return this._applyModification(saturate, arguments);
    },
    greyscale: function() {
        return this._applyModification(greyscale, arguments);
    },
    spin: function() {
        return this._applyModification(spin, arguments);
    },

    _applyCombination: function(fn, args) {
        return fn.apply(null, [this].concat([].slice.call(args)));
    },
    analogous: function() {
        return this._applyCombination(analogous, arguments);
    },
    complement: function() {
        return this._applyCombination(complement, arguments);
    },
    monochromatic: function() {
        return this._applyCombination(monochromatic, arguments);
    },
    splitcomplement: function() {
        return this._applyCombination(splitcomplement, arguments);
    },
    triad: function() {
        return this._applyCombination(triad, arguments);
    },
    tetrad: function() {
        return this._applyCombination(tetrad, arguments);
    }
};

// If input is an object, force 1 into "1.0" to handle ratios properly
// String input requires "1.0" as input, so 1 will be treated as 1
tinycolor.fromRatio = function(color, opts) {
    if (typeof color == "object") {
        var newColor = {};
        for (var i in color) {
            if (color.hasOwnProperty(i)) {
                if (i === "a") {
                    newColor[i] = color[i];
                }
                else {
                    newColor[i] = convertToPercentage(color[i]);
                }
            }
        }
        color = newColor;
    }

    return tinycolor(color, opts);
};

// Given a string or object, convert that input to RGB
// Possible string inputs:
//
//     "red"
//     "#f00" or "f00"
//     "#ff0000" or "ff0000"
//     "#ff000000" or "ff000000"
//     "rgb 255 0 0" or "rgb (255, 0, 0)"
//     "rgb 1.0 0 0" or "rgb (1, 0, 0)"
//     "rgba (255, 0, 0, 1)" or "rgba 255, 0, 0, 1"
//     "rgba (1.0, 0, 0, 1)" or "rgba 1.0, 0, 0, 1"
//     "hsl(0, 100%, 50%)" or "hsl 0 100% 50%"
//     "hsla(0, 100%, 50%, 1)" or "hsla 0 100% 50%, 1"
//     "hsv(0, 100%, 100%)" or "hsv 0 100% 100%"
//
function inputToRGB(color) {

    var rgb = { r: 0, g: 0, b: 0 };
    var a = 1;
    var ok = false;
    var format = false;

    if (typeof color == "string") {
        color = stringInputToObject(color);
    }

    if (typeof color == "object") {
        if (color.hasOwnProperty("r") && color.hasOwnProperty("g") && color.hasOwnProperty("b")) {
            rgb = rgbToRgb(color.r, color.g, color.b);
            ok = true;
            format = String(color.r).substr(-1) === "%" ? "prgb" : "rgb";
        }
        else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("v")) {
            color.s = convertToPercentage(color.s);
            color.v = convertToPercentage(color.v);
            rgb = hsvToRgb(color.h, color.s, color.v);
            ok = true;
            format = "hsv";
        }
        else if (color.hasOwnProperty("h") && color.hasOwnProperty("s") && color.hasOwnProperty("l")) {
            color.s = convertToPercentage(color.s);
            color.l = convertToPercentage(color.l);
            rgb = hslToRgb(color.h, color.s, color.l);
            ok = true;
            format = "hsl";
        }

        if (color.hasOwnProperty("a")) {
            a = color.a;
        }
    }

    a = boundAlpha(a);

    return {
        ok: ok,
        format: color.format || format,
        r: mathMin(255, mathMax(rgb.r, 0)),
        g: mathMin(255, mathMax(rgb.g, 0)),
        b: mathMin(255, mathMax(rgb.b, 0)),
        a: a
    };
}


// Conversion Functions
// --------------------

// `rgbToHsl`, `rgbToHsv`, `hslToRgb`, `hsvToRgb` modified from:
// <http://mjijackson.com/2008/02/rgb-to-hsl-and-rgb-to-hsv-color-model-conversion-algorithms-in-javascript>

// `rgbToRgb`
// Handle bounds / percentage checking to conform to CSS color spec
// <http://www.w3.org/TR/css3-color/>
// *Assumes:* r, g, b in [0, 255] or [0, 1]
// *Returns:* { r, g, b } in [0, 255]
function rgbToRgb(r, g, b){
    return {
        r: bound01(r, 255) * 255,
        g: bound01(g, 255) * 255,
        b: bound01(b, 255) * 255
    };
}

// `rgbToHsl`
// Converts an RGB color value to HSL.
// *Assumes:* r, g, and b are contained in [0, 255] or [0, 1]
// *Returns:* { h, s, l } in [0,1]
function rgbToHsl(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, l = (max + min) / 2;

    if(max == min) {
        h = s = 0; // achromatic
    }
    else {
        var d = max - min;
        s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }

        h /= 6;
    }

    return { h: h, s: s, l: l };
}

// `hslToRgb`
// Converts an HSL color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and l are contained [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
function hslToRgb(h, s, l) {
    var r, g, b;

    h = bound01(h, 360);
    s = bound01(s, 100);
    l = bound01(l, 100);

    function hue2rgb(p, q, t) {
        if(t < 0) t += 1;
        if(t > 1) t -= 1;
        if(t < 1/6) return p + (q - p) * 6 * t;
        if(t < 1/2) return q;
        if(t < 2/3) return p + (q - p) * (2/3 - t) * 6;
        return p;
    }

    if(s === 0) {
        r = g = b = l; // achromatic
    }
    else {
        var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
        var p = 2 * l - q;
        r = hue2rgb(p, q, h + 1/3);
        g = hue2rgb(p, q, h);
        b = hue2rgb(p, q, h - 1/3);
    }

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHsv`
// Converts an RGB color value to HSV
// *Assumes:* r, g, and b are contained in the set [0, 255] or [0, 1]
// *Returns:* { h, s, v } in [0,1]
function rgbToHsv(r, g, b) {

    r = bound01(r, 255);
    g = bound01(g, 255);
    b = bound01(b, 255);

    var max = mathMax(r, g, b), min = mathMin(r, g, b);
    var h, s, v = max;

    var d = max - min;
    s = max === 0 ? 0 : d / max;

    if(max == min) {
        h = 0; // achromatic
    }
    else {
        switch(max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break;
            case g: h = (b - r) / d + 2; break;
            case b: h = (r - g) / d + 4; break;
        }
        h /= 6;
    }
    return { h: h, s: s, v: v };
}

// `hsvToRgb`
// Converts an HSV color value to RGB.
// *Assumes:* h is contained in [0, 1] or [0, 360] and s and v are contained in [0, 1] or [0, 100]
// *Returns:* { r, g, b } in the set [0, 255]
 function hsvToRgb(h, s, v) {

    h = bound01(h, 360) * 6;
    s = bound01(s, 100);
    v = bound01(v, 100);

    var i = math.floor(h),
        f = h - i,
        p = v * (1 - s),
        q = v * (1 - f * s),
        t = v * (1 - (1 - f) * s),
        mod = i % 6,
        r = [v, q, p, p, t, v][mod],
        g = [t, v, v, q, p, p][mod],
        b = [p, p, t, v, v, q][mod];

    return { r: r * 255, g: g * 255, b: b * 255 };
}

// `rgbToHex`
// Converts an RGB color to hex
// Assumes r, g, and b are contained in the set [0, 255]
// Returns a 3 or 6 character hex
function rgbToHex(r, g, b, allow3Char) {

    var hex = [
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    // Return a 3 character hex if possible
    if (allow3Char && hex[0].charAt(0) == hex[0].charAt(1) && hex[1].charAt(0) == hex[1].charAt(1) && hex[2].charAt(0) == hex[2].charAt(1)) {
        return hex[0].charAt(0) + hex[1].charAt(0) + hex[2].charAt(0);
    }

    return hex.join("");
}

// `rgbaToHex`
// Converts an RGBA color plus alpha transparency to hex
// Assumes r, g, b and a are contained in the set [0, 255]
// Returns an 8 character hex
function rgbaToHex(r, g, b, a) {

    var hex = [
        pad2(convertDecimalToHex(a)),
        pad2(mathRound(r).toString(16)),
        pad2(mathRound(g).toString(16)),
        pad2(mathRound(b).toString(16))
    ];

    return hex.join("");
}

// `equals`
// Can be called with any tinycolor input
tinycolor.equals = function (color1, color2) {
    if (!color1 || !color2) { return false; }
    return tinycolor(color1).toRgbString() == tinycolor(color2).toRgbString();
};

tinycolor.random = function() {
    return tinycolor.fromRatio({
        r: mathRandom(),
        g: mathRandom(),
        b: mathRandom()
    });
};


// Modification Functions
// ----------------------
// Thanks to less.js for some of the basics here
// <https://github.com/cloudhead/less.js/blob/master/lib/less/functions.js>

function desaturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s -= amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function saturate(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.s += amount / 100;
    hsl.s = clamp01(hsl.s);
    return tinycolor(hsl);
}

function greyscale(color) {
    return tinycolor(color).desaturate(100);
}

function lighten (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l += amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

function brighten(color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var rgb = tinycolor(color).toRgb();
    rgb.r = mathMax(0, mathMin(255, rgb.r - mathRound(255 * - (amount / 100))));
    rgb.g = mathMax(0, mathMin(255, rgb.g - mathRound(255 * - (amount / 100))));
    rgb.b = mathMax(0, mathMin(255, rgb.b - mathRound(255 * - (amount / 100))));
    return tinycolor(rgb);
}

function darken (color, amount) {
    amount = (amount === 0) ? 0 : (amount || 10);
    var hsl = tinycolor(color).toHsl();
    hsl.l -= amount / 100;
    hsl.l = clamp01(hsl.l);
    return tinycolor(hsl);
}

// Spin takes a positive or negative amount within [-360, 360] indicating the change of hue.
// Values outside of this range will be wrapped into this range.
function spin(color, amount) {
    var hsl = tinycolor(color).toHsl();
    var hue = (mathRound(hsl.h) + amount) % 360;
    hsl.h = hue < 0 ? 360 + hue : hue;
    return tinycolor(hsl);
}

// Combination Functions
// ---------------------
// Thanks to jQuery xColor for some of the ideas behind these
// <https://github.com/infusion/jQuery-xcolor/blob/master/jquery.xcolor.js>

function complement(color) {
    var hsl = tinycolor(color).toHsl();
    hsl.h = (hsl.h + 180) % 360;
    return tinycolor(hsl);
}

function triad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 120) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 240) % 360, s: hsl.s, l: hsl.l })
    ];
}

function tetrad(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 90) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 180) % 360, s: hsl.s, l: hsl.l }),
        tinycolor({ h: (h + 270) % 360, s: hsl.s, l: hsl.l })
    ];
}

function splitcomplement(color) {
    var hsl = tinycolor(color).toHsl();
    var h = hsl.h;
    return [
        tinycolor(color),
        tinycolor({ h: (h + 72) % 360, s: hsl.s, l: hsl.l}),
        tinycolor({ h: (h + 216) % 360, s: hsl.s, l: hsl.l})
    ];
}

function analogous(color, results, slices) {
    results = results || 6;
    slices = slices || 30;

    var hsl = tinycolor(color).toHsl();
    var part = 360 / slices;
    var ret = [tinycolor(color)];

    for (hsl.h = ((hsl.h - (part * results >> 1)) + 720) % 360; --results; ) {
        hsl.h = (hsl.h + part) % 360;
        ret.push(tinycolor(hsl));
    }
    return ret;
}

function monochromatic(color, results) {
    results = results || 6;
    var hsv = tinycolor(color).toHsv();
    var h = hsv.h, s = hsv.s, v = hsv.v;
    var ret = [];
    var modification = 1 / results;

    while (results--) {
        ret.push(tinycolor({ h: h, s: s, v: v}));
        v = (v + modification) % 1;
    }

    return ret;
}

// Utility Functions
// ---------------------

tinycolor.mix = function(color1, color2, amount) {
    amount = (amount === 0) ? 0 : (amount || 50);

    var rgb1 = tinycolor(color1).toRgb();
    var rgb2 = tinycolor(color2).toRgb();

    var p = amount / 100;
    var w = p * 2 - 1;
    var a = rgb2.a - rgb1.a;

    var w1;

    if (w * a == -1) {
        w1 = w;
    } else {
        w1 = (w + a) / (1 + w * a);
    }

    w1 = (w1 + 1) / 2;

    var w2 = 1 - w1;

    var rgba = {
        r: rgb2.r * w1 + rgb1.r * w2,
        g: rgb2.g * w1 + rgb1.g * w2,
        b: rgb2.b * w1 + rgb1.b * w2,
        a: rgb2.a * p  + rgb1.a * (1 - p)
    };

    return tinycolor(rgba);
};


// Readability Functions
// ---------------------
// <http://www.w3.org/TR/2008/REC-WCAG20-20081211/#contrast-ratiodef (WCAG Version 2)

// `contrast`
// Analyze the 2 colors and returns the color contrast defined by (WCAG Version 2)
tinycolor.readability = function(color1, color2) {
    var c1 = tinycolor(color1);
    var c2 = tinycolor(color2);
    return (Math.max(c1.getLuminance(),c2.getLuminance())+0.05) / (Math.min(c1.getLuminance(),c2.getLuminance())+0.05);
};

// `isReadable`
// Ensure that foreground and background color combinations meet WCAG2 guidelines.
// The third argument is an optional Object.
//      the 'level' property states 'AA' or 'AAA' - if missing or invalid, it defaults to 'AA';
//      the 'size' property states 'large' or 'small' - if missing or invalid, it defaults to 'small'.
// If the entire object is absent, isReadable defaults to {level:"AA",size:"small"}.

// *Example*
//    tinycolor.isReadable("#000", "#111") => false
//    tinycolor.isReadable("#000", "#111",{level:"AA",size:"large"}) => false
tinycolor.isReadable = function(color1, color2, wcag2) {
    var readability = tinycolor.readability(color1, color2);
    var wcag2Parms, out;

    out = false;

    wcag2Parms = validateWCAG2Parms(wcag2);
    switch (wcag2Parms.level + wcag2Parms.size) {
        case "AAsmall":
        case "AAAlarge":
            out = readability >= 4.5;
            break;
        case "AAlarge":
            out = readability >= 3;
            break;
        case "AAAsmall":
            out = readability >= 7;
            break;
    }
    return out;

};

// `mostReadable`
// Given a base color and a list of possible foreground or background
// colors for that base, returns the most readable color.
// Optionally returns Black or White if the most readable color is unreadable.
// *Example*
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:false}).toHexString(); // "#112255"
//    tinycolor.mostReadable(tinycolor.mostReadable("#123", ["#124", "#125"],{includeFallbackColors:true}).toHexString();  // "#ffffff"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"large"}).toHexString(); // "#faf3f3"
//    tinycolor.mostReadable("#a8015a", ["#faf3f3"],{includeFallbackColors:true,level:"AAA",size:"small"}).toHexString(); // "#ffffff"
tinycolor.mostReadable = function(baseColor, colorList, args) {
    var bestColor = null;
    var bestScore = 0;
    var readability;
    var includeFallbackColors, level, size ;
    args = args || {};
    includeFallbackColors = args.includeFallbackColors ;
    level = args.level;
    size = args.size;

    for (var i= 0; i < colorList.length ; i++) {
        readability = tinycolor.readability(baseColor, colorList[i]);
        if (readability > bestScore) {
            bestScore = readability;
            bestColor = tinycolor(colorList[i]);
        }
    }

    if (tinycolor.isReadable(baseColor, bestColor, {"level":level,"size":size}) || !includeFallbackColors) {
        return bestColor;
    }
    else {
        args.includeFallbackColors=false;
        return tinycolor.mostReadable(baseColor,["#fff", "#000"],args);
    }
};


// Big List of Colors
// ------------------
// <http://www.w3.org/TR/css3-color/#svg-color>
var names = tinycolor.names = {
    aliceblue: "f0f8ff",
    antiquewhite: "faebd7",
    aqua: "0ff",
    aquamarine: "7fffd4",
    azure: "f0ffff",
    beige: "f5f5dc",
    bisque: "ffe4c4",
    black: "000",
    blanchedalmond: "ffebcd",
    blue: "00f",
    blueviolet: "8a2be2",
    brown: "a52a2a",
    burlywood: "deb887",
    burntsienna: "ea7e5d",
    cadetblue: "5f9ea0",
    chartreuse: "7fff00",
    chocolate: "d2691e",
    coral: "ff7f50",
    cornflowerblue: "6495ed",
    cornsilk: "fff8dc",
    crimson: "dc143c",
    cyan: "0ff",
    darkblue: "00008b",
    darkcyan: "008b8b",
    darkgoldenrod: "b8860b",
    darkgray: "a9a9a9",
    darkgreen: "006400",
    darkgrey: "a9a9a9",
    darkkhaki: "bdb76b",
    darkmagenta: "8b008b",
    darkolivegreen: "556b2f",
    darkorange: "ff8c00",
    darkorchid: "9932cc",
    darkred: "8b0000",
    darksalmon: "e9967a",
    darkseagreen: "8fbc8f",
    darkslateblue: "483d8b",
    darkslategray: "2f4f4f",
    darkslategrey: "2f4f4f",
    darkturquoise: "00ced1",
    darkviolet: "9400d3",
    deeppink: "ff1493",
    deepskyblue: "00bfff",
    dimgray: "696969",
    dimgrey: "696969",
    dodgerblue: "1e90ff",
    firebrick: "b22222",
    floralwhite: "fffaf0",
    forestgreen: "228b22",
    fuchsia: "f0f",
    gainsboro: "dcdcdc",
    ghostwhite: "f8f8ff",
    gold: "ffd700",
    goldenrod: "daa520",
    gray: "808080",
    green: "008000",
    greenyellow: "adff2f",
    grey: "808080",
    honeydew: "f0fff0",
    hotpink: "ff69b4",
    indianred: "cd5c5c",
    indigo: "4b0082",
    ivory: "fffff0",
    khaki: "f0e68c",
    lavender: "e6e6fa",
    lavenderblush: "fff0f5",
    lawngreen: "7cfc00",
    lemonchiffon: "fffacd",
    lightblue: "add8e6",
    lightcoral: "f08080",
    lightcyan: "e0ffff",
    lightgoldenrodyellow: "fafad2",
    lightgray: "d3d3d3",
    lightgreen: "90ee90",
    lightgrey: "d3d3d3",
    lightpink: "ffb6c1",
    lightsalmon: "ffa07a",
    lightseagreen: "20b2aa",
    lightskyblue: "87cefa",
    lightslategray: "789",
    lightslategrey: "789",
    lightsteelblue: "b0c4de",
    lightyellow: "ffffe0",
    lime: "0f0",
    limegreen: "32cd32",
    linen: "faf0e6",
    magenta: "f0f",
    maroon: "800000",
    mediumaquamarine: "66cdaa",
    mediumblue: "0000cd",
    mediumorchid: "ba55d3",
    mediumpurple: "9370db",
    mediumseagreen: "3cb371",
    mediumslateblue: "7b68ee",
    mediumspringgreen: "00fa9a",
    mediumturquoise: "48d1cc",
    mediumvioletred: "c71585",
    midnightblue: "191970",
    mintcream: "f5fffa",
    mistyrose: "ffe4e1",
    moccasin: "ffe4b5",
    navajowhite: "ffdead",
    navy: "000080",
    oldlace: "fdf5e6",
    olive: "808000",
    olivedrab: "6b8e23",
    orange: "ffa500",
    orangered: "ff4500",
    orchid: "da70d6",
    palegoldenrod: "eee8aa",
    palegreen: "98fb98",
    paleturquoise: "afeeee",
    palevioletred: "db7093",
    papayawhip: "ffefd5",
    peachpuff: "ffdab9",
    peru: "cd853f",
    pink: "ffc0cb",
    plum: "dda0dd",
    powderblue: "b0e0e6",
    purple: "800080",
    rebeccapurple: "663399",
    red: "f00",
    rosybrown: "bc8f8f",
    royalblue: "4169e1",
    saddlebrown: "8b4513",
    salmon: "fa8072",
    sandybrown: "f4a460",
    seagreen: "2e8b57",
    seashell: "fff5ee",
    sienna: "a0522d",
    silver: "c0c0c0",
    skyblue: "87ceeb",
    slateblue: "6a5acd",
    slategray: "708090",
    slategrey: "708090",
    snow: "fffafa",
    springgreen: "00ff7f",
    steelblue: "4682b4",
    tan: "d2b48c",
    teal: "008080",
    thistle: "d8bfd8",
    tomato: "ff6347",
    turquoise: "40e0d0",
    violet: "ee82ee",
    wheat: "f5deb3",
    white: "fff",
    whitesmoke: "f5f5f5",
    yellow: "ff0",
    yellowgreen: "9acd32"
};

// Make it easy to access colors via `hexNames[hex]`
var hexNames = tinycolor.hexNames = flip(names);


// Utilities
// ---------

// `{ 'name1': 'val1' }` becomes `{ 'val1': 'name1' }`
function flip(o) {
    var flipped = { };
    for (var i in o) {
        if (o.hasOwnProperty(i)) {
            flipped[o[i]] = i;
        }
    }
    return flipped;
}

// Return a valid alpha value [0,1] with all invalid values being set to 1
function boundAlpha(a) {
    a = parseFloat(a);

    if (isNaN(a) || a < 0 || a > 1) {
        a = 1;
    }

    return a;
}

// Take input from [0, n] and return it as [0, 1]
function bound01(n, max) {
    if (isOnePointZero(n)) { n = "100%"; }

    var processPercent = isPercentage(n);
    n = mathMin(max, mathMax(0, parseFloat(n)));

    // Automatically convert percentage into number
    if (processPercent) {
        n = parseInt(n * max, 10) / 100;
    }

    // Handle floating point rounding errors
    if ((math.abs(n - max) < 0.000001)) {
        return 1;
    }

    // Convert into [0, 1] range if it isn't already
    return (n % max) / parseFloat(max);
}

// Force a number between 0 and 1
function clamp01(val) {
    return mathMin(1, mathMax(0, val));
}

// Parse a base-16 hex value into a base-10 integer
function parseIntFromHex(val) {
    return parseInt(val, 16);
}

// Need to handle 1.0 as 100%, since once it is a number, there is no difference between it and 1
// <http://stackoverflow.com/questions/7422072/javascript-how-to-detect-number-as-a-decimal-including-1-0>
function isOnePointZero(n) {
    return typeof n == "string" && n.indexOf('.') != -1 && parseFloat(n) === 1;
}

// Check to see if string passed in is a percentage
function isPercentage(n) {
    return typeof n === "string" && n.indexOf('%') != -1;
}

// Force a hex value to have 2 characters
function pad2(c) {
    return c.length == 1 ? '0' + c : '' + c;
}

// Replace a decimal with it's percentage value
function convertToPercentage(n) {
    if (n <= 1) {
        n = (n * 100) + "%";
    }

    return n;
}

// Converts a decimal to a hex value
function convertDecimalToHex(d) {
    return Math.round(parseFloat(d) * 255).toString(16);
}
// Converts a hex value to a decimal
function convertHexToDecimal(h) {
    return (parseIntFromHex(h) / 255);
}

var matchers = (function() {

    // <http://www.w3.org/TR/css3-values/#integers>
    var CSS_INTEGER = "[-\\+]?\\d+%?";

    // <http://www.w3.org/TR/css3-values/#number-value>
    var CSS_NUMBER = "[-\\+]?\\d*\\.\\d+%?";

    // Allow positive/negative integer/number.  Don't capture the either/or, just the entire outcome.
    var CSS_UNIT = "(?:" + CSS_NUMBER + ")|(?:" + CSS_INTEGER + ")";

    // Actual matching.
    // Parentheses and commas are optional, but not required.
    // Whitespace can take the place of commas or opening paren
    var PERMISSIVE_MATCH3 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";
    var PERMISSIVE_MATCH4 = "[\\s|\\(]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")[,|\\s]+(" + CSS_UNIT + ")\\s*\\)?";

    return {
        rgb: new RegExp("rgb" + PERMISSIVE_MATCH3),
        rgba: new RegExp("rgba" + PERMISSIVE_MATCH4),
        hsl: new RegExp("hsl" + PERMISSIVE_MATCH3),
        hsla: new RegExp("hsla" + PERMISSIVE_MATCH4),
        hsv: new RegExp("hsv" + PERMISSIVE_MATCH3),
        hsva: new RegExp("hsva" + PERMISSIVE_MATCH4),
        hex3: /^([0-9a-fA-F]{1})([0-9a-fA-F]{1})([0-9a-fA-F]{1})$/,
        hex6: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/,
        hex8: /^([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})([0-9a-fA-F]{2})$/
    };
})();

// `stringInputToObject`
// Permissive string parsing.  Take in a number of formats, and output an object
// based on detected format.  Returns `{ r, g, b }` or `{ h, s, l }` or `{ h, s, v}`
function stringInputToObject(color) {

    color = color.replace(trimLeft,'').replace(trimRight, '').toLowerCase();
    var named = false;
    if (names[color]) {
        color = names[color];
        named = true;
    }
    else if (color == 'transparent') {
        return { r: 0, g: 0, b: 0, a: 0, format: "name" };
    }

    // Try to match string input using regular expressions.
    // Keep most of the number bounding out of this function - don't worry about [0,1] or [0,100] or [0,360]
    // Just return an object and let the conversion functions handle that.
    // This way the result will be the same whether the tinycolor is initialized with string or object.
    var match;
    if ((match = matchers.rgb.exec(color))) {
        return { r: match[1], g: match[2], b: match[3] };
    }
    if ((match = matchers.rgba.exec(color))) {
        return { r: match[1], g: match[2], b: match[3], a: match[4] };
    }
    if ((match = matchers.hsl.exec(color))) {
        return { h: match[1], s: match[2], l: match[3] };
    }
    if ((match = matchers.hsla.exec(color))) {
        return { h: match[1], s: match[2], l: match[3], a: match[4] };
    }
    if ((match = matchers.hsv.exec(color))) {
        return { h: match[1], s: match[2], v: match[3] };
    }
    if ((match = matchers.hsva.exec(color))) {
        return { h: match[1], s: match[2], v: match[3], a: match[4] };
    }
    if ((match = matchers.hex8.exec(color))) {
        return {
            a: convertHexToDecimal(match[1]),
            r: parseIntFromHex(match[2]),
            g: parseIntFromHex(match[3]),
            b: parseIntFromHex(match[4]),
            format: named ? "name" : "hex8"
        };
    }
    if ((match = matchers.hex6.exec(color))) {
        return {
            r: parseIntFromHex(match[1]),
            g: parseIntFromHex(match[2]),
            b: parseIntFromHex(match[3]),
            format: named ? "name" : "hex"
        };
    }
    if ((match = matchers.hex3.exec(color))) {
        return {
            r: parseIntFromHex(match[1] + '' + match[1]),
            g: parseIntFromHex(match[2] + '' + match[2]),
            b: parseIntFromHex(match[3] + '' + match[3]),
            format: named ? "name" : "hex"
        };
    }

    return false;
}

function validateWCAG2Parms(parms) {
    // return valid WCAG2 parms for isReadable.
    // If input parms are invalid, return {"level":"AA", "size":"small"}
    var level, size;
    parms = parms || {"level":"AA", "size":"small"};
    level = (parms.level || "AA").toUpperCase();
    size = (parms.size || "small").toLowerCase();
    if (level !== "AA" && level !== "AAA") {
        level = "AA";
    }
    if (size !== "small" && size !== "large") {
        size = "small";
    }
    return {"level":level, "size":size};
}

// Node: Export function
if (typeof module !== "undefined" && module.exports) {
    module.exports = tinycolor;
}
// AMD/requirejs: Define the module
else if (typeof define === 'function' && define.amd) {
    define(function () {return tinycolor;});
}
// Browser: Expose to window
else {
    window.tinycolor = tinycolor;
}

})();
angular.module('scfc', [])
    .controller('ScfcController', ['$scope', function($scope) {
        $scope.scfc = {
            colorA: '#BADA55',
            colorB: '#B0BCA7',
            colorDiff: function(a,b) {
                var a = tinycolor(a).toHsl(),
                    b = tinycolor(b).toHsl(),
  
                    sat = a.s - b.s,
                    lig = a.l - b.l,
                    hue = -(a.h - b.h),
  
                    fnSat = (sat > 0) ? 'desaturate' : 'saturate',
                    fnLig = (lig > 0) ? 'darken' : 'lighten';
  
                sat = Math.abs(sat) * 100;
                lig = Math.abs(lig) * 100;
  
                return {
                    baseColor: '#' + tinycolor(a).toHex(),
                    fnHue : 'adjust-hue',
                    hue : hue.toFixed(0),
                    fnSat : fnSat,
                    sat : sat.toFixed(2),
                    fnLig : fnLig,
                    lig: lig.toFixed(2)
                }
            },
            adjustmentStringConstuctor: function(diff) {
                var addTransformToString = function(diffVal, diffFn, transformString) {
                    if (diffVal != 0)
                        return diffFn + '(' + transformString + ', ' + diffVal + ')';
                    
                    return transformString;
                }

                var transformString = diff.baseColor;

                transformString = addTransformToString(diff.hue, diff.fnHue, transformString);
                transformString = addTransformToString(diff.sat, diff.fnSat, transformString);
                transformString = addTransformToString(diff.lig, diff.fnLig, transformString);

                if (transformString === diff.baseColor)
                    return "Colours are too similar, pal!";

                return transformString;
            },
            adjustmentString: function() {
                if ( !( tinycolor($scope.scfc.colorA).isValid() && tinycolor($scope.scfc.colorB).isValid() ) )
                    return 'Please enter two valid colours';
                
                var adjustments = $scope.scfc.colorDiff($scope.scfc.colorA, $scope.scfc.colorB);
                return $scope.scfc.adjustmentStringConstuctor(adjustments);
            }
        };
    }]);
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
//# sourceMappingURL=main.js.map
