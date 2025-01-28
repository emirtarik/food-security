import React from "react";
import Breadcrumbs from "@mui/material/Breadcrumbs";
import Link from "@mui/material/Link";
import HomeIcon from "@mui/icons-material/Home";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { BASE_URL } from "../components/constant.js";
import { useTranslationHook } from "../i18n";
import "../styles/IconBreadcrumbs.css";

const IconBreadcrumbs = ({ routeTitle, lastPart }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");

  console.log("IconBreadcrumbs routeTitle:", routeTitle);
  console.log("IconBreadcrumbs lastPart:", lastPart);

  return (
    <div role="presentation">
      <Breadcrumbs aria-label="breadcrumb" separator=">">
        <Link
          underline="hover"
          sx={{ display: "flex", alignItems: "center" }}
          color="inherit"
          href="/"
        >
          <HomeIcon sx={{ mr: 0.5 }} fontSize="inherit" />
          {t("Home").toUpperCase()}
        </Link>
        <Link
          underline="hover"
          sx={{ display: "flex", alignItems: "center" }}
          color="inherit"
          href={
            routeTitle === "Resources"
              ? `${BASE_URL}/resources`
              : routeTitle === "Analysis and Response"
              ? `${BASE_URL}/analysis-and-response`
              : routeTitle === "Toolkit"
              ? `${BASE_URL}/analysis-and-response/toolkit`
              : routeTitle === "About"
              ? `${BASE_URL}/about`
              : routeTitle === "TOPICS"
              ? `${BASE_URL}/topics`
              : routeTitle === "Events and Opportunities"
              ? `${BASE_URL}/events-and-opportunities`
              : BASE_URL
          }
        >
          {routeTitle ? routeTitle.toUpperCase() : ""}
        </Link>
        {lastPart && (
          <Link
            underline="hover"
            sx={{ display: "flex", alignItems: "center" }}
            color="inherit"
          >
            {formatLastPart(lastPart)}
          </Link>
        )}
      </Breadcrumbs>
    </div>
  );
};

const textTheme = createTheme({
  typography: {
    fontFamily: ['"Lato"'],
  },
  palette: {
    primary: {
      main: "#fff", // Change this to the desired color
    },
  },
});

export function formatLastPart(inputString) {
  if (!inputString) {
    console.warn("formatLastPart received a null or undefined inputString");
    return "";
  }
  const regex = /[\&\/\*\$\%\^\(\)\{\}]/g;
  const sanitizedString = inputString.replace(regex, ' ');
  const result = sanitizedString.toUpperCase();
  return result;
}

export default function IconBreadcrumbsWrapper({ routeTitle, lastPart }) {
  return (
    <div
      style={{
        background: "#c2be00",
        opacity: "0.63",
        paddingTop: "5px",
        paddingBottom: "5px",
      }}
    >
      <ThemeProvider theme={textTheme}>
        <IconBreadcrumbs routeTitle={routeTitle} lastPart={lastPart} />
      </ThemeProvider>
    </div>
  );
}
