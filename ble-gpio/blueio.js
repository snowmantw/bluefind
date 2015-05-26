'use strict';
(function(exports) {
  /**
   * This is a proxy to provide GPIO interface upon our
   * bluetooth implementation. It doesn't care things like
   * connection change, how to get device, etc.
   */
  var BlueIO = function(pinmap) {
    // pinmap: flag, direction: (in|out)
    this._pinmap = pinmap;
    this._characteristic = null;
    // If there is a read request.
    this._readResolve = null;
  };

  BlueIO.prototype.setup = function() {
    // Notification.
    window.addEventListener('characteristicchanged', this);
  };

  BlueIO.prototype.handleEvent = function(evt) {
    if (evt.type === 'characteristicchanged') {
      this.onNotify(evt.characteristic);
    }
  };

  /**
   * When notification comes, resolve one reading function.
   */
  BlueIO.prototype.onNotify = function(characteristic) {
    var { value, uuid } = charateristic;
    var resolve = this._readResolve;
    if (resolve && charateristic.uuid === this._characteristic.uuid) {
      resolve(value);
    }
  };

  /**
   * Before any manipulation, the characteristic must be setup.
   */
  BlueIO.prototype.characteristic = function(c) {
    if (this._characteristic && c.uuid === this._characteristic.uuid) {
      return;
    }
    this._characteristic = c;
    // Switch to new one.
    this._readResolve = null;
  };

  /**
   * Create a 'read' request and get the promise which only be resolved
   * after the read is completed.
   *
   * Since the implementation is to create a read promise,
   * and let it be resolved only when the notification
   * comes, one must uses looping to create a continuous reading.
   */
  BlueIO.prototype.read = function() {
    var resolve;
    var promise = new Promise((res, rej) => {
      resolve = res;
    });
    this._read
    this._readResolves[this._characteristic.uuid] = resolve;
    return promise;
  };

  /**
   * Although it's a useless wrapper, we may add some convenient converter
   * to ease the pain of converting hex and numbers.
   */
  BlueIO.prototype.write = function(value) {
    this._charateristic.writeValue(value);
    return Promise.resolve();
  };

  /**
   * @direction: 'in'|'out'
   * @id: one byte ID
   */
  BlueIO.prototype.setPinMode = function(id, direction) {
    // pinmap: flag, direction: (in|out)
    var command = [ this._pinmap.flag,
                    this._pinmap.direction[direction],
                    id
                  ];
    command = this.parseHexString(command.join(''));
    this._characteristic.writeValue(command);
    return Promise.resolve();
  };

  BlueIO.prototype.parseHexString(str) {
    var arrayBuffer = new ArrayBuffer(Math.ceil(str.length / 2));
    var uint8Array = new Uint8Array(arrayBuffer);

    for (var i = 0, j = 0; i < str.length; i += 2, j++) {
      uint8Array[j] = parseInt(str.substr(i, 2), 16);
    }
    console.log(uint8Array);
    return arrayBuffer;
  };

  exports.BlueIO = BlueIO;
})(window);
