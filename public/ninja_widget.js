function iecheck() {
  if (navigator.platform == "Win32" && navigator.appName == "Microsoft Internet Explorer" && window.attachEvent) {
    var rslt = navigator.appVersion.match(/MSIE (\d+\.\d+)/, '');
    var iever = (rslt != null && Number(rslt[1]) >= 5.5 && Number(rslt[1]) <= 7 );
  }
  return iever;
}

MyNinjaWidget = new function(params) {
  var BASE_URL = 'http://temperature-widget.herokuapp.com/';
  var STYLESHEET = BASE_URL + "ninja_widget.css"
  var CONTENT_URL = BASE_URL + 'temperature';
  var ROOT = 'ninja_temperature_widget';
  
  var scripts = document.getElementsByTagName('script');
  var myScript = scripts[ scripts.length - 1 ];

  var queryString = myScript.src.replace(/^[^\?]+\??/,'');

  function parseQuery ( query ) {
     var Params = new Object ();
     if ( ! query ) return Params; // return empty object
     var Pairs = query.split(/[;&]/);
     for ( var i = 0; i < Pairs.length; i++ ) {
        var KeyVal = Pairs[i].split('=');
        if ( ! KeyVal || KeyVal.length != 2 ) continue;
        var key = unescape( KeyVal[0] );
        var val = unescape( KeyVal[1] );
        val = val.replace(/\+/g, ' ');
        Params[key] = val;
     }
     return Params;
  }

  function requestStylesheet(stylesheet_url) {
    stylesheet = document.createElement("link");
    stylesheet.rel = "stylesheet";
    stylesheet.type = "text/css";
    stylesheet.href = stylesheet_url;
    stylesheet.media = "all";
    document.lastChild.firstChild.appendChild(stylesheet);
  }

  
  function requestContent() {
    var params = parseQuery( queryString );
    var token = params["widget_token"];
    var script = document.createElement('script');
    script.src = CONTENT_URL + "?widget_token=" + token;
    document.getElementsByTagName('head')[0].appendChild(script);
  }

	this.init = function(params) {
	  this.serverResponse = function(data) {
	    if (!data) return;
	    var div = document.getElementById(ROOT);
	    var txt = "";
	    for (var i = 0; i < data.length; i++) {
	      if (txt.length > 0) { txt += ", "; }
	      txt += data[i];
	    }
	    div.innerHTML = "<div id=\"ninja_currently\">Currently<br /></div><div>" + txt + 'ºC'+ "</div><div>" + "<a id='powered_by_ninja' href=\"http://ninjablocks.com\">Powered by Ninja Blocks.</a></div>";  // assign new HTML into #ROOT
	    div.style.display = 'block'; // make element visible
	    div.style.visibility = 'visible'; // make element visible
	  }
	
	  requestStylesheet(STYLESHEET);
	  document.write("<div id='" + ROOT + "' style='display: none' onclick='window.location=\"http://ninjablocks.com\"'></div>");
	  requestContent();
	  var no_script = document.getElementById('no_script');
	  if (no_script) { no_script.style.display = 'none'; }
	}
}
MyNinjaWidget.init();
