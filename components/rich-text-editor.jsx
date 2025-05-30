"use client"

import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  Link,
  Image,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Quote,
  Code,
  Undo,
  Redo,
  Type,
  Palette,
  Highlighter,
  Table,
  Video,
  FileText,
  Subscript,
  Superscript,
  Indent,
  Outdent,
  MoreHorizontal
} from "lucide-react"

export function FroalaTextEditor({ value, onChange, placeholder = "Type something..." }) {
  const editorRef = useRef(null)
  const [isEditorReady, setIsEditorReady] = useState(false)
  const [showMoreTools, setShowMoreTools] = useState(false)
  const [fontSize, setFontSize] = useState("14px")
  const [fontFamily, setFontFamily] = useState("Arial")

  useEffect(() => {
    if (editorRef.current) {
      setIsEditorReady(true)
      if (value && editorRef.current.innerHTML !== value) {
        editorRef.current.innerHTML = value
      }
    }
  }, [value])

  const executeCommand = (command, value = null) => {
    if (command === "insertUnorderedList" || command === "insertOrderedList") {
      // Special handling for lists
      editorRef.current?.focus()
      document.execCommand(command, false, null)
      handleContentChange()
    } else {
      document.execCommand(command, false, value)
      editorRef.current?.focus()
      handleContentChange()
    }
  }

  const handleContentChange = () => {
    if (editorRef.current && onChange) {
      onChange(editorRef.current.innerHTML)
    }
  }

  const insertLink = () => {
    const selection = window.getSelection()
    const selectedText = selection.toString()
    const url = prompt("Enter URL:", "https://")
    if (url) {
      if (selectedText) {
        executeCommand("createLink", url)
      } else {
        const linkText = prompt("Enter link text:", "Link")
        if (linkText) {
          const linkHtml = `<a href="${url}" target="_blank">${linkText}</a>`
          executeCommand("insertHTML", linkHtml)
        }
      }
    }
  }

  const insertImage = () => {
    const url = prompt("Enter image URL:", "https://")
    if (url) {
      const imgHtml = `<img src="${url}" alt="Image" style="max-width: 100%; height: auto;" />`
      executeCommand("insertHTML", imgHtml)
    }
  }

  const insertTable = () => {
    const rows = prompt("Number of rows:", "3")
    const cols = prompt("Number of columns:", "3")
    if (rows && cols) {
      let tableHtml = '<table style="border-collapse: collapse; width: 100%; margin: 10px 0;">'
      for (let i = 0; i < parseInt(rows); i++) {
        tableHtml += '<tr>'
        for (let j = 0; j < parseInt(cols); j++) {
          tableHtml += '<td style="border: 1px solid #ddd; padding: 8px; min-width: 50px;">&nbsp;</td>'
        }
        tableHtml += '</tr>'
      }
      tableHtml += '</table>'
      executeCommand("insertHTML", tableHtml)
    }
  }

  const insertVideo = () => {
    const url = prompt("Enter YouTube/Vimeo URL:", "https://")
    if (url) {
      let embedHtml = ""
      if (url.includes("youtube.com") || url.includes("youtu.be")) {
        const videoId = url.split("v=")[1]?.split("&")[0] || url.split("/").pop()
        embedHtml = `<iframe width="560" height="315" src="https://www.youtube.com/embed/${videoId}" frameborder="0" allowfullscreen></iframe>`
      } else if (url.includes("vimeo.com")) {
        const videoId = url.split("/").pop()
        embedHtml = `<iframe src="https://player.vimeo.com/video/${videoId}" width="560" height="315" frameborder="0" allowfullscreen></iframe>`
      } else {
        embedHtml = `<video controls style="max-width: 100%;"><source src="${url}">Your browser does not support the video tag.</video>`
      }
      executeCommand("insertHTML", embedHtml)
    }
  }

  const changeFontSize = (size) => {
    setFontSize(size)
    executeCommand("fontSize", "7")
    const selection = window.getSelection()
    if (selection.rangeCount > 0) {
      const range = selection.getRangeAt(0)
      const span = document.createElement("span")
      span.style.fontSize = size
      try {
        range.surroundContents(span)
      } catch (e) {
        span.appendChild(range.extractContents())
        range.insertNode(span)
      }
    }
    handleContentChange()
  }

  const changeFontFamily = (family) => {
    setFontFamily(family)
    executeCommand("fontName", family)
  }

  const changeTextColor = () => {
    const color = prompt("Enter color (hex, rgb, or name):", "#000000")
    if (color) {
      executeCommand("foreColor", color)
    }
  }

  const changeBackgroundColor = () => {
    const color = prompt("Enter background color (hex, rgb, or name):", "#ffff00")
    if (color) {
      executeCommand("backColor", color)
    }
  }

  const primaryToolbarButtons = [
    { icon: Bold, command: "bold", title: "Bold (Ctrl+B)" },
    { icon: Italic, command: "italic", title: "Italic (Ctrl+I)" },
    { icon: Underline, command: "underline", title: "Underline (Ctrl+U)" },
    { icon: Strikethrough, command: "strikeThrough", title: "Strikethrough" },
  ]

  const formattingButtons = [
    { 
      icon: List, 
      command: "insertUnorderedList", 
      title: "Bullet List",
      action: () => {
        editorRef.current?.focus()
        document.execCommand("insertUnorderedList", false, null)
        handleContentChange()
      }
    },
    { 
      icon: ListOrdered, 
      command: "insertOrderedList", 
      title: "Numbered List",
      action: () => {
        editorRef.current?.focus()
        document.execCommand("insertOrderedList", false, null)
        handleContentChange()
      }
    },
    { icon: Quote, command: "formatBlock", value: "blockquote", title: "Quote" },
    { icon: Code, command: "formatBlock", value: "pre", title: "Code Block" },
  ]

  const alignmentButtons = [
    { icon: AlignLeft, command: "justifyLeft", title: "Align Left" },
    { icon: AlignCenter, command: "justifyCenter", title: "Align Center" },
    { icon: AlignRight, command: "justifyRight", title: "Align Right" },
    { icon: AlignJustify, command: "justifyFull", title: "Justify" },
  ]

  const moreTools = [
    { icon: Subscript, command: "subscript", title: "Subscript" },
    { icon: Superscript, command: "superscript", title: "Superscript" },
    { icon: Indent, command: "indent", title: "Indent" },
    { icon: Outdent, command: "outdent", title: "Outdent" },
    { icon: Undo, command: "undo", title: "Undo" },
    { icon: Redo, command: "redo", title: "Redo" },
  ]

  return (
    <div className="border rounded-lg overflow-hidden bg-white shadow-sm">
      {/* Main Toolbar */}
      <div className="border-b bg-gray-50 p-3">
        {/* First Row - Font Controls */}
        <div className="flex items-center gap-2 mb-2 pb-2 border-b border-gray-200">
          <select
            value={fontFamily}
            onChange={(e) => changeFontFamily(e.target.value)}
            className="px-2 py-1 border rounded text-sm bg-white"
          >
            <option value="Arial">Arial</option>
            <option value="Georgia">Georgia</option>
            <option value="Times New Roman">Times New Roman</option>
            <option value="Helvetica">Helvetica</option>
            <option value="Verdana">Verdana</option>
            <option value="Courier New">Courier New</option>
          </select>
          
          <select
            value={fontSize}
            onChange={(e) => changeFontSize(e.target.value)}
            className="px-2 py-1 border rounded text-sm bg-white"
          >
            <option value="10px">10</option>
            <option value="12px">12</option>
            <option value="14px">14</option>
            <option value="16px">16</option>
            <option value="18px">18</option>
            <option value="20px">20</option>
            <option value="24px">24</option>
            <option value="28px">28</option>
            <option value="32px">32</option>
          </select>

          <div className="w-px bg-gray-300 h-6 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={changeTextColor}
            title="Text Color"
            className="h-8 w-8 p-0"
          >
            <Palette className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={changeBackgroundColor}
            title="Background Color"
            className="h-8 w-8 p-0"
          >
            <Highlighter className="h-4 w-4" />
          </Button>
        </div>

        {/* Second Row - Formatting */}
        <div className="flex flex-wrap items-center gap-1">
          {primaryToolbarButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(button.command, button.value)}
              title={button.title}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}

          <div className="w-px bg-gray-300 h-6 mx-1" />

          {formattingButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={button.action ? button.action : () => executeCommand(button.command, button.value)}
              title={button.title}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}

          <div className="w-px bg-gray-300 h-6 mx-1" />

          {alignmentButtons.map((button, index) => (
            <Button
              key={index}
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => executeCommand(button.command, button.value)}
              title={button.title}
              className="h-8 w-8 p-0 hover:bg-blue-100"
            >
              <button.icon className="h-4 w-4" />
            </Button>
          ))}

          <div className="w-px bg-gray-300 h-6 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertLink}
            title="Insert Link"
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <Link className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertImage}
            title="Insert Image"
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <Image className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertTable}
            title="Insert Table"
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <Table className="h-4 w-4" />
          </Button>

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={insertVideo}
            title="Insert Video"
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <Video className="h-4 w-4" />
          </Button>

          <div className="w-px bg-gray-300 h-6 mx-1" />

          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setShowMoreTools(!showMoreTools)}
            title="More Tools"
            className="h-8 w-8 p-0 hover:bg-blue-100"
          >
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Third Row - Additional Tools (Collapsible) */}
        {showMoreTools && (
          <div className="flex flex-wrap items-center gap-1 mt-2 pt-2 border-t border-gray-200">
            {moreTools.map((button, index) => (
              <Button
                key={index}
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => executeCommand(button.command, button.value)}
                title={button.title}
                className="h-8 w-8 p-0 hover:bg-blue-100"
              >
                <button.icon className="h-4 w-4" />
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleContentChange}
        onBlur={handleContentChange}
        className="min-h-[300px] p-4 focus:outline-none"
        style={{
          wordBreak: "break-word",
          overflowWrap: "break-word",
          lineHeight: "1.6",
          fontFamily: fontFamily,
          fontSize: fontSize,
        }}
        suppressContentEditableWarning={true}
        data-placeholder={placeholder}
      />

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
          font-style: italic;
        }
        
        [contenteditable] blockquote {
          border-left: 4px solid #3b82f6;
          padding-left: 1rem;
          margin: 1rem 0;
          font-style: italic;
          background-color: #f8fafc;
          padding: 1rem;
          border-radius: 0.375rem;
        }
        
        [contenteditable] pre {
          background-color: #1f2937;
          color: #f9fafb;
          padding: 1rem;
          border-radius: 0.375rem;
          overflow-x: auto;
          font-family: 'Courier New', monospace;
          margin: 1rem 0;
        }
        
        [contenteditable] ul, [contenteditable] ol {
          padding-left: 2rem;
          margin: 1rem 0;
        }
        
        [contenteditable] ul li, [contenteditable] ol li {
          margin: 0.25rem 0;
        }
        
        [contenteditable] img {
          max-width: 100%;
          height: auto;
          border-radius: 0.375rem;
          margin: 0.5rem 0;
        }
        
        [contenteditable] table {
          border-collapse: collapse;
          width: 100%;
          margin: 1rem 0;
        }
        
        [contenteditable] table td, [contenteditable] table th {
          border: 1px solid #d1d5db;
          padding: 0.5rem;
          text-align: left;
        }
        
        [contenteditable] table th {
          background-color: #f3f4f6;
          font-weight: bold;
        }
        
        [contenteditable] a {
          color: #3b82f6;
          text-decoration: underline;
        }
        
        [contenteditable] a:hover {
          color: #1d4ed8;
        }
        
        [contenteditable] iframe {
          max-width: 100%;
          margin: 1rem 0;
          border-radius: 0.375rem;
        }
        
        [contenteditable] video {
          max-width: 100%;
          margin: 1rem 0;
          border-radius: 0.375rem;
        }
        
        [contenteditable]:focus {
          box-shadow: inset 0 0 0 2px #3b82f6;
        }
        
        [contenteditable] h1, [contenteditable] h2, [contenteditable] h3, 
        [contenteditable] h4, [contenteditable] h5, [contenteditable] h6 {
          margin: 1rem 0 0.5rem 0;
          font-weight: bold;
        }
        
        [contenteditable] h1 { font-size: 2rem; }
        [contenteditable] h2 { font-size: 1.5rem; }
        [contenteditable] h3 { font-size: 1.25rem; }
        [contenteditable] h4 { font-size: 1.125rem; }
        [contenteditable] h5 { font-size: 1rem; }
        [contenteditable] h6 { font-size: 0.875rem; }
        
        [contenteditable] p {
          margin: 0.5rem 0;
        }
      `}</style>
    </div>
  )
}