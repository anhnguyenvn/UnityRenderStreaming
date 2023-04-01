import * as Logger from "./logger.js";

export default class Peer extends EventTarget {
  constructor(connectionId, polite, config, resendIntervalMsec = 5000) {
    super();
    const _this = this;
    this.connectionId = connectionId;
    this.polite = polite;
    this.config = config;
    this.pc = new RTCPeerConnection(this.config);
    this.makingOffer = false;
    this.waitingAnswer = false;
    this.ignoreOffer = false;
    this.srdAnswerPending = false;
    this.log = str => void Logger.log(`[${_this.polite ? 'POLITE' : 'IMPOLITE'}] ${str}`);
    this.warn = str => void Logger.warn(`[${_this.polite ? 'POLITE' : 'IMPOLITE'}] ${str}`);
    this.assert_equals = window.assert_equals ? window.assert_equals : (a, b, msg) => { if (a === b) { return; } throw new Error(`${msg} expected ${b} but got ${a}`); };
    this.interval = resendIntervalMsec;
    this.sleep = msec => new Promise(resolve => setTimeout(resolve, msec));

    this.pc.ontrack = e => {
      _this.log(`ontrack:${e}`);
      _this.dispatchEvent(new CustomEvent('trackevent', { detail: e }));
    };
    this.pc.ondatachannel = e => {
      _this.log(`ondatachannel:${e}`);
      _this.dispatchEvent(new CustomEvent('adddatachannel', { detail: e }));
    };
    this.pc.onicecandidate = ({ candidate }) => {
      _this.log(`send candidate:${candidate}`);
      Logger.error(candidate);
      this.log('canTrickleIceCandidates ' + this.pc.canTrickleIceCandidates);
      if (candidate == null) {
        return;
      }
      _this.dispatchEvent(new CustomEvent('sendcandidate', { detail: { connectionId: _this.connectionId, candidate: candidate.candidate, sdpMLineIndex: candidate.sdpMLineIndex, sdpMid: candidate.sdpMid } }));
    };

    this.pc.onicecandidateerror = (error) => {
      this.log('&*&*&*&* onicecandidateerror ');
      Logger.error(error);
    };

    this.pc.onnegotiationneeded = this._onNegotiation.bind(this);

    this.pc.onsignalingstatechange = () => {
      this.log("**** onsignalingstatechange");
      _this.log(`signalingState changed:${_this.pc.signalingState}`);
    };

    this.pc.oniceconnectionstatechange = (event) => {
      this.log("**** oniceconnectionstatechange");
      Logger.error(event);
      _this.log(`iceConnectionState changed:${_this.pc.iceConnectionState}`);
      if (_this.pc.iceConnectionState === 'disconnected') {
        this.log("** THIS CODENNNECTEDDFDFDF PEER");
        // this.log(JSON.parse(_this.pc));
        this.dispatchEvent(new Event('disconnect'));
      }
    };

    this.pc.onicegatheringstatechange = () => {
      _this.log(`iceGatheringState changed:${_this.pc.iceGatheringState}'`);
    };

    this.loopResendOffer();
  }

  async _onNegotiation() {
    try {
      this.log(`SLD due to negotiationneeded`);
      this.assert_equals(this.pc.signalingState, 'stable', 'negotiationneeded always fires in stable state');
      this.assert_equals(this.makingOffer, false, 'negotiationneeded not already in progress');
      this.makingOffer = true;
      await this.pc.setLocalDescription();
      this.assert_equals(this.pc.signalingState, 'have-local-offer', 'negotiationneeded not racing with onmessage');
      this.assert_equals(this.pc.localDescription.type, 'offer', 'negotiationneeded SLD worked');
      this.waitingAnswer = true;
      this.log("***SENDING OFFFERRR");
      this.dispatchEvent(new CustomEvent('sendoffer', { detail: { connectionId: this.connectionId, sdp: this.pc.localDescription.sdp } }));
    } catch (e) {
      this.log(e);
    } finally {
      this.makingOffer = false;
    }
  }

  async loopResendOffer() {
    while (this.connectionId) {
      if (this.pc && this.waitingAnswer) {
        this.dispatchEvent(new CustomEvent('sendoffer', { detail: { connectionId: this.connectionId, sdp: this.pc.localDescription.sdp } }));
      }
      await this.sleep(this.interval);
    }
  }

