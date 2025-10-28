import React from 'react';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

export function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  const parseMarkdown = (text: string): JSX.Element => {
    const lines = text.split('\n');
    const elements: JSX.Element[] = [];
    let key = 0;

    for (let i = 0; i < lines.length; i++) {
      const line = lines[i];

      // Headers
      if (line.startsWith('###')) {
        elements.push(
          <h3 key={key++} className="text-lg font-semibold mb-2 text-foreground">
            {line.replace(/^###\s*/, '')}
          </h3>
        );
      } else if (line.startsWith('##')) {
        elements.push(
          <h2 key={key++} className="text-xl font-bold mb-3 text-foreground">
            {line.replace(/^##\s*/, '')}
          </h2>
        );
      } else if (line.startsWith('#')) {
        elements.push(
          <h1 key={key++} className="text-2xl font-bold mb-4 text-foreground">
            {line.replace(/^#\s*/, '')}
          </h1>
        );
      }
      // Lists
      else if (line.startsWith('•')) {
        const listItems = [line];
        let j = i + 1;
        while (j < lines.length && lines[j].startsWith('•')) {
          listItems.push(lines[j]);
          j++;
        }
        i = j - 1;

        elements.push(
          <ul key={key++} className="list-disc list-inside mb-4 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-foreground">
                {parseInlineMarkdown(item.replace(/^•\s*/, ''))}
              </li>
            ))}
          </ul>
        );
      }
      // Numbered lists
      else if (/^\d+\./.test(line)) {
        const listItems = [line];
        let j = i + 1;
        while (j < lines.length && /^\d+\./.test(lines[j])) {
          listItems.push(lines[j]);
          j++;
        }
        i = j - 1;

        elements.push(
          <ol key={key++} className="list-decimal list-inside mb-4 space-y-1">
            {listItems.map((item, idx) => (
              <li key={idx} className="text-foreground">
                {parseInlineMarkdown(item.replace(/^\d+\.\s*/, ''))}
              </li>
            ))}
          </ol>
        );
      }
      // Empty lines
      else if (line.trim() === '') {
        if (i < lines.length - 1 && lines[i + 1].trim() !== '') {
          elements.push(<br key={key++} />);
        }
      }
      // Regular paragraphs
      else {
        elements.push(
          <p key={key++} className="mb-2 text-foreground">
            {parseInlineMarkdown(line)}
          </p>
        );
      }
    }

    return <div className={className}>{elements}</div>;
  };

  const parseInlineMarkdown = (text: string): React.ReactNode => {
    const parts = [];
    let current = '';
    let i = 0;

    while (i < text.length) {
      if (text.slice(i, i + 2) === '**') {
        if (current) {
          parts.push(current);
          current = '';
        }

        // Find closing **
        let j = i + 2;
        let boldText = '';
        while (j < text.length - 1 && text.slice(j, j + 2) !== '**') {
          boldText += text[j];
          j++;
        }

        if (j < text.length - 1) {
          parts.push(<strong key={parts.length} className="font-bold">{boldText}</strong>);
          i = j + 2;
        } else {
          current += '**';
          i += 2;
        }
      } else if (text[i] === '*' && text[i + 1] !== '*') {
        if (current) {
          parts.push(current);
          current = '';
        }

        // Find closing *
        let j = i + 1;
        let italicText = '';
        while (j < text.length && text[j] !== '*') {
          italicText += text[j];
          j++;
        }

        if (j < text.length) {
          parts.push(<em key={parts.length} className="italic">{italicText}</em>);
          i = j + 1;
        } else {
          current += '*';
          i++;
        }
      } else if (text[i] === '`') {
        if (current) {
          parts.push(current);
          current = '';
        }

        // Find closing `
        let j = i + 1;
        let codeText = '';
        while (j < text.length && text[j] !== '`') {
          codeText += text[j];
          j++;
        }

        if (j < text.length) {
          parts.push(
            <code key={parts.length} className="bg-muted px-1 py-0.5 rounded text-sm font-mono">
              {codeText}
            </code>
          );
          i = j + 1;
        } else {
          current += '`';
          i++;
        }
      } else {
        current += text[i];
        i++;
      }
    }

    if (current) {
      parts.push(current);
    }

    return parts.length === 1 && typeof parts[0] === 'string' ? parts[0] : parts;
  };

  return parseMarkdown(content);
}