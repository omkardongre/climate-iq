'use client';

interface RichTextNode {
  type: string;
  content?: RichTextNode[];
  text?: string;
  marks?: { type: string }[];
  attrs?: any;
}

interface StoryblokRichTextProps {
  content: RichTextNode;
}

export function StoryblokRichText({ content }: StoryblokRichTextProps) {
  if (!content || !content.content) {
    return null;
  }

  const renderNode = (node: RichTextNode, index: number): React.ReactNode => {
    // Text node
    if (node.type === 'text') {
      let text: React.ReactNode = node.text || '';
      
      // Apply marks (bold, italic, etc.)
      if (node.marks) {
        node.marks.forEach((mark) => {
          if (mark.type === 'bold') {
            text = <strong>{text}</strong>;
          } else if (mark.type === 'italic') {
            text = <em>{text}</em>;
          } else if (mark.type === 'code') {
            text = <code className="bg-gray-100 px-1 rounded">{text}</code>;
          }
        });
      }
      
      return <span key={index}>{text}</span>;
    }

    // Paragraph
    if (node.type === 'paragraph') {
      return (
        <p key={index} className="mb-4">
          {node.content?.map((child, i) => renderNode(child, i))}
        </p>
      );
    }

    // Headings
    if (node.type === 'heading') {
      const level = node.attrs?.level || 1;
      const Tag = `h${level}` as keyof JSX.IntrinsicElements;
      const className = {
        1: 'text-3xl font-bold mt-8 mb-4',
        2: 'text-2xl font-semibold mt-6 mb-3',
        3: 'text-xl font-semibold mt-5 mb-2',
        4: 'text-lg font-semibold mt-4 mb-2',
        5: 'text-base font-semibold mt-3 mb-2',
        6: 'text-sm font-semibold mt-2 mb-1',
      }[level] || '';

      return (
        <Tag key={index} className={className}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </Tag>
      );
    }

    // Bullet list
    if (node.type === 'bullet_list') {
      return (
        <ul key={index} className="list-disc ml-6 mb-4 space-y-1">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ul>
      );
    }

    // Ordered list
    if (node.type === 'ordered_list') {
      return (
        <ol key={index} className="list-decimal ml-6 mb-4 space-y-1">
          {node.content?.map((child, i) => renderNode(child, i))}
        </ol>
      );
    }

    // List item
    if (node.type === 'list_item') {
      return (
        <li key={index}>
          {node.content?.map((child, i) => renderNode(child, i))}
        </li>
      );
    }

    // Blockquote
    if (node.type === 'blockquote') {
      return (
        <blockquote key={index} className="border-l-4 border-gray-300 pl-4 italic my-4">
          {node.content?.map((child, i) => renderNode(child, i))}
        </blockquote>
      );
    }

    // Code block - render as markdown content instead
    if (node.type === 'code_block') {
      const markdownText = node.content?.map((child) => child.text).join('') || '';
      
      // Parse markdown and render
      return (
        <div key={index} className="mb-4">
          {markdownText.split('\n').map((line, i) => {
            // Headers
            if (line.startsWith('# ')) {
              return <h1 key={i} className="text-3xl font-bold mt-6 mb-4">{line.slice(2)}</h1>;
            }
            if (line.startsWith('## ')) {
              return <h2 key={i} className="text-2xl font-semibold mt-5 mb-3">{line.slice(3)}</h2>;
            }
            if (line.startsWith('### ')) {
              return <h3 key={i} className="text-xl font-semibold mt-4 mb-2">{line.slice(4)}</h3>;
            }
            // Bullet points
            if (line.startsWith('- ')) {
              return <li key={i} className="ml-6 mb-1 list-disc">{line.slice(2)}</li>;
            }
            // Numbered lists
            if (/^\d+\./.test(line)) {
              return <li key={i} className="ml-6 mb-1 list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
            }
            // Bold text
            if (line.includes('**')) {
              const parts = line.split('**');
              return (
                <p key={i} className="mb-2">
                  {parts.map((part, j) => 
                    j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                  )}
                </p>
              );
            }
            // Empty line
            if (line.trim() === '') {
              return <br key={i} />;
            }
            // Regular paragraph
            return <p key={i} className="mb-2">{line}</p>;
          })}
        </div>
      );
    }

    // Hard break
    if (node.type === 'hard_break') {
      return <br key={index} />;
    }

    // Horizontal rule
    if (node.type === 'horizontal_rule') {
      return <hr key={index} className="my-6 border-gray-300" />;
    }

    // Image
    if (node.type === 'image') {
      return (
        <img
          key={index}
          src={node.attrs?.src}
          alt={node.attrs?.alt || ''}
          title={node.attrs?.title}
          className="max-w-full h-auto rounded-lg my-4"
        />
      );
    }

    // Link
    if (node.type === 'link') {
      return (
        <a
          key={index}
          href={node.attrs?.href}
          target={node.attrs?.target}
          className="text-blue-600 hover:underline"
        >
          {node.content?.map((child, i) => renderNode(child, i))}
        </a>
      );
    }

    // Default: render children if they exist
    if (node.content) {
      return <div key={index}>{node.content.map((child, i) => renderNode(child, i))}</div>;
    }

    return null;
  };

  return <div>{content.content.map((node, i) => renderNode(node, i))}</div>;
}
