import React, { useMemo } from 'react';
import {
  Linking,
  ScrollView,
  StyleSheet,
  Text,
  View
} from 'react-native';

interface HtmlNode {
  type: 'text' | 'element' | 'br';
  tag?: string;
  content?: string | HtmlNode[];
  attrs?: Record<string, string>;
}

interface HtmlRichTextNoteDisplayProps {
  content: string;
  maxHeight?: number;
}

// Simple HTML parser
const parseHtml = (html: string): HtmlNode[] => {
  const nodes: HtmlNode[] = [];
  let currentIndex = 0;

  const tagRegex = /<\/?([a-z][a-z0-9]*)\b[^>]*>/gi;
  let match;
  let lastIndex = 0;

  while ((match = tagRegex.exec(html)) !== null) {
    // Add text before this tag
    if (match.index > lastIndex) {
      const text = html.slice(lastIndex, match.index).trim();
      if (text) {
        nodes.push({
          type: 'text',
          content: text,
        });
      }
    }

    const tagName = match[1].toLowerCase();
    const isClosing = match[0].startsWith('</');
    const isSelfClosing = /\/>$/.test(match[0]);

    if (tagName === 'br') {
      nodes.push({ type: 'br' });
    } else if (!isClosing && !isSelfClosing) {
      // Opening tag
      const endTagRegex = new RegExp(`</${tagName}>`, 'i');
      const endMatch = endTagRegex.exec(html.slice(match.index + match[0].length));

      let innerContent = '';
      if (endMatch) {
        innerContent = html.slice(
          match.index + match[0].length,
          match.index + match[0].length + endMatch.index
        );
      }

      // Extract attributes
      const attrsMatch = match[0].match(/\s+([a-z-]+)="([^"]*)"/gi) || [];
      const attrs: Record<string, string> = {};
      attrsMatch.forEach((attr) => {
        const [key, value] = attr.trim().split('=');
        attrs[key] = value.replace(/"/g, '');
      });

      nodes.push({
        type: 'element',
        tag: tagName,
        content: cleanAndParse(innerContent),
        attrs,
      });

      // Skip to end tag
      tagRegex.lastIndex = match.index + match[0].length + innerContent.length + 3 + tagName.length;
    }

    lastIndex = tagRegex.lastIndex;
  }

  // Add remaining text
  if (lastIndex < html.length) {
    const text = html.slice(lastIndex).trim();
    if (text) {
      nodes.push({
        type: 'text',
        content: text,
      });
    }
  }

  return nodes;
};

// Clean HTML entities and extra spaces
const cleanText = (text: string): string => {
  return text
    .replace(/&nbsp;/g, ' ')
    .replace(/&#160;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\s+/g, ' ')
    .trim();
};

const cleanAndParse = (html: string): HtmlNode[] => {
  // Remove script and style tags
  html = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '');
  html = html.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '');

  return parseHtml(html);
};

interface RenderProps {
  node: HtmlNode;
  depth?: number;
}

