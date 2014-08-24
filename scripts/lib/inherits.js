define(function () {
  'use strict';

  return function (Child, Parent) {
    Child.prototype = Object.create(Parent.prototype, {
      constructor: {
        value: Child,
        enumerable: false,
        configurable: true,
        writable: true
      }
    });
  };
});
