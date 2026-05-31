import { Module } from '@nestjs/common';
import { PrismaModule } from '../../prisma/prisma.module';
import { AiModule } from '../ai/ai.module';
import { RagController } from './rag.controller';
import { RagService } from './rag.service';
import { IngestDocumentUseCase } from './use-cases/ingest-document.use-case';
import { QueryKnowledgeUseCase } from './use-cases/query-knowledge.use-case';
import { ReviewAnswerUseCase } from './use-cases/review-answer.use-case';
import { RagAnswerPolicy } from './policies/rag-answer.policy';
import { RagRepository } from './repositories/rag.repository';
import { RecursiveTextChunker } from './adapters/recursive-text-chunker';
import { VoyageEmbeddingAdapter } from './adapters/voyage-embedding.adapter';
import { RagGenerationAdapter } from './adapters/rag-generation.adapter';
import {
  EMBEDDING_PROVIDER,
  RAG_GENERATION,
  RAG_REPOSITORY,
  TEXT_CHUNKER,
} from './rag.constants';

// Pattern: Composition Root — binds RAG ports to their concrete adapters.
// AiModule is imported to reuse AI_PROVIDER_PORT (the LLM Provider Router).
@Module({
  imports: [PrismaModule, AiModule],
  controllers: [RagController],
  providers: [
    RagService,
    IngestDocumentUseCase,
    QueryKnowledgeUseCase,
    ReviewAnswerUseCase,
    RagAnswerPolicy,
    { provide: RAG_REPOSITORY, useClass: RagRepository },
    { provide: EMBEDDING_PROVIDER, useClass: VoyageEmbeddingAdapter },
    { provide: RAG_GENERATION, useClass: RagGenerationAdapter },
    // Chunker has primitive constructor args with defaults — instantiate
    // explicitly so Nest doesn't try to resolve Number dependencies.
    { provide: TEXT_CHUNKER, useFactory: () => new RecursiveTextChunker() },
  ],
})
export class RagModule {}
