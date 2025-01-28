import React from "react";
import postData from "../data/postData.json";
import DynamicPost from "../components/DynamicPost.js";
import Header from "./Header";
import Footer from "./Footer";
import IconBreadcrumbsWrapper from "../components/IconBreadcrumbs.js";

export default function Posts () {


  return (
    <div>
    <Header />
    <IconBreadcrumbsWrapper routeTitle={""}/>
    <DynamicPost data={postData} category={"post"}/>
    <Footer />
    </div>
  );
}