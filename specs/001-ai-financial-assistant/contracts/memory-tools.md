# Memory Tools Contract

**Version**: 1.0.0
**Status**: Draft
**Date**: 2026-03-12

## 概述

本文档定义了记忆工具的 API 合约，这些工具提供了长期记忆存储、检索和管理的原子操作。

---

## Tool: storeMemory

### 描述

在分层记忆结构中存储新的记忆节点。

### 输入模式

```typescript
interface StoreMemoryInput {
  parentId?: string;           // 父节点 ID（如未指定则为根）
  type: 'principle' | 'external_learning' | 'trading_review' | 'lesson';
  title: string;               // 记忆标题
  content: string;             // 记忆内容
  metadata?: {
    weight?: number;           // 重要性权重（0-1）
    confidence?: number;        // 信心水平（0-1）
    tags?: string[];           // 用于索引的标签
    [key: string]: any;       // 额外元数据
  };
  relatedTickers?: string[];    // 相关股票代码
  relatedMemories?: string[];   // 相关记忆 ID
}
```

### 输出模式

```typescript
interface StoreMemoryOutput {
  id: string;                 // 生成的记忆 ID
  success: boolean;
  node: MemoryNode;            // 创建的记忆节点
  indexesUpdated: {
    keywordIndex: boolean;
    tickerIndex: boolean;
    typeIndex: boolean;
    temporalIndex: boolean;
  };
  timestamp: Date;
}
```

### 错误代码

- `INVALID_PARENT_ID`: 父节点 ID 无效
- `INVALID_TYPE`: 记忆类型无效
- `INVALID_CONTENT`: 内容为空或无效
- `STORAGE_ERROR`: 存储记忆失败

### 示例

```typescript
const result = await storeMemory({
  parentId: 'root',
  type: 'principle',
  title: 'Strong earnings momentum',
  content: 'When a stock beats earnings estimates with strong guidance, it typically shows positive momentum for 2-4 weeks',
  metadata: {
    weight: 0.85,
    confidence: 0.9,
    tags: ['earnings', 'momentum', 'pattern']
  },
  relatedTickers: ['AAPL', 'MSFT', 'GOOG']
  }
});

// 输出:
// {
//   id: 'mem-001',
//   success: true,
//   node: {
//     id: 'mem-001',
//     parentId: 'root',
//     type: 'principle',
//     title: 'Strong earnings momentum',
//     content: 'When a stock beats earnings estimates...',
//     metadata: {
//       weight: 0.85,
//       confidence: 0.9,
//       tags: ['earnings', 'momentum', 'pattern']
//     },
//     children: [],
//     relatedTickers: ['AAPL', 'MSFT', 'GOOG'],
//     relatedMemories: [],
//     createdAt: new Date('2026-03-12T10:30:00Z'),
//     updatedAt: new Date('2026-03-12T10:30:00Z'),
//     lastAccessed: new Date('2026-03-12T10:30:00Z'),
//     accessCount: 0,
//     effectiveness: 0
//   },
//   indexesUpdated: {
//     keywordIndex: true,
//     tickerIndex: true,
//     typeIndex: true,
//     temporalIndex: true
//   },
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: retrieveMemory

### 描述

根据查询条件检索记忆，具有快速索引。

### 输入模式

```typescript
interface RetrieveMemoryInput {
  query: MemoryQuery;         // 查询参数
  includeChildren?: boolean;   // 是否包含子节点（默认：false）
  limit?: number;              // 最大结果数（默认：10）
}
```

### 输出模式

```typescript
interface RetrieveMemoryOutput {
  memories: Array<{
    node: MemoryNode;
    relevanceScore: number;    // 相关性得分（0-1）
    matchedCriteria: string[];  // 匹配的条件
  }>;
  total: number;               // 找到的记忆总数
  queryTime: number;           // 查询执行时间（毫秒）
  timestamp: Date;
}
```

### 错误代码

- `INVALID_QUERY`: 查询参数无效
- `INDEX_ERROR`: 访问索引失败
- `RETRIEVAL_ERROR`: 检索记忆失败

### 示例

```typescript
const result = await retrieveMemory({
  query: {
    keywords: ['earnings', 'momentum'],
    tickers: ['AAPL'],
    types: ['principle', 'lesson'],
    minWeight: 0.7,
    limit: 5,
    sortBy: 'relevance',
    sortOrder: 'desc'
  },
  includeChildren: false
});

// 输出:
// {
//   memories: [
//     {
//       node: { /* 记忆节点 */ },
//       relevanceScore: 0.95,
//       matchedCriteria: ['keywords', 'tickers', 'types']
//     },
//     // ... 更多记忆
//   ],
//   total: 3,
//   queryTime: 45,
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: updateMemory

### 描述

更新现有记忆节点并刷新索引。

### 输入模式

```typescript
interface UpdateMemoryInput {
  id: string;                 // 要更新的记忆 ID
  updates: {
    title?: string;
    content?: string;
    metadata?: {
      weight?: number;
      confidence?: number;
      tags?: string[];
      [key: string]: any;
    };
    relatedTickers?: string[];
    relatedMemories?: string[];
  };
  reindex?: boolean;           // 重建索引（默认：true）
}
```

