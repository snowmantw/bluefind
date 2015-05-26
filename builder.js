'use strict';

/**
 * Give a literal object to generate a component.
 * Since the component would directly map to hardware so it's a thin wrapper.
 * If give a 'send' and 'wait' pair then there is an async operation.
 * No matter the operations are async or not, the whole process should be
 * handled in Promise or other async managements.
 *
 * The built prototype still need a hardware instance to have '_write' and
 * '_onsignal' methods.
 */
(function(exports) {
  var Builder = function() {};
  
  Builder.prototype.create = function(manifest) {
    var proto = {
      'name': manifest.name,
      'type': manifest.type
    };
    proto = this._buildMethods(manifest, proto);
  };
  
  Builder.prototype._buildMethods = function(manifest, proto) {
    return Object.keys(manifest.methods).reduce((neoproto, methodName) => {
      neoproto[methodName] = this._generateMethod(manifest.methods[methodName]);
      return neoproto;
    }, proto);
  };

  Builder.prototype._generateMethod = function(methodInfo) {
    var { name, input, output } = this._parseMethodInfo(methodInfo);

    // The 'this' would be the component.
    var method = function(value) {
      input.parse(value);   // Throw error if it's out of range.
      this._write(value);
      return new Promise((resolve) => {
        if (output) {
          this._onsignal((data) => {
            if (output.check(data)) {
              resolve(output.parse(data));
            }
          });
        } else {
          resolve();
        }
      });
    };
    return method;
  };

  /**
   * According to the literal information, map it to functional object.
   */
  Builder.prototype._parseMethodInfo = function(methodInfo) {
    var { name, input, output } = methodInfo;
    // The 'type' of two -put, would indicate to one
    // value range prototype.
    methodInfo.input = new input.type(input.range);
    methodInfo.output = new output.type(output.range);
    return methodInfo;
  };
  exports.Builder = Builder;
})(window);
