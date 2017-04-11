class Channels {
  constructor() {

  }
  unsubscribeClientFromAll(client){};
  unsubscribeClientFromChannel(client,channelName){};
  subscribeClient(client,channelName){};
  getAllClientsSubscribed(channelName){};
  onChannelActivityChanged(channelName, callback){}
};


module.exports = Channels;
