import { Test, TestingModule } from '@nestjs/testing';
import { AcademicSessionService } from './academic-session.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  academicSession: {
    findMany: jest.fn(),
  },
};

describe('AcademicSessionService', () => {
  let service: AcademicSessionService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicSessionService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AcademicSessionService>(AcademicSessionService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('findAll', () => {
    it('should return an array of academic sessions with semesters', async () => {
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
      mockPrismaService.academicSession.findMany.mockResolvedValue(mockSessions);

      const result = await service.findAll();

      expect(result).toEqual(mockSessions);
      expect(mockPrismaService.academicSession.findMany).toHaveBeenCalledWith({
        orderBy: { startDate: 'desc' },
        include: { semesters: true },
      });
    });
  });
});
