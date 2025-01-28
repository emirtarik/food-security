// import React, { useState } from "react";
// import { Select, MenuItem, Typography } from "@mui/material";
// import { useTranslationHook } from "../i18n";
// import "../styles/Timebar.css";

// export default function TimeRangePicker({ onChangeRange, displayMap }) {
//   const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
//   const minYear = 2014;
//   const maxYear = new Date().getFullYear();
//   const [startYear, setStartYear] = useState(minYear);
//   const [startMonth, setStartMonth] = useState(3); // Default to March
//   const [endYear, setEndYear] = useState(maxYear-1);
//   const [endMonth, setEndMonth] = useState(3); // Default to November

//   const monthLabels = [3, 6, 11]; // March, June, November

//   const monthNames = {
//     3: t("March"),
//     6: t("June"),
//     11: t("November"),
//   };

//   const handleStartYearChange = (event) => {
//     const selectedYear = event.target.value;
//     if (
//       selectedYear > endYear ||
//       (selectedYear === endYear && startMonth > endMonth)
//     ) {
//       // If the selected start year is greater than the current end year or
//       // the start year and month are greater than the current end year and month,
//       // update the end year and month
//       setEndYear(selectedYear);
//       setStartYear(selectedYear);
//     } else {
//       setStartYear(selectedYear);
//     }
//   };

//   const handleStartMonthChange = (event) => {
//     const selectedMonth = event.target.value;
//     if (startYear === endYear && selectedMonth > endMonth) {
//       // If the selected start year and month are greater than the current end year and month,
//       // update the end month
//       setEndMonth(selectedMonth);
//     }
//     setStartMonth(selectedMonth);
//   };

//   const handleEndYearChange = (event) => {
//     const selectedYear = event.target.value;
//     if (
//       selectedYear < startYear ||
//       (selectedYear === startYear && endMonth < startMonth)
//     ) {
//       // If the selected end year is smaller than the current start year or
//       // the end year and month are smaller than the current start year and month,
//       // update the start year and month
//       setStartYear(selectedYear);
//       setEndYear(selectedYear);
//     } else {
//       setEndYear(selectedYear);
//     }
//   };

//   const handleEndMonthChange = (event) => {
//     const selectedMonth = event.target.value;
//     if (endYear === startYear && selectedMonth < startMonth) {
//       // If the selected end year and month are smaller than the current start year and month,
//       // update the start month
//       setStartMonth(selectedMonth);
//     }
//     setEndMonth(selectedMonth);
//   };

//   // Handle range change and return the selected range
//   const handleRangeChange = () => {
//     if (onChangeRange) {
//       onChangeRange({
//         startTimeYear: startYear,
//         startTimeMonth: startMonth,
//         endTimeYear: endYear,
//         endTimeMonth: endMonth,
//       });
//     }
//   };

//   handleRangeChange();

//   return (
//     <div className="timebar" style={{ marginTop: displayMap === 'map' ? "-23px" : "0", marginLeft: displayMap === 'map' ? "0" : "25px"}}>
//       <div className="row">
//         <div className="col-sm-6">
//           <div className="select-container">
//             <Typography style={{ width: "235px", color: "#243d54" }}>
//               {t("Start Time")}
//             </Typography>
//             <Select
//               value={startYear}
//               onChange={handleStartYearChange}
//               style={{ width: "80px", color: "#243d54" }}
//             >
//               {Array.from({ length: maxYear - minYear + 1 }, (_, index) => (
//                 <MenuItem key={minYear + index} value={minYear + index}>
//                   {minYear + index}
//                 </MenuItem>
//               ))}
//             </Select>
//             <Select
//               value={startMonth}
//               onChange={handleStartMonthChange}
//               style={{ width: "125px", color: "#243d54" }}
//             >
//               {monthLabels.map((month) => (
//                 <MenuItem key={month} value={month}>
//                   {monthNames[month]}
//                 </MenuItem>
//               ))}
//             </Select>
//           </div>
//         </div>
//         <div className="col-sm-6">
//           <div className="select-container">
//             <Typography style={{ width: "235px", color: "#243d54" }}>
//               {t("End Time")}
//             </Typography>
//             <Select
//               value={endYear}
//               onChange={handleEndYearChange}
//               style={{ width: "80px", color: "#243d54" }}
//             >
//               {Array.from({ length: maxYear - startYear + 1 }, (_, index) => (
//                 <MenuItem key={startYear + index} value={startYear + index}>
//                   {startYear + index}
//                 </MenuItem>
//               ))}
//             </Select>
//             <Select
//               value={endMonth}
//               onChange={handleEndMonthChange}
//               style={{ width: "125px", color: "#243d54" }}
//             >
//               {monthLabels.map((month) => (
//                 <MenuItem key={month} value={month}>
//                   {monthNames[month]}
//                 </MenuItem>
//               ))}
//             </Select>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }
