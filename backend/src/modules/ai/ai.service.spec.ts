import { Test, TestingModule } from '@nestjs/testing';
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiService } from './ai.service';
import { PrismaService } from '../../prisma/prisma.service';
import { NotificationService } from '../notification/notification.service';
import { UserRole } from '@prisma/client';
import { FileParserService } from './services/file-parser.service';
import { DocxGeneratorService } from './services/docx-generator.service';

// Mock Anthropic SDK
const mockCreate = jest.fn();
jest.mock('@anthropic-ai/sdk', () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      messages: { create: mockCreate },
    })),
  };
});

const mockPrisma = {
  aiConversation: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  aiMessage: {
    create: jest.fn(),
  },
  aiUsageAudit: {
    create: jest.fn(),
    count: jest.fn(),
  },
  project: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  user: {
    count: jest.fn(),
    findUnique: jest.fn(),
    update: jest.fn(),
  },
  task: {
    count: jest.fn(),
  },
  $transaction: jest.fn(),
};

const mockConfigService = {
  getOrThrow: jest.fn().mockReturnValue('test-api-key'),
};

const mockNotificationService = {
  create: jest.fn(),
};

const mockFileParserService = {
  parse: jest.fn(),
};

const mockDocxGeneratorService = {
  generateArchitectureReport: jest.fn(),
};

