const DB_NAME = 'europe-trip-offline'
const DB_VERSION = 1
const STORE_NAME = 'ticket-files'

function openDatabase() {
  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DB_NAME, DB_VERSION)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)
    request.onupgradeneeded = () => {
      const database = request.result
      if (!database.objectStoreNames.contains(STORE_NAME)) {
        database.createObjectStore(STORE_NAME, { keyPath: 'id' })
      }
    }
  })
}

async function runTransaction(mode, action) {
  const database = await openDatabase()
  return new Promise((resolve, reject) => {
    const transaction = database.transaction(STORE_NAME, mode)
    const store = transaction.objectStore(STORE_NAME)
    const request = action(store)
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error)
    transaction.oncomplete = () => database.close()
    transaction.onerror = () => {
      database.close()
      reject(transaction.error)
    }
  })
}

export async function saveOfflineTicket(ticket, blob) {
  return runTransaction('readwrite', store => store.put({
    id: String(ticket.id),
    blob,
    fileName: ticket.file_name || ticket.title,
    mimeType: ticket.mime_type || blob.type || 'application/octet-stream',
    savedAt: new Date().toISOString(),
  }))
}

export async function downloadOfflineTicket(ticket, signedUrl) {
  const response = await window.fetch(signedUrl)
  if (!response.ok) throw new Error('티켓 파일을 내려받지 못했어요.')
  const blob = await response.blob()
  await saveOfflineTicket(ticket, blob)
  return blob
}

export async function getOfflineTicket(ticketId) {
  return runTransaction('readonly', store => store.get(String(ticketId)))
}

export async function getOfflineTicketIds() {
  const keys = await runTransaction('readonly', store => store.getAllKeys())
  return keys.map(String)
}

export async function deleteOfflineTicket(ticketId) {
  return runTransaction('readwrite', store => store.delete(String(ticketId)))
}

export function openOfflineTicket(record) {
  const fileUrl = URL.createObjectURL(record.blob)
  window.open(fileUrl, '_blank', 'noopener,noreferrer')
  window.setTimeout(() => URL.revokeObjectURL(fileUrl), 60_000)
}
