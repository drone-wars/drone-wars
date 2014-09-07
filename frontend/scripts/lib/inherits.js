define(function () {
  'use strict';

  // Much like Node's util.inherits, but I don't care about the super-constructor stuff.
  function inherits(Child, Parent) {
    Child.prototype = Object.create(Parent.prototype, {
      constructor: {
        value: Child,
        enumerable: false,
        configurable: true,
        writable: true
      }
    });
  }

  return inherits;
});
