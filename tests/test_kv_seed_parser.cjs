const matter = require('gray-matter');

// Test 1: block scalar 解析
const fixture1 = `---
title: "Test"
paul_perspective: >-
  這是 block scalar 測試，會折成單行。
  第二段內容也要保留。
---

body content
`;
const { data: data1 } = matter(fixture1);
console.assert(
  data1.paul_perspective.includes('block scalar 測試'),
  '❌ block scalar 第一段必須被正確解析'
);
console.assert(
  data1.paul_perspective.includes('第二段內容也要保留'),
  '❌ block scalar 多行內容必須保留'
);
console.log('✓ Test 1: block scalar 解析 passed');

// Test 2: array 解析（簡繁混合）
const fixture2 = `---
title: "Test"
tags: [AI編碼代理, Harness工程, 前饋控制]
links_to: [tacit-knowledge, human-ai-collaboration]
---
`;
const { data: data2 } = matter(fixture2);
console.assert(
  data2.tags.length === 3 && data2.tags[0] === 'AI編碼代理',
  '❌ array with 簡繁中文必須正確解析'
);
console.log('✓ Test 2: array 解析 passed');

// Test 3: Date 解析
const fixture3 = `---
title: "Test"
created: 2026-04-26
updated: 2026-04-26
---
`;
const { data: data3 } = matter(fixture3);
console.assert(
  data3.created instanceof Date,
  '❌ date 應該是 Date 物件'
);
console.assert(
  JSON.stringify(data3).includes('2026-04-26'),
  '❌ Date JSON.stringify 應該保留日期'
);
console.log('✓ Test 3: Date 解析 + 序列化 passed');

console.log('\n=== All parser fixtures passed ===');
