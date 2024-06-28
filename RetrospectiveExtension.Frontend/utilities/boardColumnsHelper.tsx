import { IFeedbackColumn } from '../interfaces/feedback';

export const getColumnsByTemplateId = (templateId: string): IFeedbackColumn[] => {
  switch (templateId) {
    case 'speedboat': // Speedboat retrospective - Propellors, Life Preserver, Anchors, Rocks
    return [
      {
        accentColor: '#008000',
        iconClass: 'fas fa-rocket',
        id: crypto.randomUUID(),
        title: 'Propellors'
      },
      {
        accentColor: '#f6af03',
        iconClass: 'fas fa-life-ring',
        id: crypto.randomUUID(),
        title: 'Life preserver',
      },
      {
        accentColor: '#F78A53',
        iconClass: 'fas fa-anchor',
        id: crypto.randomUUID(),
        title: 'Anchors',
      },
      {
        accentColor: '#cc293d',
        iconClass: 'far fa-exclamation',
        id: crypto.randomUUID(),
        title: 'Rocks',
      },
    ];
    case '4ls': // The 4 Ls - Like, Learned, Lacked, Longed For
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'Liked'
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-book',
          id: crypto.randomUUID(),
          title: 'Learned',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'far fa-compass',
          id: crypto.randomUUID(),
          title: 'Lacked',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-eye',
          id: crypto.randomUUID(),
          title: 'Longed for',
        },
      ];
    case '1to1': // 1-to-1 - Good, So-so, Improve, Done
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'Good',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'So-so',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-balance-scale-right',
          id: crypto.randomUUID(),
          title: 'Improve',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'fas fa-birthday-cake',
          id: crypto.randomUUID(),
          title: 'Done',
        },
      ];
    case 'daki': // Drop, Add, Keep, Improve
      return [
        {
          accentColor: '#cc293d',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'Drop',
        },
        {
          accentColor: '#008000',
          iconClass: 'fas fa-smile',
          id: crypto.randomUUID(),
          title: 'Add',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-book',
          id: crypto.randomUUID(),
          title: 'Keep',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-compass',
          id: crypto.randomUUID(),
          title: 'Improve',
        },
      ];
    case 'mad-sad-glad':
      return [
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-angry',
          id: crypto.randomUUID(),
          title: 'Mad',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'Sad',
        },
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'Glad',
        },
      ];
    case 'good-bad-ideas':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'Good',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-angry',
          id: crypto.randomUUID(),
          title: 'Bad',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'Ideas',
        },
      ];
    case 'kalm': // Keep, Add, Less, More
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'Keep',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-book',
          id: crypto.randomUUID(),
          title: 'Add',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'Less',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-comments',
          id: crypto.randomUUID(),
          title: 'More',
        },
      ];
    case 'start-stop-continue':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'Start',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'Stop',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'far fa-eye',
          id: crypto.randomUUID(),
          title: 'Continue',
        },
      ];
    case 'psy-safety':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'What makes it safe',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'What hinders safety',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'clarity':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'What provides clarity',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'What hinders clarity',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'energy':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'What provides energy',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'What drains energy',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'wlb':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'What helps work-life balance',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'What hinders work-life balance',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'team-confidence':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'What increases confidence in team',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'What decreases confidence in team',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'team-efficiency':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'What helps efficiency',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: crypto.randomUUID(),
          title: 'What hinders efficiency',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: crypto.randomUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'wlai': // Went Well, Learned, Impediments, Accelerators
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: crypto.randomUUID(),
          title: 'Went Well',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'fas fa-book',
          id: crypto.randomUUID(),
          title: 'Learned',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'far fa-compass',
          id: crypto.randomUUID(),
          title: 'Accelerators',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'fas fa-question',
          id: crypto.randomUUID(),
          title: 'Impediments',
        },
      ];
    default: {
      return [{
        accentColor: '#008000',
        iconClass: 'far fa-smile',
        id: crypto.randomUUID(),
        title: 'What went well',
      }, {
        accentColor: '#cc293d',
        iconClass: 'far fa-frown',
        id: crypto.randomUUID(),
        title: "What didn't go well",
      }]
    }
  }
};
