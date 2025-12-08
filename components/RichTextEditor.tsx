import React from "react";
import { StyleSheet, View } from "react-native";
import { RichEditor, RichToolbar, actions } from "react-native-pell-rich-editor";

export interface RichTextEditorRef {
  focus: () => void;
  blur: () => void;
  setContentHTML: (html: string) => void;
}

interface RichTextEditorProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  style?: any;
}

export const RichTextEditor = React.forwardRef<
  RichTextEditorRef,
  RichTextEditorProps
>(({ value, onChangeText, placeholder = "Enter text...", style }, ref) => {
  const richText = React.useRef<any>(null);

  React.useImperativeHandle(ref, () => ({
    focus: () => {
      richText.current?.focusContentEditor();
    },

    blur: () => {
      richText.current?.blurContentEditor();
    },

    setContentHTML: (html: string) => {
      richText.current?.setContentHTML(html);
    },
  }));

  return (
    <View style={[styles.container, style]}>
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

      <RichEditor
        ref={richText}
        initialContentHTML={value}
        onChange={onChangeText}
        placeholder={placeholder}
        androidHardwareAccelerationDisabled
        style={styles.editor}
        initialHeight={120}
      />
    </View>
  );
});

RichTextEditor.displayName = "RichTextEditor";

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
});
