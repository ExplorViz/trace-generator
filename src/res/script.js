const formIds = [
  "appCount",
  "packageDepth",
  "minClassCount",
  "maxClassCount",
  "minMethodCount",
  "maxMethodCount",
  "balance",

  "duration",
  "callCount",
  "maxCallDepth"
];

formIds.forEach((id) => {
  const range = document.getElementById(`range_${id}`);
  const label = document.getElementById(`label_${id}`);
  label.textContent = range.value;

  range.addEventListener("input", (event) => {
    label.textContent = event.target.value;
  });
});