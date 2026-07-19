import uuid
import logging
from typing import Any
from datetime import datetime, timezone

from qdrant_client import AsyncQdrantClient
from qdrant_client.models import (
    Distance,
    VectorParams,
    PointStruct,
    Filter,
    FieldCondition,
    MatchValue,
    FilterSelector,
    PayloadSchemaType
)
from sentence_transformers import CrossEncoder
from langchain_openai import OpenAIEmbeddings
from app.core.config import settings

logger = logging.getLogger(__name__)

class VectorService:
    def __init__(self):
        """
        Initializes the async Qdrant client, OpenAI embeddings (1536 dimensions), 
        and the local Cross-Encoder reranker.
        """
        self.client = AsyncQdrantClient(url=settings.QDRANT_URL, api_key=settings.QDRANT_API_KEY)
        self.collection_name = settings.QDRANT_COLLECTION_NAME or "knowledge_workspaces"
        
        # Dense Embedder: OpenAI text-embedding-3-small (outputs 1536 dimensions)
        self.embedder = OpenAIEmbeddings(
            model="text-embedding-3-small", 
            api_key=settings.OPENAI_API_KEY
        )
        
        # Cross-Encoder: Local high-precision reranker for top candidates
        self.reranker = CrossEncoder("cross-encoder/ms-marco-MiniLM-L-6-v2")

    async def ensure_collection_exists(self):
        """Verifies if the workspace Qdrant collection exists; creates it if missing."""
        collections = await self.client.get_collections()
        exists = any(c.name == self.collection_name for c in collections.collections)
        
        if not exists:
            logger.info(f"Creating Qdrant collection: {self.collection_name}")
            await self.client.create_collection(
                collection_name=self.collection_name,
                vectors_config=VectorParams(
                    size=1536,  # Matched to OpenAI text-embedding-3-small output dimension
                    distance=Distance.COSINE
                )
            )
        collection_info = await self.client.get_collection(collection_name=self.collection_name)
        active_indexes = collection_info.payload_schema.keys()
        
        # Automatically backfill workspace isolation index if missing
        if "workspace_id" not in active_indexes:
            logger.info("⚡ Automatically building permanent INTEGER index for 'workspace_id'...")
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="workspace_id",
                field_schema=PayloadSchemaType.INTEGER
            )
            
        # Automatically backfill document reference index if missing
        if "document_id" not in active_indexes:
            logger.info("⚡ Automatically building permanent INTEGER index for 'document_id'...")
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="document_id",
                field_schema=PayloadSchemaType.INTEGER
            )
            
        # Automatically backfill chat episodic memory index if missing
        if "memory_type" not in active_indexes:
            logger.info("⚡ Automatically building permanent KEYWORD index for 'memory_type'...")
            await self.client.create_payload_index(
                collection_name=self.collection_name,
                field_name="memory_type",
                field_schema=PayloadSchemaType.KEYWORD
            )
        

    async def store_chunks(
        self, 
        chunks: list[str], 
        metadata_list: list[dict[str, Any]], 
        workspace_id: int, 
        document_id: int
    ) -> int:
        """
        Embeds text chunks via OpenAI, attaches mandatory workspace/document isolation payloads, 
        and upserts them into Qdrant.
        """
        if not chunks:
            return 0

        await self.ensure_collection_exists()

        # Generate dense embeddings asynchronously in batches
        embeddings = await self.embedder.aembed_documents(chunks)
        
        points = []
        for i, (text, meta, emb) in enumerate(zip(chunks, metadata_list, embeddings)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"{workspace_id}_{document_id}_{i}"))
            
            # Strict tenant isolation payload structure
            payload = {
                "text": text,
                "workspace_id": workspace_id,
                "document_id": document_id,
                "chunk_index": i,
                **meta
            }
            
            points.append(
                PointStruct(
                    id=point_id,
                    vector=emb,  # OpenAI returns pure float lists; .tolist() is not needed
                    payload=payload
                )
            )

        await self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info(f"Successfully upserted {len(points)} chunks for document {document_id} in workspace {workspace_id}.")
        return len(points)

    async def search_and_rerank(
        self, 
        query: str, 
        workspace_id: int, 
        top_k: int = 5, 
        fetch_k: int = 30
    ) -> list[dict[str, Any]]:
        """
        Executes a two-stage hybrid retrieval pipeline:
        1. Fast semantic search in Qdrant filtered strictly by workspace_id (fetching top 30).
        2. High-precision cross-encoder reranking to select the top K most accurate chunks.
        """
        await self.ensure_collection_exists()

        # 1. Embed user query asynchronously using OpenAI
        query_vector = await self.embedder.aembed_query(query)

        # 2. Stage 1: Fast Dense Retrieval with strict Tenant Isolation Filter
        tenant_filter = Filter(
            must=[
                FieldCondition(
                    key="workspace_id",
                    match=MatchValue(value=workspace_id)
                )
            ]
        )

        # --> CRITICAL FIX: Changed .search() to .query_points() and query_vector to query <--
        response = await self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=tenant_filter,
            limit=fetch_k
        )
        
        initial_results = response.points

        if not initial_results:
            return []

        # 3. Stage 2: Cross-Encoder Reranking
        candidate_pairs = [[query, res.payload["text"]] for res in initial_results]
        rerank_scores = self.reranker.predict(candidate_pairs)

        # Combine Qdrant payload data with new Cross-Encoder scores
        reranked_candidates = []
        for res, score in zip(initial_results, rerank_scores):
            item = res.payload.copy()
            item["vector_score"] = float(res.score)
            item["rerank_score"] = float(score)
            reranked_candidates.append(item)

        # Sort descending by rerank score and return top_k
        reranked_candidates.sort(key=lambda x: x["rerank_score"], reverse=True)
        return reranked_candidates[:top_k]

    async def delete_document_vectors(self, document_id: int, workspace_id: int):
        """Wipes all vector chunks associated with a specific document inside a workspace."""
        await self.ensure_collection_exists()
        
        doc_filter = Filter(
            must=[
                FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id)),
                FieldCondition(key="document_id", match=MatchValue(value=document_id))
            ]
        )
        
        await self.client.delete(
            collection_name=self.collection_name,
            points_selector=FilterSelector(filter=doc_filter)
        )
        logger.info(f"Deleted vector chunks for document {document_id} in workspace {workspace_id}.")

    async def delete_workspace_vectors(self, workspace_id: int):
        """Wipes an entire workspace's vector data upon workspace deletion cascade."""
        await self.ensure_collection_exists()
        
        workspace_filter = Filter(
            must=[
                FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id))
            ]
        )
        
        await self.client.delete(
            collection_name=self.collection_name,
            points_selector=FilterSelector(filter=workspace_filter)
        )
        logger.info(f"Scrubbed all vector data for workspace {workspace_id}.")
        
    async def store_memories(self, facts: list[str], workspace_id: int, session_id: int):
        """Embeds atomic conversation facts and stores them in Qdrant as cross-session memory."""
        if not facts:
            return

        await self.ensure_collection_exists()
        
        # Async OpenAI embedding generation
        embeddings = await self.embedder.aembed_documents(facts)
        
        points = []
        for i, (fact, emb) in enumerate(zip(facts, embeddings)):
            point_id = str(uuid.uuid5(uuid.NAMESPACE_DNS, f"mem_{workspace_id}_{session_id}_{i}_{fact[:25]}"))
            payload = {
                "text": fact,
                "workspace_id": workspace_id,
                "session_id": session_id,
                "memory_type": "EPISODIC_FACT",
                "timestamp": str(datetime.now(timezone.utc))
            }
            points.append(PointStruct(id=point_id, vector=emb, payload=payload))

        await self.client.upsert(collection_name=self.collection_name, points=points)
        logger.info(f"💾 [MEMORY] Stored {len(points)} episodic facts for workspace {workspace_id}.")

    async def search_memories(self, query: str, workspace_id: int, top_k: int = 2) -> list[str]:
        """Retrieves relevant past memories from previous chat sessions."""
        await self.ensure_collection_exists()
        
        # Async OpenAI query embedding
        query_vector = await self.embedder.aembed_query(query)

        memory_filter = Filter(
            must=[
                FieldCondition(key="workspace_id", match=MatchValue(value=workspace_id)),
                FieldCondition(key="memory_type", match=MatchValue(value="EPISODIC_FACT"))
            ]
        )

        # --> CRITICAL FIX: Changed .search() to .query_points() and query_vector to query <--
        response = await self.client.query_points(
            collection_name=self.collection_name,
            query=query_vector,
            query_filter=memory_filter,
            limit=top_k
        )
        
        results = response.points
        
        # Return only high-confidence memories (cosine similarity > 0.65)
        return [res.payload["text"] for res in results if res.score > 0.65]

# Global singleton instance for injection across workers and agents
vector_service = VectorService()