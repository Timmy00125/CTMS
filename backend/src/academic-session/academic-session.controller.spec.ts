import { Test, TestingModule } from '@nestjs/testing';
import { AcademicSessionController } from './academic-session.controller';
import { AcademicSessionService } from './academic-session.service';

const mockAcademicSessionService = {
  findAll: jest.fn(),
};

describe('AcademicSessionController', () => {
  let controller: AcademicSessionController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [AcademicSessionController],
      providers: [
        { provide: AcademicSessionService, useValue: mockAcademicSessionService },
      ],
    }).compile();

    controller = module.get<AcademicSessionController>(AcademicSessionController);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('GET /academic-sessions', () => {
    it('should return an array of academic sessions', async () => {
      const mockSessions = [
        {
          id: '1',
          name: '2023/2024',
          startDate: new Date('2023-09-01'),
          endDate: new Date('2024-06-30'),
          isActive: false,
          semesters: [
            { id: 's1', name: 'First Semester', academicSessionId: '1', isActive: false },
            { id: 's2', name: 'Second Semester', academicSessionId: '1', isActive: false },
          ],
        },
      ];
      mockAcademicSessionService.findAll.mockResolvedValue(mockSessions);

      const result = await controller.findAll();

      expect(result).toEqual(mockSessions);
      expect(mockAcademicSessionService.findAll).toHaveBeenCalled();
    });
  });
});
