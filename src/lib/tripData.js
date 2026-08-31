export const TRIP_COLLECTIONS = ['cities', 'places', 'events', 'tickets', 'prepItems']

export function createEmptyDeletions() {
  return Object.fromEntries(TRIP_COLLECTIONS.map(collection => [collection, {}]))
}

export function normalizeDeletions(value) {
  const source = value && typeof value === 'object' ? value : {}
  return Object.fromEntries(TRIP_COLLECTIONS.map(collection => [
    collection,
    source[collection] && typeof source[collection] === 'object' ? { ...source[collection] } : {},
  ]))
}

export function touchRecord(record, updatedAt = new Date().toISOString()) {
  return { ...record, _updatedAt: updatedAt }
}

export function ensureRecordTimestamps(items, fallback) {
  return (Array.isArray(items) ? items : []).map(record => record?._updatedAt ? record : touchRecord(record, fallback))
}

export function addDeletion(deletions, collection, id, deletedAt = new Date().toISOString()) {
  if (!TRIP_COLLECTIONS.includes(collection) || id === undefined || id === null) return normalizeDeletions(deletions)
  const next = normalizeDeletions(deletions)
  next[collection][String(id)] = deletedAt
  return next
}

function timestamp(value, fallback = '') {
  const parsed = Date.parse(value || fallback || '')
  return Number.isFinite(parsed) ? parsed : 0
}

function mergeDeletionMaps(local, remote) {
  const left = normalizeDeletions(local)
  const right = normalizeDeletions(remote)
  return Object.fromEntries(TRIP_COLLECTIONS.map(collection => {
    const merged = { ...left[collection] }
    for (const [id, deletedAt] of Object.entries(right[collection])) {
      if (timestamp(deletedAt) >= timestamp(merged[id])) merged[id] = deletedAt
    }
    return [collection, merged]
  }))
}

function mergeCollection(localItems, remoteItems, deletionMap, localFallback, remoteFallback) {
  const records = new Map()

  const consider = (record, fallback) => {
    if (!record || record.id === undefined || record.id === null) return
    const id = String(record.id)
    const candidateTime = timestamp(record._updatedAt, fallback)
    const current = records.get(id)
    if (!current || candidateTime >= current.time) records.set(id, { record, time: candidateTime })
  }

  for (const record of Array.isArray(localItems) ? localItems : []) consider(record, localFallback)
  for (const record of Array.isArray(remoteItems) ? remoteItems : []) consider(record, remoteFallback)

  return [...records.entries()]
    .filter(([id, value]) => timestamp(deletionMap[id]) < value.time)
    .map(([, value]) => value.record._updatedAt || !value.time
      ? value.record
      : touchRecord(value.record, new Date(value.time).toISOString()))
}

export function mergeTripPayloads(localPayload, remotePayload, options = {}) {
  const local = localPayload && typeof localPayload === 'object' ? localPayload : {}
  const remote = remotePayload && typeof remotePayload === 'object' ? remotePayload : {}
  const localFallback = options.localSavedAt || local.savedAt || ''
  const remoteFallback = options.remoteSavedAt || remote.savedAt || ''
  const deletedRecords = mergeDeletionMaps(local.deletedRecords, remote.deletedRecords)
  const merged = {
    ...remote,
    ...local,
    deletedRecords,
    scheduleDataVersion: Math.max(Number(local.scheduleDataVersion || 0), Number(remote.scheduleDataVersion || 0)),
    placeDataVersion: Math.max(Number(local.placeDataVersion || 0), Number(remote.placeDataVersion || 0)),
    prepDataVersion: Math.max(Number(local.prepDataVersion || 0), Number(remote.prepDataVersion || 0)),
  }

  for (const collection of TRIP_COLLECTIONS) {
    merged[collection] = mergeCollection(
      local[collection],
      remote[collection],
      deletedRecords[collection],
      localFallback,
      remoteFallback,
    )
  }

  return merged
}

export function isSafeHttpUrl(value) {
  if (!String(value || '').trim()) return true
  try {
    const url = new URL(value)
    return url.protocol === 'https:' || url.protocol === 'http:'
  } catch {
    return false
  }
}
