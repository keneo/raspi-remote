var chai = require('chai');
var expect = chai.expect; // we are using the "expect" style of Chai
var Channels = require('./../channels');

describe('Channels', function() {
  it('should allow subscribe and unsubscribe from channel', function() {
    var channels = new Channels();
    channels.subscribeClient("ala","ala","ch1");
    expect(channels.getAllClientsSubscribed("ch1")[0]).to.equal("ala");
  });

  it('should allow unsubscribe client from all channels in 1 shot', function() {
    var channels = new Channels();
    channels.subscribeClient("ala","ala","ch1");
    channels.subscribeClient("ala","ala","ch2");
    channels.unsubscribeClientFromAll("ala");
    expect(channels.getAllClientsSubscribed("ch1").length).to.equal(0);
    expect(channels.getAllClientsSubscribed("ch2").length).to.equal(0);
  });


  it('should allow unsubscribe client from one channel but stay on the rest', function() {
    var channels = new Channels();
    channels.subscribeClient("ala","ala","ch1");
    channels.subscribeClient("ala","ala","ch2");
    channels.unsubscribeClientFromChannel("ala","ch1");
    expect(channels.getAllClientsSubscribed("ch1").length).to.equal(0);
    expect(channels.getAllClientsSubscribed("ch2").length).to.equal(1);
    expect(channels.getAllClientsSubscribed("ch2")[0]).to.equal("ala");
  });

});
