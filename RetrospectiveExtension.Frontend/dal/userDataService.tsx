import { getValue, setValue } from './dataService';
import { IUserVisit } from '../interfaces/feedback';

const enum UserDataKey {
  Visits = 'visits'
}

class UserDataService {
  public addVisit = async (teamId: string, boardId?: string): Promise<IUserVisit[]> => {
    const visit: IUserVisit = { boardId, teamId };

    const existingVisits: IUserVisit[] = await getValue<IUserVisit[]>(UserDataKey.Visits, true);
    let newVisits: IUserVisit[] = [];

    if (existingVisits) {
      newVisits = existingVisits.filter((existingVisit) => {
        return !(existingVisit.teamId === visit.teamId &&
          existingVisit.boardId === visit.boardId);
      })
    }

    newVisits.push(visit);

    // We will keep only the 10 most recently visited team-board combinations.
    newVisits.splice(0, newVisits.length - 10);

    const updatedVisits: IUserVisit[] = await setValue<IUserVisit[]>(
      UserDataKey.Visits,
      newVisits,
      true);
    return updatedVisits;
  }

  public getVisits = async (): Promise<IUserVisit[]> => {
    const retrievedVisits: IUserVisit[] = await getValue<IUserVisit[]>(UserDataKey.Visits, true);
    return retrievedVisits;
  }

  public getMostRecentVisit = async (): Promise<IUserVisit> => {
    const retrievedVisits: IUserVisit[] = await getValue<IUserVisit[]>(UserDataKey.Visits, true);
    if (retrievedVisits) {
      return retrievedVisits[retrievedVisits.length - 1];
    } else {
      return undefined;
    }
  }

  public clearVisits = async (): Promise<IUserVisit[]> => {
    const updatedVisits: IUserVisit[] = await setValue<IUserVisit[]>(
      UserDataKey.Visits,
      [],
      true);

    return updatedVisits;
  }
}

export const userDataService = new UserDataService();
