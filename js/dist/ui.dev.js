"use strict";

var toggle = document.getElementById("modeToggle");

toggle.onclick = function () {
  document.body.classList.toggle("dark");
};

var currentVehicle = "car";
document.querySelectorAll(".vehicle-option").forEach(function (item) {
  item.onclick = function () {
    document.querySelectorAll(".vehicle-option").forEach(function (v) {
      return v.classList.remove("active");
    });
    item.classList.add("active");
    currentVehicle = item.dataset.type;
  };
});
//# sourceMappingURL=ui.dev.js.map
