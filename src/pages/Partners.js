import React from 'react';
import partnerData from '../data/partnerData.json';
import Header from './Header';
import SubHeader from "./SubHeader";
import IconBreadcrumbsWrapper from '../components/IconBreadcrumbs';
import Footer from './Footer';
import { useTranslationHook } from '../i18n';
import '../styles/Partners.css';

const Article = ({ imgSrc, imgAlt, title, subtitle, link }) => {
  const { t, currentLanguage, changeLanguage } = useTranslationHook("misc");
  return (
    <div className="col-sm-4">
      <article>
        <div className="row">
          <div className="col-sm-12 text-center img">
            <img src={imgSrc} alt={imgAlt} className="img-responsive" />
          </div>
          <div className="col-sm-12 text-center text">
            <h3>{title}</h3>
            <p><strong>{subtitle}</strong></p>
          </div>
        </div>
      </article>
    </div>
  );
};

const ResultsSection = ({ articles }) => (
  <section id="doc-results" className="container list-articles">
    {articles.map((article, index) => (
      <Article
        key={index}
        imgSrc={article.imgSrc}
        imgAlt={article.imgAlt}
        title={article.title}
        subtitle={article.subtitle}
        link={article.link}
      />
    ))}
  </section>
);

export default function ResultsPage() {

  return (
    <div>
      <Header />
      <SubHeader />
      <ResultsSection articles={partnerData} />
      <Footer />
    </div>
  );
}
