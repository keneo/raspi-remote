// Load the TCP Library
net = require('net');

// Keep track of the chat clients
var clients = [];

var RaspiRobot = require("./raspirobot.js").RaspiRobot, // Import the library
    robot = new RaspiRobot();

robot.setup(); // Set up GPIO ports

function ledBusy(){
    robot.setLED(1, 1); // Turn on LED 1
    robot.setLED(2, 0); // Turn off LED 2
}

ledBusy();

function motorStop() {
  robot.setLED(1,0);
  robot.setLED(2,1);
  robot.setMotor("left",0);
  robot.setMotor("right",0);
}

function onIdle() {
  motorStop();
}

var idleTimeout = setTimeout(onIdle, 250)

function resetIdleTimeout() {
    clearTimeout(idleTimeout);
    idleTimeout = setTimeout(onIdle, 250);
}

var keyToFun = {
    "u": ["update",function() { myexit(0); }],
    "r": ["restart",function() { myexit(10); }],
    "k": ["kill",function() { myexit(20); }],

    "o": ["led1 switch",function() { robot.setLED(1,(robot.getLED(1)?0:1)); }],
    "p": ["led2 switch",function() { robot.setLED(2,(robot.getLED(2)?0:1)); }],
    "w": ["forward",function() { ledBusy(); robot.setMotor("left",1); robot.setMotor("right",1); }],
    "s": ["backwards",function() { ledBusy(); robot.setMotor("left",1,1); robot.setMotor("right",1,1); }],
    " ": ["stop",function() { motorStop(); }],
    "a": ["left",function() { ledBusy(); robot.setMotor("left",0); robot.setMotor("right",1); }],
    "d": ["right",function() { ledBusy(); robot.setMotor("left",1); robot.setMotor("right",0); }]
}

function myexit(code) {
    clearTimeout(idleTimeout);
    robot.setLED(1, 1);
    robot.setLED(2, 1);
    broadcast("Server closing in 1 sec. Code: "+code);
    setTimeout(function(){process.exit(code);}, 1000);
}

net.createServer(function (socket) {
  socket.name = socket.remoteAddress + ":" + socket.remotePort
  clients.push(socket);
  socket.write("Welcome " + socket.name + "\r\n");
  broadcast(socket.name + " joined.", socket);
  socket.on('data', function (data) {
    resetIdleTimeout();
    //console.log(JSON.stringify(data));
    var action = keyToFun[data.toString().trim()[0]];
    if (action==undefined){
      broadcast(socket.name + "> " + data + " <- unknown command", socket);
    } else {
        broadcast(socket.name + "> " + action[0], socket);
        (action[1])();
    }
  });
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left.");
  });
}).listen(5000);

// Put a friendly message on the terminal of the server.
console.log("Telnet server running at port 5000, v2\n");

var express = require('express')
var app = express()

var expressWs = require('express-ws')(app);
var aWss = expressWs.getWss('/socket');

app.get('/', function (req, res) {
  res.send('Hello World!')
})

app.ws('/socket', function(ws, req) {
  broadcast("web socket created. req: "+req);
  ws.on('message', function(msg) {
    //ws.send(msg);
    broadcast("message received on web socket: "+msg);

    var d = JSON.parse(msg);
    if (d.x==0){
      //prosto
      if (d.y==0) {
        motorStop();
      } else {
        var reverse = d.y>0?0:1;
        ledBusy(); robot.setMotor("left",1,reverse); robot.setMotor("right",1,reverse);
      }
    } else {
      //skrecamy
      ledBusy();
      if (d.y==0) {
        //w miejscu
        robot.setMotor("left",1,d.x<0?1:0); robot.setMotor("right",1,d.x>0?1:0);
      } else {
        //w ruchu
        var dir = d.y==1?0:1;
        robot.setMotor("left",d.x==d.y?1:0,dir); robot.setMotor("right",d.x!=d.y?1:0,dir); 
      }
    }
  });
  ws.on('close', function() {
    //ws.send(msg);
    broadcast("web socket close event.");
  });
});

app.listen(3000, function () {
  console.log('Web app listening on port 3000. http://127.0.0.1:3000/ !')
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
