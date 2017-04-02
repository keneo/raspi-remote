var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = MyRobot;

function MyRobot() {
  EventEmitter.call(this);
  const that = this;
  this.setup=setup;
  //this.ledBusy=ledBusy; //

  this.update=(()=>{myexit(0);});
  this.restart=(()=>{myexit(10);});
  this.kill=(()=>{myexit(20);});

  this.led1_switch=led1_switch;
  this.led2_switch=led2_switch;
  this.forward=forward;
  this.backwards=backwards;
  this.stop=stop;
  this.left=left;
  this.right=right;
  this.setDirection=setDirection;

  function myexit(code) {
      robot.setLED(1, 1);
      robot.setLED(2, 1);
      broadcast("Server closing in 1 sec. Code: "+code);
      setTimeout(function(){process.exit(code);}, 1000);
  }

  function broadcast(message) {
      //process.stdout.write(message+"\n");
      that.emit('message', message);
  }
}

util.inherits(MyRobot, EventEmitter);

//var util = require('util');
//var EventEmitter = require('events').EventEmitter;

var RaspiRobot = require("./raspirobot.js").RaspiRobot, // Import the library
    robot = new RaspiRobot();

function setup() {
  robot.setup(); // Set up GPIO ports
  ledBusy();
}

function ledBusy(){
    robot.setLED(1, 1); // Turn on LED 1
    robot.setLED(2, 0); // Turn off LED 2
}

function motorStop() {
  robot.setLED(1,0);
  robot.setLED(2,1);
  robot.setMotor("left",0);
  robot.setMotor("right",0);
}

var stopScheduledTimeout = setTimeout(motorStop, 250)

function unsheduleStop() {
  clearTimeout(stopScheduledTimeout);
}

function resheduleStop() {
    unsheduleStop();
    stopScheduledTimeout = setTimeout(motorStop, 250);
}

function led1_switch() { robot.setLED(1,(robot.getLED(1)?0:1)); }
function led2_switch() { robot.setLED(2,(robot.getLED(2)?0:1)); }
function forward() { ledBusy(); robot.setMotor("left",1); robot.setMotor("right",1); resheduleStop(); }
function backwards() { ledBusy(); robot.setMotor("left",1,1); robot.setMotor("right",1,1); resheduleStop(); }
function stop() { motorStop(); unsheduleStop();}
function left() { ledBusy(); robot.setMotor("left",0); robot.setMotor("right",1); resheduleStop(); }
function right() { ledBusy(); robot.setMotor("left",1); robot.setMotor("right",0); resheduleStop(); }

function setDirection(d) { //x,y
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
}
