var util = require('util');
var EventEmitter = require('events').EventEmitter;

module.exports = Hardware;

function Hardware() {
  EventEmitter.call(this);
  const that = this;
  //this.ledBusy=ledBusy; //

  robot.setup(); // Set up GPIO ports
  ledBusy();

  this.status = {
    startedOn:new Date(),
    //sensors:null,
    leds:[null,null],
    motors:[0,0],
    power:"on"
  }

  this.update=()=>{myexit(0); this.status.power="updating...";};
  this.restart=()=>{myexit(10); this.status.power="restarting...";};
  this.kill=()=>{myexit(20); this.status.power="terminating...";};


  this.led1_switch=()=> { robot.setLED(1,(robot.getLED(1)?0:1)); }
  this.led2_switch=()=> { robot.setLED(2,(robot.getLED(2)?0:1)); }
  this.forward=()=> { ledBusy(); robot.setMotor("left",1); robot.setMotor("right",1); resheduleStop(); }
  this.backwards=()=> { ledBusy(); robot.setMotor("left",1,1); robot.setMotor("right",1,1); resheduleStop(); }
  this.stop=()=> { motorStop(); unsheduleStop();}
  this.left=()=> { ledBusy(); robot.setMotor("left",0); robot.setMotor("right",1); resheduleStop(); }
  this.right=()=> { ledBusy(); robot.setMotor("left",1); robot.setMotor("right",0); resheduleStop(); }

  this.setDirection=(d)=> { //x,y
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

  function sensorOrNull() {
    try {
      var i2c = require('i2c-bus');
      var MPU6050 = require('i2c-mpu6050');

      var address = 0x68;
      var i2c1 = i2c.openSync(1);

      var sensor = new MPU6050(i2c1, address);
      return sensor;
    } catch (e) {
      return null;
    }
  }

  const sensor = sensorOrNull();

  this.sensorReadSync = function() {
    if (sensor!=null) {
      return sensor.readSync();
    } else {
      return null;
    }
  }

  function emitStatusUpdated() {
    that.emit("statusUpdated", that.status);
  }

  function runSensors() {
    that.status.sensors = that.sensorReadSync();
    emitStatusUpdated();
  }

  if (sensor!=null) {
    setInterval(runSensors, 500);
  }
}

util.inherits(Hardware, EventEmitter);

//var util = require('util');
//var EventEmitter = require('events').EventEmitter;

var RaspiRobot = require("./raspirobot.js").RaspiRobot, // Import the library
    robot = new RaspiRobot();

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
