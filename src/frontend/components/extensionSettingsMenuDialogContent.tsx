import React from 'react';

export const RETRO_URLS = {
  retrospectivewiki: 'https://retrospectivewiki.org/',
  changelog: 'https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CHANGELOG.md',
  readme: 'https://github.com/microsoft/vsts-extension-retrospectives/blob/main/README.md',
  contributing: 'https://github.com/microsoft/vsts-extension-retrospectives/blob/main/CONTRIBUTING.md',
  issues: 'https://github.com/microsoft/vsts-extension-retrospectives/issues',
} as const;

interface ContentItem {
  content: string;
  bullet?: boolean; // defaults to false
  style?: 'normal' | 'bold' | 'italic'; // defaults to 'normal'
}

export const WHATISNEW_MARKDOWN = `
The latest release includes redesign of menu options, enabling mobile view, role-based permission setting, redesign of deleting boards, and implementation of sticky defaults.

- Extension settings menu was redesigned to mirror the ADO settings menu, while moving Prime Directive and adding Volunteer options.
- Switch to mobile view was enabled with only core functionality and improved viewing on mobile devices.
- Ability to set permissions for accessing the retrospective board is now restricted to the board owner or a team admin.
- Functionality to delete boards was moved from the Board menu to the History table and is only enabled for archived boards.
- User settings for maximum votes, Team Assessment, obscure feedback, and anonymous feedback are saved and used as defaults when the user creates the next retrospective board.

Refer to the [Changelog](${RETRO_URLS.changelog}) for a comprehensive listing of the updates included in this release and past releases.
`;

export const PRIME_DIRECTIVE_CONTENT: ContentItem[] = [
  {
    content: 'The purpose of the Prime Directive is to set the stage for a respectful and constructive retrospective.  By embracing this mindset, we create an environment where everyone feels safe to share openly, learn together, and improve as a team.'
  },
  {
    content: '“Regardless of what we discover, we understand and truly believe that everyone did the best job they could, given what they knew at the time, their skills and abilities, the resources available, and the situation at hand.”',
    style: 'bold'
  },
  {
    content: '--Norm Kerth, Project Retrospectives: A Handbook for Team Review',
    style: 'italic'
  },
];

export const CHANGELOG_CONTENT: ContentItem[] = [
  {
    content: 'The latest release includes redesign of menu options, enabling mobile view, role-based permission setting, redesign of deleting boards, and implementation of sticky defaults.'
  },
  {
    bullet: true,
    content: 'Extension settings menu was redesigned to mirror the ADO settings menu, while moving Prime Directive and adding Volunteer options.',
  },
  {
    bullet: true,
    content: 'Switch to mobile view was enabled with only core functionality and improved viewing on mobile devices.',
  },
  {
    bullet: true,
    content: 'Ability to set permissions for accessing the retrospective board is now restricted to the board owner or a team admin.',
  },
  {
    bullet: true,
    content: 'Functionality to delete boards was moved from the Board menu to the History table and is only enabled for archived boards.',
  },
  {
    bullet: true,
    content: 'User settings for maximum votes, Team Assessment, obscure feedback, and anonymous feedback are saved and used as defaults when the user creates the next retrospective board.',
  },
  {
    content: 'Refer to the Changelog for a comprehensive listing of the updates included in this release and past releases.'
  },
];

export const RETRO_HELP_CONTENT: ContentItem[] = [
  {
    content: 'The purpose of the retrospective is to build a practice of gathering feedback and continuously improving by acting on that feedback.  The Retrospective extension and Team Assessment feature are valuable tools supporting that process.'
  },
  {
    content: 'For instructions on getting started, using the Retrospective extension and Team Assessment feature, and best practices for running effective retrospectives, open the user guide documented in the Readme file.',
  },
];

export const VOLUNTEER_CONTENT: ContentItem[] = [
  {
    content: 'Help us make the Retrospective Extension even better!'
  },
  {
    content: "While we will continue to maintain the extension to meet Microsoft's high standards for security and accessibility, we rely on volunteers like you to add new features and enhance the user experience."
  },
  {
    content: 'Want to contribute? Join us and become part of our community! 🙋',
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

  const flushBullets = (
    key: string,
    addTopSpace: boolean,
    addBottomSpace: boolean
  ) => {
    if (!bullets.length) return;

    elements.push(
      <ul
        key={key}
        className="menu-item-dialog-list"
        style={{
          marginTop: addTopSpace ? '1rem' : undefined,
          marginBottom: addBottomSpace ? '1rem' : undefined,
        }}
      >
        {bullets.map((bullet, i) => (
          <li key={`${key}-li-${i}`}>{bullet.content}</li>
        ))}
      </ul>
    );
    bullets.length = 0;
  };

  contentArray.forEach((item, index) => {
    const prev = contentArray[index - 1];
    const next = contentArray[index + 1];
    const isFirst = index === 0;
    const isLast = index === contentArray.length - 1;

    if (item.bullet) { // prepare lines with bullets
      bullets.push(item);

      const nextIsParagraph = next && !next.bullet;
      const isLastBullet = isLast || nextIsParagraph;
      if (isLastBullet) {
        const addTop = !isFirst && (!prev || !prev.bullet);
        const addBottom = !isLast && (!next || !next.bullet);
        flushBullets(`ul-${index}`, addTop, addBottom);
      }
    } else { // prepare lines without bullets
      flushBullets(`ul-${index}`, false, false);

      const addBottom = !isLast;

      elements.push(
        <div
          key={`p-${index}`}
          style={{
            marginTop: !isFirst && (!prev || prev.bullet) ? '1rem' : undefined,
            marginBottom: addBottom ? '1rem' : undefined,
          }}
        >
          {applyFontStyle(item.content, item.style || 'normal')}
        </div>
      );
    }
  });

  return elements;
};
