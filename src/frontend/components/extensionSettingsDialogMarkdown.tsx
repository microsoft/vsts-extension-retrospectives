import React from 'react';
import ReactMarkdown from 'react-markdown';

interface DialogMarkdownProps {
  markdown: string;
}

export const DialogMarkdown: React.FC<DialogMarkdownProps> = ({ markdown }) => (
  <div className="menu-item-dialog-markdown">
    <ReactMarkdown>{markdown}</ReactMarkdown>
  </div>
);
