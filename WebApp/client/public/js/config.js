export async function getServerConfig() {
  const protocolEndPoint = location.origin + '/config';
  const createResponse = await fetch(protocolEndPoint);
  return await createResponse.json();
}

export function getRTCConfiguration() {
  let config = {};
  config.sdpSemantics = 'unified-plan';
  // config.iceServers = [{ urls: ['stun:stun.l.google.com:19302'] }];
  config.iceServers = [{
    urls: ['stun:stun.l.google.com:19302'] 
    },{
      urls: ['stun:stun1.l.google.com:19302'] 
      },{
        urls: ['stun:stun2.l.google.com:19302'] 
        },{
          urls: ['stun:stun3.l.google.com:19302'] 
          },
    {
      urls: ['stun:relay.metered.ca:80']
    }
    , {
    urls: ['turn:relay.metered.ca:443?transport=tcp'], 
    username: '948af193297139967d3960b8', 
    credential: '2aH3tkETJpuYc/uo'
  }, {
    urls: ['turn:relay.metered.ca:80'], 
    username: '948af193297139967d3960b8', 
    credential: '2aH3tkETJpuYc/uo'
  }, {
    urls: ['turn:relay.metered.ca:443'], 
    username: '948af193297139967d3960b8', 
    credential: '2aH3tkETJpuYc/uo'
  }
];


// config.iceServers = [{ urls: ["stun:hk-turn1.xirsys.com"] },
//   {
//     username: "zr8Zz2qRj4xUPaUFd6y3LrTlTMVHTRiDAn2jj3jfhCP-JyKy8dB738nNZS6Wni8eAAAAAGQoKwhhbmhuZ3V5ZW4=",
//     credential: "3d94b01c-d08d-11ed-a5c0-0242ac120004",
//     urls: ["turn:hk-turn1.xirsys.com:80?transport=udp", "turn:hk-turn1.xirsys.com:3478?transport=udp", 
//     "turn:hk-turn1.xirsys.com:80?transport=tcp", "turn:hk-turn1.xirsys.com:3478?transport=tcp", "turns:hk-turn1.xirsys.com:443?transport=tcp",
//      "turns:hk-turn1.xirsys.com:5349?transport=tcp"]
//   }]

  return config;
}