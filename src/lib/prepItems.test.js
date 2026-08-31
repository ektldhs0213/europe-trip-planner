import test from 'node:test'
import assert from 'node:assert/strict'
import { DEFAULT_PREP_ITEMS, PREP_DATA_VERSION, normalizePrepItems } from './prepItems.js'

test('ships the agreed preparation mockup with separate completed and needed items', () => {
  assert.equal(DEFAULT_PREP_ITEMS.length, 90)
  assert.equal(DEFAULT_PREP_ITEMS.filter(item => item.completed).length, 74)
  assert.equal(DEFAULT_PREP_ITEMS.filter(item => !item.completed).length, 16)
})

test('replaces legacy seed rows while preserving custom preparation items', () => {
  const migrated = normalizePrepItems({
    prepItems: [
      { id: 'prep-esim', text: '유심 · eSIM 준비', completed: true },
      { id: 'custom-one', text: '내가 추가한 준비물', completed: false },
    ],
  })

  assert.equal(migrated.find(item => item.id === 'prep-esim')?.completed, false)
  assert.equal(migrated.find(item => item.id === 'custom-one')?.category, '기타')
  assert.equal(migrated.filter(item => item.id === 'prep-esim').length, 1)
})

test('keeps category and notes in current preparation payloads', () => {
  const current = normalizePrepItems({
    prepDataVersion: PREP_DATA_VERSION,
    prepItems: [{ id: 'one', text: '볶음김치', category: '음식', note: '2중 포장', completed: false }],
  })

  assert.deepEqual(current[0], {
    id: 'one',
    text: '볶음김치',
    category: '음식',
    group: '',
    note: '2중 포장',
    completed: false,
  })
})
