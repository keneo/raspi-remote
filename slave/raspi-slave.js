// Load the TCP Library
net = require('net');

// test commit

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

function onIdle() {
  robot.setLED(1,0);
  robot.setLED(2,1);
  robot.setMotor("left",0);
  robot.setMotor("right",0);
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
    " ": ["stop",function() { onIdle(); }],
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

// Send a message to all clients
function broadcast(message, sender) {
    clients.forEach(function (client) {
      // Don't want to send it to sender
      if (client === sender) return;
      client.write(message+"\r\n");
    });
    // Log it to the server output too
    process.stdout.write(message+"\r\n");
}

// Start a TCP Server
net.createServer(function (socket) {

  // Identify this client
  socket.name = socket.remoteAddress + ":" + socket.remotePort 

  // Put this new client in the list
  clients.push(socket);

  // Send a nice welcome message and announce
  socket.write("Welcome " + socket.name);
  broadcast(socket.name + " joined the chat", socket);

  // Handle incoming messages from clients.
  socket.on('data', function (data) {
    resetIdleTimeout();
    var action = keyToFun[data];
    if (action==undefined){
      broadcast(socket.name + "> " + data + " <- unknown command", socket);
    } else {
        broadcast(socket.name + "> " + action[0], socket);
        (action[1])();
    }
    
  });

  // Remove the client from the list when it leaves
  socket.on('end', function () {
    clients.splice(clients.indexOf(socket), 1);
    broadcast(socket.name + " left the chat.");
  });
  


}).listen(5000);

// Put a friendly message on the terminal of the server.
console.log("Chat server running at port 5000, v2\n");
