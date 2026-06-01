import { ReactNode, useMemo } from 'react';
import { CopyButton } from './copy-button';

interface CodeBlockProps {
  code: string;
  language?: string;
  title?: string;
  showCopyButton?: boolean;
  className?: string;
}

// Syntax highlighting colors following Frappe/smrs-frontend patterns
const syntaxColors = {
  light: {
    background: 'bg-zinc-900',
    text: 'text-zinc-100',
    keyword: 'text-violet-400',
    string: 'text-emerald-400',
    number: 'text-amber-400',
    property: 'text-blue-400',
    comment: 'text-zinc-500',
    punctuation: 'text-zinc-500',
    operator: 'text-sky-400',
  },
  dark: {
    background: 'bg-zinc-950',
    text: 'text-zinc-100',
    keyword: 'text-violet-400',
    string: 'text-emerald-400',
    number: 'text-amber-400',
    property: 'text-blue-400',
    comment: 'text-zinc-500',
    punctuation: 'text-zinc-500',
    operator: 'text-sky-400',
  },
};

interface Token {
  type: 'keyword' | 'string' | 'number' | 'property' | 'comment' | 'punctuation' | 'operator' | 'text';
  value: string;
}

function tokenize(code: string, language: string): Token[] {
  const tokens: Token[] = [];

  if (language === 'json' || language === 'javascript') {
    // JSON/JavaScript tokenization
    const patterns = [
      { type: 'string' as const, regex: /"(?:[^"\\]|\\.)*"/g },
      { type: 'number' as const, regex: /\b-?\d+\.?\d*(?:e[+-]?\d+)?\b/gi },
      { type: 'keyword' as const, regex: /\b(?:true|false|null)\b/g },
      { type: 'property' as const, regex: /"(?:[^"\\]|\\.)*"(?=\s*:)/g },
      { type: 'punctuation' as const, regex: /[{}\[\]:,]/g },
    ];

    // Simple line-by-line tokenization
    const lines = code.split('\n');
    for (const line of lines) {
      const lineTokens: Token[] = [];
      let remaining = line;

      while (remaining.length > 0) {
        let matched = false;

        // Check for string
        const stringMatch = remaining.match(/^("(?:[^"\\]|\\.)*")/);
        if (stringMatch) {
          lineTokens.push({ type: 'string', value: stringMatch[1] });
          remaining = remaining.slice(stringMatch[1].length);
          matched = true;
          continue;
        }

        // Check for number
        const numberMatch = remaining.match(/^(-?\d+\.?\d*(?:e[+-]?\d+)?)/i);
        if (numberMatch) {
          lineTokens.push({ type: 'number', value: numberMatch[1] });
          remaining = remaining.slice(numberMatch[1].length);
          matched = true;
          continue;
        }

        // Check for boolean/null
        const boolMatch = remaining.match(/^(true|false|null)\b/);
        if (boolMatch) {
          lineTokens.push({ type: 'keyword', value: boolMatch[1] });
          remaining = remaining.slice(boolMatch[1].length);
          matched = true;
          continue;
        }

        // Check for punctuation
        const punctMatch = remaining.match(/^([{}\[\]:,])/);
        if (punctMatch) {
          lineTokens.push({ type: 'punctuation', value: punctMatch[1] });
          remaining = remaining.slice(1);
          matched = true;
          continue;
        }

        // Check for property (key before colon)
        const propertyMatch = remaining.match(/^("(?:[^"\\]|\\.)*")(\s*:\s*)/);
        if (propertyMatch) {
          lineTokens.push({ type: 'property', value: propertyMatch[1] });
          remaining = remaining.slice(propertyMatch[0].length);
          matched = true;
          continue;
        }

        if (!matched) {
          lineTokens.push({ type: 'text', value: remaining[0] });
          remaining = remaining.slice(1);
        }
      }

      tokens.push(...lineTokens);
      tokens.push({ type: 'text', value: '\n' });
    }
  } else if (language === 'bash' || language === 'curl') {
    // Bash/cURL tokenization
    const lines = code.split('\n');
    for (const line of lines) {
      // Highlight flags
      const parts = line.split(/(-[A-Za-z]|'[^']*'|"[^"]*")/);
      for (const part of parts) {
        if (part.startsWith('-')) {
          tokens.push({ type: 'operator', value: part });
        } else if (part.startsWith("'") || part.startsWith('"')) {
          tokens.push({ type: 'string', value: part });
        } else {
          tokens.push({ type: 'text', value: part });
        }
      }
      tokens.push({ type: 'text', value: '\n' });
    }
  }

  return tokens;
}

export function CodeBlock({
  code,
  language = 'json',
  title,
  showCopyButton = true,
  className = '',
}: CodeBlockProps) {
  const tokens = useMemo(() => tokenize(code, language), [code, language]);
  const colors = syntaxColors.light; // Using light colors that work in both modes

  const getTokenColor = (type: Token['type']) => {
    switch (type) {
      case 'keyword':
        return colors.keyword;
      case 'string':
        return colors.string;
      case 'number':
        return colors.number;
      case 'property':
        return colors.property;
      case 'comment':
        return colors.comment;
      case 'punctuation':
        return colors.punctuation;
      case 'operator':
        return colors.operator;
      default:
        return colors.text;
    }
  };

  return (
    <div className={`group relative overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800 ${className}`}>
      {title && (
        <div className="flex items-center justify-between border-b border-zinc-200 bg-zinc-100 px-4 py-2 dark:border-zinc-800 dark:bg-zinc-900">
          <span className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            {title}
          </span>
          {showCopyButton && (
            <CopyButton text={code} variant="icon" className="opacity-0 group-hover:opacity-100" />
          )}
        </div>
      )}
      <div className="overflow-x-auto">
        <pre className={`${colors.background} ${colors.text} p-4 text-xs leading-relaxed font-mono`}>
          <code>
            {tokens.map((token, index) => (
              <span key={index} className={getTokenColor(token.type)}>
                {token.value}
              </span>
            ))}
          </code>
        </pre>
      </div>
      {!title && showCopyButton && (
        <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition-opacity">
          <CopyButton text={code} variant="icon" />
        </div>
      )}
    </div>
  );
}
