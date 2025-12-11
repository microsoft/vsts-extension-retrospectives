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

  // Column navigation
  { keys: ["1-5"], description: "Jump to column by number", category: "Navigation" },
  { keys: ["←", "→"], description: "Navigate between columns", category: "Navigation" },
  { keys: ["Tab"], description: "Move focus to next element", category: "Navigation" },
  { keys: ["Shift", "Tab"], description: "Move focus to previous element", category: "Navigation" },

  // Item navigation
  { keys: ["↑", "↓"], description: "Navigate between feedback items", category: "Navigation" },
  { keys: ["Page Up"], description: "Scroll up in column", category: "Navigation" },
  { keys: ["Page Down"], description: "Scroll down in column", category: "Navigation" },

  // Item actions - Collect phase
  { keys: ["Insert"], description: "Create new feedback item", category: "Actions", workflowPhases: [WorkflowPhase.Collect] },
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
];

const KeyboardShortcutsDialog: React.FC<KeyboardShortcutsDialogProps> = ({ isOpen, onClose, currentWorkflowPhase }) => {
  const relevantShortcuts = keyboardShortcuts.filter(shortcut => !shortcut.workflowPhases || shortcut.workflowPhases.includes(currentWorkflowPhase));

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

  const renderKey = (key: string) => <kbd key={key}>{key}</kbd>;

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
        focusTrapZoneProps: {
          firstFocusableSelector: "ms-Dialog-header",
        },
      }}
      minWidth={660}
    >
      <div className="keyboard-shortcuts-content" tabIndex={-1}>
        {Object.entries(groupedShortcuts).map(([category, shortcuts]) => (
          <div key={category}>
            <h3 className="keyboard-shortcuts-category-title">{category}</h3>
            <table className="keyboard-shortcuts-table">
              <thead>
                <tr>
                  <th scope="col">Shortcut</th>
                  <th scope="col">Description</th>
                </tr>
              </thead>
              <tbody>
                {shortcuts.map((shortcut, index) => (
                  <tr key={index}>
                    <td>
                      {shortcut.keys.map((key, idx) => (
                        <React.Fragment key={idx}>
                          {idx > 0 && <span className="keyboard-shortcuts-key-separator">+</span>}
                          {renderKey(key)}
                        </React.Fragment>
                      ))}
                    </td>
                    <td>{shortcut.description}</td>
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