  close() {
    this.connectionId = null;
    if (this.pc) {
      this.pc.close();
      this.pc = null;
    }
  }

  getTransceivers(connectionId) {
    if (this.connectionId != connectionId) {
      return null;
    }

    return this.pc.getTransceivers();
  }

  addTrack(connectionId, track) {
    if (this.connectionId != connectionId) {
      return null;
    }

    return this.pc.addTrack(track);
  }

  addTransceiver(connectionId, trackOrKind, init) {
    if (this.connectionId != connectionId) {
      return null;
    }

    return this.pc.addTransceiver(trackOrKind, init);
  }

  createDataChannel(connectionId, label) {
    if (this.connectionId != connectionId) {
      return null;
    }

    return this.pc.createDataChannel(label);
  }

  async getStats(connectionId) {
    if (this.connectionId != connectionId) {
      return null;
    }

    return await this.pc.getStats();
  }

  async onGotDescription(connectionId, description) {
    this.log("**** onGotDescription");
    this.log(description);
    
    if (this.connectionId != connectionId) {
      return;
    }

    const _this = this;
    const isStable =
      this.pc.signalingState == 'stable' ||
      (this.pc.signalingState == 'have-local-offer' && this.srdAnswerPending);
    this.ignoreOffer =
      description.type == 'offer' && !this.polite && (this.makingOffer || !isStable);
      this.log("**** onGotDescription2222");
    if (this.ignoreOffer) {
      _this.log(`glare - ignoring offer`);
      return;
    }
    this.log("**** onGotDescription 333");
    this.waitingAnswer = false;
    this.srdAnswerPending = description.type == 'answer';
    _this.log(`SRD(${description.type})`);
    this.log("**** onGotDescription SET setRemoteDescription");
    this.log("**** onGotDescription SET setRemoteDescription111");
    this.log("**** onGotDescription SET setRemoteDescription222");
    this.log(description.type);
    if ( this.srdAnswerPendin){
      this.log("** SET ANWSER TO REMOTE DESCTIOTION");
    }
    this.log("**** onGotDescription SET setRemoteDescription xxxx");

    await this.pc.setRemoteDescription(description);
    this.srdAnswerPending = false;

    if (description.type == 'offer') {
      _this.dispatchEvent(new CustomEvent('ongotoffer', { detail: { connectionId: _this.connectionId } }));

      _this.assert_equals(this.pc.signalingState, 'have-remote-offer', 'Remote offer');
      _this.assert_equals(this.pc.remoteDescription.type, 'offer', 'SRD worked');
      _this.log('SLD to get back to stable');
      await this.pc.setLocalDescription();
      _this.assert_equals(this.pc.signalingState, 'stable', 'onmessage not racing with negotiationneeded');
      _this.assert_equals(this.pc.localDescription.type, 'answer', 'onmessage SLD worked');
      _this.dispatchEvent(new CustomEvent('sendanswer', { detail: { connectionId: _this.connectionId, sdp: _this.pc.localDescription.sdp } }));

    } else {
      this.log("**** onGotDescription SET ongotanswer");
      _this.dispatchEvent(new CustomEvent('ongotanswer', { detail: { connectionId: _this.connectionId } }));

      _this.assert_equals(this.pc.remoteDescription.type, 'answer', 'Answer was set');
      _this.assert_equals(this.pc.signalingState, 'stable', 'answered');
      this.pc.dispatchEvent(new Event('negotiated'));
    }
  }

  async onGotCandidate(connectionId, candidate) {
    this.log("**** GOT CANDIDATE");
    if (this.connectionId != connectionId) {
      return;
    }

    try { 
      this.log("**** GOT CANDIDATE 222");
      await this.pc.addIceCandidate(candidate);
    } catch (e) {
      this.log("**** GOT CANDIDATE 3333");
      if (this.pc && !this.ignoreOffer){
        this.log("**** GOT CANDIDATE 4444");
        this.warn(`${this.pc} this candidate can't accept current signaling state ${this.pc.signalingState}.`);
      }
    }
  }
}
