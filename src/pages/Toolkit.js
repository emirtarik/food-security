import React from "react";
import Header from "./Header";
import SubHeader from "./SubHeader";
import Footer from "./Footer";
import topicsData from "../data/toolkitData.json";
import { BASE_URL } from "../components/constant";

const Tools = ({ results }) => {
  return (
    <section id="doc-results" className="container list-articles">
      {results.length > 0 && (
        <div className="row" style={{justifyContent: "center"}}>
          {results.map((result) => (
            <div key={result.id} className="list-articles col-md-4">
              <article className="nopad mb-3">
                <div className="thumb">
                  <img
                    src={`${BASE_URL}${result.img.medium}`}
                    alt={result.title}
                    className="img-fluid"
                  />
                  <div className="screen">
                    <p className="text-center">{result.excerpt}</p>
                    <a
                      href={`${
                        result.permalink.includes("http") ? "" : BASE_URL
                      }${result.permalink}`}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="btn btn-white-inv mt-3"
                    >
                      More
                    </a>
                  </div>
                </div>
                <div className="content">
                  <h3 className="title">{result.title}</h3>
                </div>
                <a
                  href={`${result.permalink.includes("http") ? "" : BASE_URL}${
                    result.permalink
                  }`}
                  className="bllink"
                >
                  More
                </a>
              </article>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default function Toolkit() {
  return (
    <div>
      <Header />
      <SubHeader />
      <Tools results={topicsData} />
      <Footer />
    </div>
  );
}