### 输出模式

```typescript
interface UpdateMemoryOutput {
  id: string;
  success: boolean;
  node: MemoryNode;            // 更新的记忆节点
  changes: {
    fieldsUpdated: string[];   // 已更新的字段
    indexesRebuilt: boolean;  // 是否重建了索引
  };
  timestamp: Date;
}
```

### 错误代码

- `INVALID_MEMORY_ID`: 记忆 ID 无效
- `INVALID_UPDATES`: 更新数据无效
- `UPDATE_ERROR`: 更新记忆失败

### 示例

```typescript
const result = await updateMemory({
  id: 'mem-001',
  updates: {
    metadata: {
      weight: 0.9,
      confidence: 0.95
    },
    relatedTickers: ['AAPL', 'MSFT', 'GOOG', 'NVDA']
  },
  reindex: true
});

// 输出:
// {
//   id: 'mem-001',
//   success: true,
//   node: { /* 更新的记忆节点 */ },
//   changes: {
//     fieldsUpdated: ['metadata', 'relatedTickers'],
//     indexesRebuilt: true
//   },
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: deleteMemory

### 描述

删除记忆节点及其子节点，更新索引。

### 输入模式

```typescript
interface DeleteMemoryInput {
  id: string;                 // 要删除的记忆 ID
  deleteChildren?: boolean;   // 同时删除子节点（默认：true）
  archive?: boolean;          // 归档而不是删除（默认：false）
}
```

### 输出模式

```typescript
interface DeleteMemoryOutput {
  id: string;
  success: boolean;
  deleted: {
    nodeId: string;
    nodeType: string;
    title: string;
  }[];
  childrenDeleted: number;      // 删除的子节点数
  archived: boolean;          // 记忆是否已归档
  indexesUpdated: boolean;     // 是否更新了索引
  timestamp: Date;
}
```

### 错误代码

- `INVALID_MEMORY_ID`: 记忆 ID 无效
- `CANNOT_DELETE_ROOT`: 无法删除根节点
- `DELETE_ERROR`: 删除记忆失败

### 示例

```typescript
const result = await deleteMemory({
  id: 'mem-001',
  deleteChildren: true,
  archive: false
});

// 输出:
// {
//   id: 'mem-001',
//   success: true,
//   deleted: [
//     {
//       nodeId: 'mem-001',
//       nodeType: 'principle',
//       title: 'Strong earnings momentum'
//     }
//   ],
//   childrenDeleted: 0,
//   archived: false,
//   indexesUpdated: true,
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: rebuildIndex

### 描述

重建记忆索引以获得最佳性能。

### 输入模式

```typescript
interface RebuildIndexInput {
  indexTypes?: string[];       // 要重建的特定索引类型（默认：全部）
  force?: boolean;             // 即使不需要也强制重建（默认：false）
}
```

### 输出模式

```typescript
interface RebuildIndexOutput {
  success: boolean;
  indexes: {
    keywordIndex: {
      rebuilt: boolean;
      entries: number;
      time: number;            // 重建时间（毫秒）
    };
    tickerIndex: {
      rebuilt: boolean;
      entries: number;
      time: number;
    };
    typeIndex: {
      rebuilt: boolean;
      entries: number;
      time: number;
    };
    temporalIndex: {
      rebuilt: boolean;
      entries: number;
      time: number;
    };
  };
  totalTime: number;            // 总重建时间（毫秒）
  timestamp: Date;
}
```

### 错误代码

- `INVALID_INDEX_TYPE`: 索引类型无效
- `REBUILD_ERROR`: 重建索引失败

### 示例

```typescript
const result = await rebuildIndex({
  indexTypes: ['keywordIndex', 'tickerIndex'],
  force: true
});

// 输出:
// {
//   success: true,
//   indexes: {
//     keywordIndex: {
//       rebuilt: true,
//       entries: 1250,
//       time: 120
//     },
//     tickerIndex: {
//       rebuilt: true,
//       entries: 85,
//       time: 45
//     },
//     typeIndex: {
//       rebuilt: false,
//       entries: 0,
//       time: 0
//     },
//     temporalIndex: {
//       rebuilt: false,
//       entries: 0,
//       time: 0
//     }
//   },
//   totalTime: 165,
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: getMemoryStats

### 描述

获取记忆系统的统计信息和指标。

### 输入模式

```typescript
interface GetMemoryStatsInput {
  includeDetails?: boolean;    // 是否包含详细统计（默认：false）
}
```

### 输出模式

```typescript
interface GetMemoryStatsOutput {
  summary: {
    totalMemories: number;
    totalNodes: number;        // 包括子节点
    rootNodes: number;
    byType: {
      principle: number;
      external_learning: number;
      trading_review: number;
      lesson: number;
    };
  };
  indexes: {
    keywordIndex: {
      entries: number;
      lastUpdated: Date;
    };
    tickerIndex: {
        entries: number;
      lastUpdated: Date;
    };
    typeIndex: {
      entries: number;
      lastUpdated: Date;
    };
    temporalIndex: {
      entries: number;
      lastUpdated: Date;
    };
  };
  performance: {
    averageQueryTime: number;  // 平均查询时间（毫秒）
    lastQueryTime: number;    // 最后查询时间（毫秒）
    cacheHitRate: number;     // 缓存命中率（0-1）
  };
  details?: {                // 详细统计（如 includeDetails 为 true）
    [memoryId: string]: {
      accessCount: number;
      lastAccessed: Date;
      effectiveness: number;
    };
  };
  timestamp: Date;
}
```

### 错误代码

- `STATS_ERROR`: 获取记忆统计失败

### 示例

```typescript
const result = await getMemoryStats({
  includeDetails: false
});

