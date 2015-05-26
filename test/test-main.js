'use strict';
(function() {
  document.addEventListener('DOMContentLoaded', function() {
    var finding;
    var find = function() {
      if (true === finding) {
        throw new Error(`dont perform another finding while this
          one is still pending`);
      }
      finding = true;
      var thetarget;
      console.log('>> start the finding test');
      var bluefind = new BlueFind();
      bluefind.setup()
        .then(bluefind.find.bind(bluefind, '713d0002-503e-4c75-ba94-3148f18d941e'))
        .then((c) => {
          console.log('got the characteristic', c)
          bluefind.abort();
          bluefind.disconnect();
          thetarget = c;
          console.log('>> reset finding');
          finding = null;
        })
        .catch(function(e) {
          console.log('>> reset finding');
          finding = null;
          console.error(e);
        });
      finding = setTimeout(function() {
        if (!thetarget) {
          bluefind.abort();
          bluefind.disconnect();
          console.error('>> cannot find the characteristic in 10 secs');
          console.log('>> reset finding');
          finding = null;
        }
      }, 10 * 1000);
    };
    console.log('>> after loaded');
    document.getElementById('start-search-device').addEventListener('click', find);
  });
})();
