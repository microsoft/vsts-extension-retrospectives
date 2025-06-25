import { getBoardUrl } from '../boardUrlHelper';
import { getHostBaseUrl, getProjectName } from '../servicesHelper';

jest.mock('../servicesHelper', () => ({
  getHostBaseUrl: jest.fn(),
  getProjectName: jest.fn(),
}));

const mockGetHostBaseUrl = getHostBaseUrl as jest.MockedFunction<typeof getHostBaseUrl>;
const mockGetProjectName = getProjectName as jest.MockedFunction<typeof getProjectName>;

describe('getBoardUrl', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('successful URL generation', () => {
    it('should generate a correct board URL with basic parameters', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
      expect(mockGetHostBaseUrl).toHaveBeenCalledTimes(1);
      expect(mockGetProjectName).toHaveBeenCalledTimes(1);
    });

    it('should generate URL with special characters in teamId and boardId', async () => {
      // Arrange
      const teamId = 'team with spaces & symbols!';
      const boardId = 'board@#$%^&*()';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });

    it('should generate URL with empty teamId and boardId', async () => {
      // Arrange
      const teamId = '';
      const boardId = '';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });

    it('should generate URL with different host base formats', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const hostBase = 'https://mycompany.visualstudio.com/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });

    it('should generate URL with project name containing special characters', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'My Project With Spaces & Symbols!';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });

    it('should generate URL when host base does not end with slash', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const hostBase = 'https://dev.azure.com/myorg';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });
  });

  describe('error handling', () => {
    it('should throw error when getHostBaseUrl fails', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const error = new Error('Failed to get host base URL');

      mockGetHostBaseUrl.mockRejectedValue(error);
      mockGetProjectName.mockResolvedValue('MyProject');

      // Act & Assert
      await expect(getBoardUrl(teamId, boardId)).rejects.toThrow('Failed to get host base URL');
      expect(mockGetHostBaseUrl).toHaveBeenCalledTimes(1);
    });

    it('should throw error when getProjectName fails', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const error = new Error('Failed to get project name');

      mockGetHostBaseUrl.mockResolvedValue('https://dev.azure.com/myorg/');
      mockGetProjectName.mockRejectedValue(error);

      // Act & Assert
      await expect(getBoardUrl(teamId, boardId)).rejects.toThrow('Failed to get project name');
      expect(mockGetHostBaseUrl).toHaveBeenCalledTimes(1);
      expect(mockGetProjectName).toHaveBeenCalledTimes(1);
    });

    it('should throw error when both dependencies fail', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const hostError = new Error('Failed to get host base URL');

      mockGetHostBaseUrl.mockRejectedValue(hostError);
      mockGetProjectName.mockRejectedValue(new Error('Failed to get project name'));

      // Act & Assert
      await expect(getBoardUrl(teamId, boardId)).rejects.toThrow('Failed to get host base URL');
      expect(mockGetHostBaseUrl).toHaveBeenCalledTimes(1);
    });
  });

  describe('edge cases', () => {
    it('should handle null/undefined responses from dependencies', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';

      mockGetHostBaseUrl.mockResolvedValue(null as unknown as string);
      mockGetProjectName.mockResolvedValue(undefined as unknown as string);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `nullundefined/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });

    it('should handle very long teamId and boardId', async () => {
      // Arrange
      const teamId = 'a'.repeat(1000);
      const boardId = 'b'.repeat(1000);
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
      expect(result.length).toBeGreaterThan(2000);
    });

    it('should handle Unicode characters in parameters', async () => {
      // Arrange
      const teamId = '团队🚀';
      const boardId = 'ボード🎯';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'プロジェクト';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });

    it('should handle whitespace-only parameters', async () => {
      // Arrange
      const teamId = '   ';
      const boardId = '\t\n';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      const expectedUrl = `${hostBase}${projectName}/_apps/hub/ms-devlabs.team-retrospectives.home#teamId=${teamId}&boardId=${boardId}`;
      expect(result).toBe(encodeURI(expectedUrl));
    });
  });

  describe('URL encoding verification', () => {
    it('should properly encode URLs with characters that need encoding', async () => {
      // Arrange
      const teamId = 'team with spaces';
      const boardId = 'board with spaces';
      const hostBase = 'https://dev.azure.com/my org/';
      const projectName = 'My Project';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      expect(result).toContain('team%20with%20spaces');
      expect(result).toContain('board%20with%20spaces');
      expect(result).toContain('my%20org');
      expect(result).toContain('My%20Project');
    });

    it('should ensure URL is valid after encoding', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      expect(() => new URL(result)).not.toThrow();
      expect(result).toMatch(/^https?:\/\/.+/);
    });

    it('should not encode fragment portion of URL (behavior of encodeURI)', async () => {
      // Arrange
      const teamId = 'team#with@special$chars';
      const boardId = 'board#with@special$chars';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const result = await getBoardUrl(teamId, boardId);

      // Assert
      expect(result).toContain('teamId=team#with@special$chars');
      expect(result).toContain('boardId=board#with@special$chars');
    });
  });

  describe('async behavior', () => {
    it('should handle concurrent calls correctly', async () => {
      // Arrange
      const teamId1 = 'team1';
      const boardId1 = 'board1';
      const teamId2 = 'team2';
      const boardId2 = 'board2';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockResolvedValue(hostBase);
      mockGetProjectName.mockResolvedValue(projectName);

      // Act
      const [result1, result2] = await Promise.all([
        getBoardUrl(teamId1, boardId1),
        getBoardUrl(teamId2, boardId2)
      ]);

      // Assert
      expect(result1).toContain('teamId=team1&boardId=board1');
      expect(result2).toContain('teamId=team2&boardId=board2');
      expect(mockGetHostBaseUrl).toHaveBeenCalledTimes(2);
      expect(mockGetProjectName).toHaveBeenCalledTimes(2);
    });

    it('should handle slow dependency responses', async () => {
      // Arrange
      const teamId = 'team123';
      const boardId = 'board456';
      const hostBase = 'https://dev.azure.com/myorg/';
      const projectName = 'MyProject';

      mockGetHostBaseUrl.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(hostBase), 100))
      );
      mockGetProjectName.mockImplementation(() =>
        new Promise(resolve => setTimeout(() => resolve(projectName), 50))
      );

      // Act
      const startTime = Date.now();
      const result = await getBoardUrl(teamId, boardId);
      const endTime = Date.now();

      // Assert
      expect(result).toContain('teamId=team123&boardId=board456');
      expect(endTime - startTime).toBeGreaterThanOrEqual(100);
    });
  });
});
