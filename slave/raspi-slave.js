// Load the TCP Library
net = require('net');

// Keep track of the chat clients
var clients = [];

var MyRobot = require("./myrobot.js")
    myrobot = new MyRobot();

myrobot.setup(); // Set up GPIO ports

var keyToFun = {
    "u": "update",
    "r": "restart",
    "k": "kill",

    "o": "led1_switch",
    "p": "led2_switch",
    "w": "forward",
    "s": "backwards",
    " ": "stop",
    "a": "left",
    "d": "right"
}

net.createServer(function (socket) {
  socket.name = socket.remoteAddress + ":" + socket.remotePort
  clients.push(socket);
  socket.write("Welcome " + socket.name + "\r\n");
  broadcast(socket.name + " joined.", socket);
  socket.on('data', function (data) {
    //console.log(JSON.stringify(data));
    var action = keyToFun[data.toString().trim()[0]];
    if (action==undefined){
      broadcast(socket.name + "> " + data + " <- unknown command", socket);
    } else {
      broadcast(socket.name + "> " + action, socket);
      (myrobot[action])();
    }
  });
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left.");
  });
}).listen(5000);

console.log("Telnet server running at port 5000, v2\n");

var express = require('express')
var app = express()

var expressWs = require('express-ws')(app);
var aWss = expressWs.getWss('/socket');

app.use(express.static(__dirname + '/public'));
app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.ws('/socket', function(ws, req) {
  broadcast("web socket created. req: "+req);
  ws.on('message', function(msg) {

    broadcast("message received on web socket: "+msg);

    var d = JSON.parse(msg);
    myrobot.setDirection(d);
  });
  ws.on('close', function() {
    //ws.send(msg);
    broadcast("web socket close event.");
  });
});

app.listen(2000, function () {
  console.log('Web app listening on port 2000. http://127.0.0.1:2000/ !')
})

function broadcast(message, sender) {
  clients.forEach(function (client) {
    // Don't want to send it to sender
    if (client === sender) return;
    client.write(message+"\r\n");
  });

  aWss.clients.forEach(function (client) {
    client.send(message);
  });

  // Log it to the server output too
  process.stdout.write(message+"\n");
}

myrobot.on('message',broadcast);
