var Fibers = Npm.require('fibers');

var getStackTrace = function() {
  var obj = {};
  Error.captureStackTrace(obj, getStackTrace);
  return obj.stack;
};

var originalYield = Fibers.yield;
Fibers.yield = function() {
  var kadiraInfo = Kadira._getInfo();
  if(kadiraInfo) {
    var eventId = Kadira.tracer.event(kadiraInfo.trace, 'async', {
      yieldStack: getStackTrace(),
    });
    if(eventId) {
      Fibers.current._apmEventId = eventId;
    }
  }

  return originalYield();
};

var originalRun = Fibers.prototype.run;
Fibers.prototype.run = function(val) {
  if(this._apmEventId) {
    var kadiraInfo = Kadira._getInfo(this);
    if(kadiraInfo) {
      Kadira.tracer.eventEnd(kadiraInfo.trace, this._apmEventId, {
        runStack: getStackTrace(),
      });
      this._apmEventId = null;
    }
  }
  return originalRun.call(this, val);
};