const HtmlRichTextNoteDisplay: React.FC<HtmlRichTextNoteDisplayProps> = ({
  content,
  maxHeight = 600,
}) => {
  const nodes = useMemo(() => {
    try {
      return cleanAndParse(content);
    } catch (error) {
      console.error('Error parsing HTML:', error);
      return [{ type: 'text' as const, content: 'Error rendering content' }];
    }
  }, [content]);

  const isInlineNode = (node: HtmlNode): boolean => {
    if (node.type === 'text') return true;
    if (node.type === 'br') return true; // Treat br as inline (newline)
    if (node.type === 'element') {
      const inlineTags = ['b', 'strong', 'i', 'em', 'u', 'a', 'span', 'small'];
      return inlineTags.includes(node.tag?.toLowerCase() || '');
    }
    return false;
  };

  const renderInlineNode = (node: HtmlNode, key: string): React.ReactNode => {
    if (node.type === 'text') {
      return <Text key={key}>{cleanText(node.content as string)}</Text>;
    }
    if (node.type === 'br') {
      return <Text key={key}>{'\n'}</Text>;
    }

    if (node.type === 'element') {
      const children = Array.isArray(node.content)
        ? node.content.map((child, idx) => renderInlineNode(child, `${key}-${idx}`))
        : node.content;

      const tag = node.tag?.toLowerCase();

      switch (tag) {
        case 'strong':
        case 'b':
          return <Text key={key} style={styles.bold}>{children}</Text>;
        case 'em':
        case 'i':
          return <Text key={key} style={styles.italic}>{children}</Text>;
        case 'a':
          return (
            <Text
              key={key}
              style={styles.link}
              onPress={() => {
                const href = node.attrs?.href;
                if (href) Linking.openURL(href).catch(console.error);
              }}
            >
              {children}
            </Text>
          );
        case 'span':
        default:
          return <Text key={key}>{children}</Text>;
      }
    }
    return null;
  };

  const renderBlockNode = (node: HtmlNode, key: string): React.ReactNode => {
    // Re-use existing renderNode logic for blocks, simplified
    if (node.type === 'element') {
      const tag = node.tag?.toLowerCase();
      // ... helper to render children ...
      const renderChildren = () => Array.isArray(node.content)
        ? node.content.map((child, idx) => {
          // Block children might need full renderNode logic if we supported nested blocks,
          // but for now let's keep it simple or call a recursive generic render.
          // Actually, best to recursively call the main grouping logic if the block contains blocks,
          // but usually p/h1/ul contain inline stuff.
          // For safety/speed in this fix, let's just map to recursive call or simplified inline if we know it's text-only content.
          // Re-using the top-level logic is safer but complex.
          // Let's rely on a simplified 'renderNode' that delegates.
          return renderAnyNode(child, `${key}-${idx}`);
        })
        : node.content;

      switch (tag) {
        case 'p': return <View key={key} style={styles.paragraph}><Text style={styles.text}>{renderChildren()}</Text></View>;
        case 'h1': return <Text key={key} style={styles.h1}>{renderChildren()}</Text>;
        case 'h2': return <Text key={key} style={styles.h2}>{renderChildren()}</Text>;
        case 'h3': return <Text key={key} style={styles.h3}>{renderChildren()}</Text>;
        case 'ul': return <View key={key} style={styles.bulletList}>{renderChildren()}</View>;
        case 'ol': return <View key={key} style={styles.numberedList}>{renderChildren()}</View>;
        case 'li':
          // This usually inside ul/ol, handled there? No, current logic handles children recursively.
          // We need to render the LI marker + content.
          // The parent ul/ol renderer in original code handled creating the bullet View.
          // If we here, we are just rendering the LI node.
          return <Text key={key}>{renderChildren()}</Text>; // Fallback if regular Text
        case 'div': return <View key={key}>{renderChildren()}</View>;
      }
    }
    return null;
  };

  // We need a unified render function that can be called recursively for children of blocks
  const renderAnyNode = (node: HtmlNode, key: string): React.ReactNode => {
    if (isInlineNode(node)) {
      return renderInlineNode(node, key);
    }
    // For block nodes (ul, ol) specifically that iterate their own children in a specific way (bullets)
    if (node.type === 'element' && (node.tag === 'ul' || node.tag === 'ol')) {
      const tag = node.tag;
      return (
        <View key={key} style={tag === 'ul' ? styles.bulletList : styles.numberedList}>
          {Array.isArray(node.content) && node.content.map((child, idx) => (
            child.tag === 'li' ? (
              <View key={`${key}-${idx}`} style={tag === 'ul' ? styles.bulletItem : styles.numberedItem}>
                <Text style={tag === 'ul' ? styles.bullet : styles.number}>
                  {tag === 'ul' ? '•' : `${idx + 1}.`}
                </Text>
                <Text style={styles.text}>
                  {/* LI content is usually text/inline, so we group it */}
                  {groupAndRenderInline([child], `${key}-${idx}-content`)}
                </Text>
              </View>
            ) : (
              renderAnyNode(child, `${key}-${idx}`)
            )
          ))}
        </View>
      );
    }
    return renderBlockNode(node, key);
  };

  // The helper to process a list of nodes and group inline ones
  const groupAndRenderInline = (nodeList: HtmlNode[], baseKey: string) => {
    const result: React.ReactNode[] = [];
    let currentGroup: HtmlNode[] = [];

    const flushGroup = (idx: number) => {
      if (currentGroup.length > 0) {
        result.push(
          <Text key={`${baseKey}-group-${idx}`} style={styles.text}>
            {currentGroup.map((n, i) => renderInlineNode(n, `${baseKey}-inline-${idx}-${i}`))}
          </Text>
        );
        currentGroup = [];
      }
    };

    nodeList.forEach((node, index) => {
      if (isInlineNode(node)) {
        // Special case: if node is an element like <li> content, we might recurse.
        // But here we are assuming flattened structure effectively.
        // Wait, if <li> contains <p>, that's invalid HTML usually but possible.
        currentGroup.push(node);
      } else {
        flushGroup(index);
        result.push(renderAnyNode(node, `${baseKey}-block-${index}`));
      }
    });
    flushGroup(nodeList.length);
    return result;
  };

  if (!nodes || nodes.length === 0) {
    return (
      <View style={[styles.container, { maxHeight }]}>
        <Text style={styles.emptyText}>No notes available</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { maxHeight }]}
      scrollEnabled
      nestedScrollEnabled
      showsVerticalScrollIndicator={true}
    >
      <View style={styles.content}>
        {groupAndRenderInline(nodes, 'root')}
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    marginVertical: 12,
  },
  content: {
    gap: 8,
  },
  text: {
    fontSize: 14,
    color: '#374151',
    lineHeight: 22,
  },
  bold: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1F2937',
  },
  italic: {
    fontSize: 14,
    fontStyle: 'italic',
    color: '#374151',
  },
  link: {
    fontSize: 14,
    color: '#2563EB',
    textDecorationLine: 'underline',
  },
  paragraph: {
    marginVertical: 8,
  },
  h1: {
    fontSize: 24,
    fontWeight: '800',
    color: '#1F2937',
    marginVertical: 12,
  },
  h2: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1F2937',
    marginVertical: 10,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginVertical: 8,
  },
  bullet: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#6B7280',
    marginRight: 12,
    lineHeight: 22,
  },
  bulletItem: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  bulletList: {
    marginVertical: 8,
    marginLeft: 12,
  },
  number: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
    marginRight: 10,
    lineHeight: 22,
    minWidth: 28,
  },
  numberedItem: {
    flexDirection: 'row',
    marginVertical: 6,
    alignItems: 'flex-start',
  },
  numberedList: {
    marginVertical: 8,
    marginLeft: 12,
  },
  lineBreak: {
    height: 8,
  },
  emptyText: {
    fontSize: 14,
    color: '#9CA3AF',
    fontStyle: 'italic',
  },
});

export default HtmlRichTextNoteDisplay;