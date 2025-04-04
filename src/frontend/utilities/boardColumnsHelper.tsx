import { IFeedbackColumn } from '../interfaces/feedback';
import { generateUUID } from './random';

export const getColumnsByTemplateId = (templateId: string): IFeedbackColumn[] => {
  switch (templateId) {
    case 'speedboat': // Speedboat retrospective - Propellors, Life Preserver, Anchors, Rocks
    return [
      {
        accentColor: '#008000',
        iconClass: 'fas fa-rocket',
        id: generateUUID(),
        title: 'Propellors'
      },
      {
        accentColor: '#f6af03',
        iconClass: 'fas fa-life-ring',
        id: generateUUID(),
        title: 'Life preserver',
      },
      {
        accentColor: '#F78A53',
        iconClass: 'fas fa-anchor',
        id: generateUUID(),
        title: 'Anchors',
      },
      {
        accentColor: '#cc293d',
        iconClass: 'far fa-exclamation',
        id: generateUUID(),
        title: 'Rocks',
      },
    ];
    case '4ls': // The 4 Ls - Like, Learned, Lacked, Longed For
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Liked'
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-book',
          id: generateUUID(),
          title: 'Learned',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'far fa-compass',
          id: generateUUID(),
          title: 'Lacked',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-eye',
          id: generateUUID(),
          title: 'Longed for',
        },
      ];
    case 'daki': // Drop, Add, Keep, Improve
      return [
        {
          accentColor: '#cc293d',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'Drop',
        },
        {
          accentColor: '#008000',
          iconClass: 'fas fa-smile',
          id: generateUUID(),
          title: 'Add',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-book',
          id: generateUUID(),
          title: 'Keep',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-compass',
          id: generateUUID(),
          title: 'Improve',
        },
      ];
    case 'mad-sad-glad':
      return [
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-angry',
          id: generateUUID(),
          title: 'Mad',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'Sad',
        },
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Glad',
        },
      ];
    case 'good-improve-ideas':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Good',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'Improve',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'Ideas',
        },
      ];
    case 'kalm': // Keep, Add, Less, More
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Keep',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-book',
          id: generateUUID(),
          title: 'Add',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'Less',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-comments',
          id: generateUUID(),
          title: 'More',
        },
      ];
    case 'start-stop-continue':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Start',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'Stop',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'far fa-eye',
          id: generateUUID(),
          title: 'Continue',
        },
      ];
    case 'wlai': // Went Well, Learned, Impediments, Accelerators
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Went Well',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'fas fa-book',
          id: generateUUID(),
          title: 'Learned',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'far fa-compass',
          id: generateUUID(),
          title: 'Accelerators',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'fas fa-question',
          id: generateUUID(),
          title: 'Impediments',
        },
      ];
    // Team Assessment Templates
    case 'clarity':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What provides clarity',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders clarity',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'energy':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What provides energy',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What drains energy',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'psy-safety':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What makes it safe',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders safety',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'wlb':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What helps work-life balance',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders work-life balance',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'team-confidence':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What increases confidence in team',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What decreases confidence in team',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint',
        },
      ];
    case 'team-efficiency':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What helps efficiency',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders efficiency',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint',
        },
      ];
    default: {
      return [{
        accentColor: '#008000',
        iconClass: 'far fa-smile',
        id: generateUUID(),
        title: 'What went well',
      }, {
        accentColor: '#cc293d',
        iconClass: 'far fa-frown',
        id: generateUUID(),
        title: "What didn't go well",
      }]
    }
  }
};
