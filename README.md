#BlueFind
(Fork from [ble-explorer](https://github.com/elin-moco/ble-explorer) by Eddie Lin)
To find a Bluetooth characteristic automatically for FirefoxOS device:

    var targetCharacteristicID = '713d0002-503e-4c75-ba94-3148f18d941e';
    var bluefind = new BlueFind();
    bluefind.setup()
      .then(bluefind.find.bind(bluefind, targetCharacteristicID))
      .then((c) => { console.log('got it', c) })
      .catch(console.error.bind(console))

For more detailed example, see `test/test-main.js` in the repo.

**WARNING: Code sucks; need a full-rewriting; don't use it if you want a stable product**

Licensing under Apache2 license (since it's from a MoCo work).
