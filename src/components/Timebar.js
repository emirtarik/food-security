// import React, { useState } from "react";
// import { Slider, Typography } from "@mui/material";
// import { timeFunction } from "../pages/Analysis";
// import { useTranslationHook } from "../i18n";
// import "../styles/Timebar.css";

// export default function Timebar({ onChangeYear, onChangeMonth, displayMap }) {
//   const { initialSelectedYear, initialSelectedMonth } = timeFunction();
//   const minYear = 2014;
//   const maxYear = new Date().getFullYear();
//   const [selectedYear, setSelectedYear] = useState(initialSelectedYear);
//   const [selectedMonth, setSelectedMonth] = useState(initialSelectedMonth);
//   const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

//   const monthLabels = [3, 6, 11]; // March, June, November

//   const monthNames = {
//     3: t("March"),
//     6: t("June"),
//     11: t("November"),
//   };

//   const sliderMarks = [];

//   for (let year = minYear; year <= maxYear; year++) {
//     for (const monthKey of Object.keys(monthNames)) {
//       const month = parseInt(monthKey, 10); // Parse the key to an integer
//       const label = new Date(year, month - 1, 1).toLocaleString("en-us", {
//         month: "long",
//         year: "numeric",
//       });
//       const value = year + month / 12;
//       sliderMarks.push({ value, label });
//     }
//   }

//   const handleSliderChange = (event, value) => {
//     const year = Math.floor(value);
//     const month = monthLabels.find((m) => value <= year + m / 12);
//     setSelectedYear(year);
//     setSelectedMonth(month);
//     if (onChangeYear) {
//       onChangeYear(year);
//     }
//     if (onChangeMonth) {
//       onChangeMonth(month);
//     }
//   };

//   return (
//     <div
//       className="timebar"
//       style={{
//         width: "max-content",
//       }}
//     >
//       <Typography style={{ width: "235px", color: "#243d54" }}>
//         {monthNames[selectedMonth]} {selectedYear}
//         {selectedYear > new Date().getFullYear() ||
//         (selectedYear === new Date().getFullYear() &&
//           selectedMonth > new Date().getMonth())
//           ? t("Projected Data")
//           : ""}
//       </Typography>
//       <Slider
//         style={{ color: "#243d54" }}
//         value={selectedYear + selectedMonth / 12}
//         onChange={handleSliderChange}
//         step={1 / 12} // Allows for month selection
//         min={minYear}
//         max={maxYear + 1 - 1 / 12} // Last month in the year
//         valueLabelDisplay="off"
//         valueLabelFormat={(value) => {
//           const date = new Date(value, Math.floor((value % 1) * 12));
//           return date.toLocaleString("en-us", {
//             month: "short",
//             year: "numeric",
//           });
//         }}
//       />
//     </div>
//   );
// }
