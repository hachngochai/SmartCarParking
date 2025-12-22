"use strict";

var zones = {
  A: {
    name: "A",
    total: 100,
    slots: []
  },
  B: {
    name: "B",
    total: 90,
    slots: []
  },
  C: {
    name: "C",
    total: 95,
    slots: []
  }
};

function initZones() {
  Object.keys(zones).forEach(function (zoneKey) {
    for (var i = 1; i <= zones[zoneKey].total; i++) {
      zones[zoneKey].slots.push({
        id: i,
        occupied: false,
        startTime: null
      });
    }
  });
}

initZones();
//# sourceMappingURL=data.dev.js.map
