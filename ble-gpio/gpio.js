var CCCD_UUID = '00002902-0000-1000-8000-00805f9b34fb';
var gattClient = environment.device.gatt;

navigator.gpio = {
    _pins: {},

    /**
     * value: UInt8Array
     */
    _write: function (value, characteristic) {
      // It's sync but we need to keep compability.
      characteristic.writeValue(value);
      return Promise.resolve();
    },

    _read: function (characteristic, bytes) {
      // TODO: Ideally we only need the 'startNotifications', but since
      // some underlying design, we need these to ensure the notifying works.
      for (var i in characteristic.descriptors) {
        if (characteristic.descriptors[i].uuid === CCCD_UUID) {
          cccDescriptor = characteristic.descriptors[i];
          var arrayBuffer = new ArrayBuffer(2);
          var uint8Array = new Uint8Array(arrayBuffer);
          uint8Array[0] = 0x01;
          uint8Array[1] = 0x00;
          cccDescriptor.writeValue(arrayBuffer);
        }
      }
      return characteristic.startNotifications()
      .then(() => {})
      .catch((reason) => {
        console.error('start notification failed: reason = ' + reason);
      });

      /*
        gattClient.oncharacteristicchanged = function onCharacteristicChanged(e) {
          var characteristic = e.characteristic;
          console.log('The value of characteristic (uuid:', characteristic.uuid, ') changed to ', characteristic.value);
          if (characteristic.value) {
            var strValue = toHexString(characteristic.value);
            console.log(strValue);
            var valueNode = document.getElementById('characteristic')
              .getElementsByTagName('section')[0]
              .querySelectorAll('ul > li > a > p');
            if (valueNode.length > 1) {
              valueNode[1].textContent = strValue;
            }
          }
        };
        */
    },

    getPin: function (id) {
        return this._pins[id];
    },

    setPinMode: function (id, mode) {
        var direction;
        switch (mode) {
        case 'in':
        case 'input':
            direction = 'in';
            break;
        case 'out':
        case 'output':
            direction = 'out';
            break;
        default:
            throw 'mode should be in|out';
        }

        var promise =
            this._write(id, '/sys/class/gpio/export')
            .then(() => this._write(direction, '/sys/class/gpio/gpio' + id + '/direction'))
            .then(() => {
                var fm = direction === 'out' ? 'wb' : 'rb';
                return navigator.mozOs.openFile('/sys/class/gpio/gpio' + id + '/value', fm);
            })
            .then(fd => {
                console.log('hi there', id, fd);
                this._pins[id] = new GpioPin(id, mode, direction, fd);
                return this._pins[id];
            })
            .catch(err => {
                console.error('Exporting gpio pin', id, 'failed', err);
                throw err;
            });

        return promise;
    }
};

function GpioPin(id, mode, direction, fd) {
    this.id = id;
    this.mode = mode;
    this.direction = direction;
    this.fd = fd;
}

GpioPin.prototype.addEventListener = function () {
    throw 'NotImplemented';
};

GpioPin.prototype.removeEventListener = function () {
    throw 'NotImplemented';
};

GpioPin.prototype.writeDigital = function (value) {
    value = value ? 1 : 0;

    return Promise.resolve()
        .then(() => this.fd.setPosition(0, 'POS_START'))
        .then(() => this.fd.write(value, 'utf-8'))
        .catch(err => {
            this._lastValue = null;
            console.error('Gpio', this.id, 'writeDigital failed', err);
            throw err;
        });
};

GpioPin.prototype.writeAnalog = function () {
    throw 'NotImplemented';
};

GpioPin.prototype.readDigital = function () {
    return Promise.resolve()
        .then(() => this.fd.setPosition(0, 'POS_START'))
        .then(() => this.fd.read(1, 'utf-8'))
        .then(res => res[0] === '1' ? true : false);
};

GpioPin.prototype.readAnalog = function () {
    throw 'NotImplemented';
};

GpioPin.prototype.release = function () {
    return this.fd.close();
};
