import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import rehypeHighlight from "rehype-highlight";
import rehypeSanitize, { defaultSchema } from "rehype-sanitize";

// highlight.js annotates code with `className` (e.g. "hljs-keyword"); the
// default sanitize schema strips class attributes, so we explicitly allow
// them back on the elements highlight.js actually touches.
const sanitizeSchema = {
  ...defaultSchema,
  attributes: {
    ...defaultSchema.attributes,
    code: [...(defaultSchema.attributes?.code ?? []), "className"],
    span: [...(defaultSchema.attributes?.span ?? []), "className"],
    pre: [...(defaultSchema.attributes?.pre ?? []), "className"],
  },
};

const ReadmeViewer = ({ content }: { content: string | null }) => {
  if (!content) {
    return <p className="no-result">No README available for this repository.</p>;
  }

  return (
    <div className="prose prose-neutral dark:prose-invert max-w-none font-work-sans prose-pre:bg-muted prose-pre:text-foreground">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        rehypePlugins={[rehypeHighlight, [rehypeSanitize, sanitizeSchema]]}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default ReadmeViewer;
