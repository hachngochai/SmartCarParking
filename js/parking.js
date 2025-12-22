/* ===================== DOM ===================== */
const grid = document.getElementById("parkingGrid");
const customSelect = document.getElementById("zoneSelect");
const selected = customSelect.querySelector(".selected");
const options = customSelect.querySelectorAll(".options li");

const vehicleInfo = document.getElementById("vehicleInfo");
const plateInfo = document.getElementById("plateInfo");
const statusText = document.getElementById("status");
const timerText = document.getElementById("timer");
const priceText = document.getElementById("price");

const zoneSelector = document.getElementById("zoneSelector");
const freeCountEl = document.getElementById("freeCount");
const busyCountEl = document.getElementById("busyCount");

const vehicleImageEl = document.getElementById("vehicleImage");

/* ===================== STATE ===================== */
let currentZone = "A";
let activeSlot = null;
let timerInterval = null;
let detectedPlate = null;
let currentVehicle = "car";

/* ===================== DATA ===================== */
const vehicleImages = {
    car: "assets/vehicles/car.png",
    motorbike: "assets/vehicles/motorbike.png",
    bike: "assets/vehicles/bike.png"
};

/* ===================== VEHICLE SELECT ===================== */
document.querySelectorAll(".vehicle-option").forEach(opt => {
    opt.onclick = () => {
        document
            .querySelectorAll(".vehicle-option")
            .forEach(o => o.classList.remove("active"));

        opt.classList.add("active");
        currentVehicle = opt.dataset.type;
    };
});

function showNotification(message) {
    const notif = document.getElementById("systemNotification");
    document.getElementById("notifMessage").textContent = message;
    notif.style.display = "block";
}

function closeNotification() {
    document.getElementById("systemNotification").style.display = "none";
}

/* ===================== ZONE ===================== */
function renderZoneButtons() {
    zoneSelector.innerHTML = "";

    Object.keys(zones).forEach(zoneKey => {
        const btn = document.createElement("button");
        btn.className = "zone-btn";
        btn.textContent = zones[zoneKey].name;

        if (zoneKey === currentZone) btn.classList.add("active");

        btn.onclick = () => {
            currentZone = zoneKey;
            renderZoneButtons();
            renderSlots();
        };

        zoneSelector.appendChild(btn);
    });
}

function updateZoneInfo() {
    const slots = zones[currentZone].slots;
    let free = 0, busy = 0;

    slots.forEach(s => s.occupied ? busy++ : free++);

    freeCountEl.textContent = free;
    busyCountEl.textContent = busy;
}

/* ===================== PARKING GRID ===================== */
function renderSlots() {
    grid.innerHTML = "";
    const slots = zones[currentZone].slots;

    slots.forEach(slot => {
        const div = document.createElement("div");
        div.className = "slot " + (slot.occupied ? "busy" : "free");
        div.textContent = `Slot ${slot.id}`;
        div.onclick = () => handleSlotClick(slot);
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

    const existed = isVehicleAlreadyParked(detectedPlate);
    if (existed) {
       showNotification(`Vehicle already parked!\nZone: ${existed.zone}\nSlot: ${existed.slot}`);
        return;
    }

    if (!slot.occupied) {
        
        slot.occupied = true;
        slot.startTime = Date.now();
        slot.vehicle = currentVehicle;
        slot.plate = detectedPlate;
        activeSlot = slot;

        vehicleInfo.textContent = `Vehicle: ${currentVehicle}`;
        plateInfo.textContent = `Plate: ${detectedPlate}`;
        statusText.textContent =
            `Parking at ${zones[currentZone].name} - Slot ${slot.id}`;

        vehicleImageEl.src = vehicleImages[currentVehicle];
        vehicleImageEl.style.display = "block";
        const existed = isVehicleAlreadyParked(detectedPlate);
      

        startTimer();
    } else {
        const minutes = Math.floor((Date.now() - slot.startTime) / 60000);
        const price = calculatePrice(minutes);

        showQRBill({
            zone: zones[currentZone].name,
            slot: slot.id,
            vehicle: slot.vehicle,
            plate: slot.plate,
            time: minutes,
            price
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
    for (const zoneKey in zones) {
        const slots = zones[zoneKey].slots;
        for (const slot of slots) {
            if (slot.occupied && slot.plate === plate) {
                return {
                    zone: zones[zoneKey].name,
                    slot: slot.id
                };
            }
        }
    }
    return null;
}

/* ===================== ZONE DROPDOWN ===================== */
selected.onclick = () => customSelect.classList.toggle("open");

options.forEach(option => {
    option.onclick = () => {
        currentZone = option.dataset.zone;
        selected.innerHTML = option.textContent + '<span class="arrow">▾</span>';
        customSelect.classList.remove("open");

        stopTimer();
        renderZoneButtons();
        renderSlots();
    };
});

document.addEventListener("click", e => {
    if (!customSelect.contains(e.target)) {
        customSelect.classList.remove("open");
    }
});

/* ===================== TIMER ===================== */
function startTimer() {
    clearInterval(timerInterval);

    timerInterval = setInterval(() => {
        if (!activeSlot) return;

        const diff = Math.floor((Date.now() - activeSlot.startTime) / 1000);
        const min = String(Math.floor(diff / 60)).padStart(2, "0");
        const sec = String(diff % 60).padStart(2, "0");

        timerText.textContent = `Time: ${min}:${sec}`;
        priceText.textContent =
            `Price: ${calculatePrice(Math.floor(diff / 60))} VND`;
    }, 1000);
}

function stopTimer() {
    clearInterval(timerInterval);
    timerText.textContent = "Time: 00:00";
    priceText.textContent = "Price: 0 VND";
}

/* ===================== CAMERA / SCAN ===================== */
document.getElementById("parkBtn").onclick = () => openCamera();

function openCamera() {
    detectedPlate = generatePlate();
    document.getElementById("cameraModal").style.display = "flex";
}

function generatePlate() {
    const letters = "ABCDEFGH";
    const nums = Math.floor(1000 + Math.random() * 9000);
    return `51${letters[Math.floor(Math.random() * letters.length)]}-${nums}`;
}

function confirmPlate() {
    document.getElementById("cameraModal").style.display = "none";
    document.getElementById("plateText").textContent = detectedPlate;
}

/* ===================== QR BILL ===================== */
function showQRBill(data) {
    const modal = document.getElementById("qrModal");
    const qrDiv = document.getElementById("qrCode");
    const info = document.getElementById("billInfo");

    qrDiv.innerHTML = "";

    const billText = `
Zone: ${data.zone}
Slot: ${data.slot}
Vehicle: ${data.vehicle}
Plate: ${data.plate}
Time: ${data.time} minutes
Price: ${data.price} VND
`;

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

