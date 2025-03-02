import { Box, useTheme } from "@mui/material";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import styled from "styled-components";

function TermsPage({ content }) {
  const plugins = [remarkGfm];
  const theme = useTheme();
  return (
    <StyledDocument>
      <ReactMarkdown remarkPlugins={plugins}>{content}</ReactMarkdown>
    </StyledDocument>
  );
}

export async function getStaticProps() {
  const content = await fetch(
    "https://raw.githubusercontent.com/burrowHQ/burrow-cash/main/DECLARATION.md",
  ).then((r) => r.text());
  return {
    props: { content },
  };
}

const StyledDocument = styled.div`
  color: "#C0C4E9";
  h1 {
    font-size: 26px;
    color: #00f7a5;
    font-family: "work-sans-bold";
  }
  h2 {
    font-size: 22px;
    color: #00f7a5;
    font-family: "work-sans-bold";
  }
  h3 {
    font-size: 16px;
    font-family: "work-sans-bold";
  }
  p {
    font-size: 16px;
    color: #fff;
    margin: 16px 0;
  }
  strong {
    font-size: 16px;
    color: #fff;
    font-weight: bold;
    font-family: "work-sans-bold";
    margin-top: 20px;
    em {
      font-style: normal;
    }
  }
  p a {
    color: #c0c4e9;
    text-decoration: underline;
  }
`;
export default TermsPage;
