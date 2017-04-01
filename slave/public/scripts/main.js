console.log('\'Allo \'Allo!');

var keymap = {
  '38':'up', '87':'up',
  '40':'down', '83':'down',
  '37':'left', '65':'left',
  '39':'right', '68':'right',
  '32':'break',
}

var keyState = {
  'up': false,
  'down': false,
  'left': false,
  'right': false,
  'break': false,
}

var vector = {x:0, y:0};


function buildVector(keyState) {
    var dx = 0, dy=0;
    dx+=keyState['left']?-1:0;
    dx+=keyState['right']?1:0;

    dy+=keyState['up']?1:0;
    dy+=keyState['down']?-1:0;
    var break_ = keyState['break']?1:0

    return {x:dx,y:dy,break:break_};
}

function buildWebSocketUriOnSameHost(path) {
  var loc = window.location;
  var proto = (loc.protocol === "https:") ? "wss:" : "ws:";
  var ret = proto + "//" + loc.host + path
  return ret;
}

//var ws = new WebSocket("ws://localhost:9998/socket");
//var ws = new WebSocket("ws://192.168.3.101:3000/socket");
//var ws = new WebSocket("ws://172.20.10.5:3000/socket");
var ws = new WebSocket(buildWebSocketUriOnSameHost("/socket"));
//var ws = new WebSocket("ws:/socket");

ws.onopen = function()
{
  // Web Socket is connected, send data using send()
  //ws.send("Hello from client");
  //console.log("Message sent: Hello from client");
};

ws.onmessage = function (evt)
{
  var received_msg = evt.data;
  console.log("Message received: "+received_msg);
};

ws.onclose = function()
{
  // websocket is closed.
  console.log("Connection closed.");
};


function onKeyStateChanged(newKeyState){
  //console.log(keyState);
  vector = buildVector(newKeyState);
  console.log(vector);
  ws.send(JSON.stringify(vector))
}

document.onkeydown = function(e) {
    e = e || window.event;
    //console.log('keydown: '+e.keyCode);
    var binding = keymap[e.keyCode];
    //console.log(binding+"     down");

    if (binding!=='undefined') {
      keyState[binding]=true;
      onKeyStateChanged(keyState);
      return false;
    }
}

document.onkeyup = function(e) {
    e = e || window.event;
    //console.log('keyup: '+e.keyCode);
    var binding = keymap[e.keyCode];
    //console.log("up     "+binding);

    if (binding!=='undefined') {
      keyState[binding]=false;
      onKeyStateChanged(keyState);
    }
}
