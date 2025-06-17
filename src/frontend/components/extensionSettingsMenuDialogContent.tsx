import React from 'react';

interface ContentItem {
  content: string;
  bullet?: boolean; // defaults to false
  style?: 'normal' | 'bold' | 'italic'; // defaults to 'normal'
  space?: 'none' | 'before' | 'after'; // defaults to 'none'
}

export const PRIME_DIRECTIVE_CONTENT: ContentItem[] = [
  {
    content: 'The purpose of the Prime Directive is to set the stage for a respectful and constructive retrospective.  By embracing this mindset, we create an environment where everyone feels safe to share openly, learn together, and improve as a team.',
    space: 'after'
  },
  {
    content: '“Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand.”',
    style: 'bold',
    space: 'after'
  },
  {
    content: '--Norm Kerth, Project Retrospectives: A Handbook for Team Review',
    style: 'italic'
  },
];

export const CHANGELOG_CONTENT: ContentItem[] = [
  {
    content: 'The latest release includes updates for setting permissions, deleting boards, and sticky defaults.',
    space: 'after'
  },
  {
    bullet: true,
    content: 'Ability to set permissions for accessing the retrospective board now restricted to the board owner or a team admin.',
  },
  {
    bullet: true,
    content: 'Functionality to delete boards was moved from the Board menu to the History table and is only enabled for archived boards.',
  },
  {
    bullet: true,
    content: 'User settings for maximum votes, Team Assessment, Prime Directive, obscure feedback, and anonymous feedback are saved and used as defaults when the user creates the next retrospective board.',
  },
  {
    content: 'Refer to the Changelog for a comprehensive listing of the updates included in this release and past releases.',
    space: 'before'
  },
];

export const RETRO_HELP_CONTENT: ContentItem[] = [
  {
    content: 'The purpose of the retrospective is to build a practice of gathering feedback and continuously improving by acting on that feedback.  The Retrospective extension and Team Assessment feature are valuable tools supporting that process.',
    space: 'after'
  },
  {
    content: 'For instructions on getting started, using the Retrospective extension and Team Assessment feature, and best practices for running effective retrospectives, open the user guide documented in the Readme file.',
  },
];

export const VOLUNTEER_CONTENT: ContentItem[] = [
  {
    content: 'Help us make the Retrospective Extension even better!',
    space: 'after'
  },
  {
    content: "While we will continue to maintain the extension to meet Microsoft's high standards for security and accessibility, we rely on volunteers like you to add new features and enhance the user experience.",
    space: 'after'
  },
  {
    content: 'Want to contribute? Join us and become part of our community! 🙋',
  },
];

export const CLEAR_VISIT_HISTORY_CONTENT: ContentItem[] = [
  {
    content: 'This extension maintains records of the teams and boards you visited.  Clearing visit history means that the next time you use the extension, you will not be automatically directed to your last visited board.',
  },
];

export const renderContent = (contentArray: ContentItem[]): React.ReactNode[] => {
  const bullets: ContentItem[] = [];
  const elements: React.ReactNode[] = [];

  const applyFontStyle = (text: string, style: 'normal' | 'bold' | 'italic' = 'normal') => {
    if (style === 'bold') return <b>{text}</b>;
    if (style === 'italic') return <i>{text}</i>;
    return text;
  };

  const flushBullets = (key: string) => {
    if (bullets.length) {
      elements.push(
        <ul key={key} className="menu-item-dialog-list">
          {bullets.map((bullet, i) => (
            <li key={`${key}-li-${i}`}>{bullet.content}</li>
          ))}
        </ul>
      );
      bullets.length = 0;
    }
  };

  contentArray.forEach((item, index) => {
    if (item.bullet) {
      bullets.push(item);
    } else {
      flushBullets(`ul-${index}`);

      const marginTop = item.space === 'before' ? '1rem' : undefined;
      const marginBottom = item.space === 'after' ? '1rem' : undefined;

      elements.push(
        <div key={`p-${index}`} style={{ marginTop, marginBottom }}>
          {applyFontStyle(item.content, item.style || 'normal')}
        </div>
      );
    }
  });

  flushBullets('ul-final');

  return elements;
};
