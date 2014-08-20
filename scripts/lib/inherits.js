(function (window) {
  'use strict';

  window.inherits = function (Child, Parent) {
    Child.prototype = Object.create(Parent.prototype, {
      constructor: {
        value: Child,
        enumerable: false,
        configurable: true,
        writable: true
      }
    });
  };
}(window));
