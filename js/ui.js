
const toggle = document.getElementById("modeToggle");

toggle.onclick = () => {
    document.body.classList.toggle("dark");
};

let currentVehicle = "car";

document.querySelectorAll(".vehicle-option").forEach(item => {
    item.onclick = () => {
        document.querySelectorAll(".vehicle-option")
            .forEach(v => v.classList.remove("active"));
        item.classList.add("active");
        currentVehicle = item.dataset.type;
    };
});

