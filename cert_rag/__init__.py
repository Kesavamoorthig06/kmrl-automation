"""
Certificate Ingestion RAG module.

Accepts railway certification documents via webhook, extracts structured
engineering parameters using RAG + LLM, validates against safety thresholds,
computes fitness scores, and exposes results to the ML planning engine.
"""
