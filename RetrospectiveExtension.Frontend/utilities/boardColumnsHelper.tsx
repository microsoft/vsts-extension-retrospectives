import { v4 as uuid } from 'uuid';
import { IFeedbackColumn } from '../interfaces/feedback';

export const getColumnsByTemplateId = (templateId: string): IFeedbackColumn[] => {
  switch (templateId) {
    case '4ls': // The 4 Ls - Like, Learned, Lacked, Longed For
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'Liked'
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-book',
          id: uuid(),
          title: 'Learned',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'far fa-compass',
          id: uuid(),
          title: 'Lacked',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-eye',
          id: uuid(),
          title: 'Longed for',
        },
      ];
    case '1to1': // 1-to-1 - Good, So-so, Improve, Done
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'Good',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'So-so',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-balance-scale-right',
          id: uuid(),
          title: 'Improve',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'fas fa-birthday-cake',
          id: uuid(),
          title: 'Done',
        },
      ];
    case 'daki': // Drop, Add, Keep, Improve
      return [
        {
          accentColor: '#cc293d',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'Drop',
        },
        {
          accentColor: '#008000',
          iconClass: 'fas fa-smile',
          id: uuid(),
          title: 'Add',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-book',
          id: uuid(),
          title: 'Keep',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-compass',
          id: uuid(),
          title: 'Improve',
        },
      ];
    case 'mad-sad-glad':
      return [
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-angry',
          id: uuid(),
          title: 'Mad',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'far fa-frown',
          id: uuid(),
          title: 'Sad',
        },
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'Glad',
        },
      ];
    case 'good-bad-ideas':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'Good',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-angry',
          id: uuid(),
          title: 'Bad',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'Ideas',
        },
      ];
    case 'kalm': // Keep, Add, Less, More
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'Keep',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-book',
          id: uuid(),
          title: 'Add',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'Less',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'far fa-comments',
          id: uuid(),
          title: 'More',
        },
      ];
    case 'start-stop-continue':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'Start',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: uuid(),
          title: 'Stop',
        },
        {
          accentColor: '#f6af08',
          iconClass: 'far fa-eye',
          id: uuid(),
          title: 'Continue',
        },
      ];
    case 'psy-safety':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'What makes it safe',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: uuid(),
          title: 'What hinders safety',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'One action in next sprint',
        },
      ];
    case 'clarity':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'What provides clarity',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: uuid(),
          title: 'What hinders clarity',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'One action in next sprint',
        },
      ];
    case 'energy':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'What provides energy',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: uuid(),
          title: 'What drains energy',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'One action in next sprint',
        },
      ];
    case 'wlb':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'What helps work-life balance',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: uuid(),
          title: 'What hinders work-life balance',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'One action in next sprint',
        },
      ];
    case 'team-confidence':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'What increases confidence in team',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: uuid(),
          title: 'What decreases confidence in team',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: uuid(),
          title: 'One action in next sprint',
        },
      ];
    case 'wlai': // Went Well, Learned, Impediments, Accelerators
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: uuid(),
          title: 'Went Well',
        },
        {
          accentColor: '#8063bf',
          iconClass: 'fas fa-book',
          id: uuid(),
          title: 'Learned',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'far fa-compass',
          id: uuid(),
          title: 'Accelerators',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'fas fa-question',
          id: uuid(),
          title: 'Impediments',
        },
      ];
    default: {
      return []
    }
  };
};
