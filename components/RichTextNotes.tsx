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

  const renderNode = (node: HtmlNode, key: string): React.ReactNode => {
    switch (node.type) {
      case 'br':
        return <View key={key} style={styles.lineBreak} />;

      case 'text':
        return (
          <Text key={key} style={styles.text} selectable>
            {cleanText(node.content as string)}
          </Text>
        );

      case 'element': {
        const tag = node.tag?.toLowerCase();
        const children = Array.isArray(node.content)
          ? node.content.map((child, idx) =>
              renderNode(child, `${key}-${idx}`)
            )
          : node.content;

        switch (tag) {
          case 'strong':
          case 'b':
            return (
              <Text key={key} style={styles.bold}>
                {children}
              </Text>
            );

          case 'em':
          case 'i':
            return (
              <Text key={key} style={styles.italic}>
                {children}
              </Text>
            );

          case 'a':
            return (
              <Text
                key={key}
                style={styles.link}
                onPress={() => {
                  const href = node.attrs?.href;
                  if (href) {
                    Linking.openURL(href).catch((err) =>
                      console.error('Error opening URL:', err)
                    );
                  }
                }}
              >
                {children}
              </Text>
            );

          case 'p':
            return (
              <View key={key} style={styles.paragraph}>
                <Text style={styles.text}>{children}</Text>
              </View>
            );

          case 'ul':
            return (
              <View key={key} style={styles.bulletList}>
                {Array.isArray(node.content) &&
                  node.content.map((child, idx) =>
                    child.tag === 'li' ? (
                      <View key={idx} style={styles.bulletItem}>
                        <Text style={styles.bullet}>•</Text>
                        <Text style={styles.text}>
                          {renderNode(child, `${key}-${idx}`)}
                        </Text>
                      </View>
                    ) : (
                      renderNode(child, `${key}-${idx}`)
                    )
                  )}
              </View>
            );

          case 'ol':
            return (
              <View key={key} style={styles.numberedList}>
                {Array.isArray(node.content) &&
                  node.content.map((child, idx) =>
                    child.tag === 'li' ? (
                      <View key={idx} style={styles.numberedItem}>
                        <Text style={styles.number}>{idx + 1}.</Text>
                        <Text style={styles.text}>
                          {renderNode(child, `${key}-${idx}`)}
                        </Text>
                      </View>
                    ) : (
                      renderNode(child, `${key}-${idx}`)
                    )
                  )}
              </View>
            );

          case 'li':
            return <>{children}</>;

          case 'div':
          case 'span':
            return <Text key={key}>{children}</Text>;

          case 'h1':
            return (
              <Text key={key} style={styles.h1}>
                {children}
              </Text>
            );

          case 'h2':
            return (
              <Text key={key} style={styles.h2}>
                {children}
              </Text>
            );

          case 'h3':
            return (
              <Text key={key} style={styles.h3}>
                {children}
              </Text>
            );

          default:
            return <Text key={key}>{children}</Text>;
        }
      }

      default:
        return null;
    }
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
        {nodes.map((node, idx) => renderNode(node, `node-${idx}`))}
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