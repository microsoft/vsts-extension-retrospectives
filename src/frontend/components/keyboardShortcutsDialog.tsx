import React from "react";
import { Dialog, DialogType, DialogFooter } from "@fluentui/react/lib/Dialog";
import { DefaultButton } from "@fluentui/react/lib/Button";
import { WorkflowPhase } from "../interfaces/workItem";

interface KeyboardShortcut {
  keys: string[];
  description: string;
  category: string;
  workflowPhases?: WorkflowPhase[];
}

interface KeyboardShortcutsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkflowPhase: WorkflowPhase;
}

const keyboardShortcuts: KeyboardShortcut[] = [
  // Global shortcuts
  { keys: ["?"], description: "Show keyboard shortcuts", category: "Global" },
  { keys: ["Esc"], description: "Close dialogs or cancel actions", category: "Global" },
  { keys: ["1-5"], description: "Jump to column by number", category: "Global" },

  // Column navigation
  { keys: ["←", "→"], description: "Navigate between columns", category: "Navigation" },
  { keys: ["Tab"], description: "Move focus to next element", category: "Navigation" },
  { keys: ["Shift", "Tab"], description: "Move focus to previous element", category: "Navigation" },

  // Item navigation
  { keys: ["↑", "↓"], description: "Navigate between feedback items", category: "Navigation" },
  { keys: ["Home"], description: "Jump to first item in column", category: "Navigation" },
  { keys: ["End"], description: "Jump to last item in column", category: "Navigation" },
  { keys: ["Page Up"], description: "Scroll up in column", category: "Navigation" },
  { keys: ["Page Down"], description: "Scroll down in column", category: "Navigation" },

  // Item actions - Collect phase
  { keys: ["N", "Insert"], description: "Create new feedback item", category: "Actions", workflowPhases: [WorkflowPhase.Collect] },
  { keys: ["Enter"], description: "Edit feedback title", category: "Actions", workflowPhases: [WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote, WorkflowPhase.Act] },
  { keys: ["Delete"], description: "Delete feedback item", category: "Actions", workflowPhases: [WorkflowPhase.Collect, WorkflowPhase.Group, WorkflowPhase.Vote, WorkflowPhase.Act] },

  // Group phase actions
  { keys: ["G"], description: "Group feedback items", category: "Actions", workflowPhases: [WorkflowPhase.Group] },
  { keys: ["M"], description: "Move feedback to different column", category: "Actions", workflowPhases: [WorkflowPhase.Group] },
  { keys: ["Space"], description: "Expand/Collapse group", category: "Actions", workflowPhases: [WorkflowPhase.Group, WorkflowPhase.Vote, WorkflowPhase.Act] },

  // Vote phase actions
  { keys: ["V"], description: "Cast/Remove vote", category: "Actions", workflowPhases: [WorkflowPhase.Vote] },

  // Act phase actions
  { keys: ["A"], description: "Add action item", category: "Actions", workflowPhases: [WorkflowPhase.Act] },
  { keys: ["T"], description: "Start/Stop timer", category: "Actions", workflowPhases: [WorkflowPhase.Act] },

  // Column actions
  { keys: ["E"], description: "Edit column notes", category: "Column" },
  { keys: ["I"], description: "View column info", category: "Column" },
];

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ isOpen, onClose, currentWorkflowPhase }) => {
  // Filter shortcuts based on current workflow phase
  const relevantShortcuts = keyboardShortcuts.filter(shortcut => !shortcut.workflowPhases || shortcut.workflowPhases.includes(currentWorkflowPhase));

  // Group shortcuts by category
  const groupedShortcuts = relevantShortcuts.reduce(
    (acc, shortcut) => {
      if (!acc[shortcut.category]) {
        acc[shortcut.category] = [];
      }
      acc[shortcut.category].push(shortcut);
      return acc;
    },
    {} as { [key: string]: KeyboardShortcut[] },
  );

  const renderKey = (key: string) => (
    <kbd
      key={key}
      style={{
        padding: "2px 6px",
        margin: "0 2px",
        border: "1px solid #ccc",
        borderRadius: "3px",
        backgroundColor: "#f7f7f7",
        fontFamily: "monospace",
        fontSize: "12px",
        boxShadow: "0 1px 2px rgba(0,0,0,0.1)",
      }}
    >
      {key}
    </kbd>
  );

  return (
    <Dialog
      hidden={!isOpen}
      onDismiss={onClose}
      dialogContentProps={{
        type: DialogType.normal,
        title: "Keyboard Shortcuts",
        subText: "Use these keyboard shortcuts to navigate and interact with the retrospective board.",
      }}
      modalProps={{
        isBlocking: false,
        containerClassName: "keyboard-shortcuts-dialog",
        className: "retrospectives-dialog-modal",
      }}
      minWidth={600}
    >
      <div style={{ maxHeight: "60vh", overflowY: "auto" }}>
        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
          <div key={category} style={{ marginBottom: "20px" }}>
            <h3
              style={{
                fontSize: "14px",
                fontWeight: 600,
                marginBottom: "10px",
                color: "var(--text-primary-color)",
                borderBottom: "1px solid var(--border-subtle-color)",
                paddingBottom: "5px",
              }}
            >
              {category}
            </h3>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <tbody>
                {shortcuts.map((shortcut, index) => (
                  <tr key={index} style={{ borderBottom: "1px solid var(--border-subtle-color)" }}>
                    <td
                      style={{
                        padding: "8px 12px",
                        textAlign: "left",
                        verticalAlign: "middle",
                        width: "40%",
                      }}
                    >
                      {shortcut.keys.map((key, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span style={{ margin: "0 4px", color: "var(--text-secondary-color)" }}>+</span>}
                          {renderKey(key)}
                        </React.Fragment>
                      ))}
                    </td>
                    <td
                      style={{
                        padding: "8px 12px",
                        color: "var(--text-primary-color)",
                        verticalAlign: "middle",
                      }}
                    >
                      {shortcut.description}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ))}
      </div>
      <DialogFooter>
        <DefaultButton onClick={onClose} text="Close" />
      </DialogFooter>
    </Dialog>
  );
};

export default KeyboardShortcutsDialog;
