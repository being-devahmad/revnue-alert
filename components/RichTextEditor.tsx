// ============ FIXED RICH TEXT EDITOR COMPONENT ============
// RichTextEditor.tsx - WITH REF FORWARDING

import React from "react"
import { StyleSheet, View } from "react-native"
import { RichEditor, RichToolbar, actions } from 'react-native-pell-rich-editor'

interface RichTextEditorProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  style?: any
}

/**
 * Rich Text Editor Component using react-native-pell-rich-editor
 * 
 * Installation:
 * npm install react-native-pell-rich-editor react-native-webview
 * 
 * This component supports HTML formatting including bold, italic, underline, lists, etc.
 * 
 * ✅ NOW PROPERLY FORWARDS REFS!
 */
export const RichTextEditor = React.forwardRef<any, RichTextEditorProps>(
  ({ value, onChangeText, placeholder = "Enter text...", style }, ref) => {
    const richText = React.useRef<any>(null)

    // ✅ Expose the internal richText ref to parent
    React.useImperativeHandle(ref, () => ({
      setContentHTML: (html: string) => {
        console.log("📝 setContentHTML called with:", html);
        if (richText.current) {
          richText.current.setContentHTML(html);
        }
      },
      getContentHTML: async () => {
        if (richText.current) {
          return await richText.current.getContentHtml();
        }
      },
      insertHTML: (html: string) => {
        console.log("📝 insertHTML called with:", html);
        if (richText.current) {
          richText.current.insertHTML(html);
        }
      },
      focus: () => {
        if (richText.current) {
          richText.current.focusContentEditor();
        }
      },
      // Expose the raw editor ref for direct access if needed
      _editor: richText.current,
    }), [])

    return (
      <View style={[styles.container, style]}>
        {/* Toolbar with formatting options */}
        <RichToolbar
          editor={richText}
          actions={[
            actions.setBold,
            actions.setItalic,
            actions.setUnderline,
            actions.insertBulletsList,
            actions.insertOrderedList,
            actions.insertLink,
          ]}
          iconTint="#6B7280"
          selectedIconTint="#9A1B2B"
          style={styles.toolbar}
        />
        
        {/* Rich Text Editor */}
        <RichEditor
          ref={richText}
          initialContentHTML={value}
          onChange={onChangeText}
          placeholder={placeholder}
          androidHardwareAccelerationDisabled={true}
          style={styles.editor}
          initialHeight={120}
        />
      </View>
    )
  }
)

RichTextEditor.displayName = "RichTextEditor"

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderColor: "#E5E7EB",
    borderRadius: 8,
    backgroundColor: "#F9FAFB",
    overflow: "hidden",
  },
  toolbar: {
    backgroundColor: "#FFFFFF",
    borderBottomWidth: 1,
    borderBottomColor: "#E5E7EB",
    minHeight: 50,
  },
  editor: {
    minHeight: 120,
    backgroundColor: "#F9FAFB",
  },
})