"""
RAG retriever — embedding-based parameter candidate selection.

On init:  embeds every parameter in the registry using sentence-transformers.
On query: chunks the certificate text, embeds it, and returns the top-K
          most relevant parameters as context for the LLM extractor.
"""

from __future__ import annotations

import logging
import numpy as np
from typing import List, Dict, Optional

from config import load_parameter_list, EMBEDDING_MODEL, RAG_TOP_K

logger = logging.getLogger(__name__)

# Lazy-loaded model singleton
_model = None


def _get_model():
    global _model
    if _model is None:
        try:
            from sentence_transformers import SentenceTransformer
            logger.info(f"Loading embedding model: {EMBEDDING_MODEL}")
            _model = SentenceTransformer(EMBEDDING_MODEL)
        except ImportError:
            raise RuntimeError(
                "sentence-transformers is required for RAG retrieval. "
                "Install with: pip install sentence-transformers"
            )
    return _model


class ParameterRetriever:
    """
    Pre-computes embeddings for registry parameters and retrieves
    the most relevant ones given certificate text.
    """

    def __init__(self, top_k: int = RAG_TOP_K):
        self.top_k = top_k
        self.registry = load_parameter_list()

        # Build descriptive strings for embedding
        self._param_texts: List[str] = []
        for p in self.registry:
            desc = (
                f"{p['param_id']} — {p['name']} ({p['domain']}): "
                f"{p['description']}. "
                f"Unit: {p['unit']}. Criticality: {p['criticality']}."
            )
            self._param_texts.append(desc)

        # Compute embeddings
        model = _get_model()
        self._param_embeddings = model.encode(
            self._param_texts,
            normalize_embeddings=True,
            show_progress_bar=False,
        )
        logger.info(
            f"Indexed {len(self.registry)} parameters "
            f"(embedding dim={self._param_embeddings.shape[1]})"
        )

    def retrieve(
        self,
        text: str,
        top_k: Optional[int] = None,
    ) -> List[Dict]:
        """
        Given certificate text, return the top-k most relevant parameters
        from the registry.

        Returns list of registry dicts augmented with 'similarity' score.
        """
        k = top_k or self.top_k

        # Chunk the text into overlapping windows (~200 chars each)
        chunks = self._chunk_text(text, window=200, overlap=50)
        if not chunks:
            return self.registry[:k]  # fallback: return first k

        model = _get_model()
        chunk_embeddings = model.encode(
            chunks,
            normalize_embeddings=True,
            show_progress_bar=False,
        )

        # Max similarity: for each parameter, take the max score across all chunks
        # This captures the most relevant chunk for each parameter
        sim_matrix = chunk_embeddings @ self._param_embeddings.T  # (n_chunks, n_params)
        max_sims = sim_matrix.max(axis=0)  # (n_params,)

        # Top-k parameter indices
        top_indices = np.argsort(max_sims)[::-1][:k]

        results = []
        for idx in top_indices:
            param = dict(self.registry[idx])
            param["similarity"] = float(max_sims[idx])
            results.append(param)

        return results

    @staticmethod
    def _chunk_text(text: str, window: int = 200, overlap: int = 50) -> List[str]:
        """Split text into overlapping character windows."""
        chunks = []
        start = 0
        while start < len(text):
            end = start + window
            chunks.append(text[start:end])
            start += window - overlap
        return chunks
