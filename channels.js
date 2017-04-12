
const EventEmitter = require('events');

class Channels extends EventEmitter {
  constructor() {
    super();
    this.channelsToClients = {};
    this.clientsToChannels = {};
    this.clientById = {};
  }
  unsubscribeClientFromAll(clientId){
    delete this.clientById[clientId];
    const allHisChannels = findOrCreate(this.clientsToChannels,clientId);
    delete this.clientsToChannels[clientId];
    allHisChannels.forEach(chName=>{
      const ch = this.channelsToClients[chName];
      remove(ch,clientId);
      if (ch.length==0) {
        this.onChannelActivityChanged(chName,false);
      }
    });
  };
  unsubscribeClientFromChannel(clientId,channelName){
    const allHisChannels = this.clientsToChannels[clientId];
    remove(allHisChannels,channelName);
    if (allHisChannels.length==0) {
      this.clientById.remove(clientId);
    }
    const channelClients = this.channelsToClients[channelName];
    remove(channelClients,clientId);
    if (channelClients.length==0) {
      this.onChannelActivityChanged(channelName,false);
    }
  };
  subscribeClient(clientId,client,channelName){
    const ch = findOrCreate(this.channelsToClients,channelName);
    ch.push(clientId);
    findOrCreate(this.clientsToChannels,clientId).push(channelName);
    this.clientById[clientId]=client;
    if (ch.length==1) {
      this.onChannelActivityChanged(channelName,true);
    }
  };
  getAllClientsSubscribed(channelName){
    return findOrCreate(this.channelsToClients, channelName);
  };
  channelIsActive(channelName) {
    return this.getAllClientsSubscribed(channelName).length>0;
  }
  onChannelActivityChanged(channelName, active){
    this.emit(channelName+"-"+(active?"activated":"deactivated"))
  }
};

module.exports = Channels;

function findOrCreate(dict,key) {
  const found = dict[key];
  if (found===undefined) {
    const created = [];
    dict[key]=created;
    return created;
  } else {
    return found;
  }
}

function remove(array,element) {
  const index = array.indexOf(element);
  if (index > -1) {
    array.splice(index, 1);
  } else {
    throw "not found "+element;
  }
}