// 输出:
// {
//   summary: {
//     totalMemories: 150,
//     totalNodes: 185,
//     rootNodes: 3,
//     byType: {
//       principle: 25,
//       external_learning: 50,
//       trading_review: 45,
//       lesson: 30
//     }
//   },
//   indexes: {
//     keywordIndex: {
//       entries: 1250,
//       lastUpdated: new Date('2026-03-12T10:00:00Z')
//     },
//     tickerIndex: {
//       entries: 85,
//       lastUpdated: new Date('2026-03-12T10:00:00Z')
//     },
//     typeIndex: {
//       entries: 150,
//       lastUpdated: new Date('2026-03-12T10:00:00Z')
//     },
//     temporalIndex: {
//       entries: 150,
//       lastUpdated: new Date('2026-03-12T10:00:00Z')
//     }
//   },
//   performance: {
//     averageQueryTime: 45,
//     lastQueryTime: 52,
//     cacheHitRate: 0.85
//   },
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: searchSimilarMemories

### 描述

使用语义相似性搜索与给定文本相似的记忆。

### 输入模式

```typescript
interface SearchSimilarMemoriesInput {
  text: string;                // 要搜索的文本
  minSimilarity?: number;      // 最小相似度阈值（0-1，默认：0.5）
  limit?: number;              // 最大结果数（默认：10）
  memoryTypes?: string[];       // 按记忆类型过滤（默认：全部）
}
```

### 输出模式

```typescript
interface SearchSimilarMemoriesOutput {
  results: Array<{
    node: MemoryNode;
    similarity: number;        // 相似度得分（0-1）
    matchedText: string;       // 匹配的文本
  }>;
  total: number;
  queryTime: number;
  timestamp: Date;
}
```

### 错误代码

- `INVALID_INPUT`: 输入参数无效
- `EMBEDDING_ERROR`: 生成嵌入失败
- `SEARCH_ERROR`: 搜索相似记忆失败

### 示例

```typescript
const result = await searchSimilarMemories({
  text: 'When should I buy stocks before earnings?',
  minSimilarity: 0.6,
  limit: 5,
  memoryTypes: ['principle', 'lesson']
});

// 输出:
// {
//   results: [
//     {
//       node: { /* 记忆节点 */ },
//       similarity: 0.85,
//       matchedText: 'Consider entering positions 1-2 days before earnings if trend is bullish'
//     },
//     // ... 更多结果
//   ],
//   total: 3,
//   queryTime: 120,
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## Tool: updateMemoryEffectiveness

### 描述

根据反馈更新记忆的敏感度得分。

### 输入模式

```typescript
interface UpdateMemoryEffectivenessInput {
  id: string;                 // 要更新的记忆 ID
  feedback: {
    helpful: boolean;          // 记忆是否有帮助？
    correct: boolean;          // 记忆是否正确？
    confidence: number;         // 反馈信心（0-1）
  };
  reason?: string;            // 反馈原因
}
```

### 输出模式

```typescript
interface UpdateMemoryEffectivenessOutput {
  id: string;
  success: boolean;
  oldEffectiveness: number;
  newEffectiveness: number;
  change: number;              // 敏感度变化
  timestamp: Date;
}
```

### 错误代码

- `INVALID_MEMORY_ID`: 记忆 ID 无效
- `INVALID_FEEDBACK`: 反馈数据无效
- `UPDATE_ERROR`: 更新敏感度失败

### 示例

```typescript
const result = await updateMemoryEffectiveness({
  id: 'mem-001',
  feedback: {
    helpful: true,
    correct: true,
    confidence: 0.9
  },
  reason: 'Memory correctly predicted earnings momentum'
});

// 输出:
// {
//   id: 'mem-001',
//   success: true,
//   oldEffectiveness: 0.75,
//   newEffectiveness: 0.82,
//   change: 0.07,
//   timestamp: new Date('2026-03-12T10:30:00Z')
// }
```

---

## 通用响应格式

### 成功响应

```typescript
{
  success: true;
  data: <ToolOutput>;
  timestamp: Date;
}
```

### 错误响应

```typescript
{
  success: false;
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
  };
  timestamp: Date;
}
```

---

## 版本历史

| Version | Date | Changes |
|---------|-------|----------|
| 1.0.0 | 2026-03-12 | 初始版本 |
