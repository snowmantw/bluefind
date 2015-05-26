'use strict';

/**
 * Give an UUID of the characteristic,
 * this component would find it for you.
 * Usage:
 *    var finder = new BlueFind();
 *    finder.setup()
 *      .then(finder.find.bind(finder, <uuid>))
 *      .then((characteristic) => {.....});
 */
(function(exports) {
  var BlueFind = function() {
    this._bluetooth = window.navigator.mozBluetooth;
    // Setup later.
    this._adapter = null;
    // Discovered devices with GATT.
    this._searchingDevices = [];
    this._abortFindings = [];
  };

  BlueFind.prototype.setup = function() {
    return this.setupAdapter()
      .catch(console.error.bind(console));
  };

  BlueFind.prototype.setupAdapter = function() {
    var resolve;
    var promise = new Promise((res) => {
      resolve = res;
    });
    var onBluetoothChanged = (evt) => {
      console.log('>> started from setupAdapter');
      evt.attrs.forEach((attr) => {
        if ('defaultAdapter' === attr) {
          this._adapter = this._bluetooth.defaultAdapter;
          this._bluetooth.removeEventListener('attributechanged',
            onBluetoothChanged);
          resolve();
        }
      });
    };
    console.log('>> prepare to setupAdapter');
    if (this._bluetooth.defaultAdapter) {
      // If there is already the adapter, use it.
      this._adapter = this._bluetooth.defaultAdapter;
      console.log('>> >> has the default adapter');
      resolve();
    } else {
      console.log('>> >> no default adapter');
      // If there is no adapter at this time, need to wait it.
      this._bluetooth.addEventListener('attributechanged',
        onBluetoothChanged);
    }
    return promise;
  };

  BlueFind.prototype.searchDevice =
  function(resolve, device, uuid) {
    if (!device.gatt) {
      return;
    }
    this._searchingDevices.push(device);
    device.gatt.connect()
    .then(() => {
      console.log('>>>> discoverServices for: ', device.uuid, device.address);
      return device.gatt.discoverServices();
    })
    .then(() => {
      device.gatt.services.forEach((service) => {
        service.characteristics.forEach((c) => {
          console.log('>>>> find: ', c.uuid, uuid);
          // If found it and it's not aborted.
          if (c.uuid === uuid && 0 !== this._abortFindings.length) {
            resolve(c);
          }
        });
      }); // -- to find services and characteristics.
    })
    .catch(console.error.bind(console));
  };

  BlueFind.prototype.find = function(uuid) {
    // Return a promise only resolves when it found the one.
    if (this._adapter.discovering) {
      throw new Error('Can\'t find since adapter is already in discovering');
    }
    return this._adapter.startDiscovery()
    .then((handle) => {
      return new Promise((resolve, reject) => {
        handle.addEventListener('devicefound', (e) => {
          console.log('>> devicefound: ', e.device.uuid, e.device.address);
          this.searchDevice(resolve, e.device, uuid);
          this._abortFindings.push(reject);
        });
      });
    });
  };

  /**
   * Abort the on going searching.
   */
  BlueFind.prototype.abort = function() {
    if (0 !== this._abortFindings.length) {
      this._abortFindings.forEach((rej) => {
        rej('User aborted');
      });
      this._abortFindings.length = 0;
    }
  };

  BlueFind.prototype.disconnect = function() {
    if (!this._adapter) { return; }
    return Promise.all(this._searchingDevices.map((device) => {
      return device.gatt.disconnect();
    }));
  };
  exports.BlueFind = BlueFind;
})(window);
