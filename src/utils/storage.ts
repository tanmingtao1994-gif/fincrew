import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';
import { config } from './config';
import { MemoryIndex, MemoryNode } from '../types/memory';
import { ToolError, ErrorCode } from './error';

const MEMORY_FILE = 'memory.json';
const INDEX_FILE = 'index.json';

export class MemoryStorage {
  private baseDir: string;
  private memoryMap: Map<string, MemoryNode>;
  private index: MemoryIndex;
  private isInitialized: boolean = false;

  constructor() {
    this.baseDir = config.memory.storagePath;
    this.memoryMap = new Map();
    this.index = this.createEmptyIndex();
  }

  public async init(): Promise<void> {
    if (this.isInitialized) return;
    
    try {
      if (!fs.existsSync(this.baseDir)) {
        fs.mkdirSync(this.baseDir, { recursive: true });
      }
      await this.loadData();
      this.isInitialized = true;
    } catch (error) {
      throw new ToolError('Failed to initialize memory storage', ErrorCode.STORAGE_ERROR, error);
    }
  }

  private createEmptyIndex(): MemoryIndex {
    return {
      keywordIndex: {},
      tickerIndex: {},
      typeIndex: {},
      temporalIndex: {},
      version: 1,
      lastUpdated: new Date().toISOString(),
    };
  }

  private async loadData(): Promise<void> {
    try {
      const memoryPath = path.join(this.baseDir, MEMORY_FILE);
      if (fs.existsSync(memoryPath)) {
        const data = fs.readFileSync(memoryPath, 'utf-8');
        const memories: MemoryNode[] = JSON.parse(data);
        memories.forEach(m => this.memoryMap.set(m.id, m));
      }

      const indexPath = path.join(this.baseDir, INDEX_FILE);
      if (fs.existsSync(indexPath)) {
        const data = fs.readFileSync(indexPath, 'utf-8');
        this.index = JSON.parse(data);
      }
    } catch (error) {
      throw new ToolError('Failed to load memory data', ErrorCode.STORAGE_ERROR, error);
    }
  }

  public async save(): Promise<void> {
    this.checkInitialized();
    try {
      const memoryPath = path.join(this.baseDir, MEMORY_FILE);
      const memories = Array.from(this.memoryMap.values());
      fs.writeFileSync(memoryPath, JSON.stringify(memories, null, 2), 'utf-8');

      const indexPath = path.join(this.baseDir, INDEX_FILE);
      fs.writeFileSync(indexPath, JSON.stringify(this.index, null, 2), 'utf-8');
    } catch (error) {
      throw new ToolError('Failed to save memory data', ErrorCode.STORAGE_ERROR, error);
    }
  }

  private checkInitialized() {
    if (!this.isInitialized) {
      throw new ToolError('MemoryStorage not initialized. Call init() first.', ErrorCode.STORAGE_ERROR);
    }
  }

  public async addMemory(memory: Omit<MemoryNode, 'id' | 'createdAt' | 'updatedAt' | 'lastAccessed' | 'accessCount' | 'effectiveness'>): Promise<MemoryNode> {
    this.checkInitialized();
    
    const now = new Date().toISOString();
    const newNode: MemoryNode = {
      ...memory,
      id: randomUUID(),
      createdAt: now,
      updatedAt: now,
      lastAccessed: now,
      accessCount: 0,
      effectiveness: 0.5, // Default
      children: memory.children || [],
      relatedMemories: memory.relatedMemories || [],
      relatedTickers: memory.relatedTickers || [],
      metadata: memory.metadata || {},
    };

    this.memoryMap.set(newNode.id, newNode);
    this.addToIndex(newNode);
    await this.save();
    return newNode;
  }
  
  public async getMemory(id: string): Promise<MemoryNode | undefined> {
    this.checkInitialized();
    const memory = this.memoryMap.get(id);
    if (memory) {
        memory.lastAccessed = new Date().toISOString();
        memory.accessCount++;
        // Not saving on every read for performance, maybe save periodically or on exit
    }
    return memory;
  }

  public async updateMemory(id: string, updates: Partial<Omit<MemoryNode, 'id' | 'createdAt'>>): Promise<MemoryNode> {
    this.checkInitialized();
    const memory = this.memoryMap.get(id);
    if (!memory) {
      throw new ToolError(`Memory not found: ${id}`, ErrorCode.NOT_FOUND);
    }

    const oldNode = { ...memory };
    const updatedNode: MemoryNode = {
      ...memory,
      ...updates,
      updatedAt: new Date().toISOString(),
    };

    this.memoryMap.set(id, updatedNode);
    
    // Remove old index entries and add new ones
    this.removeFromIndex(oldNode);
    this.addToIndex(updatedNode);
    
    await this.save();
    return updatedNode;
  }

