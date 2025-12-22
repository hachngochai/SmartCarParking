"use strict";

/* ===================== DOM ===================== */
var grid = document.getElementById("parkingGrid");
var customSelect = document.getElementById("zoneSelect");
var selected = customSelect.querySelector(".selected");
var options = customSelect.querySelectorAll(".options li");
var vehicleInfo = document.getElementById("vehicleInfo");
var plateInfo = document.getElementById("plateInfo");
var statusText = document.getElementById("status");
var timerText = document.getElementById("timer");
var priceText = document.getElementById("price");
var zoneSelector = document.getElementById("zoneSelector");
var freeCountEl = document.getElementById("freeCount");
var busyCountEl = document.getElementById("busyCount");
var vehicleImageEl = document.getElementById("vehicleImage");
/* ===================== STATE ===================== */

var currentZone = "A";
var activeSlot = null;
var timerInterval = null;
var detectedPlate = null;
var currentVehicle = "car";
/* ===================== DATA ===================== */

var vehicleImages = {
  car: "assets/vehicles/car.png",
  motorbike: "assets/vehicles/motorbike.png",
  bike: "assets/vehicles/bike.png"
};
/* ===================== VEHICLE SELECT ===================== */

document.querySelectorAll(".vehicle-option").forEach(function (opt) {
  opt.onclick = function () {
    document.querySelectorAll(".vehicle-option").forEach(function (o) {
      return o.classList.remove("active");
    });
    opt.classList.add("active");
    currentVehicle = opt.dataset.type;
  };
});

function showNotification(message) {
  var notif = document.getElementById("systemNotification");
  document.getElementById("notifMessage").textContent = message;
  notif.style.display = "block";
}

function closeNotification() {
  document.getElementById("systemNotification").style.display = "none";
}
/* ===================== ZONE ===================== */


function renderZoneButtons() {
  zoneSelector.innerHTML = "";
  Object.keys(zones).forEach(function (zoneKey) {
    var btn = document.createElement("button");
    btn.className = "zone-btn";
    btn.textContent = zones[zoneKey].name;
    if (zoneKey === currentZone) btn.classList.add("active");

    btn.onclick = function () {
      currentZone = zoneKey;
      renderZoneButtons();
      renderSlots();
    };

    zoneSelector.appendChild(btn);
  });
}

function updateZoneInfo() {
  var slots = zones[currentZone].slots;
  var free = 0,
      busy = 0;
  slots.forEach(function (s) {
    return s.occupied ? busy++ : free++;
  });
  freeCountEl.textContent = free;
  busyCountEl.textContent = busy;
}
/* ===================== PARKING GRID ===================== */


function renderSlots() {
  grid.innerHTML = "";
  var slots = zones[currentZone].slots;
  slots.forEach(function (slot) {
    var div = document.createElement("div");
    div.className = "slot " + (slot.occupied ? "busy" : "free");
    div.textContent = "Slot ".concat(slot.id);

    div.onclick = function () {
      return handleSlotClick(slot);
    };

    grid.appendChild(div);
  });
  updateZoneInfo();
}
/* ===================== SLOT CLICK ===================== */


function handleSlotClick(slot) {
  // if (!slot.occupied && !detectedPlate) {
  //     alert("Please scan license plate first!");
  //     return;
  // }
  if (!detectedPlate) {
    showNotification("Please scan vehicle plate first!");
    return;
  }

  var existed = isVehicleAlreadyParked(detectedPlate);

  if (existed) {
    showNotification("Vehicle already parked!\nZone: ".concat(existed.zone, "\nSlot: ").concat(existed.slot));
    return;
  }

  if (!slot.occupied) {
    slot.occupied = true;
    slot.startTime = Date.now();
    slot.vehicle = currentVehicle;
    slot.plate = detectedPlate;
    activeSlot = slot;
    vehicleInfo.textContent = "Vehicle: ".concat(currentVehicle);
    plateInfo.textContent = "Plate: ".concat(detectedPlate);
    statusText.textContent = "Parking at ".concat(zones[currentZone].name, " - Slot ").concat(slot.id);
    vehicleImageEl.src = vehicleImages[currentVehicle];
    vehicleImageEl.style.display = "block";

    var _existed = isVehicleAlreadyParked(detectedPlate);

    startTimer();
  } else {
    var minutes = Math.floor((Date.now() - slot.startTime) / 60000);
    var price = calculatePrice(minutes);
    showQRBill({
      zone: zones[currentZone].name,
      slot: slot.id,
      vehicle: slot.vehicle,
      plate: slot.plate,
      time: minutes,
      price: price
    });
    stopTimer();
    slot.occupied = false;
    slot.startTime = null;
    slot.vehicle = null;
    slot.plate = null;
    detectedPlate = null;
    vehicleInfo.textContent = "Vehicle: —";
    plateInfo.textContent = "Plate: —";
    statusText.textContent = "Select a slot";
    vehicleImageEl.style.display = "none";
    document.getElementById("plateText").textContent = "—";
  }

  renderSlots();
}

