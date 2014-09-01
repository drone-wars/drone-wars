# drone wars

A drone battleground with done brains encased in web workers.

This has been tested with stock Firefox >= 32, and Chrome >= 37 with
[harmony enabled](chrome://flags/#enable-javascript-harmony).

Sadly, Firefox behaves strangely with `let`, requiring particular script tags for it to work that
disagree with RequireJS. This code makes use of Harmony features, but not block scoping.

WORK IN PROGRESS
