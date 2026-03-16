// src/types/memory.ts

// 4. Long-term Memory Entities

export interface MemoryNode {
  // Identification
  id: string;                  // Unique Memory ID
  parentId?: string;           // Parent Node ID (Root has no parent)
  type: 'root' | 'principle' | 'external_learning' | 'trading_review' | 'lesson';

  // Content
  title: string;               // Memory Title
  content: string;             // Memory Content
  metadata: {
    [key: string]: any;        // Flexible Metadata
    weight?: number;           // Importance Weight (0-1)
    confidence?: number;       // Confidence Level (0-1)
    tags?: string[];           // Tags for Indexing
  };

  // Relationships
  children: string[];          // Child Node IDs
  relatedMemories: string[];   // Related Memory IDs
  relatedTickers: string[];    // Related Stock Tickers

  // Timestamps
  createdAt: Date | string;    // Creation Timestamp
  updatedAt: Date | string;    // Last Update Timestamp
  lastAccessed: Date | string; // Last Accessed Timestamp (for LRU)

  // Access Tracking
  accessCount: number;         // Access Count
  effectiveness: number;       // Sensitivity/Effectiveness Score (0-1)
}

export interface MemoryIndex {
  // Keyword Inverted Index
  keywordIndex: {
    [keyword: string]: string[]; // Keyword -> Memory IDs
  };

  // Ticker-based Index
  tickerIndex: {
    [ticker: string]: string[]; // Ticker -> Memory IDs
  };

  // Type-based Index
  typeIndex: {
    [type: string]: string[]; // Type -> Memory IDs
  };

  // Temporal Index
  temporalIndex: {
    [date: string]: string[]; // Date (YYYY-MM-DD) -> Memory IDs
  };

  // Semantic Embeddings (Optional, for similarity search)
  embeddings?: {
    [memoryId: string]: number[]; // Memory ID -> Vector Embedding
  };

  // Index Metadata
  version: number;             // Index Version
  lastUpdated: Date | string;  // Last Update Timestamp
}

export interface MemoryQuery {
  // Query Parameters
  keywords?: string[];         // Keywords to search
  tickers?: string[];          // Related Stock Tickers
  types?: string[];            // Types to filter
  dateRange?: {
    start: Date | string;      // Start Date
    end: Date | string;        // End Date
  };

  // Semantic Search (Optional)
  text?: string;               // Text for Semantic Search
  minSimilarity?: number;      // Minimum Similarity Threshold (0-1)

  // Filters
  minWeight?: number;          // Minimum Weight Threshold
  minConfidence?: number;      // Minimum Confidence Threshold
  limit?: number;              // Max Results

  // Sorting
  sortBy?: 'relevance' | 'date' | 'weight' | 'access_count';
  sortOrder?: 'asc' | 'desc';
}