function isVehicleAlreadyParked(plate) {
  for (var zoneKey in zones) {
    var slots = zones[zoneKey].slots;
    var _iteratorNormalCompletion = true;
    var _didIteratorError = false;
    var _iteratorError = undefined;

    try {
      for (var _iterator = slots[Symbol.iterator](), _step; !(_iteratorNormalCompletion = (_step = _iterator.next()).done); _iteratorNormalCompletion = true) {
        var slot = _step.value;

        if (slot.occupied && slot.plate === plate) {
          return {
            zone: zones[zoneKey].name,
            slot: slot.id
          };
        }
      }
    } catch (err) {
      _didIteratorError = true;
      _iteratorError = err;
    } finally {
      try {
        if (!_iteratorNormalCompletion && _iterator["return"] != null) {
          _iterator["return"]();
        }
      } finally {
        if (_didIteratorError) {
          throw _iteratorError;
        }
      }
    }
  }

  return null;
}
/* ===================== ZONE DROPDOWN ===================== */


selected.onclick = function () {
  return customSelect.classList.toggle("open");
};

options.forEach(function (option) {
  option.onclick = function () {
    currentZone = option.dataset.zone;
    selected.innerHTML = option.textContent + '<span class="arrow">▾</span>';
    customSelect.classList.remove("open");
    stopTimer();
    renderZoneButtons();
    renderSlots();
  };
});
document.addEventListener("click", function (e) {
  if (!customSelect.contains(e.target)) {
    customSelect.classList.remove("open");
  }
});
/* ===================== TIMER ===================== */

function startTimer() {
  clearInterval(timerInterval);
  timerInterval = setInterval(function () {
    if (!activeSlot) return;
    var diff = Math.floor((Date.now() - activeSlot.startTime) / 1000);
    var min = String(Math.floor(diff / 60)).padStart(2, "0");
    var sec = String(diff % 60).padStart(2, "0");
    timerText.textContent = "Time: ".concat(min, ":").concat(sec);
    priceText.textContent = "Price: ".concat(calculatePrice(Math.floor(diff / 60)), " VND");
  }, 1000);
}

function stopTimer() {
  clearInterval(timerInterval);
  timerText.textContent = "Time: 00:00";
  priceText.textContent = "Price: 0 VND";
}
/* ===================== CAMERA / SCAN ===================== */


document.getElementById("parkBtn").onclick = function () {
  return openCamera();
};

function openCamera() {
  detectedPlate = generatePlate();
  document.getElementById("cameraModal").style.display = "flex";
}

function generatePlate() {
  var letters = "ABCDEFGH";
  var nums = Math.floor(1000 + Math.random() * 9000);
  return "51".concat(letters[Math.floor(Math.random() * letters.length)], "-").concat(nums);
}

function confirmPlate() {
  document.getElementById("cameraModal").style.display = "none";
  document.getElementById("plateText").textContent = detectedPlate;
}
/* ===================== QR BILL ===================== */


function showQRBill(data) {
  var modal = document.getElementById("qrModal");
  var qrDiv = document.getElementById("qrCode");
  var info = document.getElementById("billInfo");
  qrDiv.innerHTML = "";
  var billText = "\nZone: ".concat(data.zone, "\nSlot: ").concat(data.slot, "\nVehicle: ").concat(data.vehicle, "\nPlate: ").concat(data.plate, "\nTime: ").concat(data.time, " minutes\nPrice: ").concat(data.price, " VND\n");
  new QRCode(qrDiv, {
    text: billText,
    width: 160,
    height: 160
  });
  info.innerText = billText;
  modal.style.display = "flex";
}

function closeQR() {
  document.getElementById("qrModal").style.display = "none";
}
/* ===================== INIT ===================== */


renderZoneButtons();
renderSlots();
//# sourceMappingURL=parking.dev.js.map
