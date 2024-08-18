// Limit range sliders to prevent minimum and maximum values from crossing

const rangeMinClassCount = document.getElementById("range_minClassCount");
const rangeMaxClassCount = document.getElementById("range_maxClassCount");
const rangeMinMethodCount = document.getElementById("range_minMethodCount");
const rangeMaxMethodCount = document.getElementById("range_maxMethodCount");

rangeMinClassCount.addEventListener("input", (event) => {
  if (parseInt(rangeMaxClassCount.value) < parseInt(event.target.value)) {
    event.target.value = rangeMaxClassCount.value;
    event.preventDefault();
  }
});

rangeMaxClassCount.addEventListener("input", (event) => {
  if (parseInt(rangeMinClassCount.value) > parseInt(event.target.value)) {
    event.target.value = rangeMinClassCount.value;
    event.preventDefault();
  }
});

rangeMinMethodCount.addEventListener("input", (event) => {
  if (parseInt(rangeMaxMethodCount.value) < parseInt(event.target.value)) {
    event.target.value = rangeMaxMethodCount.value;
    event.preventDefault();
  }
});

rangeMaxMethodCount.addEventListener("input", (event) => {
  if (parseInt(rangeMinMethodCount.value) > parseInt(event.target.value)) {
    event.target.value = rangeMinMethodCount.value;
    event.preventDefault();
  }
});

// Update labels next to range sliders to show exact range value

const formRangeIds = [
  "appCount",
  "packageDepth",
  "minClassCount",
  "maxClassCount",
  "minMethodCount",
  "maxMethodCount",
  "balance",

  "duration",
  "callCount",
  "maxCallDepth",
];

formRangeIds.forEach((id) => {
  const range = document.getElementById(`range_${id}`);
  const label = document.getElementById(`label_${id}`);
  label.textContent = range.value;

  range.addEventListener("input", (event) => {
    label.textContent = event.target.value;
  });
});
