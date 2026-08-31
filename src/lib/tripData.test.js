import test from 'node:test'
import assert from 'node:assert/strict'
import { addDeletion, ensureRecordTimestamps, isSafeHttpUrl, mergeTripPayloads, touchRecord } from './tripData.js'

test('keeps records created independently on two devices', () => {
  const merged = mergeTripPayloads(
    { events: [{ id: 'local', title: 'Local' }] },
    { events: [{ id: 'remote', title: 'Remote' }] },
    { localSavedAt: '2026-08-30T10:00:00Z', remoteSavedAt: '2026-08-30T11:00:00Z' },
  )
  assert.deepEqual(merged.events.map(item => item.id).sort(), ['local', 'remote'])
})

test('uses the newest version of the same record', () => {
  const merged = mergeTripPayloads(
    { places: [touchRecord({ id: 'one', name: 'Local' }, '2026-08-30T12:00:00Z')] },
    { places: [touchRecord({ id: 'one', name: 'Remote' }, '2026-08-30T11:00:00Z')] },
  )
  assert.equal(merged.places[0].name, 'Local')
})

test('keeps a deletion when it is newer than the record', () => {
  const deletedRecords = addDeletion({}, 'prepItems', 'one', '2026-08-30T12:00:00Z')
  const merged = mergeTripPayloads(
    { prepItems: [], deletedRecords },
    { prepItems: [touchRecord({ id: 'one', text: 'Old' }, '2026-08-30T11:00:00Z')] },
  )
  assert.deepEqual(merged.prepItems, [])
})

test('allows an explicitly newer edit to restore a deleted record', () => {
  const deletedRecords = addDeletion({}, 'cities', 'one', '2026-08-30T11:00:00Z')
  const merged = mergeTripPayloads(
    { cities: [], deletedRecords },
    { cities: [touchRecord({ id: 'one', name: 'Restored' }, '2026-08-30T12:00:00Z')] },
  )
  assert.equal(merged.cities[0].name, 'Restored')
})

test('accepts only empty or HTTP map URLs', () => {
  assert.equal(isSafeHttpUrl(''), true)
  assert.equal(isSafeHttpUrl('https://maps.google.com/example'), true)
  assert.equal(isSafeHttpUrl('javascript:alert(1)'), false)
  assert.equal(isSafeHttpUrl('not a url'), false)
})

test('upgrades legacy records with a stable timestamp', () => {
  const records = ensureRecordTimestamps([{ id: 'legacy' }], '2026-08-30T10:00:00Z')
  assert.equal(records[0]._updatedAt, '2026-08-30T10:00:00Z')
})

test('keeps the newest preparation data version while merging devices', () => {
  const merged = mergeTripPayloads(
    { prepDataVersion: 2, prepItems: [] },
    { prepDataVersion: 1, prepItems: [] },
  )
  assert.equal(merged.prepDataVersion, 2)
})