  public async searchMemories(query: {
    keywords?: string[];
    tickers?: string[];
    types?: string[];
    limit?: number;
  }): Promise<MemoryNode[]> {
    this.checkInitialized();
    
    let resultIds: Set<string> | null = null;

    // Helper to intersect sets
    const intersect = (setA: Set<string>, setB: Set<string>) => {
      const _intersect = new Set<string>();
      for (const elem of setB) {
        if (setA.has(elem)) {
          _intersect.add(elem);
        }
      }
      return _intersect;
    };

    // Keyword Search
    if (query.keywords && query.keywords.length > 0) {
      const keywordIds = new Set<string>();
      for (const kw of query.keywords) {
        // Simple exact match on indexed keywords
        const ids = this.index.keywordIndex[kw.toLowerCase()] || [];
        ids.forEach(id => keywordIds.add(id));
      }
      resultIds = keywordIds;
    }

    // Ticker Search
    if (query.tickers && query.tickers.length > 0) {
      const tickerIds = new Set<string>();
      for (const ticker of query.tickers) {
        const ids = this.index.tickerIndex[ticker] || [];
        ids.forEach(id => tickerIds.add(id));
      }
      resultIds = resultIds ? intersect(resultIds, tickerIds) : tickerIds;
    }

    // Type Search
    if (query.types && query.types.length > 0) {
        const typeIds = new Set<string>();
        for (const type of query.types) {
            const ids = this.index.typeIndex[type] || [];
            ids.forEach(id => typeIds.add(id));
        }
        resultIds = resultIds ? intersect(resultIds, typeIds) : typeIds;
    }

    if (!resultIds) {
        // If no filters provided, return all?
        // Let's assume return empty if no filters for safety, unless explicit 'all' intent (not supported yet)
        return [];
    }

    const results: MemoryNode[] = [];
    for (const id of resultIds) {
        const memory = this.memoryMap.get(id);
        if (memory) {
            results.push(memory);
        }
    }

    // Sort by relevance? For now, no specific sort implemented, just arbitrary order.
    // If we want sort, we need to implement it.
    
    // Limit results
    if (query.limit && results.length > query.limit) {
        return results.slice(0, query.limit);
    }

    return results;
  }

  private addToIndex(memory: MemoryNode) {
    // Ticker Index
    if (memory.relatedTickers) {
      memory.relatedTickers.forEach(ticker => {
          if (!this.index.tickerIndex[ticker]) {
              this.index.tickerIndex[ticker] = [];
          }
          if (!this.index.tickerIndex[ticker].includes(memory.id)) {
              this.index.tickerIndex[ticker].push(memory.id);
          }
      });
    }

    // Type Index
    if (memory.type) {
      if (!this.index.typeIndex[memory.type]) {
          this.index.typeIndex[memory.type] = [];
      }
      if (!this.index.typeIndex[memory.type].includes(memory.id)) {
          this.index.typeIndex[memory.type].push(memory.id);
      }
    }

    // Keyword Index (Simple implementation: title words)
    if (memory.title) {
      const keywords = memory.title.toLowerCase().split(/\s+/);
      keywords.forEach(kw => {
          // Filter small words?
          if (kw.length < 2) return;
          if (!this.index.keywordIndex[kw]) {
              this.index.keywordIndex[kw] = [];
          }
          if (!this.index.keywordIndex[kw].includes(memory.id)) {
              this.index.keywordIndex[kw].push(memory.id);
          }
      });
    }
    
    // Temporal Index
    // Assume we index by creation date
    const dateStr = new Date(memory.createdAt).toISOString().split('T')[0];
    if (!this.index.temporalIndex[dateStr]) {
        this.index.temporalIndex[dateStr] = [];
    }
    if (!this.index.temporalIndex[dateStr].includes(memory.id)) {
        this.index.temporalIndex[dateStr].push(memory.id);
    }

    this.index.lastUpdated = new Date().toISOString();
  }

  private removeFromIndex(memory: MemoryNode) {
    // Ticker Index
    if (memory.relatedTickers) {
      memory.relatedTickers.forEach(ticker => {
          if (this.index.tickerIndex[ticker]) {
              this.index.tickerIndex[ticker] = this.index.tickerIndex[ticker].filter(id => id !== memory.id);
              if (this.index.tickerIndex[ticker].length === 0) {
                  delete this.index.tickerIndex[ticker];
              }
          }
      });
    }

    // Type Index
    if (memory.type && this.index.typeIndex[memory.type]) {
        this.index.typeIndex[memory.type] = this.index.typeIndex[memory.type].filter(id => id !== memory.id);
        if (this.index.typeIndex[memory.type].length === 0) {
            delete this.index.typeIndex[memory.type];
        }
    }

    // Keyword Index
    if (memory.title) {
      const keywords = memory.title.toLowerCase().split(/\s+/);
      keywords.forEach(kw => {
          if (this.index.keywordIndex[kw]) {
              this.index.keywordIndex[kw] = this.index.keywordIndex[kw].filter(id => id !== memory.id);
              if (this.index.keywordIndex[kw].length === 0) {
                  delete this.index.keywordIndex[kw];
              }
          }
      });
    }

    // Temporal Index
    const dateStr = new Date(memory.createdAt).toISOString().split('T')[0];
     if (this.index.temporalIndex[dateStr]) {
        this.index.temporalIndex[dateStr] = this.index.temporalIndex[dateStr].filter(id => id !== memory.id);
        if (this.index.temporalIndex[dateStr].length === 0) {
            delete this.index.temporalIndex[dateStr];
        }
    }
  }
}

export const memoryStorage = new MemoryStorage();