describe('AiService', () => {
  let service: AiService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AiService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: ConfigService, useValue: mockConfigService },
        { provide: NotificationService, useValue: mockNotificationService },
        { provide: FileParserService, useValue: mockFileParserService },
        { provide: DocxGeneratorService, useValue: mockDocxGeneratorService },
      ],
    }).compile();

    service = module.get<AiService>(AiService);
    jest.clearAllMocks();

    mockPrisma.user.count.mockResolvedValue(0);
    mockPrisma.aiUsageAudit.count.mockResolvedValue(0);
    mockPrisma.user.findUnique.mockResolvedValue({
      id: 'user-1',
      aiQuotaUsedTokens: 0,
      aiQuotaLimitTokens: 100000,
    });
    mockPrisma.user.update.mockResolvedValue({});
    mockPrisma.project.count.mockResolvedValue(0);
    mockPrisma.task.count.mockResolvedValue(0);
    mockPrisma.$transaction.mockImplementation(async (queries: Promise<unknown>[]) =>
      Promise.all(queries),
    );
  });

  describe('chat', () => {
    const anthropicResponse = {
      content: [{ type: 'text', text: 'Hello from AI!' }],
      usage: { input_tokens: 10, output_tokens: 20 },
    };

    it('should create new conversation when no conversationId', async () => {
      mockPrisma.aiConversation.create.mockResolvedValue({
        id: 'conv-1',
        messages: [],
      });
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.aiMessage.create.mockResolvedValue({});
      mockCreate.mockResolvedValue(anthropicResponse);

      const result = await service.chat('user-1', 'Hello');

      expect(result.conversationId).toBe('conv-1');
      expect(result.message).toBe('Hello from AI!');
      expect(mockPrisma.aiConversation.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({ userId: 'user-1' }),
        }),
      );
    });

    it('should use existing conversation when conversationId provided', async () => {
      mockPrisma.aiConversation.findFirst.mockResolvedValue({
        id: 'conv-1',
        userId: 'user-1',
        messages: [{ role: 'user', content: 'Previous' }],
      });
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.aiMessage.create.mockResolvedValue({});
      mockCreate.mockResolvedValue(anthropicResponse);

      const result = await service.chat('user-1', 'Follow up', 'conv-1');

      expect(result.conversationId).toBe('conv-1');
      expect(mockPrisma.aiConversation.findFirst).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'conv-1', userId: 'user-1' } }),
      );
    });

    it('should block access to conversation not owned by current user', async () => {
      mockPrisma.aiConversation.findFirst.mockResolvedValue(null);

      await expect(service.chat('user-1', 'Follow up', 'conv-other')).rejects.toThrow(
        ForbiddenException,
      );

      expect(mockPrisma.aiConversation.create).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });

    it('should save both user and assistant messages', async () => {
      mockPrisma.aiConversation.create.mockResolvedValue({
        id: 'conv-1',
        messages: [],
      });
      mockPrisma.project.findMany.mockResolvedValue([]);
      mockPrisma.aiMessage.create.mockResolvedValue({});
      mockCreate.mockResolvedValue(anthropicResponse);

      await service.chat('user-1', 'Hello');

      // 2 calls: user message + assistant message
      expect(mockPrisma.aiMessage.create).toHaveBeenCalledTimes(2);
    });
  });

  describe('generateProposal', () => {
    it('should return proposal text in Vietnamese by default', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Đề xuất dự án...' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await service.generateProposal(
        'user-1',
        UserRole.OWNER,
        'Build a website',
      );
      expect(result).toBe('Đề xuất dự án...');
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('Build a website'),
            }),
          ]),
        }),
      );
    });

    it('should include budget in prompt when provided', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Proposal text' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      await service.generateProposal(
        'user-1',
        UserRole.OWNER,
        'Requirements',
        'EN' as any,
        '$5000',
      );
      expect(mockCreate).toHaveBeenCalledWith(
        expect.objectContaining({
          messages: expect.arrayContaining([
            expect.objectContaining({
              content: expect.stringContaining('$5000'),
            }),
          ]),
        }),
      );
    });
  });

  describe('breakdownTasks', () => {
    it('should return parsed JSON when response contains JSON block', async () => {
      const jsonData = { milestones: [{ name: 'Phase 1', tasks: [] }] };
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '```json\n' + JSON.stringify(jsonData) + '\n```',
          },
        ],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await service.breakdownTasks(
        'user-1',
        UserRole.OWNER,
        'Build app',
        ['React', 'Node.js'],
      );
      expect(result).toEqual(jsonData);
    });

    it('should return raw content when JSON parsing fails', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'No JSON here' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await service.breakdownTasks(
        'user-1',
        UserRole.OWNER,
        'Build app',
        ['React'],
      );
      expect(result).toEqual({ raw: 'No JSON here' });
    });
  });

  describe('reviewCode', () => {
    it('should return review text', async () => {
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Code review: looks good!' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await service.reviewCode(
        'user-1',
        UserRole.OWNER,
        'const x = 1;',
        'typescript',
        'General',
      );
      expect(result).toBe('Code review: looks good!');
    });
  });

  describe('estimateProject', () => {
    it('should return parsed estimate JSON', async () => {
      const estimate = {
        phases: [{ name: 'Setup', hours: 10, cost: '10000000 VND' }],
      };
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: '```json\n' + JSON.stringify(estimate) + '\n```',
          },
        ],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await service.estimateProject(
        'user-1',
        UserRole.OWNER,
        'Build website',
      );
      expect(result).toEqual(estimate);
    });
  });

  describe('generateProgressReport', () => {
    it('should generate report from project data', async () => {
      mockPrisma.project.findUnique.mockResolvedValue({
        id: 'p1',
        name: 'Project',
        tasks: [
          { status: 'DONE' },
          { status: 'IN_PROGRESS' },
          { status: 'BLOCKED' },
        ],
        milestones: [{ title: 'M1' }],
      });
      mockCreate.mockResolvedValue({
        content: [{ type: 'text', text: 'Báo cáo tiến độ...' }],
        usage: { input_tokens: 10, output_tokens: 20 },
      });

      const result = await service.generateProgressReport(
        'user-1',
        UserRole.OWNER,
        'p1',
      );
      expect(result).toBe('Báo cáo tiến độ...');
    });

    it('should throw NotFoundException for missing project', async () => {
      mockPrisma.project.findUnique.mockResolvedValue(null);

      await expect(
        service.generateProgressReport('user-1', UserRole.OWNER, 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('generateArchitectureDiagram', () => {
    const validArchitecturePayload = {
      description:
        'System architecture is organized into five layers to ensure scalability, maintainability, and secure operations for contract and delivery workflows. The client layer provides role-based dashboards for internal teams and clients, with clear visibility into milestones and financial indicators.\n\n' +
        'The API and business layers orchestrate project lifecycle, invoicing, task execution, and notification workflows through modular services. This separation reduces coupling and allows independent evolution of core business capabilities.\n\n' +
        'Data and integration layers centralize persistence, auditing, and external connectors such as payment providers, email services, and AI services. End-to-end observability and access control policies are applied to keep data quality and compliance at production level.',
      layers: [
        'Client Layer',
        'API Layer',
        'Business Logic Layer',
        'Data Layer',
        'External Integrations',
      ],
      svg:
        '<svg viewBox="0 0 900 600" xmlns="http://www.w3.org/2000/svg"><defs><marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth"><path d="M0,0 L0,6 L9,3 z" fill="#334155"/></marker></defs><rect x="50" y="50" width="800" height="90" fill="#dbeafe"/><rect x="50" y="160" width="800" height="90" fill="#dcfce7"/><rect x="50" y="270" width="800" height="90" fill="#fff7ed"/><rect x="50" y="380" width="800" height="90" fill="#f5f3ff"/><rect x="50" y="490" width="800" height="70" fill="#ecfeff"/><text x="450" y="85">CLIENT LAYER</text><text x="450" y="110">Dashboard and client portal</text><text x="450" y="195">API LAYER</text><text x="450" y="220">Contract, task and invoice APIs</text><text x="450" y="305">BUSINESS LOGIC LAYER</text><text x="450" y="330">Workflow and rule processing</text><text x="450" y="415">DATA LAYER</text><text x="450" y="440">PostgreSQL and audit logs</text><text x="450" y="525">EXTERNAL INTEGRATIONS</text><line x1="450" y1="140" x2="450" y2="160" stroke="#334155" marker-end="url(#arrow)"/><line x1="450" y1="250" x2="450" y2="270" stroke="#334155" marker-end="url(#arrow)"/><line x1="450" y1="360" x2="450" y2="380" stroke="#334155" marker-end="url(#arrow)"/><line x1="450" y1="470" x2="450" y2="490" stroke="#334155" marker-end="url(#arrow)"/></svg>',
    };

    it('should generate architecture payload and docx for valid input', async () => {
      mockFileParserService.parse.mockResolvedValue({ textContext: '' });
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validArchitecturePayload),
          },
        ],
        usage: { input_tokens: 100, output_tokens: 200 },
      });
      mockDocxGeneratorService.generateArchitectureReport.mockResolvedValue(
        Buffer.from('docx-content'),
      );

      const result = await service.generateArchitectureDiagram(
        'user-1',
        UserRole.OWNER,
        'Design a SaaS platform',
      );

      expect(result.description).toContain('System architecture is organized into five layers');
      expect(result.docxBase64).toBe(Buffer.from('docx-content').toString('base64'));
      expect(result.usage.totalTokens).toBe(300);
      expect(mockPrisma.user.update).toHaveBeenCalled();
    });

    it('should throw when quota is exceeded', async () => {
      mockPrisma.user.findUnique.mockResolvedValue({
        id: 'user-1',
        aiQuotaUsedTokens: 99990,
        aiQuotaLimitTokens: 100000,
      });
      mockFileParserService.parse.mockResolvedValue({ textContext: '' });
      mockCreate.mockResolvedValue({
        content: [
          {
            type: 'text',
            text: JSON.stringify(validArchitecturePayload),
          },
        ],
        usage: { input_tokens: 20, output_tokens: 20 },
      });

      await expect(
        service.generateArchitectureDiagram(
          'user-1',
          UserRole.OWNER,
          'Design a SaaS platform',
        ),
      ).rejects.toThrow();
    });

    it('should throw when trial request limit is reached', async () => {
      mockPrisma.aiUsageAudit.count.mockResolvedValue(4);

      await expect(
        service.generateArchitectureDiagram(
          'user-1',
          UserRole.OWNER,
          'Design a SaaS platform',
        ),
      ).rejects.toThrow('Trial limit reached: maximum 4 requests');

      expect(mockFileParserService.parse).not.toHaveBeenCalled();
      expect(mockCreate).not.toHaveBeenCalled();
    });
  });
});
