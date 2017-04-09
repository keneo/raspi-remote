const net = require('net');

const clientsOnTelnet = [];

const MyRobot = require("./myrobot.js"),
      myrobot = new MyRobot();

myrobot.setup();

function slavesExecute(action,args) {
  //broadcast()
  slaves.forEach(slave=>{slave.send(JSON.stringify([action,args]))});
  (myrobot[action])(args);
}

net.createServer(function (socket) {
  socket.name = socket.remoteAddress + ":" + socket.remotePort
  clientsOnTelnet.push(socket);
  socket.write("Welcome " + socket.name + "\r\n");
  broadcast(socket.name + " joined.", socket);
  socket.on('data', function (data) {
    const keyToFun = {
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
    const action = keyToFun[data.toString().trim()[0]];
    if (action==undefined){
      broadcast(socket.name + "> " + data + " <- unknown command");
    } else {
      broadcast(socket.name + "> " + action, socket);
      slavesExecute(action,null);
    }
  });
  socket.on('end', function () {
    clientsOnTelnet.splice(clientsOnTelnet.indexOf(socket), 1);
    broadcast(socket.name + " left.");
  });
}).listen(5000);

console.log("Telnet server running at port 5000, v2\n");

const express = require('express')
const app = express()

const expressWs = require('express-ws')(app);
//const aWss = expressWs.getWss('/socket');

app.use(express.static(__dirname + '/public'));

const clientsOnWS = [];

app.ws('/socket', function(ws, req) {
  broadcast("client (web browser) connected on web socket.");
  clientsOnWS.push(ws);
  ws.on('message', function(msg) {

    broadcast("message received from client (web browser): "+msg);

    const cmd = JSON.parse(msg);
    const method = cmd[0];
    const arg = cmd[1];
    slavesExecute(method,arg);
  });
  ws.on('close', function() {
    //ws.send(msg);
    clientsOnWS.splice(clientsOnWS.indexOf(ws), 1);
    broadcast("client connection closed.");
  });
});

const slaves = [];

app.ws('/slaveSocket', function(ws, req) {
  slaves.push(ws);
  broadcast("Slave has connected.");
  ws.on('message', function(msg) {
    broadcast("Slave WS> Message from slave: "+msg);
  });
  ws.on('close', function() {
    slaves.splice(slaves.indexOf(ws), 1);
    //ws.send(msg);
    broadcast("Slave disconnected: "+ws);
  });
});

const port = process.env.PORT || 2000;

app.listen(port, function () {
  console.log('Web app listening on port '+port+'. http://127.0.0.1:'+port+'/ !')
})

var uplinkConnection = null;

const config = require("./config.js");

if (config.remoteMasterHostAndPort != null) {
  const remoteHostAndPort = config.remoteMasterHostAndPort;
  const WebSocketClient = require('websocket').client;
  const client = new WebSocketClient();

  client.on('connectFailed', function(error) {
      broadcast('WSC Connect Error: ' + error.toString());
      scheduleWSCReconnect();
  });

  client.on('connect', function(connection) {
      broadcast('WSC WebSocket Client Connected');
      connection.on('error', function(error) {
          broadcast("WSC Connection Error: " + error.toString());
          scheduleWSCReconnect();
      });
      connection.on('close', function() {
          broadcast('WSC Connection Closed');
          uplinkConnection = null;
          scheduleWSCReconnect();
      });
      connection.on('message', function(message) {
          if (message.type === 'utf8') {
              broadcast("WSC Received: '" + message.utf8Data + "'");

              const cmd = JSON.parse(message.utf8Data);
              const method = cmd[0];
              const arg = cmd[1];
              myrobot[method](arg);
          } else {
            broadcast("WSC Unknown message type: "+message.type);
            broadcast("WSC Full message dump: "+JSON.stringify(message));
          }
      });
  });

  function wscReconnect() {
    const socketUrl = 'ws://'+remoteHostAndPort+'/slaveSocket';
    broadcast("WSC Connecting to remote master web socket: "+socketUrl+" ...");
    client.connect(socketUrl);
  }
  var wscReconnectTimeout;
  function scheduleWSCReconnect(){
    broadcast("WSC Reconnect attempt in 5 secs...");
    clearTimeout(wscReconnectTimeout)
    wscReconnectTimeout=setTimeout(wscReconnect,5000);
  }

  wscReconnect();
}

function broadcast(message, sender) {
  process.stdout.write(message+"\n");
  clientsOnTelnet.forEach(function (client) {
    // Don't want to send it to sender
    if (client !== sender) {
      client.write(message+"\r\n");
    }
  });

  clientsOnWS.forEach(function (client) {
    if (client !== sender) {
      client.send(message);
    }
  });

  if (uplinkConnection !== sender && uplinkConnection!=null) {
    uplinkConnection.sendUTF(message);
  }
}

function broadcastObject(ob, sender) {
  broadcast("X"+JSON.stringify(ob), sender);
}

myrobot.on('message',broadcast);
//myrobot.on('slaveStatus',)
