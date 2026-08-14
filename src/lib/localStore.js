const LOCAL_TRIP_KEY = 'europe-trip-planner:trip:v1'

export function loadLocalTrip() {
  try {
    const raw = window.localStorage.getItem(LOCAL_TRIP_KEY)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export function saveLocalTrip(payload) {
  window.localStorage.setItem(LOCAL_TRIP_KEY, JSON.stringify({
    ...payload,
    savedAt: new Date().toISOString(),
  }))
}

export function getLocalSavedAt() {
  return loadLocalTrip()?.savedAt || null
}
