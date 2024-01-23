import { IFeedbackBoardDocument, IFeedbackColumn } from "../../../interfaces/feedback";

export const testTeamId: string = 'mocked-team-uuid';
export const testTitle: string = 'Test Title';

export const testColumns: IFeedbackColumn[] = [
    {
        id: 'mock-column-uuid-1',
        title: 'Test Column 1',
        iconClass: '',
        accentColor: ''
    },
    {
        id: 'mock-column-uuid-2',
        title: 'Test Column 2',
        iconClass: '',
        accentColor: ''
    }
]

export const testExistingBoard: IFeedbackBoardDocument = {
    id: 'mock-board-uuid',
    teamId: testTeamId,
    title: 'Mock Title 1',
    createdBy: null,
    createdDate: new Date(),
    columns: testColumns,
    activePhase: 'Collect',
    maxVotesPerUser: 10,
    boardVoteCollection: {},
    teamEffectivenessMeasurementVoteCollection: [],
    isIncludeTeamEffectivenessMeasurement: true,
    shouldShowFeedbackAfterCollect: false,
    displayPrimeDirective: true,
    isAnonymous: false,
    isPublic: false,
    permissions: null
}
