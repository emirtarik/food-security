import { useEffect, useState } from "react";
import ReactMarkdown from "react-markdown";

export default function MarkdownRender({ path }) {
  return (
    <section>
      <PageComponent path={path} />
    </section>
  );
}

const PageComponent = ({ path }) => {
  const [content, setContent] = useState("");

  useEffect(() => {
    fetch(".." + path)
      .then((res) => res.text())
      .then((text) => setContent(text));
  }, []);

  return (
    <div className="post">
      <ReactMarkdown children={content} />
    </div>
  );
};
