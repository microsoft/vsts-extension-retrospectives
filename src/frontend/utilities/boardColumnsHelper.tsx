import { IFeedbackColumn } from '../interfaces/feedback';
import { generateUUID } from './random';

export const getColumnsByTemplateId = (templateId: string): IFeedbackColumn[] => {
  switch (templateId) {
    case 'start-stop-continue':
      return [
        {
          accentColor: '#008000', //green
          iconClass: 'far fa-circle-play',
          id: generateUUID(),
          title: 'Start',
        },
        {
          accentColor: '#cc293d', //red
          iconClass: 'far fa-circle-stop',
          id: generateUUID(),
          title: 'Stop',
        },
        {
          accentColor: '#f6af08', //yellow
          iconClass: 'far fa-circle-dot',
          id: generateUUID(),
          title: 'Continue',
        },
      ];
    case 'good-improve-ideas-thanks':
      return [
        {
          accentColor: '#008000', //green
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Good',
        },
        {
          accentColor: '#cc293d', //red
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'Improve',
        },
        {
          accentColor: '#f6af08', //yellow
          iconClass: 'far fa-question',
>>>>>>> 3120d33d043a3d3e9d1ee06b3228ba7a957beaf3
          id: generateUUID(),
          title: 'Ideas',
        },
        {
          accentColor: '#0078d4', //blue
          iconClass: 'far fa-exclamation',
          id: generateUUID(),
          title: 'Thanks',
        }
      ];
>>>>>>> 3120d33d043a3d3e9d1ee06b3228ba7a957beaf3
    case 'mad-sad-glad':
      return [
        {
          accentColor: '#cc293d', //red
          iconClass: 'far fa-angry',
          id: generateUUID(),
          title: 'Mad',
        },
        {
          accentColor: '#f6af08', //yellow
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'Sad',
        },
        {
          accentColor: '#008000', //green
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'Glad',
        },
      ];
    case '4ls': // The 4 Ls - Like, Learned, Lacked, Longed For
      return [
        {
          accentColor: '#008000', //green
          iconClass: 'far fa-thumbs-up',
          id: generateUUID(),
          title: 'Liked'
        },
        {
          accentColor: '#0078d4', //blue
          iconClass: 'far fa-lightbulb',
          id: generateUUID(),
          title: 'Learned',
        },
        {
          accentColor: '#cc293d', //red
          iconClass: 'far fa-thumbs-down',
          id: generateUUID(),
          title: 'Lacked',
        },
        {
          accentColor: '#f6af08', //yellow 
          iconClass: 'far fa-star',
          id: generateUUID(),
          title: 'Longed for',
        },
      ];
    case 'daki': // Drop, Add, Keep, Improve
      return [
        {
          accentColor: '#cc293d', //red
          iconClass: 'fas fa-trash',
          id: generateUUID(),
          title: 'Drop',
        },
        {
          accentColor: '#008000', //green
          iconClass: 'fas fa-cart-plus',
          id: generateUUID(),
          title: 'Add',
        },
        {
          accentColor: '#0078d4', //blue
          iconClass: 'fas fa-lock',
          id: generateUUID(),
          title: 'Keep',
        },
        {
          accentColor: '#f6af08', //yellow 
          iconClass: 'fas fa-wrench',
          id: generateUUID(),
          title: 'Improve',
        },
      ];
    case 'kalm': // Keep, Add, Less, More
      return [
        {
          accentColor: '#0078d4', //blue
          iconClass: 'far fa-square-check',
          id: generateUUID(),
          title: 'Keep',
        },
        {
          accentColor: '#008000', //green
          iconClass: 'far fa-square-plus',
          id: generateUUID(),
          title: 'Add',
        },
        {
          accentColor: '#f6af08', //yellow
          iconClass: 'far fa-circle-down',
          id: generateUUID(),
          title: 'Less',
        },
        {
          accentColor: '#8063bf', //purple
          iconClass: 'far fa-circle-up',
          id: generateUUID(),
          title: 'More',
        },
      ];
    case 'wlai': // Went Well, Learned, Accelerators, Impediments
      return [
        {
          accentColor: '#008000', //green
          iconClass: 'fas fa-star',
          id: generateUUID(),
          title: 'Went Well',
        },
        {
          accentColor: '#8063bf', //purple
          iconClass: 'fas fa-book',
          id: generateUUID(),
          title: 'Learned',
        },
        {
          accentColor: '#0078d4', //blue
          iconClass: 'fas fa-rocket',
          id: generateUUID(),
          title: 'Accelerators',
        },
        {
          accentColor: '#cc293d', //red
          iconClass: 'fas fa-exclamation-triangle',
          id: generateUUID(),
          title: 'Impediments',
        },
      ];
    case 'speedboat': // Speedboat retrospective - Propellors, Life Preserver, Anchors, Rocks
      return [
        {
          accentColor: '#008000', //green
          iconClass: 'fas fa-fan',
          id: generateUUID(),
          title: 'Propellors'
        },
        {
          accentColor: '#0078d4', //blue
          iconClass: 'fas fa-life-ring',
          id: generateUUID(),
          title: 'Life preservers',
        },
        {
          accentColor: '#cc293d', //red
          iconClass: 'fas fa-anchor',
          id: generateUUID(),
          title: 'Anchors',
        },
        {
          accentColor: '#f6af08', //yellow
          iconClass: 'fas fa-skull-crossbones',
          id: generateUUID(),
          title: 'Rocks',
        },
      ];
    // Team Assessment Templates
    case 'clarity':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What provides clarity?',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders clarity?',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint.',
        },
      ];
    case 'energy':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What provides energy?',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What drains energy?',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint.',
        },
      ];
    case 'psy-safety':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What makes it safe?',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders safety?',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint.',
        },
      ];
    case 'wlb':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What helps work-life balance?',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders work-life balance?',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint.',
        },
      ];
    case 'confidence':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What increases confidence in team?',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What decreases confidence in team?',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint.',
        },
      ];
    case 'efficiency':
      return [
        {
          accentColor: '#008000',
          iconClass: 'far fa-smile',
          id: generateUUID(),
          title: 'What helps efficiency?',
        },
        {
          accentColor: '#cc293d',
          iconClass: 'far fa-frown',
          id: generateUUID(),
          title: 'What hinders efficiency?',
        },
        {
          accentColor: '#0078d4',
          iconClass: 'fas fa-exclamation',
          id: generateUUID(),
          title: 'One action in next sprint.',
        },
      ];
    default: {
      return [{
        accentColor: '#008000',
        iconClass: 'far fa-smile',
        id: generateUUID(),
        title: 'What went well?',
      }, {
        accentColor: '#cc293d',
        iconClass: 'far fa-frown',
        id: generateUUID(),
        title: "What didn't go well?",
      }]
    }
  }
};
