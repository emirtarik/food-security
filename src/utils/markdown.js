// src/utils/markdown.js
import { marked } from 'marked';

export const fixFileLinks = (html) => {
  if (!html) return html;
  let replaced = html;
  replaced = replaced.replace(
    /http:\/\/www\.food-security\.net\/wp-content\/uploads\//g,
    "/uploads/"
  );
  replaced = replaced.replace(
    /https:\/\/www\.food-security\.net\/wp-content\/uploads\//g,
    "/uploads/"
  );
  replaced = replaced.replace(
    /https:\/\/www\.food-security\.net\/document\//g,
    "http://localhost:3000/document/"
  );
  replaced = replaced.replace(
    /http:\/\/www\.food-security\.net\/document\//g,
    "http://localhost:3000/document/"
  );
  return replaced;
};

export const fetchAndConvertMarkdown = async (path) => {
  try {
    const response = await fetch(path);
    const mdContent = await response.text();
    return fixFileLinks(marked(mdContent));
  } catch (error) {
    console.error("Error fetching markdown from", path, error);
    return "";
  }
};
